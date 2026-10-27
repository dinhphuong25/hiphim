import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";
import * as SplashScreen from "expo-splash-screen";
import { haptic } from "@/services/haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AppLoadingScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

const LOADING_STEPS = [
  "Khởi tạo không gian điện ảnh...",
  "Đang kết nối kho phim chuẩn 4K...",
  "Tải danh mục rạp chiếu & thịnh hành...",
  "Sẵn sàng trải nghiệm tuyệt đỉnh!",
];

export function AppLoadingScreen({
  onFinish,
  minDuration = 1800,
}: AppLoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);

  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  const emblemScale = useRef(new Animated.Value(0.85)).current;
  const emblemOpacity = useRef(new Animated.Value(0)).current;
  const rotateReel = useRef(new Animated.Value(0)).current;
  const rotateCounter = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Dismiss native splash screen immediately so custom animation takes over
    SplashScreen.hideAsync().catch(() => {});

    // 1. Initial entrance animation
    Animated.parallel([
      Animated.timing(emblemOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(emblemScale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous rotating cinema film reel animation
    const reelLoop = Animated.loop(
      Animated.timing(rotateReel, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    reelLoop.start();

    // 3. Counter-rotating inner aperture ring
    const counterLoop = Animated.loop(
      Animated.timing(rotateCounter, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    counterLoop.start();

    // 5. Progress bar fill animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: minDuration - 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 6. Cycling status text
    const stepDuration = Math.floor((minDuration - 250) / LOADING_STEPS.length);
    const intervals: ReturnType<typeof setTimeout>[] = [];

    LOADING_STEPS.forEach((_, idx) => {
      if (idx === 0) return;
      const t = setTimeout(() => {
        Animated.sequence([
          Animated.timing(textFadeAnim, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(textFadeAnim, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
        setStepIndex(idx);
        if (idx === LOADING_STEPS.length - 1) {
          haptic.light();
        }
      }, idx * stepDuration);
      intervals.push(t);
    });

    // 7. Curtain exit to main app
    const finishTimer = setTimeout(() => {
      reelLoop.stop();
      counterLoop.stop();

      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 380,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 1.05,
          duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        if (onFinish) onFinish();
      });
    }, minDuration);

    // Failsafe timer
    const safeTimer = setTimeout(() => {
      setVisible(false);
    }, minDuration + 2000);

    return () => {
      clearTimeout(finishTimer);
      clearTimeout(safeTimer);
      intervals.forEach((i) => clearTimeout(i));
      reelLoop.stop();
      counterLoop.stop();
    };
  }, [minDuration, onFinish]);

  if (!visible) return null;

  const spinReel = rotateReel.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const spinCounter = rotateCounter.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["4%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      {/* Center Cinematic Cluster */}
      <Animated.View
        style={[
          styles.centerCluster,
          {
            opacity: emblemOpacity,
            transform: [{ scale: emblemScale }],
          },
        ]}
      >
        {/* Film Reel Spool Container */}
        <View style={styles.reelChassis}>
          {/* Subtle Outer Neon Halo Ring */}
          <View style={styles.neonHalo} />

          {/* Rotating Cinema Film Reel Spool SVG */}
          <Animated.View
            style={[
              styles.rotatingLayer,
              {
                transform: [{ rotate: spinReel }],
              },
            ]}
          >
            <Svg width={128} height={128} viewBox="0 0 128 128">
              <Defs>
                <SvgGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#20D66B" stopOpacity={1} />
                  <Stop offset="0.6" stopColor="#00E676" stopOpacity={0.75} />
                  <Stop offset="1" stopColor="#059669" stopOpacity={0.15} />
                </SvgGradient>
              </Defs>

              {/* Outer Film Wheel Rim */}
              <Circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#emeraldGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="160 80"
                fill="none"
              />

              {/* 35mm Film Frame Perforations around outer circle */}
              <Circle
                cx="64"
                cy="64"
                r="50"
                stroke="rgba(32, 214, 107, 0.3)"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                fill="none"
              />

              {/* 4 Cinema Spool Holes */}
              <Circle cx="64" cy="28" r="7" fill="rgba(32, 214, 107, 0.25)" />
              <Circle cx="100" cy="64" r="7" fill="rgba(32, 214, 107, 0.25)" />
              <Circle cx="64" cy="100" r="7" fill="rgba(32, 214, 107, 0.25)" />
              <Circle cx="28" cy="64" r="7" fill="rgba(32, 214, 107, 0.25)" />

              {/* Spool Accent Dots */}
              <Circle cx="64" cy="8" r="3" fill="#20D66B" />
              <Circle cx="120" cy="64" r="3" fill="#20D66B" />
              <Circle cx="64" cy="120" r="3" fill="#20D66B" />
              <Circle cx="8" cy="64" r="3" fill="#20D66B" />
            </Svg>
          </Animated.View>

          {/* Counter-rotating Inner Aperture Track */}
          <Animated.View
            style={[
              styles.rotatingLayer,
              {
                transform: [{ rotate: spinCounter }],
              },
            ]}
          >
            <Svg width={80} height={80} viewBox="0 0 80 80">
              <Circle
                cx="40"
                cy="40"
                r="34"
                stroke="#20D66B"
                strokeWidth="1.8"
                strokeDasharray="40 30"
                strokeOpacity={0.6}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>

          {/* Center Play Core / Cinema Crystal */}
          <View style={styles.playButtonCore}>
            <LinearGradient
              colors={["rgba(32, 214, 107, 0.25)", "rgba(11, 18, 14, 0.95)"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
              <Path
                d="M7 4.5V19.5L19 12L7 4.5Z"
                fill="#20D66B"
                stroke="#FFFFFF"
                strokeWidth={1.2}
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>

        {/* Brand Typography */}
        <View style={styles.brandContainer}>
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitleLight}>HI </Text>
            <Text style={styles.brandTitleAccent}>PHIM</Text>
            <Text style={styles.brandTitleDot}>.</Text>
          </View>
          <Text style={styles.brandSubtitle}>
            TRẢI NGHIỆM ĐIỆN ẢNH ĐỈNH CAO
          </Text>
        </View>
      </Animated.View>

      {/* Bottom Loading Progress Cluster */}
      <View style={styles.bottomCluster}>
        {/* Cinema Neon Progress Track */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
              },
            ]}
          >
            <LinearGradient
              colors={["#00E676", "#20D66B", "#34D399"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* Dynamic Status Text */}
        <Animated.Text
          style={[
            styles.statusText,
            {
              opacity: textFadeAnim,
            },
          ]}
        >
          {LOADING_STEPS[stepIndex]}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    backgroundColor: "#030605",
    alignItems: "center",
    justifyContent: "center",
  },
  centerCluster: {
    alignItems: "center",
    justifyContent: "center",
  },
  reelChassis: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(8, 14, 11, 0.92)",
    borderWidth: 1.5,
    borderColor: "rgba(32, 214, 107, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 16,
    position: "relative",
  },
  neonHalo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.15)",
  },
  rotatingLayer: {
    position: "absolute",
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonCore: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(32, 214, 107, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4, // Optical centering of play triangle
    overflow: "hidden",
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  brandContainer: {
    alignItems: "center",
    marginTop: 26,
  },
  brandTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  brandTitleLight: {
    fontSize: 27,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2.5,
  },
  brandTitleAccent: {
    fontSize: 27,
    fontWeight: "900",
    color: "#20D66B",
    letterSpacing: 2.5,
    textShadowColor: "rgba(32, 214, 107, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  brandTitleDot: {
    fontSize: 27,
    fontWeight: "900",
    color: "#20D66B",
  },
  brandSubtitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.45)",
    letterSpacing: 2.5,
    marginTop: 6,
    textTransform: "uppercase",
  },
  bottomCluster: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 54 : 36,
    alignItems: "center",
    width: "100%",
  },
  progressTrack: {
    width: 210,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.55)",
    letterSpacing: 0.3,
  },
});
