import { getProducts } from "@/lib/db";

export default async function SupabaseTestPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-[#f4f7f2] p-8">
      <div className="mx-auto max-w-5xl rounded-[24px] border border-[#d7e2d5] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-800">Test kết nối Supabase</h1>
        <p className="mt-2 text-slate-500">
          Nếu bạn thấy danh sách sản phẩm ở dưới, nghĩa là app đã đọc được dữ liệu từ Supabase.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products?.map((product: any) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-[20px] border border-[#d7e2d5] bg-white"
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <p className="inline-flex rounded-full bg-[#e4ece3] px-3 py-1 text-xs font-semibold text-[#3d5643]">
                  {product.category}
                </p>
                <h2 className="mt-3 text-lg font-bold text-slate-800">{product.name}</h2>
                <p className="mt-2 text-sm text-slate-500">{product.description}</p>
                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  <p>Giá: {Number(product.price).toLocaleString("vi-VN")}đ</p>
                  <p>Tồn kho: {product.stock}</p>
                  <p>{product.active ? "Đang bán" : "Ngưng bán"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!products || products.length === 0) && (
          <div className="mt-6 rounded-2xl border border-dashed border-[#d7e2d5] p-6 text-slate-500">
            Không có sản phẩm nào được đọc từ Supabase.
          </div>
        )}
      </div>
    </div>
  );
}