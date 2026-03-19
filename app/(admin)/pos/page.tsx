"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, UserRound } from "lucide-react";
import { CATEGORY_OPTIONS, UNIVERSITY_OPTIONS } from "@/lib/constants";
import { useCafeStore } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  addOrderToSupabase,
  getCafeTables,
  getCustomers,
  getProducts,
  updateCafeTableInSupabase,
  updateProductStockInSupabase,
} from "@/lib/db";

type ProductItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  active: boolean;
};

type CustomerItem = {
  id: string;
  name: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  last_order_type: string | null;
  created_at: string;
};

type CafeTableItem = {
  id: string;
  code: string;
  floor: number;
  seats: number;
  status: string;
  current_order_id: string | null;
  current_customer_name: string | null;
  occupied_at: string | null;
};

type CartItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
};

type CustomerInfo = {
  customerName: string;
  customerPhone: string;
  isStudent: boolean;
  university: string;
  orderType: "takeaway" | "dine-in";
  floor: number | null;
  tableId: string;
};

const emptyCustomerInfo: CustomerInfo = {
  customerName: "",
  customerPhone: "",
  isStudent: false,
  university: "",
  orderType: "takeaway",
  floor: null,
  tableId: "",
};

export default function PosPage() {
  const { currentUser } = useCafeStore();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [tables, setTables] = useState<CafeTableItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(emptyCustomerInfo);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");

  async function loadPosData(showAlert = false) {
    try {
      setLoading(true);
      const [productsData, customersData, tablesData] = await Promise.all([
        getProducts(),
        getCustomers(),
        getCafeTables(),
      ]);

      setProducts((productsData || []).filter((item: ProductItem) => item.active));
      setCustomers(customersData || []);
      setTables(tablesData || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu POS:", error);
      if (showAlert) {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        alert(`Lỗi tải dữ liệu POS: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosData(true);
  }, []);

  const matchedCustomer = useMemo(() => {
    const phone = customerInfo.customerPhone.trim();
    if (!phone) return null;
    return customers.find((c) => c.phone.trim() === phone) || null;
  }, [customers, customerInfo.customerPhone]);

  useEffect(() => {
    const phone = customerInfo.customerPhone.trim();
    const currentName = customerInfo.customerName.trim();

    if (phone && matchedCustomer) {
      if (!currentName || currentName === "Khách lẻ" || currentName === "Khách quen") {
        setCustomerInfo((prev) => ({
          ...prev,
          customerName: matchedCustomer.name,
        }));
      }
    }
  }, [matchedCustomer, customerInfo.customerPhone]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = category === "All" ? true : product.category === category;
      const matchKeyword = product.name.toLowerCase().includes(keyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [products, category, keyword]);

  const availableTables = useMemo(() => {
    if (!customerInfo.floor) return [];
    return tables.filter(
      (table) => table.floor === customerInfo.floor && table.status === "available"
    );
  }, [tables, customerInfo.floor]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const discount = useMemo(
    () => (customerInfo.isStudent ? subtotal * 0.1 : 0),
    [customerInfo.isStudent, subtotal]
  );

  const finalTotal = subtotal - discount;

  function addToCart(product: ProductItem) {
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
  }

  function increaseCartItem(id: string) {
    setCart((prev) =>
      prev.map((item) => {
        const product = products.find((p) => p.id === item.id);
        if (!product) return item;
        return {
          ...item,
          quantity: Math.min(item.quantity + 1, product.stock),
        };
      })
    );
  }

  function decreaseCartItem(id: string) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeCartItem(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleCreateOrder() {
    if (cart.length === 0) {
      alert("Giỏ hàng đang trống.");
      return;
    }

    if (customerInfo.isStudent && !customerInfo.university) {
      alert("Vui lòng chọn trường đại học.");
      return;
    }

    if (customerInfo.orderType === "dine-in") {
      if (!customerInfo.floor) {
        alert("Vui lòng chọn tầng.");
        return;
      }

      if (!customerInfo.tableId) {
        alert("Vui lòng chọn bàn.");
        return;
      }
    }

    for (const item of cart) {
      const product = products.find((p) => p.id === item.id);
      if (!product || product.stock < item.quantity) {
        alert(`Sản phẩm "${item.name}" không đủ tồn kho.`);
        return;
      }
    }

    try {
      setSubmitting(true);

      const createdAt = new Date().toISOString();
      const selectedTable =
        customerInfo.orderType === "dine-in"
          ? tables.find((t) => t.id === customerInfo.tableId) || null
          : null;

      const finalPhone = customerInfo.customerPhone.trim();
      const finalName =
        customerInfo.customerName.trim() ||
        matchedCustomer?.name ||
        (finalPhone ? "Khách quen" : "Khách lẻ");

      const orderId = `ORD-${Date.now()}`;

      await addOrderToSupabase({
        id: orderId,
        customer_name: finalName,
        customer_phone: finalPhone,
        is_student: customerInfo.isStudent,
        university: customerInfo.isStudent ? customerInfo.university : "",
        voucher_name: customerInfo.isStudent ? "Voucher sinh viên 10%" : "Không áp dụng",
        discount_rate: customerInfo.isStudent ? 10 : 0,
        subtotal,
        discount,
        final_total: finalTotal,
        items: cart,
        created_at: createdAt,
        created_by: currentUser?.fullName || "Nhân viên",
        order_type: customerInfo.orderType,
        floor: customerInfo.orderType === "dine-in" ? customerInfo.floor : null,
        table_id: customerInfo.orderType === "dine-in" ? customerInfo.tableId : null,
        table_code: customerInfo.orderType === "dine-in" ? selectedTable?.code || null : null,
        status: "ordering",
        paid_at: null,
      });

      for (const item of cart) {
        const product = products.find((p) => p.id === item.id);
        if (!product) continue;
        await updateProductStockInSupabase(item.id, Math.max(0, product.stock - item.quantity));
      }

      if (customerInfo.orderType === "dine-in" && customerInfo.tableId) {
        await updateCafeTableInSupabase(customerInfo.tableId, {
          status: "occupied",
          current_order_id: orderId,
          current_customer_name: finalName,
          occupied_at: createdAt,
        });
      }

      alert("Tạo đơn hàng thành công.");
      setCart([]);
      setCustomerInfo(emptyCustomerInfo);
      await loadPosData();
    } catch (error) {
      console.error("Lỗi tạo đơn hàng:", error);
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      alert(`Có lỗi khi tạo đơn hàng: ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (currentUser?.role !== "staff" && currentUser?.role !== "admin") {
    return (
      <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-6">
        Bạn không có quyền truy cập POS.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.95fr]">
        <div className="rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[#d7e2d5] px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input
                className="w-full bg-transparent outline-none"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên sản phẩm..."
              />
            </div>

            <select
              className="rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">Tất cả danh mục</option>
              {CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#d7e2d5] p-6 text-slate-500">
              Đang tải dữ liệu POS từ Supabase...
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-[22px] border border-[#d7e2d5] bg-white"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-44 w-full object-cover"
                  />
                  <div className="p-4">
                    <span className="inline-flex rounded-full bg-[#e4ece3] px-3 py-1 text-xs font-semibold text-[#3d5643]">
                      {product.category}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-slate-800">{product.name}</h3>
                    <p className="mt-2 min-h-[40px] text-sm text-slate-500">
                      {product.description || "Chưa có mô tả"}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <strong>{formatCurrency(product.price)}</strong>
                      <span className="text-slate-500">Tồn: {product.stock}</span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Plus size={16} />
                      {product.stock > 0 ? "Thêm vào đơn" : "Hết hàng"}
                    </button>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="rounded-[22px] border border-dashed border-[#d7e2d5] p-6 text-slate-500">
                  Không có sản phẩm phù hợp.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-fit rounded-[24px] border border-[#d7e2d5] bg-white p-5 shadow-sm xl:sticky xl:top-6">
          <h2 className="text-xl font-bold text-slate-800">Thông tin đơn hàng</h2>
          <p className="mt-1 text-sm text-slate-500">
            Thời gian realtime: {formatDateTime(new Date())}
          </p>

          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-[#d7e2d5] bg-[#f8fbf7] p-4">
              <div className="mb-3 flex items-center gap-2">
                <UserRound size={18} className="text-[#4e6b53]" />
                <h3 className="font-semibold text-slate-800">Thông tin khách hàng</h3>
              </div>

              <p className="mb-3 text-sm text-slate-500">
                Nếu nhập số điện thoại đã từng mua, hệ thống sẽ tự hiện tên khách.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Số điện thoại (optional)
                  </label>
                  <input
                    className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                    value={customerInfo.customerPhone}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        customerPhone: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: 0987654321"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tên khách hàng (optional)
                  </label>
                  <input
                    className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                    value={customerInfo.customerName}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    placeholder="Để trống nếu khách không muốn cung cấp"
                  />
                </div>

                {customerInfo.customerPhone.trim() && matchedCustomer && (
                  <div className="rounded-2xl border border-[#cfe0cf] bg-[#edf6ed] px-4 py-3 text-sm">
                    <p className="font-semibold text-[#33503a]">Đã nhận diện khách quen</p>
                    <p className="mt-1 text-[#4a6752]">
                      Tên trong hệ thống: <strong>{matchedCustomer.name}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Hình thức mua
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCustomerInfo((prev) => ({
                      ...prev,
                      orderType: "takeaway",
                      floor: null,
                      tableId: "",
                    }))
                  }
                  className={`rounded-2xl border px-4 py-3 font-semibold ${
                    customerInfo.orderType === "takeaway"
                      ? "border-[#4e6b53] bg-[#e5eee4] text-[#3d5643]"
                      : "border-[#d7e2d5] bg-white text-slate-700"
                  }`}
                >
                  Mang về
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCustomerInfo((prev) => ({
                      ...prev,
                      orderType: "dine-in",
                    }))
                  }
                  className={`rounded-2xl border px-4 py-3 font-semibold ${
                    customerInfo.orderType === "dine-in"
                      ? "border-[#4e6b53] bg-[#e5eee4] text-[#3d5643]"
                      : "border-[#d7e2d5] bg-white text-slate-700"
                  }`}
                >
                  Ở lại
                </button>
              </div>
            </div>

            {customerInfo.orderType === "dine-in" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Chọn tầng
                  </label>
                  <select
                    className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                    value={customerInfo.floor ?? ""}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        floor: Number(e.target.value) || null,
                        tableId: "",
                      }))
                    }
                  >
                    <option value="">-- Chọn tầng --</option>
                    <option value="1">Tầng 1</option>
                    <option value="2">Tầng 2</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Chọn bàn
                  </label>
                  <select
                    className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                    value={customerInfo.tableId}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        tableId: e.target.value,
                      }))
                    }
                  >
                    <option value="">-- Chọn bàn --</option>
                    {availableTables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.code} - Tầng {table.floor} - {table.seats} ghế
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="rounded-2xl border border-[#d7e2d5] bg-[#f3f7f1] p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={customerInfo.isStudent}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({
                      ...prev,
                      isStudent: e.target.checked,
                      university: e.target.checked ? prev.university : "",
                    }))
                  }
                />
                Áp dụng voucher sinh viên giảm 10%
              </label>

              {customerInfo.isStudent && (
                <div className="mt-3">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Chọn trường đại học
                  </label>
                  <select
                    className="w-full rounded-2xl border border-[#d7e2d5] px-4 py-3 outline-none"
                    value={customerInfo.university}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({
                        ...prev,
                        university: e.target.value,
                      }))
                    }
                  >
                    <option value="">-- Chọn trường --</option>
                    {UNIVERSITY_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d7e2d5] p-5 text-center text-slate-500">
                  Chưa có món nào trong đơn.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl border border-[#d7e2d5] p-4"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-800">{item.name}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatCurrency(item.price)} x {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decreaseCartItem(item.id)}
                        className="h-8 w-8 rounded-xl bg-[#e9f0e8] font-bold text-[#3d5643]"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => increaseCartItem(item.id)}
                        className="h-8 w-8 rounded-xl bg-[#e9f0e8] font-bold text-[#3d5643]"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-slate-800">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className="mt-1 text-sm text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 border-t border-dashed border-[#d7e2d5] pt-4">
              <div className="flex items-center justify-between text-sm">
                <span>Tạm tính</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Giảm giá</span>
                <strong>- {formatCurrency(discount)}</strong>
              </div>
              <div className="flex items-center justify-between text-lg font-bold text-[#3d5643]">
                <span>Tổng đơn</span>
                <strong>{formatCurrency(finalTotal)}</strong>
              </div>
            </div>

            <button
              onClick={handleCreateOrder}
              disabled={submitting}
              className="w-full rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Đang tạo đơn..." : "Tạo đơn hàng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}