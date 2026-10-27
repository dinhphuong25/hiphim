import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Clock, Sparkles, Trash2, LogIn, Lock, Film } from "lucide-react-native";
import { NativeHeader } from "@/components/ui/NativeHeader";
import { MovieCard } from "@/components/ui/MovieCard";
import {
  getWatchHistory,
  clearWatchHistory,
  removeWatchHistory,
  HistoryItem,
} from "@/services/storage";
import { syncDataWithServer } from "@/services/auth";
import { useUserAuth } from "@/context/UserAuthContext";
import { Colors, Radii } from "@/constants/theme";
import { haptic } from "@/services/haptics";
import { useObserve } from "@/services/observe";

export default function HistoryScreen() {
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useUserAuth();
  const { width: screenWidth } = useWindowDimensions();
  const { markInteractive } = useObserve();
  const numColumns = 2;

  const cardSpacing = 12;
  const horizontalPadding = 14;
  const cardWidth = Math.floor((screenWidth - horizontalPadding * 2 - cardSpacing) / 2);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Report interactive time to EAS Observe once history is loaded
  React.useEffect(() => {
    if (!loading) {
      markInteractive();
    }
  }, [loading, markInteractive]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setLoading(true);

      getWatchHistory().then((items) => {
        if (isMounted) {
          setHistory(items);
          setLoading(false);
        }
      });

      return () => {
        isMounted = false;
      };
    }, [user])
  );

  const handleClearAll = () => {
    haptic.medium();
    Alert.alert(
      "Xóa lịch sử xem",
      "Bạn có chắc muốn xóa toàn bộ lịch sử xem phim không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa hết",
          style: "destructive",
          onPress: async () => {
            haptic.heavy();
            await clearWatchHistory();
            setHistory([]);
            if (user) {
              syncDataWithServer();
            }
          },
        },
      ]
    );
  };

  const handleDeleteItem = (item: HistoryItem) => {
    haptic.medium();
    Alert.alert(
      "Xóa khỏi lịch sử",
      `Bạn có muốn xóa phim "${item.name}" khỏi lịch sử xem không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            haptic.light();
            await removeWatchHistory(item.slug);
            setHistory((prev) => prev.filter((h) => h.slug !== item.slug));
            if (user) {
              syncDataWithServer();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <NativeHeader />

      {/* Action Bar when logged-in user has history items */}
      {user && history.length > 0 && (
        <View style={styles.compactActionBar}>
          <Text style={styles.historyCountText}>{history.length} phim đã xem</Text>
          <Pressable
            onPress={handleClearAll}
            style={({ pressed }) => [styles.clearBtn, pressed && styles.btnPressed]}
          >
            <Trash2 size={13} color={Colors.danger} />
            <Text style={styles.clearText}>Xóa hết</Text>
          </Pressable>
        </View>
      )}

      {/* State 1: Loading */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.emptySub, { marginTop: 12 }]}>Đang tải lịch sử xem...</Text>
        </View>
      ) : !user ? (
        /* State 2: Login Required */
        <View style={styles.emptyContainer}>
          <View style={styles.loginRequiredIconCircle}>
            <Clock size={36} color={Colors.primary} strokeWidth={1.8} />
            <View style={styles.lockBadge}>
              <Lock size={12} color="#050807" strokeWidth={2.4} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Đăng nhập để lưu lịch sử</Text>
          <Text style={styles.emptySub}>
            Vui lòng đăng nhập tài khoản để tự động ghi nhớ và lưu lại lịch sử xem phim trên mọi thiết bị.
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
      ) : history.length === 0 ? (
        /* State 3: Empty History */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Clock size={36} color={Colors.textDim} strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có lịch sử xem</Text>
          <Text style={styles.emptySub}>
            Khi bạn xem bất kỳ tập phim nào, hệ thống sẽ tự động ghi nhớ vị trí phát và lưu lại tại đây để bạn tiếp tục xem dễ dàng.
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
        /* State 3: History Grid */
        <FlatList
          key={String(numColumns)}
          data={history}
          numColumns={numColumns}
          keyExtractor={(item) => item.slug}
          renderItem={({ item }) => {
            const movieData = item.lastEpisodeName
              ? { ...item, episode_current: item.lastEpisodeName }
              : item;
            return (
              <MovieCard
                movie={movieData}
                width={cardWidth}
                onLongPress={() => handleDeleteItem(item)}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
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
  compactActionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  historyCountText: {
    color: Colors.textDim,
    fontSize: 12,
    fontWeight: "600",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  clearText: {
    color: Colors.danger,
    fontSize: 11.5,
    fontWeight: "700",
  },
  syncHintBtn: {
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
  syncHintText: {
    color: "#20D66B",
    fontSize: 10.5,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 115,
    paddingTop: 8,
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
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(32, 214, 107, 0.35)",
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
    backgroundColor: Colors.primary,
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
