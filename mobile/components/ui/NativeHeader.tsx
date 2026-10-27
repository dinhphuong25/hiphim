import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Search, LayoutGrid, User, ChevronLeft } from "lucide-react-native";
import { Colors } from "@/constants/theme";
import { haptic } from "@/services/haptics";
import { useExploreSheet } from "@/context/ExploreSheetContext";
import { useUserAuth } from "@/context/UserAuthContext";

interface NativeHeaderProps {
  onOpenExplore?: () => void;
  showExploreButton?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function NativeHeader({
  onOpenExplore,
  showExploreButton = true,
  showBackButton = false,
  onBack,
}: NativeHeaderProps) {
  const router = useRouter();
  const { openExplore } = useExploreSheet();
  const { user, openAccountSheet } = useUserAuth();

  const handleMenuPress = () => {
    haptic.medium();
    if (onOpenExplore) {
      onOpenExplore();
    } else {
      openExplore("main");
    }
  };

  const handleBackPress = () => {
    haptic.light();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleSearchPress = () => {
    haptic.light();
    router.push("/search");
  };

  const handleAccountPress = () => {
    haptic.light();
    openAccountSheet();
  };

  return (
    <View style={styles.headerWrapper}>
      {/* Floating Rounded Nav Bar */}
      <View style={styles.navBar}>
        {/* Left: Back Button or [⊞ Menu] Button */}
        {showBackButton ? (
          <Pressable
            onPress={handleBackPress}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.btnPressed,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={18} color="#20D66B" strokeWidth={2.4} />
            <Text style={styles.backBtnText}>Quay lại</Text>
          </Pressable>
        ) : (
          showExploreButton && (
            <Pressable
              onPress={handleMenuPress}
              style={({ pressed }) => [
                styles.menuBtn,
                pressed && styles.btnPressed,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <LayoutGrid size={15} color="#20D66B" strokeWidth={2.4} />
              <Text style={styles.menuText}>Menu</Text>
            </Pressable>
          )
        )}

        {/* Right: Search Pill */}
        <Pressable
          onPress={handleSearchPress}
          style={({ pressed }) => [
            styles.searchPill,
            pressed && styles.btnPressed,
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.searchIconBadge}>
            <Search size={13} color="#20D66B" strokeWidth={2.4} />
          </View>
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Tìm kiếm...
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 6,
    backgroundColor: "transparent",
  },
  navBar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    borderRadius: 26,
    backgroundColor: "rgba(11, 16, 14, 0.94)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  menuBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 19,
    backgroundColor: "rgba(20, 35, 27, 0.85)",
    borderWidth: 1.2,
    borderColor: "rgba(32, 214, 107, 0.35)",
  },
  menuText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: "rgba(20, 35, 27, 0.85)",
    borderWidth: 1.2,
    borderColor: "rgba(32, 214, 107, 0.35)",
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    paddingLeft: 5,
    paddingRight: 11,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
  },
  searchIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(32, 214, 107, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchPlaceholder: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
  userBtn: {
    height: 38,
    width: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#20D66B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(32, 214, 107, 0.6)",
    position: "relative",
  },
  userAvatarText: {
    color: "#050807",
    fontSize: 14,
    fontWeight: "900",
  },
  userCrownDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FBBF24",
    borderWidth: 1.5,
    borderColor: "#0B100E",
  },
  userIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
