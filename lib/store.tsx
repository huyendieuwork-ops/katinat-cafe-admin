"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  CATEGORY_OPTIONS,
  CURRENT_USER_KEY,
  DEFAULT_DATA,
  STORAGE_KEY,
  UNIVERSITY_OPTIONS,
} from "./constants";
import {
  CafeData,
  CafeTable,
  CartItem,
  Customer,
  Ingredient,
  InventoryLog,
  Order,
  OrderStatus,
  OrderType,
  Product,
  ProductCategory,
  StockReceipt,
  User,
} from "./types";
import { formatDateOnly, getDateKey, getStartDateByDays, uid } from "./utils";

type CustomerInfo = {
  customerName: string;
  customerPhone: string;
  isStudent: boolean;
  university: string;
  orderType: OrderType;
  floor: number | null;
  tableId: string;
};

type ProductInput = {
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  image: string;
  description: string;
  active: boolean;
};

type IngredientInput = {
  name: string;
  unit: string;
  quantity: number;
  cost: number;
  minStock: number;
};

type StoreContextType = {
  hydrated: boolean;
  data: CafeData;
  currentUser: User | null;
  cart: CartItem[];
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  matchedCustomer: Customer | null;

  login: (username: string, password: string) => { ok: boolean; message?: string };
  logout: () => void;

  addProduct: (input: ProductInput) => void;
  updateProduct: (id: string, input: ProductInput) => void;
  deleteProduct: (id: string) => void;

  addIngredient: (input: IngredientInput) => void;
  updateIngredient: (id: string, input: IngredientInput) => void;
  deleteIngredient: (id: string) => void;

  updateIngredientStock: (params: {
    ingredientId: string;
    newQuantity: number;
    note: string;
  }) => void;

  receiveIngredientStock: (params: {
    ingredientId: string;
    quantityAdded: number;
    unitCost: number;
    note: string;
  }) => void;

  releaseTable: (tableId: string) => void;

  addToCart: (product: Product) => void;
  increaseCartItem: (id: string) => void;
  decreaseCartItem: (id: string) => void;
  removeCartItem: (id: string) => void;
  clearCart: () => void;

  createOrderFromCart: () => { ok: boolean; message: string };
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  activeProducts: Product[];
  subtotal: number;
  discount: number;
  finalTotal: number;

  totalRevenue: number;
  revenue7: number;
  revenue30: number;
  revenue60: number;
  revenue90: number;

  dailyRevenue30: { date: string; revenue: number }[];
  universityStats: { university: string; count: number; revenue: number }[];
  categorySales: { name: string; value: number }[];
  lowStockIngredients: Ingredient[];
  availableTablesByFloor: (floor: number) => CafeTable[];
};

const StoreContext = createContext<StoreContextType | null>(null);

function normalizeLoadedData(parsed: Partial<CafeData> | null | undefined): CafeData {
  return {
    users: parsed?.users?.length ? parsed.users : DEFAULT_DATA.users,
    products: parsed?.products?.length ? parsed.products : DEFAULT_DATA.products,
    ingredients: parsed?.ingredients?.length ? parsed.ingredients : DEFAULT_DATA.ingredients,
    inventoryLogs: parsed?.inventoryLogs || [],
    stockReceipts: parsed?.stockReceipts || [],
    orders: parsed?.orders || [],
    customers: parsed?.customers || [],
    tables: parsed?.tables?.length ? parsed.tables : DEFAULT_DATA.tables,
  };
}

