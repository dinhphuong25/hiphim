import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeHeader } from "@/components/ui/NativeHeader";
import { MovieCard } from "@/components/ui/MovieCard";
import { fetchListByType, MovieItem } from "@/services/api";
import { Colors } from "@/constants/theme";
import { haptic } from "@/services/haptics";
import { useObserve } from "@/services/observe";

export default function CinemaScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { markInteractive } = useObserve();
  const numColumns = 2;

  const cardSpacing = 12;
  const horizontalPadding = 14;
  const cardWidth = Math.floor((screenWidth - horizontalPadding * 2 - cardSpacing) / 2);

  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (p = 1, append = false) => {
    try {
      const res = await fetchListByType("phim-chieu-rap", p);
      if (append) {
        setMovies((prev) => {
          const seen = new Set(prev.map((m) => m.slug));
          const newItems = res.items.filter((m) => !seen.has(m.slug));
          return [...prev, ...newItems];
        });
      } else {
        setMovies(res.items);
      }
      setTotalPages(res.totalPages);
      setPage(p);
    } catch (err) {
      console.error("Cinema load error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(1, false);
  }, [loadData]);

  // Report interactive time to EAS Observe once cinema list is loaded
  useEffect(() => {
    if (!loading) {
      markInteractive();
    }
  }, [loading, markInteractive]);

  const onRefresh = () => {
    haptic.light();
    setRefreshing(true);
    loadData(1, false);
  };

  const onEndReached = () => {
    if (!loadingMore && page < totalPages) {
      setLoadingMore(true);
      loadData(page + 1, true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <NativeHeader />



      {/* Movie Grid */}
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải phim chiếu rạp...</Text>
        </View>
      ) : (
        <FlatList
          key={String(numColumns)}
          data={movies}
          numColumns={numColumns}
          keyExtractor={(item, index) => `${item._id || item.slug}-${index}`}
          renderItem={({ item }) => <MovieCard movie={item} width={cardWidth} />}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={onRefresh}
          initialNumToRender={numColumns === 2 ? 6 : 9}
          maxToRenderPerBatch={numColumns === 2 ? 8 : 12}
          windowSize={7}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
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
    paddingTop: 12,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  footerLoader: {
    paddingVertical: 18,
    alignItems: "center",
  },
});
