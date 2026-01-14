import { useCallback, useEffect, useState } from "react";
import {
  getAccessToken,
  getRefreshToken,
  getUserInfo,
  isAuthenticated,
  clearAuthData,
  setAuthTokens,
  shouldRefreshToken,
} from "@/utils/auth";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuth(isAuthenticated());
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    clearAuthData();
    router.push("/sign-in");
  }, [router]);

  const refreshToken = useCallback(async () => {
    try {
      const refresh = getRefreshToken();
      if (!refresh) {
        logout();
        return false;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refresh }),
        }
      );

      if (!response.ok) {
        logout();
        return false;
      }

      const data = await response.json();

      if (data.status === 200 && data.data) {
        setAuthTokens({
          access_token: data.data.access_token,
          refresh_token: data.data.refresh_token,
          token_type: data.data.token_type,
        });
        setIsAuth(true);
        return true;
      }

      logout();
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      return false;
    }
  }, [logout]);

  const checkAndRefreshToken = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return false;
    }

    if (shouldRefreshToken(accessToken)) {
      return await refreshToken();
    }

    return true;
  }, [refreshToken]);

  return {
    isAuthenticated: isAuth,
    isLoading,
    user: getUserInfo(),
    accessToken: getAccessToken(),
    logout,
    refreshToken,
    checkAndRefreshToken,
  };
};
