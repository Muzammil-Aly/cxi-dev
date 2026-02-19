import ProfileLayout from "@/views/Profile/ProfileLayout";
import AdminDashboard from "@/views/Profile/AdminDashboard";

const AdminOversightPage = () => {
  return (
    <ProfileLayout activeMenu="Admin Oversight">
      <AdminDashboard />
    </ProfileLayout>
  );
};

export default AdminOversightPage;
