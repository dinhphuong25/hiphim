import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Home,
  Tv,
  Film,
  Clapperboard,
  Flame,
  Globe,
  Calendar,
  Layers,
  Sparkles,
  X,
  ChevronLeft,
  Search,
  User,
  Crown,
  Cat,
} from "lucide-react-native";
import { useExploreSheet } from "@/context/ExploreSheetContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { CATEGORIES_LIST, COUNTRIES_LIST } from "@/services/api";
import { Colors, Radii } from "@/constants/theme";
import { haptic } from "@/services/haptics";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface ExploreCard {
  id: string;
  label: string;
  icon: any;
  action?: "categories" | "countries" | "years";
  route?: string;
  routeParams?: Record<string, string>;
  gradient: [string, string, string];
  fadeOverlay: [string, string, string];
  borderColor: string;
  iconColor: string;
  iconBg: string;
  image: string;
}

const CARDS: ExploreCard[] = [
  {
    id: "home",
    label: "Trang Chủ",
    icon: Home,
    route: "/",
    gradient: ["#082317", "#0d2d1f", "#123827"],
    fadeOverlay: ["#082317", "rgba(8, 35, 23, 0.6)", "transparent"],
    borderColor: "rgba(16, 185, 129, 0.35)",
    iconColor: "#20D66B",
    iconBg: "rgba(32, 214, 107, 0.2)",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=85",
  },
  {
    id: "phim-chieu-rap",
    label: "Chiếu Rạp",
    icon: Clapperboard,
    route: "/(tabs)/cinema",
    gradient: ["#280c12", "#351018", "#42141f"],
    fadeOverlay: ["#280c12", "rgba(40, 12, 18, 0.6)", "transparent"],
    borderColor: "rgba(244, 63, 94, 0.35)",
    iconColor: "#fb7185",
    iconBg: "rgba(244, 63, 94, 0.2)",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=85",
  },
  {
    id: "phim-bo",
    label: "Phim Bộ",
    icon: Tv,
    route: "/explore",
    routeParams: { segment: "type", slug: "phim-bo", name: "Phim Bộ" },
    gradient: ["#0c1d3b", "#112448", "#172c57"],
    fadeOverlay: ["#0c1d3b", "rgba(12, 29, 59, 0.6)", "transparent"],
    borderColor: "rgba(14, 165, 233, 0.35)",
    iconColor: "#38bdf8",
    iconBg: "rgba(14, 165, 233, 0.2)",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=85",
  },
  {
    id: "phim-le",
    label: "Phim Lẻ",
    icon: Film,
    route: "/explore",
    routeParams: { segment: "type", slug: "phim-le", name: "Phim Lẻ" },
    gradient: ["#08291b", "#0b3323", "#0f3d2b"],
    fadeOverlay: ["#08291b", "rgba(8, 41, 27, 0.6)", "transparent"],
    borderColor: "rgba(16, 185, 129, 0.35)",
    iconColor: "#34d399",
    iconBg: "rgba(16, 185, 129, 0.2)",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=85",
  },
  {
    id: "hoat-hinh",
    label: "Hoạt Hình",
    icon: Cat,
    route: "/explore",
    routeParams: { segment: "type", slug: "hoat-hinh", name: "Hoạt Hình" },
    gradient: ["#291b06", "#352308", "#422c0a"],
    fadeOverlay: ["#291b06", "rgba(41, 27, 6, 0.6)", "transparent"],
    borderColor: "rgba(245, 158, 11, 0.35)",
    iconColor: "#fbbf24",
    iconBg: "rgba(245, 158, 11, 0.2)",
    image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=85",
  },
  {
    id: "new-updates",
    label: "Mới Cập Nhật",
    icon: Flame,
    route: "/explore",
    routeParams: { segment: "type", slug: "phim-moi-cap-nhat", name: "Mới Cập Nhật" },
    gradient: ["#301206", "#3d1808", "#4a1e0a"],
    fadeOverlay: ["#301206", "rgba(48, 18, 6, 0.6)", "transparent"],
    borderColor: "rgba(249, 115, 22, 0.35)",
    iconColor: "#fb923c",
    iconBg: "rgba(249, 115, 22, 0.2)",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=85",
  },
  {
    id: "categories",
    label: "Thể Loại",
    icon: Layers,
    action: "categories",
    gradient: ["#280f08", "#34140a", "#41190d"],
    fadeOverlay: ["#280f08", "rgba(40, 15, 8, 0.6)", "transparent"],
    borderColor: "rgba(245, 158, 11, 0.35)",
    iconColor: "#fbbf24",
    iconBg: "rgba(245, 158, 11, 0.2)",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=85",
  },
  {
    id: "countries",
    label: "Quốc Gia",
    icon: Globe,
    action: "countries",
    gradient: ["#0a2624", "#0d312e", "#113d39"],
    fadeOverlay: ["#0a2624", "rgba(10, 38, 36, 0.6)", "transparent"],
    borderColor: "rgba(20, 184, 166, 0.35)",
    iconColor: "#2dd4bf",
    iconBg: "rgba(20, 184, 166, 0.2)",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=85",
  },
  {
    id: "years",
    label: "Năm Phát Hành",
    icon: Calendar,
    action: "years",
    gradient: ["#26170c", "#311e10", "#3d2514"],
    fadeOverlay: ["#26170c", "rgba(38, 23, 12, 0.6)", "transparent"],
    borderColor: "rgba(249, 115, 22, 0.35)",
    iconColor: "#fb923c",
    iconBg: "rgba(249, 115, 22, 0.2)",
    image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&auto=format&fit=crop&q=85",
  },

];

