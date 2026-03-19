"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, UserRound } from "lucide-react";
import { CATEGORY_OPTIONS, UNIVERSITY_OPTIONS } from "@/lib/constants";
import { useCafeStore } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function PosPage() {
  const {
    currentUser,
    activeProducts,
    cart,
    addToCart,
    increaseCartItem,
    decreaseCartItem,
    removeCartItem,
    customerInfo,
    setCustomerInfo,
    matchedCustomer,
    subtotal,
    discount,
    finalTotal,
    createOrderFromCart,
    availableTablesByFloor,
  } = useCafeStore();

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("All");

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
  }, [customerInfo.customerPhone, matchedCustomer, setCustomerInfo]);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((product) => {
      const matchCategory = category === "All" ? true : product.category === category;
      const matchKeyword = product.name.toLowerCase().includes(keyword.toLowerCase());
      return matchCategory && matchKeyword;
    });
  }, [activeProducts, category, keyword]);

  const availableTables = useMemo(() => {
    if (!customerInfo.floor) return [];
    return availableTablesByFloor(customerInfo.floor);
  }, [availableTablesByFloor, customerInfo.floor]);

  const handleCreateOrder = () => {
    const result = createOrderFromCart();
    alert(result.message);
  };

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
          </div>
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
                Tên khách và số điện thoại là không bắt buộc. Nếu nhập số điện thoại đã từng mua,
                hệ thống sẽ tự hiện tên khách.
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

                {customerInfo.customerPhone.trim() && !matchedCustomer && (
                  <div className="rounded-2xl border border-[#e6e1c9] bg-[#fbfaf2] px-4 py-3 text-sm text-[#6a6240]">
                    Số điện thoại này chưa có trong danh sách khách hàng.
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
                        {table.code} - {table.seats} chỗ
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
              className="w-full rounded-2xl bg-[#4e6b53] px-4 py-3 font-semibold text-white hover:bg-[#3f5845]"
            >
              Tạo đơn hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}