export type UserRole = "admin" | "staff";

export type User = {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  fullName: string;
};

export type ProductCategory =
  | "Tea"
  | "Milk Tea"
  | "Smoothie"
  | "Coffee"
  | "Cake"
  | "Topping";

export type OrderType = "dine-in" | "takeaway";
export type TableStatus = "available" | "occupied";

export type OrderStatus =
  | "ordering"
  | "preparing"
  | "served"
  | "paid"
  | "cancelled";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  image: string;
  description: string;
  active: boolean;
  createdAt: string;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  cost: number;
  minStock: number;
  createdAt: string;
};

export type InventoryLog = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  note: string;
  updatedBy: string;
  createdAt: string;
};

export type StockReceipt = {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantityAdded: number;
  unitCost: number;
  totalCost: number;
  note: string;
  receivedBy: string;
  createdAt: string;
};

export type CartItem = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  quantity: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string;
  lastOrderType: OrderType;
  createdAt: string;
};

export type CafeTable = {
  id: string;
  code: string;
  floor: number;
  seats: number;
  status: TableStatus;
  currentOrderId: string | null;
  currentCustomerName: string | null;
  occupiedAt: string | null;
};

export type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  isStudent: boolean;
  university: string;
  voucherName: string;
  discountRate: number;
  subtotal: number;
  discount: number;
  finalTotal: number;
  items: CartItem[];
  createdAt: string;
  createdBy: string;
  orderType: OrderType;
  floor: number | null;
  tableId: string | null;
  tableCode: string | null;
  status: OrderStatus;
  paidAt: string | null;
};

export type CafeData = {
  users: User[];
  products: Product[];
  ingredients: Ingredient[];
  inventoryLogs: InventoryLog[];
  stockReceipts: StockReceipt[];
  orders: Order[];
  customers: Customer[];
  tables: CafeTable[];
};