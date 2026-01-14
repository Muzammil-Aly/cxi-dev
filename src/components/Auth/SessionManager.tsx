"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SessionManager as SessionManagerClass } from "@/utils/auth/sessionManager";
import { isAuthenticated } from "@/utils/auth";

export default function SessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const sessionManagerRef = useRef<SessionManagerClass | null>(null);

  useEffect(() => {
    // Don't run on sign-in page
    if (pathname === "/sign-in") {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated()) {
      return;
    }

    // Initialize session manager
    const handleLogout = () => {
      console.log("Session expired - logging out");
      router.push("/sign-in");
    };

    sessionManagerRef.current = new SessionManagerClass(handleLogout);
    sessionManagerRef.current.init();

    console.log("Session manager initialized");

    // Cleanup on unmount
    return () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.cleanup();
        sessionManagerRef.current = null;
      }
    };
  }, [pathname, router]);

  // This component doesn't render anything
  return null;
}
