import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CartItemType, ProductSize } from "@/types";

type CreatePosOrderParams = {
  tableId: string;
  cart: CartItemType[];
};

type CheckoutOrderParams = {
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: "cash" | "card" | "transfer";
};

export const createPosOrder = async ({
  tableId,
  cart,
}: CreatePosOrderParams) => {
  if (!tableId) throw new Error("Chưa chọn bàn");
  if (!cart.length) throw new Error("Giỏ hàng đang trống");

  await runTransaction(db, async (transaction) => {
    const tableRef = doc(db, "tables", tableId);
    const tableSnap = await transaction.get(tableRef);

    if (!tableSnap.exists()) throw new Error("Bàn không tồn tại");

    const tableData = tableSnap.data() as {
      name: string;
      status: string;
      currentOrderId?: string | null;
    };

    if (tableData.status === "reserved") {
      throw new Error("Bàn đang được đặt trước");
    }

    if (tableData.currentOrderId) {
      throw new Error("Bàn này đang có đơn mở");
    }

    let subtotal = 0;
    const verifiedItems: CartItemType[] = [];

    for (const item of cart) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Không tìm thấy sản phẩm: ${item.name}`);
      }

      const productData = productSnap.data() as {
        name: string;
        prices: { M: number; L: number };
      };

      const finalPrice = Number(productData.prices?.[item.size as ProductSize] || 0);
      subtotal += finalPrice * item.qty;

      verifiedItems.push({
        productId: item.productId,
        name: productData.name,
        size: item.size,
        price: finalPrice,
        qty: item.qty,
      });
    }

    const orderRef = doc(collection(db, "orders"));

    transaction.set(orderRef, {
      tableId,
      tableName: tableData.name,
      items: verifiedItems,
      subtotal,
      discount: 0,
      total: subtotal,
      status: "pending",
      customerName: "",
      customerPhone: "",
      paymentMethod: "",
      createdAt: Date.now(),
      paidAt: null,
    });

    transaction.update(tableRef, {
      status: "occupied",
      currentOrderId: orderRef.id,
    });
  });
};

export const checkoutOrder = async ({
  orderId,
  customerName = "",
  customerPhone = "",
  paymentMethod,
}: CheckoutOrderParams) => {
  await runTransaction(db, async (transaction) => {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Đơn hàng không tồn tại");
    }

    const orderData = orderSnap.data() as {
      tableId: string;
      items: {
        productId: string;
        name: string;
        size: ProductSize;
        price: number;
        qty: number;
      }[];
      total: number;
      status: string;
    };

    if (orderData.status === "paid") {
      throw new Error("Đơn đã thanh toán");
    }

    for (const item of orderData.items) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Không tìm thấy sản phẩm: ${item.name}`);
      }

      const productData = productSnap.data() as {
        recipes: {
          M: { inventoryId: string; qty: number }[];
          L: { inventoryId: string; qty: number }[];
        };
      };

      const selectedRecipe = productData.recipes?.[item.size] || [];

      for (const recipeItem of selectedRecipe) {
        const inventoryRef = doc(db, "inventory", recipeItem.inventoryId);
        const inventorySnap = await transaction.get(inventoryRef);

        if (!inventorySnap.exists()) {
          throw new Error(
            `Không tìm thấy nguyên liệu ID: ${recipeItem.inventoryId}`
          );
        }

        const inventoryData = inventorySnap.data() as {
          name: string;
          stock: number;
        };

        const requiredQty = Number(recipeItem.qty) * item.qty;
        const currentStock = Number(inventoryData.stock || 0);

        if (currentStock < requiredQty) {
          throw new Error(`Không đủ tồn kho cho: ${inventoryData.name}`);
        }

        transaction.update(inventoryRef, {
          stock: currentStock - requiredQty,
        });
      }
    }

    const paidAt = Date.now();
    const tableRef = doc(db, "tables", orderData.tableId);

    transaction.update(orderRef, {
      status: "paid",
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      paymentMethod,
      paidAt,
    });

    transaction.update(tableRef, {
      status: "available",
      currentOrderId: null,
    });

    if (customerPhone.trim()) {
      const customersQuery = query(
        collection(db, "customers"),
        where("phone", "==", customerPhone.trim())
      );

      const customersSnap = await getDocs(customersQuery);

      if (!customersSnap.empty) {
        const customerDoc = customersSnap.docs[0];
        const customerRef = doc(db, "customers", customerDoc.id);
        const customerData = customerDoc.data() as {
          totalSpent?: number;
          visitCount?: number;
          name?: string;
        };

        transaction.update(customerRef, {
          name: customerName.trim() || customerData.name || "",
          totalSpent:
            Number(customerData.totalSpent || 0) + Number(orderData.total || 0),
          visitCount: Number(customerData.visitCount || 0) + 1,
          lastOrderAt: paidAt,
        });
      } else {
        const newCustomerRef = doc(collection(db, "customers"));
        transaction.set(newCustomerRef, {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          totalSpent: Number(orderData.total || 0),
          visitCount: 1,
          lastOrderAt: paidAt,
        });
      }
    }
  });
};