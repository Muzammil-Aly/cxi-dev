// SidebarItems.tsx
import { Aireach, Analytics, LeadsIcon, Tasks, UserIcon } from "@/assets/icons";
// export const sidebarButtons = [
//   { label: "Admin User", id: "admin" },
//   { label: "Solo User", id: "solo" },
// ];

export const sidebarItems = [
  { label: "Profile", icon: LeadsIcon },
  { label: "AI Outreach", icon: Aireach },
  { label: "Tasks & Reminder", icon: Tasks },
  { label: "Analytics", icon: Analytics },
  { label: "Admin Oversight", icon: UserIcon },
];
export const sidebarItemsMobile = [
  { label: "Profile", icon: LeadsIcon },
  { label: "AI Outreach", icon: Aireach },
  { label: "Tasks", icon: Tasks },
  { label: "Analytics", icon: Analytics },
  { label: "Admin", icon: UserIcon },
];