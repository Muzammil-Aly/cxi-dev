import Cookies from "js-cookie";

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ID_KEY = "userId";
const USER_NAME_KEY = "userName";
const USER_EMAIL_KEY = "userEmail";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserInfo {
  user_id: string;
  user_name: string;
  email: string;
}

/**
 * Store authentication tokens securely
 */
export const setAuthTokens = (tokens: AuthTokens): void => {
  // Store tokens in cookies with 7 days expiry
  Cookies.set(ACCESS_TOKEN_KEY, tokens.access_token, { expires: 7, path: "/" });
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refresh_token, { expires: 7, path: "/" });

  // Also store in localStorage as backup for client-side checks
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
};

/**
 * Get the access token
 */
export const getAccessToken = (): string | null => {
  return Cookies.get(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get the refresh token
 */
export const getRefreshToken = (): string | null => {
  return Cookies.get(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Store user information
 */
export const setUserInfo = (userInfo: UserInfo): void => {
  // Set cookie for server-side middleware
  Cookies.set(USER_ID_KEY, userInfo.user_id, { expires: 7, path: "/" });
  Cookies.set(USER_NAME_KEY, userInfo.user_name, { expires: 7, path: "/" });
  Cookies.set(USER_EMAIL_KEY, userInfo.email, { expires: 7, path: "/" });
  Cookies.set("loggedIn", "true", { expires: 7, path: "/" });

  // Set localStorage for client-side checks
  localStorage.setItem(USER_ID_KEY, userInfo.user_id);
  localStorage.setItem(USER_NAME_KEY, userInfo.user_name);
  localStorage.setItem(USER_EMAIL_KEY, userInfo.email);
  localStorage.setItem("loggedIn", "true");
};

/**
 * Get user information
 */
export const getUserInfo = (): UserInfo | null => {
  const userId = Cookies.get(USER_ID_KEY) || localStorage.getItem(USER_ID_KEY);
  const userName = Cookies.get(USER_NAME_KEY) || localStorage.getItem(USER_NAME_KEY);
  const email = Cookies.get(USER_EMAIL_KEY) || localStorage.getItem(USER_EMAIL_KEY);

  if (!userId || !userName || !email) {
    return null;
  }

  return {
    user_id: userId,
    user_name: userName,
    email: email,
  };
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const accessToken = getAccessToken();
  const userInfo = getUserInfo();
  return !!(accessToken && userInfo);
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
  // Remove cookies
  Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
  Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
  Cookies.remove(USER_ID_KEY, { path: "/" });
  Cookies.remove(USER_NAME_KEY, { path: "/" });
  Cookies.remove(USER_EMAIL_KEY, { path: "/" });
  Cookies.remove("loggedIn", { path: "/" });

  // Remove from localStorage
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem("loggedIn");
};

/**
 * Decode JWT token to get expiry time
 */
export const getTokenExpiry = (token: string): number | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  return Date.now() >= expiry;
};

/**
 * Check if token needs refresh (expires in less than 5 minutes)
 */
export const shouldRefreshToken = (token: string): boolean => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= expiry - fiveMinutes;
};
