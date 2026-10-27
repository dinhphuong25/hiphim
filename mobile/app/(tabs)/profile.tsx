import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  User,
  Heart,
  Clock,
  RefreshCw,
  LogOut,
  Crown,
  ChevronRight,
  Shield,
  LogIn,
  Compass,
  Film,
  Sparkles,
  Info,
} from "lucide-react-native";
import { NativeHeader } from "@/components/ui/NativeHeader";
import { useUserAuth } from "@/context/UserAuthContext";
import { useExploreSheet } from "@/context/ExploreSheetContext";
import { getFavorites, getWatchHistory } from "@/services/storage";
import { Colors, Radii } from "@/constants/theme";
import { haptic } from "@/services/haptics";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, openAuthModal, logout, syncWithServer, isSyncing } = useUserAuth();
  const { openExplore } = useExploreSheet();

  const [favCount, setFavCount] = useState(0);
  const [histCount, setHistCount] = useState(0);
  const [syncFeedback, setSyncFeedback] = useState("");

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (!user) {
        setFavCount(0);
        setHistCount(0);
        return () => {
          isMounted = false;
        };
      }
      Promise.all([getFavorites(), getWatchHistory()]).then(([favs, hist]) => {
        if (isMounted) {
          setFavCount(favs.length);
          setHistCount(hist.length);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [user])
  );

  const handleSync = async () => {
    if (!user) {
      haptic.medium();
      openAuthModal("login");
      return;
    }
    haptic.medium();
    setSyncFeedback("");
    try {
      const res = await syncWithServer();
      if (res.success) {
        haptic.success();
        setFavCount(res.favoritesCount);
        setHistCount(res.historyCount);
        setSyncFeedback("Đã đồng bộ thành công!");
        setTimeout(() => setSyncFeedback(""), 3500);
      }
    } catch {
      setSyncFeedback("Đồng bộ thất bại, vui lòng thử lại sau.");
    }
  };

  const handleLogout = () => {
    haptic.medium();
    Alert.alert("Đăng Xuất", "Bạn có chắc chắn muốn đăng xuất tài khoản?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng Xuất",
        style: "destructive",
        onPress: async () => {
          haptic.success();
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <NativeHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Banner */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <View style={styles.titleIconBadge}>
              <User size={18} color="#20D66B" strokeWidth={2.4} />
            </View>
            <Text style={styles.pageTitle}>Tài Khoản</Text>
          </View>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{user ? "Đã Đăng Nhập" : "Khách"}</Text>
          </View>
        </View>

        {/* User Card */}
        {user ? (
          <View style={styles.userCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {(user.name || user.email || "U").charAt(0).toUpperCase()}
                </Text>
                {user.role === "superadmin" && (
                  <View style={styles.crownBadge}>
                    <Crown size={11} color="#050807" strokeWidth={2.6} />
                  </View>
                )}
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.name || "Thành viên Hi Phim"}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user.email}
                </Text>

                <View style={styles.roleRow}>
                  {user.role === "superadmin" ? (
                    <View style={styles.adminBadge}>
                      <Shield size={10} color="#F59E0B" />
                      <Text style={styles.adminBadgeText}>SUPERADMIN</Text>
                    </View>
                  ) : (
                    <View style={styles.vipBadge}>
                      <Sparkles size={10} color="#20D66B" />
                      <Text style={styles.vipBadgeText}>THÀNH VIÊN VIP</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestHeader}>
              <View style={styles.guestIconCircle}>
                <User size={22} color="#20D66B" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guestTitle}>Chào Mừng Bạn!</Text>
                <Text style={styles.guestSubtitle}>
                  Đăng nhập để lưu phim yêu thích, lịch sử xem và đồng bộ dữ liệu.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                haptic.medium();
                openAuthModal("login");
              }}
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && styles.btnPressed,
              ]}
            >
              <LogIn size={15} color="#050807" strokeWidth={2.5} />
              <Text style={styles.loginBtnText}>Đăng Nhập / Đăng Ký</Text>
            </Pressable>
          </View>
        )}

        {/* Quick Stats (Yêu thích & Lịch sử) */}
        <View style={styles.statsRow}>
          <Pressable
            onPress={() => {
              haptic.selection();
              router.push("/favorites");
            }}
            style={({ pressed }) => [
              styles.statCard,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.statIconBadgeFav}>
              <Heart size={16} color="#EF4444" fill="#EF4444" />
            </View>
            <View>
              <Text style={styles.statCount}>{favCount}</Text>
              <Text style={styles.statLabel}>Phim Yêu Thích</Text>
            </View>
            <ChevronRight size={15} color="rgba(255, 255, 255, 0.3)" style={styles.statArrow} />
          </Pressable>

          <Pressable
            onPress={() => {
              haptic.selection();
              router.push("/history");
            }}
            style={({ pressed }) => [
              styles.statCard,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.statIconBadgeHist}>
              <Clock size={16} color="#60A5FA" />
            </View>
            <View>
              <Text style={styles.statCount}>{histCount}</Text>
              <Text style={styles.statLabel}>Lịch Sử Xem</Text>
            </View>
            <ChevronRight size={15} color="rgba(255, 255, 255, 0.3)" style={styles.statArrow} />
          </Pressable>
        </View>

        {/* Cloud Sync Card */}
        <View style={styles.syncCard}>
          <View style={styles.syncLeft}>
            <View style={styles.syncIconCircle}>
              <RefreshCw
                size={16}
                color="#20D66B"
                style={isSyncing ? styles.spinningIcon : undefined}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.syncTitle}>Đồng Bộ Đám Mây</Text>
              <Text style={styles.syncSubtitle}>
                {syncFeedback || (user ? "Sao lưu danh sách xem & yêu thích lên máy chủ" : "Đăng nhập để bật đồng bộ máy chủ")}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleSync}
            disabled={isSyncing}
            style={({ pressed }) => [
              styles.syncBtn,
              pressed && styles.btnPressed,
            ]}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#20D66B" />
            ) : (
              <Text style={styles.syncBtnText}>Đồng Bộ</Text>
            )}
          </Pressable>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>TIỆN ÍCH & ĐIỀU HƯỚNG</Text>

          <Pressable
            onPress={() => {
              haptic.selection();
              openExplore("main");
            }}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuRowIconBadge, { backgroundColor: "rgba(32, 214, 107, 0.12)" }]}>
                <Compass size={16} color="#20D66B" />
              </View>
              <View>
                <Text style={styles.menuRowText}>Khám Phá Toàn Diện</Text>
                <Text style={styles.menuRowSub}>Bộ lọc Thể loại, Quốc gia, Năm phát hành</Text>
              </View>
            </View>
            <ChevronRight size={16} color="rgba(255, 255, 255, 0.35)" />
          </Pressable>

          <Pressable
            onPress={() => {
              haptic.selection();
              router.push("/cinema");
            }}
            style={({ pressed }) => [
              styles.menuRow,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuRowIconBadge, { backgroundColor: "rgba(244, 63, 94, 0.12)" }]}>
                <Film size={16} color="#FB7185" />
              </View>
              <View>
                <Text style={styles.menuRowText}>Phim Chiếu Rạp Bom Tấn</Text>
                <Text style={styles.menuRowSub}>Tuyển chọn phim rạp HD chất lượng cao</Text>
              </View>
            </View>
            <ChevronRight size={16} color="rgba(255, 255, 255, 0.35)" />
          </Pressable>

          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuRowIconBadge, { backgroundColor: "rgba(59, 130, 246, 0.12)" }]}>
                <Info size={16} color="#60A5FA" />
              </View>
              <View>
                <Text style={styles.menuRowText}>Phiên Bản Ứng Dụng</Text>
                <Text style={styles.menuRowSub}>Hi Phim Mobile v1.0.0 (Expo Native)</Text>
              </View>
            </View>
            <Text style={styles.versionBadgeText}>2026</Text>
          </View>
        </View>

        {/* Logout Button */}
        {user && (
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <LogOut size={16} color="#EF4444" strokeWidth={2.2} />
            <Text style={styles.logoutBtnText}>Đăng Xuất Tài Khoản</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050807",
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 110,
    gap: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 2,
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(32, 214, 107, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.3)",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#20D66B",
  },
  statusText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 11,
    fontWeight: "700",
  },
  userCard: {
    backgroundColor: "rgba(13, 20, 16, 0.85)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.2,
    borderColor: "rgba(32, 214, 107, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(32, 214, 107, 0.18)",
    borderWidth: 2,
    borderColor: "#20D66B",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#20D66B",
  },
  crownBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    backgroundColor: "#F59E0B",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#050807",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  userEmail: {
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.55)",
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
  },
  adminBadgeText: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "800",
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.35)",
  },
  vipBadgeText: {
    color: "#20D66B",
    fontSize: 10,
    fontWeight: "800",
  },
  guestCard: {
    backgroundColor: "rgba(13, 20, 16, 0.85)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 14,
  },
  guestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  guestIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  guestSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.55)",
    lineHeight: 16,
    marginTop: 2,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#20D66B",
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#050807",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  statIconBadgeFav: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  statIconBadgeHist: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(96, 165, 250, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  statCount: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.55)",
    fontWeight: "600",
  },
  statArrow: {
    marginLeft: "auto",
  },
  syncCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    gap: 10,
  },
  syncLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  syncIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  syncSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 1,
  },
  syncBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.35)",
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#20D66B",
  },
  menuSection: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    gap: 10,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: 0.5,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  menuRowIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  menuRowText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  menuRowSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.45)",
    marginTop: 1,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.35)",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginTop: 6,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#EF4444",
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  spinningIcon: {
    transform: [{ rotate: "45deg" }],
  },
});
