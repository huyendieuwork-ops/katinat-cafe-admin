import { supabase } from "./supabase";

/* =========================
 * READ
 * ========================= */

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getUsers() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function getIngredients() {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCafeTables() {
  const { data, error } = await supabase
    .from("cafe_tables")
    .select("*")
    .order("floor", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getInventoryLogs() {
  const { data, error } = await supabase
    .from("inventory_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getStockReceipts() {
  const { data, error } = await supabase
    .from("stock_receipts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getSuppliers() {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getDeliveryNotes() {
  const { data, error } = await supabase
    .from("delivery_notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPaymentDocuments() {
  const { data, error } = await supabase
    .from("payment_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/* =========================
 * PRODUCTS
 * ========================= */

export async function addProductToSupabase(product: any) {
  const { error } = await supabase.from("products").insert(product);
  if (error) throw error;
}

export async function updateProductInSupabase(id: string, payload: any) {
  const { error } = await supabase.from("products").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteProductInSupabase(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

/* =========================
 * CUSTOMERS
 * ========================= */

export async function updateCustomerInSupabase(id: string, payload: any) {
  const { error } = await supabase.from("customers").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomerInSupabase(id: string) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertCustomerAfterPayment(params: {
  customerName: string;
  customerPhone: string;
  finalTotal: number;
  orderType: string;
  paidAt: string;
}) {
  const phone = String(params.customerPhone || "").trim();
  if (!phone) return;

  const { data: existing, error: findError } = await supabase
    .from("customers")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from("customers")
      .update({
        name: params.customerName || existing.name || "Khách hàng",
        total_orders: Number(existing.total_orders || 0) + 1,
        total_spent:
          Number(existing.total_spent || 0) + Number(params.finalTotal || 0),
        last_order_at: params.paidAt,
        last_order_type: params.orderType,
      })
      .eq("id", existing.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("customers").insert({
    id: `customer-${Date.now()}`,
    name: params.customerName || "Khách hàng",
    phone,
    total_orders: 1,
    total_spent: Number(params.finalTotal || 0),
    last_order_at: params.paidAt,
    last_order_type: params.orderType,
    created_at: params.paidAt,
  });

  if (error) throw error;
}

/* =========================
 * ORDERS / TABLES
 * ========================= */

export async function addOrderToSupabase(order: any) {
  const { error } = await supabase.from("orders").insert(order);
  if (error) throw error;
}

export async function updateOrderInSupabase(id: string, payload: any) {
  const { error } = await supabase.from("orders").update(payload).eq("id", id);
  if (error) throw error;
}

export async function updateProductStockInSupabase(id: string, stock: number) {
  const { error } = await supabase.from("products").update({ stock }).eq("id", id);
  if (error) throw error;
}

export async function updateCafeTableInSupabase(id: string, payload: any) {
  const { error } = await supabase.from("cafe_tables").update(payload).eq("id", id);
  if (error) throw error;
}

/* =========================
 * INGREDIENTS
 * ========================= */

export async function addIngredientToSupabase(payload: any) {
  const { error } = await supabase.from("ingredients").insert(payload);
  if (error) throw error;
}

export async function updateIngredientInSupabase(id: string, payload: any) {
  const { error } = await supabase.from("ingredients").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteIngredientInSupabase(id: string) {
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) throw error;
}

/* =========================
 * INVENTORY LOGS
 * ========================= */

export async function addInventoryLogToSupabase(payload: any) {
  const { error } = await supabase.from("inventory_logs").insert(payload);
  if (error) throw error;
}

/* =========================
 * STOCK RECEIPTS
 * ========================= */

export async function addStockReceiptToSupabase(payload: any) {
  const { error } = await supabase.from("stock_receipts").insert({
    id: payload.id,
    receipt_group_code:
      payload.receipt_group_code ??
      payload.receipt_group_id ??
      payload.receipt_code ??
      null,
    ingredient_id: payload.ingredient_id,
    ingredient_name: payload.ingredient_name,
    quantity_added: Number(payload.quantity_added ?? 0),
    unit_cost: Number(payload.unit_cost ?? 0),
    total_cost: Number(payload.total_cost ?? 0),
    note: payload.note ?? null,
    received_by: payload.received_by ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
    supplier_id: payload.supplier_id ?? null,
    supplier_name: payload.supplier_name ?? null,
  });

  if (error) throw error;
}

export async function deleteStockReceiptGroupInSupabase(receiptGroupCode: string) {
  const { error } = await supabase
    .from("stock_receipts")
    .delete()
    .eq("receipt_group_code", receiptGroupCode);

  if (error) throw error;
}

/* =========================
 * SUPPLIERS
 * ========================= */

export async function addSupplierToSupabase(payload: {
  id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  notes?: string | null;
  active?: boolean;
  created_at?: string;
}) {
  const { error } = await supabase.from("suppliers").insert({
    id: payload.id,
    name: payload.name,
    contact_name: payload.contact_name ?? null,
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    address: payload.address ?? null,
    notes: payload.notes ?? payload.note ?? null,
    active: payload.active ?? true,
    created_at: payload.created_at ?? new Date().toISOString(),
  });

  if (error) throw error;
}

export async function updateSupplierInSupabase(
  id: string,
  payload: {
    name: string;
    contact_name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    note?: string | null;
    notes?: string | null;
    active?: boolean;
  }
) {
  const { error } = await supabase
    .from("suppliers")
    .update({
      name: payload.name,
      contact_name: payload.contact_name ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.address ?? null,
      notes: payload.notes ?? payload.note ?? null,
      active: payload.active ?? true,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteSupplierInSupabase(id: string) {
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;
}

/* =========================
 * DELIVERY NOTES
 * ========================= */

export async function addDeliveryNoteToSupabase(payload: {
  id: string;
  receipt_group_code: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  delivery_code: string;
  delivered_at: string;
  delivered_by: string;
  vehicle_number?: string | null;
  note?: string | null;
  created_at?: string;
}) {
  const { error } = await supabase.from("delivery_notes").insert({
    id: payload.id,
    receipt_group_code: payload.receipt_group_code,
    supplier_id: payload.supplier_id ?? null,
    supplier_name: payload.supplier_name ?? null,
    delivery_code: payload.delivery_code,
    delivered_at: payload.delivered_at,
    delivered_by: payload.delivered_by,
    vehicle_number: payload.vehicle_number ?? null,
    note: payload.note ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
  });

  if (error) throw error;
}

export async function deleteDeliveryNoteInSupabase(id: string) {
  const { error } = await supabase
    .from("delivery_notes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function deleteDeliveryNoteByReceiptGroupCodeInSupabase(
  receiptGroupCode: string
) {
  const { error } = await supabase
    .from("delivery_notes")
    .delete()
    .eq("receipt_group_code", receiptGroupCode);

  if (error) throw error;
}

/* =========================
 * PAYMENT DOCUMENTS
 * ========================= */

export async function addPaymentDocumentToSupabase(payload: {
  id: string;
  receipt_group_code: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  payment_code: string;
  payment_method: string;
  amount: number;
  payment_date: string;
  reference_number?: string | null;
  note?: string | null;
  created_at?: string;
}) {
  const { error } = await supabase.from("payment_documents").insert({
    id: payload.id,
    receipt_group_code: payload.receipt_group_code,
    supplier_id: payload.supplier_id ?? null,
    supplier_name: payload.supplier_name ?? null,
    payment_code: payload.payment_code,
    payment_method: payload.payment_method,
    amount: Number(payload.amount ?? 0),
    payment_date: payload.payment_date,
    reference_number: payload.reference_number ?? null,
    note: payload.note ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
  });

  if (error) throw error;
}

export async function deletePaymentDocumentInSupabase(id: string) {
  const { error } = await supabase
    .from("payment_documents")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function deletePaymentDocumentByReceiptGroupCodeInSupabase(
  receiptGroupCode: string
) {
  const { error } = await supabase
    .from("payment_documents")
    .delete()
    .eq("receipt_group_code", receiptGroupCode);

  if (error) throw error;
}

/* =========================
 * STOCK EXPORTS
 * ========================= */

export async function getStockExports() {
  const { data, error } = await supabase
    .from("stock_exports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addStockExportToSupabase(payload: any) {
  const { error } = await supabase.from("stock_exports").insert({
    export_code: payload.export_code,
    ingredient_id: payload.ingredient_id,
    ingredient_name: payload.ingredient_name,
    quantity_exported: Number(payload.quantity_exported ?? 0),
    unit_cost: Number(payload.unit_cost ?? 0),
    total_value: Number(payload.total_value ?? 0),
    reason: payload.reason ?? null,
    exported_by: payload.exported_by ?? null,
    note: payload.note ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
  });

  if (error) throw error;
}

/* =========================
 * INVENTORY CHECKS
 * ========================= */

export async function getInventoryChecks() {
  const { data, error } = await supabase
    .from("inventory_checks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addInventoryCheckToSupabase(payload: any) {
  const { error } = await supabase.from("inventory_checks").insert({
    check_code: payload.check_code,
    ingredient_id: payload.ingredient_id,
    ingredient_name: payload.ingredient_name,
    system_quantity: Number(payload.system_quantity ?? 0),
    actual_quantity: Number(payload.actual_quantity ?? 0),
    difference: Number(payload.difference ?? 0),
    reason: payload.reason ?? null,
    status: payload.status ?? "draft",
    checked_by: payload.checked_by ?? null,
    note: payload.note ?? null,
    created_at: payload.created_at ?? new Date().toISOString(),
  });

  if (error) throw error;
}