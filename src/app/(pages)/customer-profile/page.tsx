import ProfileLayout from "@/views/Profile/ProfileLayout";
import CustomerProfile from "@/views/Profile/TabsContent/customer-profile/CustomerProfile";

export default function CustomerProfilesPage() {
  return (
    <ProfileLayout activeMenu="Customer Profiles">
      <CustomerProfile />
    </ProfileLayout>
  );
}
