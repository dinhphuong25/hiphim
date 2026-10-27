import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Search, X, Film } from "lucide-react-native";
import { MovieCard } from "@/components/ui/MovieCard";
import { searchMovies, MovieItem } from "@/services/api";
import { Colors, Radii } from "@/constants/theme";
import { haptic } from "@/services/haptics";

const POPULAR_TAGS = [
  "Chiếu Rạp",
  "Anime",
  "Hàn Quốc",
  "Hành Động",
  "Kinh Dị",
  "Tình Cảm",
  "Cổ Trang",
  "Viễn Tưởng",
  "Hài Hước",
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const numColumns = 2;

  const cardSpacing = 12;
  const horizontalPadding = 14;
  const cardWidth = Math.floor((screenWidth - horizontalPadding * 2 - cardSpacing) / 2);

  const [query, setQuery] = useState(params.q || "");
  const [results, setResults] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const items = await searchMovies(trimmed, 30);
      setResults(items);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
      performSearch(params.q);
    }
  }, [params.q, performSearch]);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(text);
    }, 400);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

  const handleTagPress = (tag: string) => {
    Keyboard.dismiss();
    setQuery(tag);
    performSearch(tag);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top Search Bar */}
      <View style={styles.searchBarContainer}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>

        <View style={styles.inputWrapper}>
          <Search size={15} color="rgba(255, 255, 255, 0.45)" strokeWidth={2.2} />
          <TextInput
            value={query}
            onChangeText={handleChangeText}
            placeholder="Tìm kiếm phim, diễn viên, thể loại..."
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(query)}
            autoFocus={!params.q}
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <View style={styles.clearCircle}>
                <X size={12} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </Pressable>
          )}
        </View>
      </View>

      {/* Popular Suggestions (when not searched yet) */}
      {!searched && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.sectionTitle}>Tìm kiếm phổ biến</Text>
          <View style={styles.tagWrap}>
            {POPULAR_TAGS.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => handleTagPress(tag)}
                style={({ pressed }) => [styles.tagChip, pressed && styles.tagPressed]}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tìm phim...</Text>
        </View>
      )}

      {/* Results List */}
      {!loading && searched && (
        <FlatList
          key={String(numColumns)}
          data={results}
          keyExtractor={(item) => item._id || item.slug}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultSummary}>
                Tìm thấy <Text style={styles.resultCount}>{results.length}</Text> kết quả cho "{query}"
              </Text>
            </View>
          }
          renderItem={({ item }) => <MovieCard movie={item} width={cardWidth} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Film size={26} color="#20D66B" strokeWidth={2.2} />
              </View>
              <Text style={styles.emptyTitle}>Không tìm thấy phim</Text>
              <Text style={styles.emptySubtitle}>
                Thử tìm với tên không dấu hoặc từ khóa ngắn gọn hơn
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
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "300",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    backgroundColor: Colors.card,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13.5,
    paddingVertical: 0,
  },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  suggestionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    color: Colors.textDim,
    fontSize: 12.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tagPressed: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
  },
  resultsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  columnWrapper: {
    justifyContent: "space-between",
  },
  resultSummary: {
    color: Colors.textMuted,
    fontSize: 12.5,
  },
  resultCount: {
    color: Colors.primary,
    fontWeight: "700",
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderWidth: 1.2,
    borderColor: "rgba(32, 214, 107, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.8,
  },
});
