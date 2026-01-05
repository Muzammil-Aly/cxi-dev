import ProfileLayout from "@/views/Profile/ProfileLayout";
import MarketingEvents from "@/views/Profile/MarketingEvents";

const MarketingEventsPage = () => {
  return (
    <ProfileLayout activeMenu="Marketing Events">
      <MarketingEvents />
    </ProfileLayout>
  );
};

export default MarketingEventsPage;
