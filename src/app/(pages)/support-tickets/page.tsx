import ProfileLayout from "@/views/Profile/ProfileLayout";
import SupportTickets from "@/views/Profile/SupportTickets";

const SupportTicketsPage = () => {
  return (
    <ProfileLayout activeMenu="Support Tickets">
      <SupportTickets />
    </ProfileLayout>
  );
};

export default SupportTicketsPage;
