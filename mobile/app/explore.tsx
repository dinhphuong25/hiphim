import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Compass } from "lucide-react-native";
import { NativeHeader } from "@/components/ui/NativeHeader";
import { MovieCard } from "@/components/ui/MovieCard";
import {
  CATEGORIES_LIST,
  fetchMoviesByCategory,
  fetchMoviesByCountry,
  fetchMoviesByYear,
  fetchListByType,
  MovieItem,
} from "@/services/api";
import { Colors } from "@/constants/theme";
import { haptic } from "@/services/haptics";
import { useObserve } from "@/services/observe";

type ExploreSegment = "category" | "country" | "type" | "year";

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ segment?: string; slug?: string; name?: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const { markInteractive } = useObserve();
  const numColumns = 2;

  const cardSpacing = 12;
  const horizontalPadding = 14;
  const cardWidth = Math.floor((screenWidth - horizontalPadding * 2 - cardSpacing) / 2);

  const [segment, setSegment] = useState<ExploreSegment>(
    (params.segment as ExploreSegment) || "category"
  );
  const [selectedSlug, setSelectedSlug] = useState<string>(
    params.slug || (CATEGORIES_LIST[0]?.slug ?? "hanh-dong")
  );
  const [selectedName, setSelectedName] = useState<string>(
    params.name || (CATEGORIES_LIST[0]?.name ?? "Hành Động")
  );

  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sync with route params if they change
  useEffect(() => {
    if (
      params.segment &&
      (params.segment === "category" ||
        params.segment === "country" ||
        params.segment === "type" ||
        params.segment === "year")
    ) {
      setSegment(params.segment as ExploreSegment);
    }
    if (params.slug) {
      setSelectedSlug(params.slug);
    }
    if (params.name) {
      setSelectedName(params.name);
    }
  }, [params.segment, params.slug, params.name]);

  const loadData = useCallback(
    async (
      currentSegment = segment,
      slug = selectedSlug,
      p = 1,
      append = false
    ) => {
      try {
        let res: { items: MovieItem[]; totalPages: number };
        if (currentSegment === "category") {
          res = await fetchMoviesByCategory(slug, p);
        } else if (currentSegment === "country") {
          res = await fetchMoviesByCountry(slug, p);
        } else if (currentSegment === "type") {
          res = await fetchListByType(slug, p);
        } else {
          res = await fetchMoviesByYear(parseInt(slug, 10) || 2026, p);
        }

        if (append) {
          setMovies((prev) => {
            const seen = new Set(prev.map((m) => m.slug));
            const newItems = res.items.filter((m) => !seen.has(m.slug));
            return [...prev, ...newItems];
          });
        } else {
          setMovies(res.items);
        }
        setTotalPages(res.totalPages || 1);
        setPage(p);
      } catch (err) {
        console.error("Explore load error:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [segment, selectedSlug]
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadData(segment, selectedSlug, 1, false);
  }, [segment, selectedSlug, loadData]);

  // Report interactive time to EAS Observe once explore list is ready
  useEffect(() => {
    if (!loading) {
      markInteractive();
    }
  }, [loading, markInteractive]);

  const onRefresh = () => {
    haptic.light();
    setRefreshing(true);
    loadData(segment, selectedSlug, 1, false);
  };

  const onEndReached = () => {
    if (!loadingMore && page < totalPages) {
      setLoadingMore(true);
      loadData(segment, selectedSlug, page + 1, true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header with Back button */}
      <NativeHeader showBackButton={true} onBack={() => router.back()} />

      {/* Result Status Title Row */}
      <View style={styles.resultTitleRow}>
        <View style={styles.resultTitleLeft}>
          <Compass size={15} color="#20D66B" strokeWidth={2.4} />
          <Text style={styles.resultTitle} numberOfLines={1}>
            Khám phá: <Text style={styles.highlightTitle}>{selectedName}</Text>
          </Text>
        </View>
        {totalPages > 1 && (
          <View style={styles.pageBadge}>
            <Text style={styles.pageBadgeText}>
              Trang {page}/{totalPages}
            </Text>
          </View>
        )}
      </View>

      {/* Movie Grid or Loading */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải phim {selectedName}...</Text>
        </View>
      ) : (
        <FlatList
          key={`grid-${numColumns}`}
          data={movies}
          keyExtractor={(item, index) => `${item.slug}-${index}`}
          numColumns={numColumns}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <MovieCard movie={item} width={cardWidth} />
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.footerText}>Đang tải thêm phim...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Chưa có phim phù hợp</Text>
              <Text style={styles.emptySubtitle}>
                Vui lòng chọn danh mục khác hoặc kéo xuống để thử lại
              </Text>
            </View>
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
  resultTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  resultTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.55)",
    fontWeight: "600",
  },
  highlightTitle: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  pageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginLeft: 6,
  },
  pageBadgeText: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 36,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
    maxWidth: 240,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});
