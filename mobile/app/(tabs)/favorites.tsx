import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Heart, Sparkles, LogIn, Lock, Film } from "lucide-react-native";
import { NativeHeader } from "@/components/ui/NativeHeader";
import { MovieCard } from "@/components/ui/MovieCard";
import { getFavorites } from "@/services/storage";
import { MovieItem } from "@/services/api";
import { useUserAuth } from "@/context/UserAuthContext";
import { Colors, Radii } from "@/constants/theme";
import { haptic } from "@/services/haptics";
import { useObserve } from "@/services/observe";

export default function FavoritesScreen() {
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useUserAuth();
  const { width: screenWidth } = useWindowDimensions();
  const { markInteractive } = useObserve();
  const numColumns = 2;

  const cardSpacing = 12;
  const horizontalPadding = 14;
  const cardWidth = Math.floor((screenWidth - horizontalPadding * 2 - cardSpacing) / 2);

  const [favorites, setFavorites] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Report interactive time to EAS Observe once favorites are loaded
  React.useEffect(() => {
    if (!loading) {
      markInteractive();
    }
  }, [loading, markInteractive]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setLoading(true);

      getFavorites().then((items) => {
        if (isMounted) {
          setFavorites(items);
          setLoading(false);
        }
      });

      return () => {
        isMounted = false;
      };
    }, [user])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <NativeHeader />



      {/* State 1: Loading */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.emptySub, { marginTop: 12 }]}>Đang tải phim yêu thích...</Text>
        </View>
      ) : !user ? (
        /* State 2: Login Required */
        <View style={styles.emptyContainer}>
          <View style={styles.loginRequiredIconCircle}>
            <Heart size={36} color="#EF4444" strokeWidth={1.8} fill="rgba(239, 68, 68, 0.2)" />
            <View style={styles.lockBadge}>
              <Lock size={12} color="#050807" strokeWidth={2.4} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Đăng nhập để lưu yêu thích</Text>
          <Text style={styles.emptySub}>
            Vui lòng đăng nhập tài khoản để lưu trữ các bộ phim yêu thích của bạn và đồng bộ trên mọi thiết bị.
          </Text>
          <Pressable
            onPress={() => {
              haptic.medium();
              openAuthModal("login");
            }}
            style={({ pressed }) => [styles.primaryLoginBtn, pressed && styles.btnPressed]}
          >
            <LogIn size={16} color="#050807" strokeWidth={2.4} />
            <Text style={styles.primaryLoginBtnText}>Đăng nhập ngay</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              haptic.light();
              openAuthModal("register");
            }}
            style={({ pressed }) => [styles.secondaryBrowseBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.secondaryBrowseBtnText}>Chưa có tài khoản? Đăng ký</Text>
          </Pressable>
        </View>
      ) : favorites.length === 0 ? (
        /* State 3: Empty Favorites */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Heart size={36} color={Colors.textDim} strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có phim yêu thích</Text>
          <Text style={styles.emptySub}>
            Khi xem phim, nhấn biểu tượng trái tim để lưu lại vào danh sách yêu thích và thưởng thức bất cứ lúc nào.
          </Text>
          <Pressable
            onPress={() => {
              haptic.medium();
              router.push("/(tabs)");
            }}
            style={({ pressed }) => [styles.browseBtn, pressed && styles.btnPressed]}
          >
            <Sparkles size={16} color="#050807" strokeWidth={2.4} />
            <Text style={styles.browseBtnText}>Khám phá phim ngay</Text>
          </Pressable>
        </View>
      ) : (
        /* State 4: Favorites Grid */
        <FlatList
          key={String(numColumns)}
          data={favorites}
          numColumns={numColumns}
          keyExtractor={(item) => item.slug}
          renderItem={({ item }) => <MovieCard movie={item} width={cardWidth} />}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          initialNumToRender={numColumns === 2 ? 6 : 9}
          maxToRenderPerBatch={numColumns === 2 ? 8 : 12}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 115,
    paddingTop: 8,
  },
  guestSyncBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  guestSyncText: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: "600",
  },
  syncActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: "rgba(32, 214, 107, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.25)",
  },
  syncActionText: {
    color: "#20D66B",
    fontSize: 10.5,
    fontWeight: "700",
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 70,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loginRequiredIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  lockBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#050807",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    color: Colors.textDim,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 22,
  },
  primaryLoginBtn: {
    backgroundColor: Colors.primary,
    width: "100%",
    maxWidth: 290,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryLoginBtnText: {
    color: "#050807",
    fontWeight: "900",
    fontSize: 13.5,
  },
  secondaryBrowseBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryBrowseBtnText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12.5,
    fontWeight: "600",
  },
  browseBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    height: 42,
    borderRadius: Radii.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  browseBtnText: {
    color: "#050807",
    fontWeight: "900",
    fontSize: 13,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
