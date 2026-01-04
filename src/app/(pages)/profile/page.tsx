import ProfileLayout from "@/views/Profile/ProfileLayout";
import DetailedInfo from "@/views/Profile/TabsContent/profile-Information/ProfileInfo";

const ProfilePage = () => {
  return (
    <ProfileLayout activeMenu="Customer Profiles">
      <DetailedInfo />
    </ProfileLayout>
  );
};

export default ProfilePage;