function loadData(): CafeData {
  if (typeof window === "undefined") return DEFAULT_DATA;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeLoadedData(JSON.parse(raw));

    const oldKeys = [
      "katinat_cafe_next_v6",
      "katinat_cafe_next_v5",
      "katinat_cafe_next_v4",
      "katinat_cafe_next_v3",
      "katinat_cafe_next_v2",
      "katinat_cafe_next_v1",
    ];

    for (const key of oldKeys) {
      const oldRaw = localStorage.getItem(key);
      if (oldRaw) {
        const migrated = normalizeLoadedData(JSON.parse(oldRaw));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }

    return DEFAULT_DATA;
  } catch {
    return DEFAULT_DATA;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<CafeData>(DEFAULT_DATA);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    customerName: "",
    customerPhone: "",
    isStudent: false,
    university: "",
    orderType: "takeaway",
    floor: null,
    tableId: "",
  });

  useEffect(() => {
    setData(loadData());
    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    if (rawUser) {
      try {
        setCurrentUser(JSON.parse(rawUser));
      } catch {}
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUser, hydrated]);

  const login = (username: string, password: string) => {
    const found = data.users.find(
      (user) => user.username === username && user.password === password
    );
    if (!found) return { ok: false, message: "Sai tài khoản hoặc mật khẩu." };
    setCurrentUser(found);
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setCart([]);
    setCustomerInfo({
      customerName: "",
      customerPhone: "",
      isStudent: false,
      university: "",
      orderType: "takeaway",
      floor: null,
      tableId: "",
    });
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const addProduct = (input: ProductInput) => {
    const newProduct: Product = {
      id: uid("product"),
      ...input,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, products: [newProduct, ...prev.products] }));
  };

  const updateProduct = (id: string, input: ProductInput) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((product) =>
        product.id === id ? { ...product, ...input } : product
      ),
    }));
  };

  const deleteProduct = (id: string) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((product) => product.id !== id),
    }));
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const addIngredient = (input: IngredientInput) => {
    const newItem: Ingredient = {
      id: uid("ingredient"),
      ...input,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      ingredients: [newItem, ...prev.ingredients],
    }));
  };

  const updateIngredient = (id: string, input: IngredientInput) => {
    setData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item) =>
        item.id === id ? { ...item, ...input } : item
      ),
    }));
  };

  const deleteIngredient = (id: string) => {
    setData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((item) => item.id !== id),
    }));
  };

  const updateIngredientStock = ({
    ingredientId,
    newQuantity,
    note,
  }: {
    ingredientId: string;
    newQuantity: number;
    note: string;
  }) => {
    if (!currentUser) return;

    setData((prev) => {
      const ingredient = prev.ingredients.find((i) => i.id === ingredientId);
      if (!ingredient) return prev;

      const log: InventoryLog = {
        id: uid("inventory-log"),
        ingredientId,
        ingredientName: ingredient.name,
        previousQuantity: ingredient.quantity,
        newQuantity,
        difference: newQuantity - ingredient.quantity,
        note: note.trim() || "Cập nhật tồn kho",
        updatedBy: currentUser.fullName,
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        ingredients: prev.ingredients.map((item) =>
          item.id === ingredientId ? { ...item, quantity: newQuantity } : item
        ),
        inventoryLogs: [log, ...prev.inventoryLogs],
      };
    });
  };

  const receiveIngredientStock = ({
    ingredientId,
    quantityAdded,
    unitCost,
    note,
  }: {
    ingredientId: string;
    quantityAdded: number;
    unitCost: number;
    note: string;
  }) => {
    if (!currentUser) return;
    if (quantityAdded <= 0 || unitCost < 0) return;

    setData((prev) => {
      const ingredient = prev.ingredients.find((i) => i.id === ingredientId);
      if (!ingredient) return prev;

      const receipt: StockReceipt = {
        id: uid("stock-receipt"),
        ingredientId,
        ingredientName: ingredient.name,
        quantityAdded,
        unitCost,
        totalCost: quantityAdded * unitCost,
        note: note.trim() || "Nhập kho",
        receivedBy: currentUser.fullName,
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        ingredients: prev.ingredients.map((item) =>
          item.id === ingredientId
            ? {
                ...item,
                quantity: item.quantity + quantityAdded,
                cost: unitCost,
              }
            : item
        ),
        stockReceipts: [receipt, ...prev.stockReceipts],
      };
    });
  };

  const releaseTable = (tableId: string) => {
    setData((prev) => ({
      ...prev,
      tables: prev.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              status: "available",
              currentOrderId: null,
              currentCustomerName: null,
              occupiedAt: null,
            }
          : table
      ),
    }));
  };

  const activeProducts = useMemo(
    () => data.products.filter((product) => product.active),
    [data.products]
  );

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        if (found.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const increaseCartItem = (id: string) => {
    setCart((prev) =>
      prev.map((item) => {
        const product = data.products.find((p) => p.id === item.id);
        if (!product) return item;
        return {
          ...item,
          quantity: Math.min(item.quantity + 1, product.stock),
        };
      })
    );
  };

  const decreaseCartItem = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const discount = useMemo(
    () => (customerInfo.isStudent ? subtotal * 0.1 : 0),
    [customerInfo.isStudent, subtotal]
  );

  const finalTotal = subtotal - discount;

  const normalizedPhone = customerInfo.customerPhone.trim();
  const matchedCustomer = useMemo(() => {
    if (!normalizedPhone) return null;
    return data.customers.find((c) => c.phone.trim() === normalizedPhone) || null;
  }, [data.customers, normalizedPhone]);

  const createOrderFromCart = () => {
    if (!currentUser) return { ok: false, message: "Bạn chưa đăng nhập." };
    if (cart.length === 0) return { ok: false, message: "Giỏ hàng đang trống." };

    if (customerInfo.isStudent && !customerInfo.university) {
      return { ok: false, message: "Vui lòng chọn trường đại học." };
    }

    if (customerInfo.orderType === "dine-in") {
      if (!customerInfo.floor) {
        return { ok: false, message: "Vui lòng chọn tầng." };
      }
      if (!customerInfo.tableId) {
        return { ok: false, message: "Vui lòng chọn bàn." };
      }
      const selectedTable = data.tables.find((t) => t.id === customerInfo.tableId);
      if (!selectedTable || selectedTable.status !== "available") {
        return { ok: false, message: "Bàn đang được sử dụng hoặc không hợp lệ." };
      }
    }

    for (const item of cart) {
      const product = data.products.find((p) => p.id === item.id);
      if (!product || product.stock < item.quantity) {
        return {
          ok: false,
          message: `Sản phẩm "${item.name}" không đủ tồn kho để tạo đơn.`,
        };
      }
    }

    const selectedTable =
      customerInfo.orderType === "dine-in"
        ? data.tables.find((t) => t.id === customerInfo.tableId) || null
        : null;

    const createdAt = new Date().toISOString();

    const finalPhone = customerInfo.customerPhone.trim();
    const finalName =
      customerInfo.customerName.trim() ||
      matchedCustomer?.name ||
      (finalPhone ? "Khách quen" : "Khách lẻ");

    const newOrder: Order = {
      id: uid("ORD"),
      customerName: finalName,
      customerPhone: finalPhone,
      isStudent: customerInfo.isStudent,
      university: customerInfo.isStudent ? customerInfo.university : "",
      voucherName: customerInfo.isStudent ? "Voucher sinh viên 10%" : "Không áp dụng",
      discountRate: customerInfo.isStudent ? 10 : 0,
      subtotal,
      discount,
      finalTotal,
      items: cart,
      createdAt,
      createdBy: currentUser.fullName,
      orderType: customerInfo.orderType,
      floor: customerInfo.orderType === "dine-in" ? customerInfo.floor : null,
      tableId: customerInfo.orderType === "dine-in" ? customerInfo.tableId : null,
      tableCode: customerInfo.orderType === "dine-in" ? selectedTable?.code || null : null,
      status: "ordering",
      paidAt: null,
    };

    setData((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      products: prev.products.map((product) => {
        const ordered = cart.find((item) => item.id === product.id);
        if (!ordered) return product;
        return {
          ...product,
          stock: Math.max(0, product.stock - ordered.quantity),
        };
      }),
      tables: prev.tables.map((table) => {
        if (customerInfo.orderType !== "dine-in") return table;
        if (table.id !== customerInfo.tableId) return table;
        return {
          ...table,
          status: "occupied",
          currentOrderId: newOrder.id,
          currentCustomerName: finalName,
          occupiedAt: createdAt,
        };
      }),
    }));

    setCart([]);
    setCustomerInfo({
      customerName: "",
      customerPhone: "",
      isStudent: false,
      university: "",
      orderType: "takeaway",
      floor: null,
      tableId: "",
    });

    return { ok: true, message: "Tạo đơn hàng thành công. Tồn kho sản phẩm đã bị trừ." };
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setData((prev) => {
      const target = prev.orders.find((o) => o.id === orderId);
      if (!target) return prev;

      const wasCancelled = target.status === "cancelled";
      const willCancel = status === "cancelled";
      const willPaid = status === "paid";
      const releaseTableNow = (willPaid || willCancel) && target.tableId;

      const nextOrders = prev.orders.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status,
          paidAt: willPaid ? new Date().toISOString() : willCancel ? null : order.paidAt,
        };
      });

      let nextCustomers = prev.customers;

      const canStoreCustomer = target.customerPhone.trim().length > 0;

      if (willPaid && target.status !== "paid" && canStoreCustomer) {
        const existingCustomer = prev.customers.find(
          (c) => c.phone.trim() === target.customerPhone.trim()
        );

        nextCustomers = existingCustomer
          ? prev.customers.map((c) =>
              c.phone.trim() === target.customerPhone.trim()
                ? {
                    ...c,
                    name: target.customerName || c.name,
                    totalOrders: c.totalOrders + 1,
                    totalSpent: c.totalSpent + target.finalTotal,
                    lastOrderAt: new Date().toISOString(),
                    lastOrderType: target.orderType,
                  }
                : c
            )
          : [
              {
                id: uid("customer"),
                name: target.customerName || "Khách hàng",
                phone: target.customerPhone,
                totalOrders: 1,
                totalSpent: target.finalTotal,
                lastOrderAt: new Date().toISOString(),
                lastOrderType: target.orderType,
                createdAt: target.createdAt,
              },
              ...prev.customers,
            ];
      }

      const shouldRestockProducts = willCancel && !wasCancelled;

      return {
        ...prev,
        orders: nextOrders,
        customers: nextCustomers,
        products: prev.products.map((product) => {
          if (!shouldRestockProducts) return product;
          const cancelledItem = target.items.find((item) => item.id === product.id);
          if (!cancelledItem) return product;
          return {
            ...product,
            stock: product.stock + cancelledItem.quantity,
          };
        }),
        tables: prev.tables.map((table) => {
          if (!releaseTableNow) return table;
          if (table.id !== target.tableId) return table;
          return {
            ...table,
            status: "available",
            currentOrderId: null,
            currentCustomerName: null,
            occupiedAt: null,
          };
        }),
      };
    });
  };

  const totalRevenue = useMemo(
    () =>
      data.orders
        .filter((order) => order.status === "paid")
        .reduce((sum, order) => sum + order.finalTotal, 0),
    [data.orders]
  );

  const revenueByDays = (days: number) => {
    const start = getStartDateByDays(days);
    return data.orders
      .filter((order) => order.status === "paid" && order.paidAt && new Date(order.paidAt) >= start)
      .reduce((sum, order) => sum + order.finalTotal, 0);
  };

  const revenue7 = revenueByDays(7);
  const revenue30 = revenueByDays(30);
  const revenue60 = revenueByDays(60);
  const revenue90 = revenueByDays(90);

  const dailyRevenue30 = useMemo(() => {
    const list: { date: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);

      const revenue = data.orders
        .filter((order) => order.status === "paid" && order.paidAt && getDateKey(order.paidAt) === key)
        .reduce((sum, order) => sum + order.finalTotal, 0);

      list.push({
        date: formatDateOnly(d).slice(0, 5),
        revenue,
      });
    }
    return list;
  }, [data.orders]);

  const universityStats = useMemo(() => {
    const base = UNIVERSITY_OPTIONS.map((u) => ({
      university: u,
      count: 0,
      revenue: 0,
    }));

    data.orders.forEach((order) => {
      if (order.status === "paid" && order.isStudent && order.university) {
        const found = base.find((item) => item.university === order.university);
        if (found) {
          found.count += 1;
          found.revenue += order.finalTotal;
        }
      }
    });

    return base.sort((a, b) => b.count - a.count);
  }, [data.orders]);

  const categorySales = useMemo(() => {
    const map = new Map<string, number>();
    CATEGORY_OPTIONS.forEach((category) => map.set(category, 0));

    data.orders
      .filter((order) => order.status === "paid")
      .forEach((order) => {
        order.items.forEach((item) => {
          map.set(item.category, (map.get(item.category) || 0) + item.quantity);
        });
      });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [data.orders]);

  const lowStockIngredients = useMemo(
    () => data.ingredients.filter((item) => Number(item.quantity) <= Number(item.minStock)),
    [data.ingredients]
  );

  const availableTablesByFloor = (floor: number) =>
    data.tables.filter((table) => table.floor === floor && table.status === "available");

  return (
    <StoreContext.Provider
      value={{
        hydrated,
        data,
        currentUser,
        cart,
        customerInfo,
        setCustomerInfo,
        matchedCustomer,
        login,
        logout,
        addProduct,
        updateProduct,
        deleteProduct,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        updateIngredientStock,
        receiveIngredientStock,
        releaseTable,
        addToCart,
        increaseCartItem,
        decreaseCartItem,
        removeCartItem,
        clearCart,
        createOrderFromCart,
        updateOrderStatus,
        activeProducts,
        subtotal,
        discount,
        finalTotal,
        totalRevenue,
        revenue7,
        revenue30,
        revenue60,
        revenue90,
        dailyRevenue30,
        universityStats,
        categorySales,
        lowStockIngredients,
        availableTablesByFloor,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useCafeStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useCafeStore must be used inside StoreProvider");
  }
  return context;
}