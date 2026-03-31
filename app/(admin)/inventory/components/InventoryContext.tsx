"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getIngredients,
  getInventoryLogs,
  getStockReceipts,
  getSuppliers,
  getDeliveryNotes,
  getPaymentDocuments,
  getStockExports,
  getInventoryChecks,
} from "@/lib/db";
import { useCafeStore } from "@/lib/store";

export type InventoryContextType = {
  ingredients: any[];
  inventoryLogs: any[];
  stockReceipts: any[];
  suppliers: any[];
  deliveryNotes: any[];
  paymentDocuments: any[];
  stockExports: any[];
  inventoryChecks: any[];
  loading: boolean;
  loadInventory: (showAlert?: boolean) => Promise<void>;
  currentUser: any;
};

const InventoryContext = createContext<InventoryContextType | null>(null);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within an InventoryProvider");
  return context;
};

export const InventoryProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useCafeStore();
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [stockReceipts, setStockReceipts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [paymentDocuments, setPaymentDocuments] = useState<any[]>([]);
  const [stockExports, setStockExports] = useState<any[]>([]);
  const [inventoryChecks, setInventoryChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadInventory(showAlert = false) {
    try {
      setLoading(true);
      const [
        ingredientsData,
        logsData,
        receiptsData,
        suppliersData,
        deliveriesData,
        paymentsData,
        exportsData,
        checksData,
      ] = await Promise.all([
        getIngredients(),
        getInventoryLogs(),
        getStockReceipts(),
        getSuppliers(),
        getDeliveryNotes(),
        getPaymentDocuments(),
        getStockExports().catch(() => []), // fallback in case SQL hasn't been run yet
        getInventoryChecks().catch(() => []),
      ]);

      setIngredients(ingredientsData || []);
      setInventoryLogs(logsData || []);
      setStockReceipts(receiptsData || []);
      setSuppliers(suppliersData || []);
      setDeliveryNotes(deliveriesData || []);
      setPaymentDocuments(paymentsData || []);
      setStockExports(exportsData || []);
      setInventoryChecks(checksData || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu kho:", error);
      if (showAlert) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        alert(`Lỗi tải dữ liệu kho: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        ingredients,
        inventoryLogs,
        stockReceipts,
        suppliers,
        deliveryNotes,
        paymentDocuments,
        stockExports,
        inventoryChecks,
        loading,
        loadInventory,
        currentUser,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
