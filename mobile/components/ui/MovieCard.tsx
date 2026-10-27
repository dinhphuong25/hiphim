import React, { memo, useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Alert } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Star, Heart } from "lucide-react-native";
import { MovieItem } from "@/services/api";
import { isFavorite, toggleFavorite } from "@/services/storage";
import { useUserAuth } from "@/context/UserAuthContext";
import { Colors } from "@/constants/theme";
import { haptic } from "@/services/haptics";

interface MovieCardProps {
  movie: MovieItem;
  width?: number;
  showEpisode?: boolean;
  hideFavoriteButton?: boolean;
  onLongPress?: () => void;
  style?: any;
}

function MovieCardComponent({
  movie,
  width = 165,
  showEpisode = true,
  hideFavoriteButton = false,
  onLongPress,
  style,
}: MovieCardProps) {
  const router = useRouter();
  const { user, openAuthModal } = useUserAuth();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setFav(false);
      return () => {
        mounted = false;
      };
    }

    if (movie?.slug) {
      isFavorite(movie.slug).then((res) => {
        if (mounted) setFav(res);
      });
    }
    return () => {
      mounted = false;
    };
  }, [movie?.slug, user?.id]);

  const handlePress = () => {
    haptic.selection();
    router.push({
      pathname: "/movie/[slug]",
      params: { slug: movie.slug },
    });
  };

  const handleToggleFav = async (e: any) => {
    e?.stopPropagation?.();
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

    haptic.light();
    const nextState = await toggleFavorite(movie);
    setFav(nextState);
  };

  const posterHeight = Math.floor(width * 1.5);

  // Deterministic or API rating matching web
  const rating = useMemo(() => {
    const raw =
      (movie as any).imdb?.rating ||
      (movie as any).tmdb?.vote_average ||
      (movie as any).rating;
    if (typeof raw === "number" && raw > 0) return raw.toFixed(1);
    // Consistent fallback rating from title/slug seed between 7.8 and 9.3
    let hash = 0;
    const key = movie.slug || movie.name || "hiphim";
    for (let i = 0; i < key.length; i++) {
      hash = (hash + key.charCodeAt(i)) % 16;
    }
    return (7.8 + (hash / 15) * 1.5).toFixed(1);
  }, [movie]);

  // Language formatting matching web
  const langText = useMemo(() => {
    if (!movie.lang) return null;
    if (movie.lang.includes("Thuyết")) return "Thuyết Minh";
    if (movie.lang.includes("Lồng")) return "Lồng Tiếng";
    return "Vietsub";
  }, [movie.lang]);

  // Episode text: Hide "Full" so cinema films don't show cluttered buttons, like web
  const badgeText = useMemo(() => {
    if (!showEpisode) return null;
    const ep = movie.episode_current;
    if (!ep || ep.toLowerCase() === "full") return null;
    return ep;
  }, [showEpisode, movie.episode_current]);

  const isWide = width >= 140;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        { width },
        style,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Poster Image Container */}
      <View style={[styles.posterWrapper, { height: posterHeight }]}>
        <Image
          source={{ uri: movie.thumb_url || movie.poster_url }}
          style={styles.poster}
          contentFit="cover"
          transition={250}
          cachePolicy="memory-disk"
        />

        {/* Ambient Top Highlight Line */}
        <View style={styles.topHighlight} />

        {/* Cinematic Gradient on Poster Bottom */}
        <LinearGradient
          colors={["transparent", "rgba(5, 8, 7, 0.25)", "rgba(5, 8, 7, 0.90)"]}
          locations={[0, 0.55, 1]}
          style={styles.gradientBottom}
        />

        {/* Top-Left Quality & Lang Badges (Web Editorial Style) */}
        <View style={styles.badgeRow}>
          {movie.quality ? (
            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>{movie.quality}</Text>
            </View>
          ) : null}

          {langText ? (
            <View style={styles.langBadge}>
              <Text style={styles.langText} numberOfLines={1}>
                {langText}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Top-Right Star Rating Badge (Web Style) */}
        <View style={styles.ratingBadge}>
          <Star size={9.5} color="#FACC15" fill="#FACC15" />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>

        {/* Bottom-Left Episode Badge (Only when not "Full", sleek pill) */}
        {badgeText ? (
          <View style={styles.episodeBadge}>
            <Text style={styles.episodeText} numberOfLines={1}>
              {badgeText}
            </Text>
          </View>
        ) : null}

        {/* Bottom-Right Quick Favorite Heart Button */}
        {!hideFavoriteButton && (
          <Pressable
            onPress={handleToggleFav}
            style={({ pressed }) => [
              styles.favBtn,
              fav && styles.favBtnActive,
              pressed && styles.btnPressed,
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              size={12.5}
              color={fav ? "#20D66B" : "rgba(255, 255, 255, 0.85)"}
              fill={fav ? "#20D66B" : "transparent"}
            />
          </Pressable>
        )}
      </View>

      {/* Info Under Poster (Matching Web Editorial Hierarchy) */}
      <View style={styles.meta}>
        <Text style={[styles.name, isWide && styles.nameWide]} numberOfLines={1}>
          {movie.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.yearText}>
            {movie.year || "2026"}
          </Text>
          {movie.origin_name ? (
            <Text style={styles.originName} numberOfLines={1}>
              {movie.origin_name}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const MovieCard = memo(MovieCardComponent);

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  posterWrapper: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#111714",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    zIndex: 3,
  },
  gradientBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
    zIndex: 1,
  },
  badgeRow: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    gap: 4,
    zIndex: 4,
    maxWidth: "68%",
    flexWrap: "wrap",
  },
  qualityBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    paddingHorizontal: 5.5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: "rgba(255, 255, 255, 0.20)",
  },
  qualityText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  langBadge: {
    backgroundColor: "rgba(6, 44, 25, 0.88)",
    paddingHorizontal: 5.5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: "rgba(32, 214, 107, 0.40)",
  },
  langText: {
    color: "#20D66B",
    fontSize: 9,
    fontWeight: "800",
  },
  ratingBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    paddingHorizontal: 5.5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: "rgba(255, 255, 255, 0.20)",
    zIndex: 4,
  },
  ratingText: {
    color: "#FACC15",
    fontSize: 9.5,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  episodeBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    paddingHorizontal: 6.5,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: "rgba(255, 255, 255, 0.16)",
    zIndex: 4,
    maxWidth: "68%",
  },
  episodeText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 9.5,
    fontWeight: "700",
  },
  favBtn: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 0.8,
    borderColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  favBtnActive: {
    backgroundColor: "rgba(32, 214, 107, 0.22)",
    borderColor: "rgba(32, 214, 107, 0.6)",
  },
  btnPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.8,
  },
  meta: {
    marginTop: 7,
    paddingHorizontal: 1,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "800",
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  nameWide: {
    fontSize: 13.5,
    lineHeight: 18.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2.5,
    gap: 6,
  },
  yearText: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  originName: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
});

