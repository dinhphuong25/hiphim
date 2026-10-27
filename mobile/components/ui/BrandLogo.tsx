import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Play } from "lucide-react-native";
import { Colors } from "@/constants/theme";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSlogan?: boolean;
  centered?: boolean;
}

export function BrandLogo({ size = "md", showSlogan = false, centered = false }: BrandLogoProps) {
  const isSm = size === "sm";
  const isLg = size === "lg";
  const isXl = size === "xl";

  const fontSize = isSm ? 15 : isXl ? 32 : isLg ? 24 : 18;
  const sloganSize = isSm ? 8 : isXl ? 12 : isLg ? 11 : 9.5;
  const badgeSize = isSm ? 22 : isXl ? 44 : isLg ? 34 : 26;
  const playIconSize = isSm ? 9 : isXl ? 18 : isLg ? 14 : 11;

  return (
    <View style={[styles.container, centered && styles.centered]}>
      <View style={styles.logoRow}>
        {/* Play Icon Badge */}
        <View
          style={[
            styles.iconBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        >
          <Play
            size={playIconSize}
            color="#20D66B"
            fill="#20D66B"
            style={{ marginLeft: 1 }}
          />
        </View>

        {/* Wordmark */}
        <Text style={[styles.title, { fontSize }]}>
          <Text style={styles.titleHi}>HI </Text>
          <Text style={styles.titlePhim}>PHIM</Text>
          <Text style={styles.titleDot}>.</Text>
        </Text>
      </View>

      {showSlogan && (
        <Text style={[styles.slogan, { fontSize: sloganSize }]}>
          Điện ảnh không giới hạn
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  centered: {
    alignItems: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBadge: {
    backgroundColor: "rgba(32, 214, 107, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(32, 214, 107, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  titleHi: {
    color: "#FFFFFF",
  },
  titlePhim: {
    color: "#20D66B",
  },
  titleDot: {
    color: "#00FF87",
  },
  slogan: {
    color: Colors.textDim,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
