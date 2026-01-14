import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthData,
  getTokenExpiry,
} from "./tokenManager";

// Session configuration
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000; // Refresh if less than 10 minutes remaining

export class SessionManager {
  private lastActivityTime: number;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private onLogout?: () => void;

  constructor(onLogout?: () => void) {
    this.lastActivityTime = Date.now();
    this.onLogout = onLogout;
  }

  /**
   * Initialize session management
   */
  public init() {
    this.setupActivityListeners();
    this.startInactivityTimer();
    this.startTokenRefreshTimer();
  }

  /**
   * Clean up timers and listeners
   */
  public cleanup() {
    this.clearInactivityTimer();
    this.clearTokenRefreshTimer();
    this.removeActivityListeners();
  }

  /**
   * Setup listeners for user activity
   */
  private setupActivityListeners() {
    if (typeof window === "undefined") return;

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, this.handleActivity, true);
    });
  }

  /**
   * Remove activity listeners
   */
  private removeActivityListeners() {
    if (typeof window === "undefined") return;

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      window.removeEventListener(event, this.handleActivity, true);
    });
  }

  /**
   * Handle user activity
   */
  private handleActivity = () => {
    this.lastActivityTime = Date.now();
    this.resetInactivityTimer();
  };

  /**
   * Start inactivity timer
   */
  private startInactivityTimer() {
    this.clearInactivityTimer();
    this.inactivityTimer = setInterval(() => {
      this.checkInactivity();
    }, 60000); // Check every minute
  }

  /**
   * Clear inactivity timer
   */
  private clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer() {
    this.startInactivityTimer();
  }

  /**
   * Check if user has been inactive for too long
   */
  private checkInactivity() {
    const inactiveTime = Date.now() - this.lastActivityTime;

    if (inactiveTime >= INACTIVITY_TIMEOUT) {
      console.log("Session expired due to inactivity");
      this.handleSessionExpired();
    }
  }

  /**
   * Start automatic token refresh timer
   */
  private startTokenRefreshTimer() {
    this.clearTokenRefreshTimer();
    this.tokenRefreshTimer = setInterval(() => {
      this.checkAndRefreshToken();
    }, TOKEN_REFRESH_INTERVAL);
  }

  /**
   * Clear token refresh timer
   */
  private clearTokenRefreshTimer() {
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Check if token needs refresh and refresh it
   */
  private async checkAndRefreshToken() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    const expiry = getTokenExpiry(accessToken);
    if (!expiry) {
      return;
    }

    const timeUntilExpiry = expiry - Date.now();

    // If token expires in less than 10 minutes, refresh it
    if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
      console.log("Token expiring soon, refreshing...");
      await this.refreshToken();
    }
  }

  /**
   * Refresh the access token
   */
  private async refreshToken() {
    try {
      const refresh = getRefreshToken();
      if (!refresh) {
        this.handleSessionExpired();
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
        this.handleSessionExpired();
        return false;
      }

      const data = await response.json();

      if (data.status === 200 && data.data) {
        setAuthTokens({
          access_token: data.data.access_token,
          refresh_token: data.data.refresh_token,
          token_type: data.data.token_type,
        });
        console.log("Token refreshed successfully");
        return true;
      }

      this.handleSessionExpired();
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.handleSessionExpired();
      return false;
    }
  }

  /**
   * Handle session expiration
   */
  private handleSessionExpired() {
    this.cleanup();
    clearAuthData();
    if (this.onLogout) {
      this.onLogout();
    }
  }

  /**
   * Get time until inactivity timeout
   */
  public getTimeUntilTimeout(): number {
    const inactiveTime = Date.now() - this.lastActivityTime;
    return Math.max(0, INACTIVITY_TIMEOUT - inactiveTime);
  }

  /**
   * Get last activity time
   */
  public getLastActivityTime(): number {
    return this.lastActivityTime;
  }

  /**
   * Check if session is still active
   */
  public isSessionActive(): boolean {
    const inactiveTime = Date.now() - this.lastActivityTime;
    return inactiveTime < INACTIVITY_TIMEOUT;
  }
}
