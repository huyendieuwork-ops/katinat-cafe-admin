import { supabase } from "./supabase";

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUsers() {
  const { data, error } = await supabase.from("users").select("*");

  if (error) throw error;
  return data;
}

export async function getIngredients() {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCafeTables() {
  const { data, error } = await supabase
    .from("cafe_tables")
    .select("*")
    .order("floor", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getInventoryLogs() {
  const { data, error } = await supabase
    .from("inventory_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStockReceipts() {
  const { data, error } = await supabase
    .from("stock_receipts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addProductToSupabase(product: {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  active: boolean;
  created_at: string;
}) {
  const { error } = await supabase.from("products").insert(product);
  if (error) throw error;
}

export async function updateProductInSupabase(
  id: string,
  product: {
    name: string;
    category: string;
    price: number;
    stock: number;
    image: string;
    description: string;
    active: boolean;
  }
) {
  const { error } = await supabase.from("products").update(product).eq("id", id);
  if (error) throw error;
}

export async function deleteProductInSupabase(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function updateCustomerInSupabase(
  id: string,
  customer: {
    name: string;
    phone: string;
    total_orders: number;
    total_spent: number;
    last_order_at: string | null;
    last_order_type: string | null;
  }
) {
  const { error } = await supabase.from("customers").update(customer).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomerInSupabase(id: string) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

export async function addOrderToSupabase(order: {
  id: string;
  customer_name: string;
  customer_phone: string;
  is_student: boolean;
  university: string;
  voucher_name: string;
  discount_rate: number;
  subtotal: number;
  discount: number;
  final_total: number;
  items: any[];
  created_at: string;
  created_by: string;
  order_type: string;
  floor: number | null;
  table_id: string | null;
  table_code: string | null;
  status: string;
  paid_at: string | null;
}) {
  const { error } = await supabase.from("orders").insert(order);
  if (error) throw error;
}

export async function updateOrderInSupabase(
  id: string,
  payload: Partial<{
    customer_name: string;
    customer_phone: string;
    status: string;
    paid_at: string | null;
    table_id: string | null;
    table_code: string | null;
    floor: number | null;
  }>
) {
  const { error } = await supabase.from("orders").update(payload).eq("id", id);
  if (error) throw error;
}

export async function updateProductStockInSupabase(id: string, stock: number) {
  const { error } = await supabase.from("products").update({ stock }).eq("id", id);
  if (error) throw error;
}

export async function updateCafeTableInSupabase(
  id: string,
  payload: Partial<{
    status: string;
    current_order_id: string | null;
    current_customer_name: string | null;
    occupied_at: string | null;
  }>
) {
  const { error } = await supabase.from("cafe_tables").update(payload).eq("id", id);
  if (error) throw error;
}

export async function upsertCustomerAfterPayment(params: {
  customerName: string;
  customerPhone: string;
  finalTotal: number;
  orderType: string;
  paidAt: string;
}) {
  const phone = params.customerPhone.trim();
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
        total_spent: Number(existing.total_spent || 0) + Number(params.finalTotal || 0),
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
export async function addIngredientToSupabase(payload: {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  cost: number;
  min_stock: number;
  created_at: string;
}) {
  const { error } = await supabase.from("ingredients").insert(payload);
  if (error) throw error;
}

export async function updateIngredientInSupabase(
  id: string,
  payload: {
    name: string;
    unit: string;
    quantity: number;
    cost: number;
    min_stock: number;
  }
) {
  const { error } = await supabase.from("ingredients").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteIngredientInSupabase(id: string) {
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) throw error;
}

export async function addInventoryLogToSupabase(payload: {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  previous_quantity: number;
  new_quantity: number;
  difference: number;
  note: string;
  updated_by: string;
  created_at: string;
}) {
  const { error } = await supabase.from("inventory_logs").insert(payload);
  if (error) throw error;
}

export async function addStockReceiptToSupabase(payload: {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity_added: number;
  unit_cost: number;
  total_cost: number;
  note: string;
  received_by: string;
  created_at: string;
}) {
  const { error } = await supabase.from("stock_receipts").insert(payload);
  if (error) throw error;
}