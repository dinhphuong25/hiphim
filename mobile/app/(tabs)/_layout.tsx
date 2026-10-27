import React from "react";
import { Tabs } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LucideIcon, Home, Film, Heart, Clock, User } from "lucide-react-native";
import { haptic } from "@/services/haptics";

interface TabConfigItem {
  name: string;
  label: string;
  Icon: LucideIcon;
}

const TABS: TabConfigItem[] = [
  { name: "index", label: "Trang chủ", Icon: Home },
  { name: "cinema", label: "Chiếu rạp", Icon: Film },
  { name: "favorites", label: "Yêu thích", Icon: Heart },
  { name: "history", label: "Lịch sử", Icon: Clock },
  { name: "profile", label: "Tài khoản", Icon: User },
];

function CustomCinemaTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  // Keep floating bar safely above iOS home indicator bar
  const bottomOffset =
    Platform.OS === "ios"
      ? insets.bottom > 0
        ? insets.bottom + 6
        : 18
      : 14;

  return (
    <View style={[styles.tabBarWrapper, { bottom: bottomOffset }]}>
      <View style={styles.tabBarInner}>
        {TABS.map((tab) => {
          // Find route index in state
          const routeIndex = state.routes.findIndex(
            (r: any) => r.name === tab.name
          );
          if (routeIndex === -1) return null;

          const route = state.routes[routeIndex];
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              haptic.selection();
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const IconComponent = tab.Icon;

          return (
            <TouchableOpacity
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
              testID={`tab-${tab.name}`}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabButton}
            >
              {isFocused ? (
                <View style={styles.activeCapsule}>
                  <IconComponent
                    size={18}
                    color="#06100A"
                    strokeWidth={2.6}
                  />
                  <Text
                    style={styles.activeLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {tab.label}
                  </Text>
                </View>
              ) : (
                <View style={styles.inactiveItem}>
                  <IconComponent
                    size={19}
                    color="rgba(255, 255, 255, 0.72)"
                    strokeWidth={2}
                  />
                  <Text
                    style={styles.inactiveLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {tab.label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomCinemaTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang Chủ",
        }}
      />
      <Tabs.Screen
        name="cinema"
        options={{
          title: "Chiếu Rạp",
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Yêu Thích",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Lịch Sử",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài Khoản",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 999,
  },
  tabBarInner: {
    height: 64,
    borderRadius: 32,
    backgroundColor: "#223128",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.20)",
    borderTopColor: "rgba(255, 255, 255, 0.32)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
  },
  tabButton: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 1,
  },
  activeCapsule: {
    width: "92%",
    height: 50,
    borderRadius: 22,
    backgroundColor: "#20D66B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    gap: 2,
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  activeLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#051309",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  inactiveItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 2,
  },
  inactiveLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.72)",
    letterSpacing: -0.2,
    textAlign: "center",
  },
});

