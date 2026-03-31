-- 1. Cập nhật bảng ingredients hiện có
-- Cần thêm các thuộc tính mở rộng cho nguyên liệu
ALTER TABLE public.ingredients 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS conversion_unit text,
ADD COLUMN IF NOT EXISTS conversion_rate numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'active';

-- Cập nhật bảng stock_receipts, delivery_notes, payment_documents (nếu chưa có)
ALTER TABLE public.stock_receipts ADD COLUMN IF NOT EXISTS receipt_group_code varchar(50);
ALTER TABLE public.stock_receipts ADD COLUMN IF NOT EXISTS supplier_id varchar(50);
ALTER TABLE public.stock_receipts ADD COLUMN IF NOT EXISTS supplier_name text;

ALTER TABLE public.delivery_notes ADD COLUMN IF NOT EXISTS receipt_group_code varchar(50);
ALTER TABLE public.delivery_notes ADD COLUMN IF NOT EXISTS supplier_id varchar(50);
ALTER TABLE public.delivery_notes ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE public.delivery_notes ADD COLUMN IF NOT EXISTS delivery_code varchar(50);
ALTER TABLE public.delivery_notes ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;
ALTER TABLE public.delivery_notes ADD COLUMN IF NOT EXISTS delivered_by text;
ALTER TABLE public.delivery_notes ADD COLUMN IF NOT EXISTS vehicle_number varchar(50);
ALTER TABLE public.delivery_notes ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.payment_documents ADD COLUMN IF NOT EXISTS receipt_group_code varchar(50);
ALTER TABLE public.payment_documents ADD COLUMN IF NOT EXISTS supplier_id varchar(50);
ALTER TABLE public.payment_documents ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE public.payment_documents ADD COLUMN IF NOT EXISTS payment_code varchar(50);
ALTER TABLE public.payment_documents ADD COLUMN IF NOT EXISTS payment_method varchar(50);
ALTER TABLE public.payment_documents ADD COLUMN IF NOT EXISTS amount numeric;
ALTER TABLE public.payment_documents ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone;
ALTER TABLE public.payment_documents ADD COLUMN IF NOT EXISTS reference_number varchar(100);
ALTER TABLE public.payment_documents ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS ingredient_id varchar(50);
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS ingredient_name text;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS previous_quantity numeric;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS new_quantity numeric;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS difference numeric;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.inventory_logs ADD COLUMN IF NOT EXISTS updated_by text;

CREATE INDEX IF NOT EXISTS idx_stock_receipts_group ON public.stock_receipts(receipt_group_code);

-- 2. Tạo bảng stock_exports (Xuất kho)
CREATE TABLE IF NOT EXISTS public.stock_exports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  export_code varchar(50) NOT NULL,
  ingredient_id text NOT NULL, -- Liên kết với ingredient.id
  ingredient_name text NOT NULL,
  quantity_exported numeric NOT NULL CHECK (quantity_exported > 0),
  unit_cost numeric DEFAULT 0,
  total_value numeric DEFAULT 0,
  reason varchar(100), -- 'hư hỏng', 'nội bộ', 'hủy đơn', 'tự động'...
  exported_by text NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_exports_code ON public.stock_exports(export_code);

-- 3. Tạo bảng inventory_checks (Kiểm kê kho)
CREATE TABLE IF NOT EXISTS public.inventory_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  check_code varchar(50) NOT NULL, -- Grouped code (ví dụ: KK-20231010)
  ingredient_id text NOT NULL,
  ingredient_name text NOT NULL,
  system_quantity numeric NOT NULL,
  actual_quantity numeric NOT NULL,
  difference numeric NOT NULL,
  reason text,
  status varchar(20) DEFAULT 'draft', -- draft, completed
  checked_by text NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_checks_code ON public.inventory_checks(check_code);

-- 4. Tạo bảng recipes (Công thức món) để trừ kho tự động khi bán
-- Một product (món ăn/đồ uống) sẽ liên kết với nhiều ingredient (nguyên liệu) thông qua bảng này
CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL, -- Mã món bán ra trong bảng products
  ingredient_id text NOT NULL, -- Mã nguyên liệu trong bảng ingredients
  quantity_required numeric NOT NULL CHECK (quantity_required > 0), -- SL nguyên liệu cần cho 1 món
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipes_product ON public.recipes(product_id);

-- ================================================
-- RLS: Tắt hoặc mở full-access cho các bảng mới
-- ================================================

-- Tắt RLS trên tất cả các bảng kho mới (bypass hoàn toàn)
ALTER TABLE public.stock_exports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes DISABLE ROW LEVEL SECURITY;

-- Đảm bảo các bảng cũ cũng cho phép ghi (nếu đang bật RLS thì thêm policy)
-- stock_receipts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_receipts'
  ) THEN
    ALTER TABLE public.stock_receipts DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'delivery_notes'
  ) THEN
    ALTER TABLE public.delivery_notes DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_documents'
  ) THEN
    ALTER TABLE public.payment_documents DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_logs'
  ) THEN
    ALTER TABLE public.inventory_logs DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ingredients'
  ) THEN
    ALTER TABLE public.ingredients DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers'
  ) THEN
    ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;
