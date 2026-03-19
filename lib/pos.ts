import {
  collection,
  doc,
  getDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CartItemType } from "@/types";

type SubmitOrderParams = {
  tableId: string;
  cart: CartItemType[];
};

export const submitPosOrder = async ({
  tableId,
  cart,
}: SubmitOrderParams) => {
  if (!tableId) {
    throw new Error("Chưa chọn bàn");
  }

  if (!cart.length) {
    throw new Error("Giỏ hàng đang trống");
  }

  await runTransaction(db, async (transaction) => {
    const tableRef = doc(db, "tables", tableId);
    const tableSnap = await transaction.get(tableRef);

    if (!tableSnap.exists()) {
      throw new Error("Bàn không tồn tại");
    }

    const tableData = tableSnap.data();

    if (tableData.status === "reserved") {
      throw new Error("Bàn này đang được đặt trước");
    }

    let total = 0;

    const verifiedItems: CartItemType[] = [];

    for (const item of cart) {
      const productRef = doc(db, "products", item.productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Sản phẩm không tồn tại: ${item.name}`);
      }

      const productData = productSnap.data() as {
        name: string;
        price: number;
        recipe?: { inventoryId: string; qty: number }[];
      };

      const finalPrice = Number(productData.price || 0);
      const itemTotal = finalPrice * item.qty;
      total += itemTotal;

      verifiedItems.push({
        productId: item.productId,
        name: productData.name,
        price: finalPrice,
        qty: item.qty,
      });

      if (productData.recipe && Array.isArray(productData.recipe)) {
        for (const recipeItem of productData.recipe) {
          const inventoryRef = doc(db, "inventory", recipeItem.inventoryId);
          const inventorySnap = await transaction.get(inventoryRef);

          if (!inventorySnap.exists()) {
            throw new Error(
              `Không tìm thấy nguyên liệu với ID: ${recipeItem.inventoryId}`
            );
          }

          const inventoryData = inventorySnap.data() as {
            stock: number;
            name: string;
          };

          const requiredQty = Number(recipeItem.qty) * item.qty;
          const currentStock = Number(inventoryData.stock || 0);

          if (currentStock < requiredQty) {
            throw new Error(
              `Không đủ tồn kho cho nguyên liệu: ${inventoryData.name}`
            );
          }

          transaction.update(inventoryRef, {
            stock: currentStock - requiredQty,
          });
        }
      }
    }

    const orderRef = doc(collection(db, "orders"));

    transaction.set(orderRef, {
      tableId,
      tableName: tableData.name,
      items: verifiedItems,
      total,
      status: "paid",
      createdAt: Date.now(),
    });

    transaction.update(tableRef, {
      status: "occupied",
      currentOrderId: orderRef.id,
    });
  });
};

export const releaseTable = async (tableId: string) => {
  const tableRef = doc(db, "tables", tableId);

  const tableSnap = await getDoc(tableRef);
  if (!tableSnap.exists()) {
    throw new Error("Bàn không tồn tại");
  }

  await runTransaction(db, async (transaction) => {
    transaction.update(tableRef, {
      status: "available",
      currentOrderId: null,
    });
  });
};