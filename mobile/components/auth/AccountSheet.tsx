import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Heart,
  Clock,
  RefreshCw,
  LogOut,
  X,
  Crown,
  ChevronRight,
  Shield,
  LogIn,
  UserPlus,
} from "lucide-react-native";
import { useUserAuth } from "@/context/UserAuthContext";
import { getFavorites, getWatchHistory } from "@/services/storage";
import { Colors } from "@/constants/theme";
import { haptic } from "@/services/haptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function AccountSheet() {
  const router = useRouter();
  const {
    user,
    isAccountSheetOpen,
    closeAccountSheet,
    openAuthModal,
    logout,
    syncWithServer,
    isSyncing,
  } = useUserAuth();

  const [favCount, setFavCount] = useState(0);
  const [histCount, setHistCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState("");

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAccountSheetOpen) {
      // Refresh local counts
      getFavorites().then((favs) => setFavCount(favs.length));
      getWatchHistory().then((hist) => setHistCount(hist.length));

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 24,
          stiffness: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAccountSheetOpen, fadeAnim, slideAnim]);

  if (!isAccountSheetOpen) return null;

  const isSuperAdmin = Boolean(
    user && (user.role === "superadmin" || user.role === "admin" || user.email?.toLowerCase() === "kimdinhphuong205@gmail.com")
  );

  const handleManualSync = async () => {
    haptic.selection();
    setSyncMessage("Đang đồng bộ...");
    const res = await syncWithServer();
    setFavCount(res.favoritesCount);
    setHistCount(res.historyCount);
    setSyncMessage("Đã đồng bộ thành công!");
    setTimeout(() => setSyncMessage(""), 2500);
  };

  return (
    <Modal
      transparent
      visible={isAccountSheetOpen}
      animationType="none"
      onRequestClose={closeAccountSheet}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAccountSheet} />
        </Animated.View>

        {/* Sheet Container */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Top Pull Handle */}
          <View style={styles.pullHandle} />

          {user ? (
            /* ==================================================== */
            /* LOGGED IN USER VIEW                                  */
            /* ==================================================== */
            <View style={styles.contentWrapper}>
              {/* Profile Card Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileLeft}>
                  <View
                    style={[
                      styles.avatarBadge,
                      isSuperAdmin && styles.avatarAdmin,
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {(user.name || user.email || "U").charAt(0).toUpperCase()}
                    </Text>
                    {isSuperAdmin && (
                      <View style={styles.crownTag}>
                        <Crown size={9} color="#000000" fill="#000000" />
                      </View>
                    )}
                  </View>

                  <View style={styles.profileInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {user.name}
                      </Text>
                      {isSuperAdmin && (
                        <Crown size={14} color="#FBBF24" fill="#FBBF24" />
                      )}
                    </View>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={closeAccountSheet}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color="rgba(255, 255, 255, 0.7)" />
                </Pressable>
              </View>

              {/* Admin Badge Notice */}
              {isSuperAdmin && (
                <View style={styles.adminBanner}>
                  <Shield size={14} color="#20D66B" />
                  <Text style={styles.adminBannerText}>
                    Tài khoản Quản Trị Viên (SuperAdmin)
                  </Text>
                </View>
              )}

              {/* Data Sync & Quick Links Hub */}
              <View style={styles.actionCluster}>
                {/* Link: Phim Yêu Thích */}
                <Pressable
                  onPress={() => {
                    closeAccountSheet();
                    router.push("/(tabs)/favorites");
                  }}
                  style={({ pressed }) => [
                    styles.actionItem,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <View style={styles.actionLeft}>
                    <View style={[styles.actionIconBadge, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                      <Heart size={15} color="#EF4444" fill="#EF4444" />
                    </View>
                    <Text style={styles.actionLabel}>Phim Yêu Thích</Text>
                  </View>
                  <View style={styles.actionRight}>
                    <View style={styles.syncBadge}>
                      <Text style={styles.syncBadgeText}>{favCount} phim • Đã lưu</Text>
                    </View>
                    <ChevronRight size={14} color="rgba(255, 255, 255, 0.4)" />
                  </View>
                </Pressable>

                {/* Link: Lịch Sử Xem */}
                <Pressable
                  onPress={() => {
                    closeAccountSheet();
                    router.push("/(tabs)/history");
                  }}
                  style={({ pressed }) => [
                    styles.actionItem,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <View style={styles.actionLeft}>
                    <View style={[styles.actionIconBadge, { backgroundColor: "rgba(32, 214, 107, 0.15)" }]}>
                      <Clock size={15} color="#20D66B" strokeWidth={2.4} />
                    </View>
                    <Text style={styles.actionLabel}>Lịch Sử Xem</Text>
                  </View>
                  <View style={styles.actionRight}>
                    <View style={styles.syncBadge}>
                      <Text style={styles.syncBadgeText}>{histCount} phim • Đã xem</Text>
                    </View>
                    <ChevronRight size={14} color="rgba(255, 255, 255, 0.4)" />
                  </View>
                </Pressable>

                {/* Button: Đồng Bộ Ngay */}
                <Pressable
                  onPress={handleManualSync}
                  disabled={isSyncing}
                  style={({ pressed }) => [
                    styles.actionItem,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <View style={styles.actionLeft}>
                    <View style={[styles.actionIconBadge, { backgroundColor: "rgba(32, 214, 107, 0.15)" }]}>
                      <RefreshCw
                        size={15}
                        color="#20D66B"
                        strokeWidth={2.4}
                      />
                    </View>
                    <View>
                      <Text style={styles.actionLabel}>Đồng Bộ Ngay</Text>
                      {syncMessage ? (
                        <Text style={styles.syncStatusText}>{syncMessage}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.actionRight}>
                    <View style={[styles.syncBadge, { backgroundColor: "rgba(32, 214, 107, 0.18)", borderColor: "rgba(32, 214, 107, 0.4)" }]}>
                      <Text style={[styles.syncBadgeText, { color: "#20D66B" }]}>
                        {isSyncing ? "Đang đồng bộ..." : "Đám mây"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>

              <View style={styles.divider} />

              {/* Logout Button */}
              <Pressable
                onPress={logout}
                style={({ pressed }) => [
                  styles.logoutBtn,
                  pressed && styles.itemPressed,
                ]}
              >
                <LogOut size={16} color="#F87171" strokeWidth={2.2} />
                <Text style={styles.logoutText}>Đăng Xuất</Text>
              </Pressable>
            </View>
          ) : (
            /* ==================================================== */
            /* NOT LOGGED IN VIEW                                   */
            /* ==================================================== */
            <View style={styles.contentWrapper}>
              {/* Header */}
              <View style={styles.loggedOutHeader}>
                <View style={styles.loggedOutHeaderLeft}>
                  <View style={styles.loggedOutEmblem}>
                    <User size={18} color="#20D66B" strokeWidth={2.4} />
                  </View>
                  <View>
                    <Text style={styles.loggedOutTitle}>Tài Khoản Thành Viên</Text>
                    <Text style={styles.loggedOutSub}>Trải nghiệm xem phim riêng tư</Text>
                  </View>
                </View>
                <Pressable
                  onPress={closeAccountSheet}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color="rgba(255, 255, 255, 0.7)" />
                </Pressable>
              </View>

              {/* Description */}
              <Text style={styles.loggedOutDescription}>
                Đăng nhập để lưu lịch sử xem phim và đồng bộ danh sách phim yêu thích xuyên suốt mọi thiết bị của bạn.
              </Text>

              {/* Dual Action Buttons: Login / Register */}
              <View style={styles.authBtnRow}>
                <Pressable
                  onPress={() => {
                    closeAccountSheet();
                    openAuthModal("login");
                  }}
                  style={({ pressed }) => [
                    styles.primaryLoginBtn,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <LogIn size={15} color="#050807" strokeWidth={2.4} />
                  <Text style={styles.primaryLoginText}>Đăng Nhập</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    closeAccountSheet();
                    openAuthModal("register");
                  }}
                  style={({ pressed }) => [
                    styles.secondaryRegisterBtn,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <UserPlus size={15} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.secondaryRegisterText}>Đăng Ký</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  sheetContainer: {
    width: "100%",
    backgroundColor: "#0B100E",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 20,
  },
  pullHandle: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignSelf: "center",
    marginBottom: 10,
  },
  contentWrapper: {
    paddingHorizontal: 18,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#20D66B",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#20D66B",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarAdmin: {
    backgroundColor: "#FBBF24",
    shadowColor: "#FBBF24",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#050807",
  },
  crownTag: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FBBF24",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#0B100E",
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  adminBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.3)",
  },
  adminBannerText: {
    color: "#20D66B",
    fontSize: 11,
    fontWeight: "700",
  },
  actionCluster: {
    marginTop: 12,
    gap: 6,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  syncStatusText: {
    fontSize: 10.5,
    color: "#20D66B",
    fontWeight: "600",
    marginTop: 2,
  },
  actionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  syncBadgeText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 14,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  logoutText: {
    color: "#F87171",
    fontSize: 13,
    fontWeight: "800",
  },
  loggedOutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  loggedOutHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loggedOutEmblem: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  loggedOutTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  loggedOutSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 1,
  },
  loggedOutDescription: {
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 16,
  },
  authBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryLoginBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#20D66B",
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryLoginText: {
    color: "#050807",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryRegisterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  secondaryRegisterText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  itemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});
