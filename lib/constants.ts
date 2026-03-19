import { CafeData, ProductCategory } from "./types";

export const STORAGE_KEY = "katinat_cafe_next_v5";
export const CURRENT_USER_KEY = "katinat_current_user_v5";

export const UNIVERSITY_OPTIONS = [
  "Đại học Kinh tế Quốc dân",
  "Đại học Bách khoa",
  "Trường Đại học Xây dựng",
  "Trường Đại học Mở",
  "Khác",
];

export const CATEGORY_OPTIONS: ProductCategory[] = [
  "Tea",
  "Milk Tea",
  "Smoothie",
  "Coffee",
  "Cake",
  "Topping",
];

export const DEFAULT_DATA: CafeData = {
  users: [
    {
      id: "admin-1",
      username: "admin",
      password: "123456",
      role: "admin",
      fullName: "Quản trị viên",
    },
    {
      id: "staff-1",
      username: "staff",
      password: "123456",
      role: "staff",
      fullName: "Nhân viên bán hàng",
    },
  ],
  products: [
    {
      id: "product-1",
      name: "Trà đào cam sả",
      category: "Tea",
      price: 49000,
      stock: 120,
      image:
        "https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=1200&q=80",
      description: "Trà đào thanh mát, dễ uống",
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "product-2",
      name: "Trà sữa trân châu đường đen",
      category: "Milk Tea",
      price: 55000,
      stock: 100,
      image:
        "https://images.unsplash.com/photo-1558857563-c0c61f0db723?auto=format&fit=crop&w=1200&q=80",
      description: "Vị béo nhẹ, topping trân châu",
      active: true,
      createdAt: new Date().toISOString(),
    },
  ],
  ingredients: [
    {
      id: "ingredient-1",
      name: "Sữa tươi",
      unit: "Lít",
      quantity: 24,
      cost: 32000,
      minStock: 5,
      createdAt: new Date().toISOString(),
    },
    {
      id: "ingredient-2",
      name: "Trân châu đen",
      unit: "Kg",
      quantity: 12,
      cost: 90000,
      minStock: 3,
      createdAt: new Date().toISOString(),
    },
  ],
  inventoryLogs: [],
  orders: [],
  customers: [],
  tables: [
    {
      id: "table-1",
      code: "B1",
      floor: 1,
      seats: 2,
      status: "available",
      currentOrderId: null,
      currentCustomerName: null,
      occupiedAt: null,
    },
    {
      id: "table-2",
      code: "B2",
      floor: 1,
      seats: 4,
      status: "available",
      currentOrderId: null,
      currentCustomerName: null,
      occupiedAt: null,
    },
    {
      id: "table-3",
      code: "B3",
      floor: 2,
      seats: 2,
      status: "available",
      currentOrderId: null,
      currentCustomerName: null,
      occupiedAt: null,
    },
    {
      id: "table-4",
      code: "B4",
      floor: 2,
      seats: 4,
      status: "available",
      currentOrderId: null,
      currentCustomerName: null,
      occupiedAt: null,
    },
  ],
};