const currentYearNum = 2026;
const YEARS_LIST = Array.from(
  { length: currentYearNum - 1980 + 1 },
  (_, i) => currentYearNum - i
);

export function MobileExploreSheet() {
  const router = useRouter();
  const { isOpen, activeView, closeExplore, setActiveView } = useExploreSheet();
  const { user, openAccountSheet } = useUserAuth();

  const isSuperAdmin = Boolean(
    user && (user.role === "superadmin" || user.role === "admin" || user.email?.toLowerCase() === "kimdinhphuong205@gmail.com")
  );

  const [searchFilter, setSearchFilter] = useState("");
  const [catGroupFilter, setCatGroupFilter] = useState<"all" | "popular" | "action" | "romance" | "other">("all");
  const [countryRegionFilter, setCountryRegionFilter] = useState<"all" | "popular" | "asia" | "west">("all");
  const [yearDecadeFilter, setYearDecadeFilter] = useState<"all" | "2020s" | "2010s" | "2000s" | "classic">("all");

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
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
  }, [isOpen, fadeAnim, slideAnim]);

  if (!isOpen) return null;

  const handleCardPress = (card: ExploreCard) => {
    haptic.selection();
    if (card.action) {
      setActiveView(card.action);
      setSearchFilter("");
    } else if (card.route) {
      closeExplore();
      if (card.routeParams) {
        router.push({ pathname: card.route as any, params: card.routeParams });
      } else {
        router.push(card.route as any);
      }
    }
  };

  const handleSelectCategory = (cat: { slug: string; name: string }) => {
    haptic.selection();
    closeExplore();
    router.push({ pathname: "/explore", params: { segment: "category", slug: cat.slug, name: cat.name } });
  };

  const handleSelectCountry = (country: { slug: string; name: string }) => {
    haptic.selection();
    closeExplore();
    router.push({ pathname: "/explore", params: { segment: "country", slug: country.slug, name: country.name } });
  };

  const handleSelectYear = (year: number) => {
    haptic.selection();
    closeExplore();
    router.push({ pathname: "/explore", params: { segment: "year", slug: String(year), name: `Năm ${year}` } });
  };

  const filteredCategories = CATEGORIES_LIST.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchFilter.toLowerCase());
    if (!matchesSearch) return false;
    if (catGroupFilter === "all") return true;
    if (catGroupFilter === "popular") return ["hanh-dong", "co-trang", "tinh-cam", "kinh-di", "hai-huoc", "vien-tuong", "tam-ly", "vo-thuat", "hinh-su", "phieu-luu", "gia-dinh"].includes(c.slug);
    if (catGroupFilter === "action") return ["hanh-dong", "vo-thuat", "chien-tranh", "hinh-su", "phieu-luu", "vien-tuong"].includes(c.slug);
    if (catGroupFilter === "romance") return ["tinh-cam", "co-trang", "tam-ly", "hoc-duong", "gia-dinh", "chinh-kich"].includes(c.slug);
    return ["am-nhac", "than-thoai", "the-thao", "kinh-dien", "lich-su", "mien-tay", "tai-lieu", "khoa-hoc", "bi-an", "tre-em", "phim-ngan", "phim-18"].includes(c.slug);
  });

  const filteredCountries = COUNTRIES_LIST.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchFilter.toLowerCase());
    if (!matchesSearch) return false;
    if (countryRegionFilter === "all") return true;
    if (countryRegionFilter === "popular") return c.popular;
    if (countryRegionFilter === "asia") return c.region === "asia";
    return c.region === "west";
  });

  let filteredYears = YEARS_LIST;
  if (searchFilter.trim()) {
    filteredYears = filteredYears.filter((y) => String(y).includes(searchFilter.trim()));
  } else if (yearDecadeFilter === "2020s") {
    filteredYears = filteredYears.filter((y) => y >= 2020);
  } else if (yearDecadeFilter === "2010s") {
    filteredYears = filteredYears.filter((y) => y >= 2010 && y <= 2019);
  } else if (yearDecadeFilter === "2000s") {
    filteredYears = filteredYears.filter((y) => y >= 2000 && y <= 2009);
  } else if (yearDecadeFilter === "classic") {
    filteredYears = filteredYears.filter((y) => y < 2000);
  }

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={closeExplore}
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
          <Pressable style={StyleSheet.absoluteFill} onPress={closeExplore} />
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
          {/* Pull Handle */}
          <View style={styles.pullHandle} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            {activeView === "main" ? (
              <View style={styles.headerTitleCluster}>
                <View style={styles.headerIconBox}>
                  <Sparkles size={16} color="#20D66B" strokeWidth={2.5} />
                </View>
                <Text style={styles.sheetTitle}>Khám Phá</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  haptic.light();
                  setActiveView("main");
                  setSearchFilter("");
                  setCatGroupFilter("all");
                  setCountryRegionFilter("all");
                  setYearDecadeFilter("all");
                }}
                style={({ pressed }) => [
                  styles.backBtn,
                  pressed && styles.btnPressed,
                ]}
              >
                <ChevronLeft size={20} color="#20D66B" strokeWidth={2.5} />
                <View style={styles.backBtnTextCluster}>
                  <Text style={styles.backBtnText}>
                    {activeView === "categories"
                      ? "Thể Loại Phim"
                      : activeView === "countries"
                      ? "Quốc Gia Điện Ảnh"
                      : "Năm Phát Hành"}
                  </Text>
                  <View style={styles.badgeCounter}>
                    <Text style={styles.badgeCounterText}>
                      {activeView === "categories"
                        ? "26 THỂ LOẠI"
                        : activeView === "countries"
                        ? "37 QUỐC GIA"
                        : `${YEARS_LIST.length} NĂM PHÁT HÀNH`}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                haptic.light();
                closeExplore();
              }}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.btnPressed,
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={17} color="rgba(255, 255, 255, 0.85)" strokeWidth={2.4} />
            </Pressable>
          </View>

          {/* Subtitle when in subview */}
          {activeView !== "main" && (
            <Text style={styles.subViewSubtitle}>
              {activeView === "categories" && "Khám phá kho 30,000+ phim phong phú theo thể loại bạn yêu thích"}
              {activeView === "countries" && "Lọc phim theo xuất xứ và nền điện ảnh quốc gia"}
              {activeView === "years" && "Tìm kiếm các tác phẩm theo năm phát hành và thập niên"}
            </Text>
          )}

          {/* View: MAIN (Account Banner + 10 Explore Cards in 2 Columns) */}
          {activeView === "main" && (
            <ScrollView
              style={styles.subScrollView}
              contentContainerStyle={styles.mainScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Account Banner Card */}
              <Pressable
                onPress={() => {
                  haptic.selection();
                  closeExplore();
                  openAccountSheet();
                }}
                style={({ pressed }) => [
                  styles.accountBanner,
                  !user && styles.accountBannerGuest,
                  pressed && styles.cardPressed,
                ]}
              >
                <LinearGradient
                  colors={
                    user
                      ? ["#082317", "#0d2d1f", "#133826"]
                      : ["#151a18", "#1c2420", "#212b26"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardTopHighlight} />

                <View style={styles.accountBannerLeft}>
                  {user ? (
                    <View
                      style={[
                        styles.accountAvatarBadge,
                        isSuperAdmin && styles.accountAvatarAdmin,
                      ]}
                    >
                      <Text style={styles.accountAvatarText}>
                        {(user.name || user.email || "U").charAt(0).toUpperCase()}
                      </Text>
                      {isSuperAdmin && (
                        <View style={styles.accountCrownBadge}>
                          <Crown size={8} color="#000000" fill="#000000" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.accountGuestIconBox}>
                      <User size={18} color="rgba(255, 255, 255, 0.7)" />
                    </View>
                  )}

                  <View style={styles.accountBannerInfo}>
                    <Text style={styles.accountBannerName} numberOfLines={1}>
                      {user ? user.name || "Thành viên" : "Tài khoản của bạn"}
                    </Text>
                    <Text style={styles.accountBannerSub} numberOfLines={1}>
                      {user
                        ? isSuperAdmin
                          ? "Super Admin • Toàn quyền quản trị"
                          : user.email || "Đã đăng nhập"
                        : "Đăng nhập để đồng bộ phim yêu thích"}
                    </Text>
                  </View>
                </View>

                <View style={styles.accountBannerArrow}>
                  <Text style={styles.accountBannerArrowText}>
                    {user ? "Hồ sơ" : "Đăng nhập"}
                  </Text>
                </View>
              </Pressable>

              {/* Explore Cards Grid */}
              <View style={styles.cardsGrid}>
                {CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Pressable
                      key={card.id}
                      onPress={() => handleCardPress(card)}
                      style={({ pressed }) => [
                        styles.cardContainer,
                        {
                          borderColor: card.borderColor,
                        },
                        pressed && styles.cardPressed,
                      ]}
                    >
                      {/* Background Linear Gradient */}
                      <LinearGradient
                        colors={card.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />

                      {/* Top ambient subtle edge line */}
                      <View style={styles.cardTopHighlight} />

                      {/* Right side background image with gradient fade mask */}
                      <View style={styles.cardImageWrapper}>
                        <Image
                          source={{ uri: card.image }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                        <LinearGradient
                          colors={card.fadeOverlay}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={StyleSheet.absoluteFill}
                        />
                      </View>

                      {/* Left Icon Badge + Title */}
                      <View style={styles.cardContentLeft}>
                        <View
                          style={[
                            styles.cardIconBadge,
                            {
                              backgroundColor: card.iconBg,
                            },
                          ]}
                        >
                          <Icon size={16} color={card.iconColor} strokeWidth={2.4} />
                        </View>
                        <Text style={styles.cardLabel} numberOfLines={1}>
                          {card.label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* View: CATEGORIES (Giao diện chuẩn web - 2 Cột Cinema Card) */}
          {activeView === "categories" && (
            <View style={styles.subViewContainer}>
              {/* Search Bar */}
              <View style={styles.subSearchWrapper}>
                <Search size={15} color="#20D66B" strokeWidth={2.2} />
                <TextInput
                  value={searchFilter}
                  onChangeText={setSearchFilter}
                  placeholder="Lọc nhanh thể loại (Hành động, Cổ trang, Tình cảm...)"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={styles.subSearchInput}
                  autoCorrect={false}
                />
                {searchFilter ? (
                  <Pressable onPress={() => setSearchFilter("")}>
                    <X size={15} color="rgba(255, 255, 255, 0.5)" />
                  </Pressable>
                ) : null}
              </View>

              {/* Thematic Filter Chips (Chuẩn Web) */}
              {!searchFilter.trim() && (
                <View style={styles.thematicRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thematicScroll}>
                    {[
                      { id: "all", label: "Tất Cả" },
                      { id: "popular", label: "Phổ Biến" },
                      { id: "action", label: "Hành Động & Kịch Tính" },
                      { id: "romance", label: "Tình Cảm & Cổ Trang" },
                      { id: "other", label: "Khác" },
                    ].map((f) => (
                      <Pressable
                        key={f.id}
                        onPress={() => {
                          haptic.selection();
                          setCatGroupFilter(f.id as any);
                        }}
                        style={[
                          styles.thematicChip,
                          catGroupFilter === f.id && styles.thematicChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.thematicChipText,
                            catGroupFilter === f.id && styles.thematicChipTextActive,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 2-Column Grid of Categories */}
              <ScrollView
                style={styles.subScrollView}
                contentContainerStyle={styles.cinemaGridContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                <View style={styles.cinemaGridRow}>
                  {filteredCategories.map((cat) => (
                    <Pressable
                      key={cat.slug}
                      onPress={() => handleSelectCategory(cat)}
                      style={({ pressed }) => [
                        styles.cinemaCard,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <View style={styles.cinemaCardDot} />
                      <Text style={styles.cinemaCardText} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* View: COUNTRIES (Giao diện chuẩn web với Cờ Quốc Gia FlagCDN) */}
          {activeView === "countries" && (
            <View style={styles.subViewContainer}>
              {/* Search Bar */}
              <View style={styles.subSearchWrapper}>
                <Search size={15} color="#20D66B" strokeWidth={2.2} />
                <TextInput
                  value={searchFilter}
                  onChangeText={setSearchFilter}
                  placeholder="Lọc nhanh quốc gia (Hàn Quốc, Âu Mỹ, Trung Quốc...)"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={styles.subSearchInput}
                  autoCorrect={false}
                />
                {searchFilter ? (
                  <Pressable onPress={() => setSearchFilter("")}>
                    <X size={15} color="rgba(255, 255, 255, 0.5)" />
                  </Pressable>
                ) : null}
              </View>

              {/* Regional Filter Chips (Chuẩn Web) */}
              {!searchFilter.trim() && (
                <View style={styles.thematicRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thematicScroll}>
                    {[
                      { id: "all", label: "Tất Cả" },
                      { id: "popular", label: "Nổi Bật" },
                      { id: "asia", label: "Châu Á" },
                      { id: "west", label: "Âu Mỹ & Toàn Cầu" },
                    ].map((f) => (
                      <Pressable
                        key={f.id}
                        onPress={() => {
                          haptic.selection();
                          setCountryRegionFilter(f.id as any);
                        }}
                        style={[
                          styles.thematicChip,
                          countryRegionFilter === f.id && styles.thematicChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.thematicChipText,
                            countryRegionFilter === f.id && styles.thematicChipTextActive,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 2-Column Grid of Countries with FlagCDN */}
              <ScrollView
                style={styles.subScrollView}
                contentContainerStyle={styles.cinemaGridContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                <View style={styles.cinemaGridRow}>
                  {filteredCountries.map((c) => (
                    <Pressable
                      key={c.slug}
                      onPress={() => handleSelectCountry(c)}
                      style={({ pressed }) => [
                        styles.cinemaCard,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <View style={styles.flagFrame}>
                        {c.code !== "WW" ? (
                          <Image
                            source={{ uri: `https://flagcdn.com/w80/${c.code.toLowerCase()}.png` }}
                            style={styles.flagImage}
                            contentFit="cover"
                          />
                        ) : (
                          <Globe size={13} color="#20D66B" strokeWidth={2.2} />
                        )}
                      </View>
                      <Text style={styles.cinemaCardText} numberOfLines={1}>
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* View: YEARS (Đồng bộ chuẩn 2 cột Cinema Card với Thể Loại & Quốc Gia) */}
          {activeView === "years" && (
            <View style={styles.subViewContainer}>
              {/* Search Bar */}
              <View style={styles.subSearchWrapper}>
                <Search size={15} color="#20D66B" strokeWidth={2.2} />
                <TextInput
                  value={searchFilter}
                  onChangeText={setSearchFilter}
                  placeholder="Lọc nhanh năm phát hành (2026, 2025, 2024...)"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  style={styles.subSearchInput}
                  autoCorrect={false}
                  keyboardType="numeric"
                />
                {searchFilter ? (
                  <Pressable onPress={() => setSearchFilter("")}>
                    <X size={15} color="rgba(255, 255, 255, 0.5)" />
                  </Pressable>
                ) : null}
              </View>

              {/* Decade Filter Chips (Chuẩn Web) */}
              {!searchFilter.trim() && (
                <View style={styles.thematicRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thematicScroll}>
                    {[
                      { id: "all", label: "Tất Cả Năm" },
                      { id: "2020s", label: "2020s Mới" },
                      { id: "2010s", label: "Thập niên 2010s" },
                      { id: "2000s", label: "Thập niên 2000s" },
                      { id: "classic", label: "Kinh Điển (< 2000)" },
                    ].map((f) => (
                      <Pressable
                        key={f.id}
                        onPress={() => {
                          haptic.selection();
                          setYearDecadeFilter(f.id as any);
                        }}
                        style={[
                          styles.thematicChip,
                          yearDecadeFilter === f.id && styles.thematicChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.thematicChipText,
                            yearDecadeFilter === f.id && styles.thematicChipTextActive,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* 3-Column Grid of Years */}
              <ScrollView
                style={styles.subScrollView}
                contentContainerStyle={styles.cinemaGridContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                <View style={styles.yearsGridRow}>
                  {filteredYears.map((y) => (
                    <Pressable
                      key={y}
                      onPress={() => handleSelectYear(y)}
                      style={({ pressed }) => [
                        styles.yearCard3Col,
                        y === 2026 && styles.yearCard3ColActive,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.yearCard3ColText,
                          y === 2026 && styles.yearCard3ColTextActive,
                        ]}
                      >
                        {y}
                      </Text>
                      {y === 2026 && (
                        <Text style={styles.yearTagMini}>MỚI</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
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
    height: SCREEN_HEIGHT * 0.85,
    backgroundColor: "#0B100E",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.12)",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
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
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  headerTitleCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  backBtnTextCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  badgeCounter: {
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.3)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCounterText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#20D66B",
    letterSpacing: 0.2,
  },
  subViewSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.45)",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: {
    opacity: 0.6,
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },
  accountBanner: {
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  accountBannerGuest: {
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  accountBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  accountAvatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#20D66B",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  accountAvatarAdmin: {
    backgroundColor: "#f59e0b",
  },
  accountAvatarText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
  },
  accountCrownBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#fef08a",
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  accountGuestIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountBannerInfo: {
    flex: 1,
    minWidth: 0,
  },
  accountBannerName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  accountBannerSub: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.55)",
    marginTop: 1,
  },
  accountBannerArrow: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.3)",
  },
  accountBannerArrowText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#20D66B",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cardContainer: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },
  cardTopHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  cardImageWrapper: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: "50%",
    overflow: "hidden",
  },
  cardContentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    zIndex: 10,
    maxWidth: "80%",
  },
  cardIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  cardLabel: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  subViewContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  subSearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 8,
  },
  subSearchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    paddingVertical: 0,
  },
  thematicRow: {
    marginBottom: 10,
  },
  thematicScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  thematicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  thematicChipActive: {
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    borderColor: "rgba(32, 214, 107, 0.4)",
  },
  thematicChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.6)",
  },
  thematicChipTextActive: {
    color: "#20D66B",
    fontWeight: "800",
  },
  cinemaGridContent: {
    paddingBottom: Platform.OS === "ios" ? 48 : 28,
  },
  subScrollView: {
    flex: 1,
    width: "100%",
  },
  cinemaGridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cinemaCard: {
    width: (SCREEN_WIDTH - 32 - 8) / 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  cinemaCardDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#20D66B",
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  cinemaCardText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
  },
  flagFrame: {
    width: 28,
    height: 18,
    borderRadius: 3.5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  flagImage: {
    width: "100%",
    height: "100%",
  },
  yearsGridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  yearCard3Col: {
    width: Math.floor((SCREEN_WIDTH - 32 - 16) / 3),
    height: 46,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  yearCard3ColActive: {
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    borderColor: "rgba(32, 214, 107, 0.4)",
  },
  yearCard3ColText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  yearCard3ColTextActive: {
    color: "#20D66B",
    fontWeight: "900",
  },
  yearTagMini: {
    position: "absolute",
    top: 3,
    right: 5,
    fontSize: 8.5,
    fontWeight: "900",
    color: "#20D66B",
  },
});
