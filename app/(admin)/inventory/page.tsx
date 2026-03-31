import InventoryLayout from "./components/InventoryLayout";
import { InventoryProvider } from "./components/InventoryContext";

export default function InventoryPage() {
  return (
    <InventoryProvider>
      <InventoryLayout />
    </InventoryProvider>
  );
}