import ProfileLayout from "@/views/Profile/ProfileLayout";
import Inventory from "@/views/Profile/TabsContent/inventory/Inventory";

const InventoryPage = () => {
  return (
    <ProfileLayout activeMenu="Inventory">
      <Inventory />
    </ProfileLayout>
  );
};

export default InventoryPage;
