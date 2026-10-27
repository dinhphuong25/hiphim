import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Share,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Play,
  Heart,
  Share2,
  ChevronLeft,
  Tv,
  Film,
  Info,
  Calendar,
  Clock,
  Languages,
  Layers,
  Globe,
  Clapperboard,
  Users,
  User,
} from "lucide-react-native";
import {
  fetchMovieDetail,
  MovieDetail,
} from "@/services/api";
import { isFavorite, toggleFavorite } from "@/services/storage";
import { useUserAuth } from "@/context/UserAuthContext";
import { Colors, Radii } from "@/constants/theme";
import { haptic } from "@/services/haptics";
import { useObserve } from "@/services/observe";

function cleanHtml(text?: string): string {
  if (!text) return "";
  return text.replace(/<[^>]*>?/gm, "").trim();
}

export default function MovieDetailScreen() {
  const router = useRouter();
  const { user, openAuthModal } = useUserAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const { markInteractive } = useObserve();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);
  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [expandedContent, setExpandedContent] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [detail, favStatus] = await Promise.all([
          fetchMovieDetail(slug as string),
          user ? isFavorite(slug as string) : Promise.resolve(false),
        ]);

        if (isMounted && detail) {
          setMovie(detail);
          setFav(favStatus);
        }
      } catch (err) {
        console.error("Load movie detail error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug, user?.id]);

  // Report interactive time to EAS Observe once movie detail is ready
  useEffect(() => {
    if (!loading && movie) {
      markInteractive();
    }
  }, [loading, movie, markInteractive]);

  const handleToggleFav = async () => {
    if (!movie) return;
    if (!user) {
      haptic.medium();
      Alert.alert(
        "Yêu Cầu Đăng Nhập",
        "Vui lòng đăng nhập tài khoản để lưu phim vào danh sách yêu thích.",
        [
          { text: "Để sau", style: "cancel" },
          {
            text: "Đăng Nhập",
            onPress: () => openAuthModal("login"),
          },
        ]
      );
      return;
    }

    haptic.medium();
    const nextState = await toggleFavorite(movie);
    setFav(nextState);
  };

  const handleShare = async () => {
    if (!movie) return;
    haptic.light();
    try {
      await Share.share({
        title: movie.name,
        message: `Xem phim ${movie.name} (${movie.origin_name}): https://hiphim.one/phim/${movie.slug}`,
      });
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const handleWatchPress = (epSlug?: string) => {
    if (!movie) return;
    haptic.heavy();
    const currentServer = movie.episodes?.[selectedServerIdx] || movie.episodes?.[0];
    const targetEp = epSlug || currentServer?.server_data?.[0]?.slug || "";

    router.push({
      pathname: "/watch/[slug]",
      params: {
        slug: movie.slug,
        ep: targetEp,
        server: String(selectedServerIdx),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết phim...</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Film size={44} color={Colors.primary} />
        <Text style={styles.errorTitle}>Không tìm thấy phim</Text>
        <Text style={styles.errorSubtitle}>
          Phim có thể đã được cập nhật hoặc không tồn tại.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.backHomeBtn}
        >
          <Text style={styles.backHomeText}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const currentServer = movie.episodes?.[selectedServerIdx] || movie.episodes?.[0];
  const episodeList = currentServer?.server_data || [];
  const firstEpisodeSlug = episodeList[0]?.slug;

  const actorsList = (movie.actor || [])
    .flatMap((a) => (typeof a === "string" ? a.split(",") : []))
    .map((a) => a.trim())
    .filter((a) => a.length > 0 && a.toLowerCase() !== "đang cập nhật");

  const directorsList = (movie.director || [])
    .flatMap((d) => (typeof d === "string" ? d.split(",") : []))
    .map((d) => d.trim())
    .filter((d) => d.length > 0 && d.toLowerCase() !== "đang cập nhật");

  // 5-column episode chip width (screenWidth - 32 section padding - 4 * 8 gap) / 5
  const epColumns = 5;
  const epGap = 8;
  const epPadding = 16;
  const epCardWidth = Math.floor(
    (screenWidth - epPadding * 2 - (epColumns - 1) * epGap) / epColumns
  );

  // Chunk actors into pairs of 2 for stable 2-column layout
  const actorPairs: (string[])[] = [];
  for (let i = 0; i < actorsList.length; i += 2) {
    actorPairs.push(actorsList.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Backdrop Hero with LinearGradient Overlay */}
        <View style={[styles.heroBanner, { width: screenWidth }]}>
          <Image
            source={{ uri: movie.poster_url || movie.thumb_url }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />

          <LinearGradient
            colors={["rgba(5, 8, 7, 0.7)", "transparent"]}
            style={styles.heroOverlayTop}
          />
          <LinearGradient
            colors={["transparent", "rgba(5, 8, 7, 0.75)", "#050807"]}
            locations={[0, 0.6, 1]}
            style={styles.heroOverlayBottom}
          />

          {/* Floating Top Bar (iOS Native Style) */}
          <SafeAreaView edges={["top"]} style={styles.topBar}>
            <Pressable
              onPress={() => {
                haptic.light();
                router.back();
              }}
              style={({ pressed }) => [styles.topIconBtn, pressed && styles.pressed]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>

            <View style={styles.topRightBtns}>
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [styles.topIconBtn, pressed && styles.pressed]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Share2 size={18} color="#FFFFFF" strokeWidth={2.2} />
              </Pressable>

              <Pressable
                onPress={handleToggleFav}
                style={({ pressed }) => [
                  styles.topIconBtn,
                  fav && styles.favIconBtnActive,
                  pressed && styles.pressed,
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart
                  size={19}
                  color={fav ? "#EF4444" : "#FFFFFF"}
                  fill={fav ? "#EF4444" : "transparent"}
                  strokeWidth={2.2}
                />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Banner Meta Info */}
          <View style={styles.bannerInfo}>
            <View style={styles.badgeRow}>
              {movie.quality ? (
                <View style={styles.badgeQuality}>
                  <Text style={styles.badgeQualityText}>{movie.quality}</Text>
                </View>
              ) : null}
              {movie.lang ? (
                <View style={styles.badgeLang}>
                  <Text style={styles.badgeLangText}>{movie.lang}</Text>
                </View>
              ) : null}
              {movie.year ? (
                <View style={styles.badgeMuted}>
                  <Text style={styles.badgeMutedText}>{movie.year}</Text>
                </View>
              ) : null}
              {movie.time ? (
                <View style={styles.badgeMuted}>
                  <Text style={styles.badgeMutedText}>{movie.time}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {movie.name}
            </Text>
            <Text style={styles.originTitle} numberOfLines={1}>
              {movie.origin_name}
            </Text>
          </View>
        </View>

        {/* Primary Action Button: Xem Phim Ngay */}
        <View style={styles.ctaWrapper}>
          <Pressable
            onPress={() => handleWatchPress(firstEpisodeSlug)}
            style={({ pressed }) => [styles.watchBtn, pressed && styles.watchBtnPressed]}
          >
            <Play size={18} color="#050807" fill="#050807" />
            <Text style={styles.watchText}>
              XEM PHIM {movie.episode_current ? `(${movie.episode_current})` : ""}
            </Text>
          </Pressable>
        </View>

        {/* Synopsis / Description */}
        {movie.content ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Nội Dung Phim</Text>
            <Text
              style={styles.synopsisText}
              numberOfLines={expandedContent ? undefined : 4}
            >
              {cleanHtml(movie.content)}
            </Text>
            {cleanHtml(movie.content).length > 180 && (
              <Pressable
                onPress={() => {
                  haptic.selection();
                  setExpandedContent(!expandedContent);
                }}
                style={styles.expandBtn}
              >
                <Text style={styles.expandText}>
                  {expandedContent ? "Thu gọn ▴" : "Xem thêm ▾"}
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        {/* Episode List (Server Tabs + Grid) */}
        {movie.episodes && movie.episodes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.epSectionHeader}>
              <View style={styles.iconTitleRow}>
                <Tv size={16} color={Colors.primary} strokeWidth={2.4} />
                <Text style={styles.sectionHeader}>Danh Sách Tập ({episodeList.length})</Text>
              </View>
            </View>

            {/* Server Selector Tabs */}
            {movie.episodes.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.serverList}
              >
                {movie.episodes.map((srv, idx) => (
                  <Pressable
                    key={srv.server_name || idx}
                    onPress={() => {
                      haptic.selection();
                      setSelectedServerIdx(idx);
                    }}
                    style={[
                      styles.serverTab,
                      selectedServerIdx === idx && styles.serverTabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.serverTabText,
                        selectedServerIdx === idx && styles.serverTabTextActive,
                      ]}
                    >
                      {srv.server_name || `Server ${idx + 1}`}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Episode Grid (Căn đều 5 cột tràn mép) */}
            <View style={styles.epGrid}>
              {episodeList.map((ep) => (
                <Pressable
                  key={ep.slug}
                  onPress={() => handleWatchPress(ep.slug)}
                  style={({ pressed }) => [
                    styles.epChip,
                    { width: epCardWidth },
                    pressed && styles.epChipPressed,
                  ]}
                >
                  <Text style={styles.epChipText} numberOfLines={1}>
                    {ep.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Movie Meta Information (Luxury Cinema Card) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderBadge}>
              <Info size={15} color="#20D66B" strokeWidth={2.4} />
            </View>
            <Text style={styles.sectionHeaderTitle}>Thông Tin Chi Tiết</Text>
          </View>

          <View style={styles.detailsCard}>
            {/* Quick Tech Specs Bar */}
            {(movie.year || movie.time || movie.quality || movie.lang) && (
              <View style={styles.specsRow}>
                {movie.year ? (
                  <View style={styles.specItem}>
                    <Calendar size={13} color="#20D66B" strokeWidth={2.2} />
                    <Text style={styles.specLabel}>NĂM</Text>
                    <Text style={styles.specVal}>{movie.year}</Text>
                  </View>
                ) : null}

                {movie.time ? (
                  <View style={styles.specItem}>
                    <Clock size={13} color="#20D66B" strokeWidth={2.2} />
                    <Text style={styles.specLabel}>THỜI LƯỢNG</Text>
                    <Text style={styles.specVal}>{movie.time}</Text>
                  </View>
                ) : null}

                {movie.quality ? (
                  <View style={styles.specItem}>
                    <Film size={13} color="#20D66B" strokeWidth={2.2} />
                    <Text style={styles.specLabel}>ĐỊNH DẠNG</Text>
                    <Text style={styles.specVal}>{movie.quality}</Text>
                  </View>
                ) : null}

                {movie.lang ? (
                  <View style={styles.specItem}>
                    <Languages size={13} color="#20D66B" strokeWidth={2.2} />
                    <Text style={styles.specLabel}>BẢN DỊCH</Text>
                    <Text style={styles.specVal}>{movie.lang}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Thể Loại (Genres) */}
            {movie.category && movie.category.length > 0 && (
              <View style={styles.metaBlock}>
                <View style={styles.subHeaderRow}>
                  <Layers size={13} color="#20D66B" strokeWidth={2.2} />
                  <Text style={styles.subHeaderText}>THỂ LOẠI</Text>
                </View>
                <View style={styles.chipsRow}>
                  {movie.category.map((c) => (
                    <View key={c.id || c.slug} style={styles.genreChip}>
                      <Text style={styles.genreChipText}>{c.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Quốc Gia (Country) */}
            {movie.country && movie.country.length > 0 && (
              <View style={styles.metaBlock}>
                <View style={styles.subHeaderRow}>
                  <Globe size={13} color="#20D66B" strokeWidth={2.2} />
                  <Text style={styles.subHeaderText}>QUỐC GIA</Text>
                </View>
                <View style={styles.chipsRow}>
                  {movie.country.map((c) => (
                    <View key={c.id || c.slug} style={styles.countryChip}>
                      <Text style={styles.countryChipText}>{c.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Đạo Diễn (Director) */}
            {directorsList.length > 0 && (
              <View style={styles.metaBlock}>
                <View style={styles.subHeaderRow}>
                  <Clapperboard size={13} color="#20D66B" strokeWidth={2.2} />
                  <Text style={styles.subHeaderText}>ĐẠO DIỄN</Text>
                </View>
                <View style={styles.chipsRow}>
                  {directorsList.map((dir, idx) => (
                    <View key={`${dir}-${idx}`} style={styles.directorChip}>
                      <View style={styles.directorAvatar}>
                        <User size={12} color="#20D66B" strokeWidth={2.4} />
                      </View>
                      <Text style={styles.directorName}>{dir}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Diễn Viên (Cast - Hiện 2 Cột Xuống Đều & Đẹp) */}
            {actorsList.length > 0 && (
              <View style={styles.metaBlock}>
                <View style={styles.subHeaderRow}>
                  <Users size={13} color="#20D66B" strokeWidth={2.2} />
                  <Text style={styles.subHeaderText}>
                    DÀN DIỄN VIÊN ({actorsList.length})
                  </Text>
                </View>

                {/* 2 Cột Xuống Đều Đẹp Chuẩn Flexbox */}
                <View style={styles.castContainer}>
                  {actorPairs.map((pair: string[], rowIndex: number) => (
                    <View key={`cast-row-${rowIndex}`} style={styles.castRow}>
                      {/* Cột 1 */}
                      <View style={styles.castGridCard}>
                        <View style={styles.castGridAvatar}>
                          <Text style={styles.castGridInitial}>
                            {pair[0].charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.castGridInfo}>
                          <Text style={styles.castGridName} numberOfLines={1}>
                            {pair[0]}
                          </Text>
                          <Text style={styles.castGridRole}>Diễn viên</Text>
                        </View>
                      </View>

                      {/* Cột 2 */}
                      {pair[1] ? (
                        <View style={styles.castGridCard}>
                          <View style={styles.castGridAvatar}>
                            <Text style={styles.castGridInitial}>
                              {pair[1].charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.castGridInfo}>
                            <Text style={styles.castGridName} numberOfLines={1}>
                              {pair[1]}
                            </Text>
                            <Text style={styles.castGridRole}>Diễn viên</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={[styles.castGridCard, styles.castCardGhost]} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  errorSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  backHomeBtn: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  backHomeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  heroBanner: {
    height: 400,
    position: "relative",
    backgroundColor: Colors.surface,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroOverlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  topIconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: "rgba(5, 8, 7, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  favIconBtnActive: {
    borderColor: "rgba(239, 68, 68, 0.5)",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  topRightBtns: {
    flexDirection: "row",
    gap: 10,
  },
  bannerInfo: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  badgeQuality: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeQualityText: {
    color: "#050807",
    fontSize: 10,
    fontWeight: "900",
  },
  badgeLang: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    borderWidth: 0.5,
    borderColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeLangText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  badgeMuted: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeMutedText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  originTitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  ctaWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  watchBtn: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  watchBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  watchText: {
    color: "#050807",
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  epSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeader: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  synopsisText: {
    color: Colors.textDim,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  expandBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  expandText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  serverList: {
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  serverTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.card,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  serverTabActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  serverTabText: {
    color: Colors.textMuted,
    fontSize: 11.5,
    fontWeight: "700",
  },
  serverTabTextActive: {
    color: Colors.primary,
  },
  epGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  epChip: {
    height: 38,
    backgroundColor: Colors.card,
    borderRadius: Radii.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  epChipPressed: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
    transform: [{ scale: 0.95 }],
  },
  epChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionHeaderBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "rgba(32, 214, 107, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  detailsCard: {
    backgroundColor: "rgba(13, 20, 17, 0.85)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    gap: 16,
  },
  specsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 4,
  },
  specItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  specLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  specVal: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  metaBlock: {
    gap: 8,
  },
  subHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subHeaderText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.35)",
  },
  genreChipText: {
    color: "#20D66B",
    fontSize: 12,
    fontWeight: "700",
  },
  countryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  countryChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  directorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 5,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
  },
  directorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(32, 214, 107, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  directorName: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  castContainer: {
    gap: 8,
    marginTop: 4,
  },
  castRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  castGridCard: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 9,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  castCardGhost: {
    opacity: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  castGridAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    borderWidth: 1.2,
    borderColor: "rgba(32, 214, 107, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  castGridInitial: {
    color: "#20D66B",
    fontSize: 14,
    fontWeight: "900",
  },
  castGridInfo: {
    flex: 1,
    justifyContent: "center",
  },
  castGridName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  castGridRole: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
