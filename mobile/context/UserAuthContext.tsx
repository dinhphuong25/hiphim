import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Alert } from "react-native";
import {
  UserProfile,
  loginUser,
  registerUser,
  verifyOtpUser,
  resendOtpUser,
  fetchCurrentProfile,
  syncDataWithServer,
  logoutUser,
} from "@/services/auth";
import { setActiveUserId } from "@/services/storage";
import { haptic } from "@/services/haptics";

interface UserAuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAccountSheetOpen: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register" | "otp";
  pendingEmail: string;
  isSyncing: boolean;
  openAccountSheet: () => void;
  closeAccountSheet: () => void;
  openAuthModal: (mode?: "login" | "register" | "otp", email?: string) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; devMode?: boolean; devCode?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string; devMode?: boolean; devCode?: string }>;
  logout: () => Promise<void>;
  syncWithServer: () => Promise<{ success: boolean; favoritesCount: number; historyCount: number }>;
  checkAuthOrPrompt: (actionName?: string) => boolean;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export function UserAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register" | "otp">("login");
  const [pendingEmail, setPendingEmail] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync active user ID into storage layer whenever user state changes
  useEffect(() => {
    setActiveUserId(user ? user.id : null);
  }, [user]);

  // Load user on startup
  useEffect(() => {
    let isMounted = true;
    fetchCurrentProfile()
      .then((profile) => {
        if (isMounted) {
          setUser(profile);
          setActiveUserId(profile ? profile.id : null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setActiveUserId(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openAccountSheet = useCallback(() => {
    haptic.light();
    setIsAccountSheetOpen(true);
  }, []);

  const closeAccountSheet = useCallback(() => {
    setIsAccountSheetOpen(false);
  }, []);

  const openAuthModal = useCallback((mode: "login" | "register" | "otp" = "login", email = "") => {
    haptic.light();
    setAuthModalMode(mode);
    if (email) setPendingEmail(email);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const res = await loginUser(email, pass);
    if (res.success && res.user) {
      setUser(res.user);
      setActiveUserId(res.user.id);
      setIsAuthModalOpen(false);
      haptic.success();
      // Auto sync in background
      syncDataWithServer().then(() => {
        fetchCurrentProfile().then((u) => u && setUser(u));
      });
      return { success: true };
    }
    haptic.error();
    return { success: false, error: res.error };
  }, []);

  const register = useCallback(async (email: string, pass: string, name: string) => {
    const res = await registerUser(email, pass, name);
    if (res.success) {
      setPendingEmail(email);
      setAuthModalMode("otp");
      haptic.success();
      return res;
    }
    haptic.error();
    return res;
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const res = await verifyOtpUser(email, otp);
    if (res.success && res.user) {
      setUser(res.user);
      setActiveUserId(res.user.id);
      setIsAuthModalOpen(false);
      haptic.success();
      syncDataWithServer();
      return { success: true };
    }
    haptic.error();
    return { success: false, error: res.error };
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    const res = await resendOtpUser(email);
    if (res.success) {
      haptic.light();
    } else {
      haptic.error();
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    haptic.medium();
    await logoutUser();
    setActiveUserId(null);
    setUser(null);
    setIsAccountSheetOpen(false);
  }, []);

  const syncWithServer = useCallback(async () => {
    setIsSyncing(true);
    haptic.selection();
    try {
      const res = await syncDataWithServer();
      const updated = await fetchCurrentProfile();
      if (updated) setUser(updated);
      haptic.success();
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const checkAuthOrPrompt = useCallback(
    (actionName?: string): boolean => {
      if (!user) {
        haptic.medium();
        Alert.alert(
          "Yêu Cầu Đăng Nhập",
          actionName
            ? `Vui lòng đăng nhập tài khoản để ${actionName}.`
            : "Vui lòng đăng nhập tài khoản để tiếp tục.",
          [
            { text: "Để sau", style: "cancel" },
            {
              text: "Đăng Nhập",
              onPress: () => openAuthModal("login"),
            },
          ]
        );
        return false;
      }
      return true;
    },
    [user, openAuthModal]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAccountSheetOpen,
      isAuthModalOpen,
      authModalMode,
      pendingEmail,
      isSyncing,
      openAccountSheet,
      closeAccountSheet,
      openAuthModal,
      closeAuthModal,
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
      syncWithServer,
      checkAuthOrPrompt,
    }),
    [
      user,
      loading,
      isAccountSheetOpen,
      isAuthModalOpen,
      authModalMode,
      pendingEmail,
      isSyncing,
      openAccountSheet,
      closeAccountSheet,
      openAuthModal,
      closeAuthModal,
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
      syncWithServer,
      checkAuthOrPrompt,
    ]
  );

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
}
