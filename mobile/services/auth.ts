import AsyncStorage from "@react-native-async-storage/async-storage";
import { MovieItem } from "./api";
import {
  getFavorites,
  getWatchHistory,
  setActiveUserId,
  getActiveUserId,
  setUserFavorites,
  setUserHistory,
} from "./storage";

const API_BASE = "https://hiphim.one";
const LOCAL_FALLBACK_API = "http://192.168.1.222:3000";

const TOKEN_KEY = "@hiphim_session_token";
const USER_KEY = "@hiphim_user_profile";
const PENDING_REG_KEY = "@hiphim_pending_registration_token";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  role?: "user" | "admin" | "superadmin";
  createdAt?: string;
  favorites?: any[];
  history?: any[];
}

async function requestApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const pendingToken = await AsyncStorage.getItem(PENDING_REG_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 HiPhimApp/1.0",
    ...(options.headers as Record<string, string>),
  };

  const cookies: string[] = [];
  if (token) {
    cookies.push(`hiphim_user_session=${token}`);
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-user-token"] = token;
  }
  if (pendingToken) {
    cookies.push(`hiphim_pending_registration=${pendingToken}`);
  }
  if (cookies.length > 0) {
    headers["Cookie"] = cookies.join("; ");
  }

  // Try production first with timeout, then local fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    // If production fails or offline, attempt local dev server
    return fetch(`${LOCAL_FALLBACK_API}${endpoint}`, {
      ...options,
      headers,
    });
  }
}

function extractTokenFromResponse(res: Response, cookieName = "hiphim_user_session"): string | null {
  try {
    if (typeof (res.headers as any).getSetCookie === "function") {
      const cookies = (res.headers as any).getSetCookie() as string[];
      for (const c of cookies) {
        const regex = new RegExp(`${cookieName}=([^;]+)`);
        const match = c.match(regex);
        if (match) return match[1];
      }
    }
  } catch {}

  const setCookie = res.headers.get("set-cookie") || res.headers.get("Set-Cookie") || "";
  const regex = new RegExp(`${cookieName}=([^;]+)`);
  const match = setCookie.match(regex);
  return match ? match[1] : null;
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await requestApi("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Đăng nhập thất bại" };
    }

    const token = extractTokenFromResponse(res);
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

    // Connect user storage
    setActiveUserId(data.user.id);
    if (Array.isArray(data.user.favorites)) {
      await setUserFavorites(data.user.id, data.user.favorites);
    }
    if (Array.isArray(data.user.history)) {
      await setUserHistory(data.user.id, data.user.history);
    }

    return { success: true, user: data.user };
  } catch (err: any) {
    console.error("login error:", err);
    return { success: false, error: err?.message || "Không thể kết nối tới máy chủ" };
  }
}

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string; devMode?: boolean; devCode?: string }> {
  try {
    const res = await requestApi("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password, name: name.trim() }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Đăng ký thất bại" };
    }

    const pendingToken = extractTokenFromResponse(res, "hiphim_pending_registration");
    if (pendingToken) {
      await AsyncStorage.setItem(PENDING_REG_KEY, pendingToken);
    }

    return {
      success: true,
      devMode: data.devMode,
      devCode: data.devCode,
    };
  } catch (err: any) {
    console.error("register error:", err);
    return { success: false, error: err?.message || "Không thể kết nối tới máy chủ" };
  }
}

export async function verifyOtpUser(
  email: string,
  otp: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await requestApi("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Mã OTP không chính xác" };
    }

    const token = extractTokenFromResponse(res);
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
    await AsyncStorage.removeItem(PENDING_REG_KEY);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

    // Connect user storage
    setActiveUserId(data.user.id);
    if (Array.isArray(data.user.favorites)) {
      await setUserFavorites(data.user.id, data.user.favorites);
    }
    if (Array.isArray(data.user.history)) {
      await setUserHistory(data.user.id, data.user.history);
    }

    return { success: true, user: data.user };
  } catch (err: any) {
    console.error("verifyOtp error:", err);
    return { success: false, error: err?.message || "Không thể kết nối tới máy chủ" };
  }
}

export async function resendOtpUser(
  email: string
): Promise<{ success: boolean; error?: string; devMode?: boolean; devCode?: string }> {
  try {
    const res = await requestApi("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Không thể gửi lại mã OTP" };
    }

    return {
      success: true,
      devMode: data.devMode,
      devCode: data.devCode,
    };
  } catch (err: any) {
    console.error("resendOtp error:", err);
    return { success: false, error: err?.message || "Không thể kết nối tới máy chủ" };
  }
}

export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      const cached = await AsyncStorage.getItem(USER_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setActiveUserId(parsed.id);
        return parsed;
      }
      setActiveUserId(null);
      return null;
    }

    const res = await requestApi("/api/auth/me", { method: "GET" });
    const data = await res.json();

    if (res.ok && data.authenticated && data.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setActiveUserId(data.user.id);
      if (Array.isArray(data.user.favorites)) {
        await setUserFavorites(data.user.id, data.user.favorites);
      }
      if (Array.isArray(data.user.history)) {
        await setUserHistory(data.user.id, data.user.history);
      }
      return data.user;
    }

    const cached = await AsyncStorage.getItem(USER_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      setActiveUserId(parsed.id);
      return parsed;
    }
    setActiveUserId(null);
    return null;
  } catch {
    const cached = await AsyncStorage.getItem(USER_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      setActiveUserId(parsed.id);
      return parsed;
    }
    setActiveUserId(null);
    return null;
  }
}

export async function syncDataWithServer(): Promise<{
  success: boolean;
  favoritesCount: number;
  historyCount: number;
}> {
  try {
    const [favorites, history] = await Promise.all([
      getFavorites(),
      getWatchHistory(),
    ]);

    const res = await requestApi("/api/auth/sync", {
      method: "POST",
      body: JSON.stringify({
        favorites,
        history: history.map((h) => ({
          ...h,
          currentTime: h.progressSeconds || 0,
          episodeName: h.lastEpisodeName,
          episodeSlug: h.lastEpisodeSlug,
          watchedAt: h.lastWatchedAt || Date.now(),
        })),
        mode: "merge",
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const activeId = getActiveUserId();
      if (activeId) {
        if (Array.isArray(data.favorites)) {
          await setUserFavorites(activeId, data.favorites);
        }
        if (Array.isArray(data.history)) {
          await setUserHistory(activeId, data.history);
        }
      }
      return {
        success: true,
        favoritesCount: data.favorites?.length ?? favorites.length,
        historyCount: data.history?.length ?? history.length,
      };
    }

    return { success: false, favoritesCount: favorites.length, historyCount: history.length };
  } catch (err) {
    console.error("syncDataWithServer error:", err);
    const [favs, hist] = await Promise.all([getFavorites(), getWatchHistory()]);
    return { success: false, favoritesCount: favs.length, historyCount: hist.length };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await requestApi("/api/auth/logout", { method: "POST" });
  } catch {}
  setActiveUserId(null);
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, PENDING_REG_KEY]);
}
