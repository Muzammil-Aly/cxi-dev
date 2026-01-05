import ProfileLayout from "@/views/Profile/ProfileLayout";
import Orders from "@/views/Profile/Orders";

const OrdersPage = () => {
  return (
    <ProfileLayout activeMenu="Orders">
      <Orders />
    </ProfileLayout>
  );
};

export default OrdersPage;
