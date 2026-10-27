import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { Observe, ObserveRoot } from "@/services/observe";
import { Colors } from "@/constants/theme";
import { ExploreSheetProvider } from "@/context/ExploreSheetContext";
import { UserAuthProvider } from "@/context/UserAuthContext";
import { MobileExploreSheet } from "@/components/navigation/MobileExploreSheet";
import { AccountSheet } from "@/components/auth/AccountSheet";
import { AuthModal } from "@/components/auth/AuthModal";
import { AppLoadingScreen } from "@/components/ui/AppLoadingScreen";

// Configure EAS Observe with Expo Router integration before mount
Observe.configure({
  integrations: {
    "expo-router": {
      filteredParams: ["token", "password", "secret", "auth"],
    },
  },
});

// Prevent auto hiding of splash screen until custom animation takes over
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayout() {
  React.useEffect(() => {
    // Dismiss native splash screen immediately when React Native tree mounts
    SplashScreen.hideAsync().catch(() => {});

    // Failsafe dismiss in case of any platform delay
    const safety = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1500);

    return () => clearTimeout(safety);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <UserAuthProvider>
        <ExploreSheetProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="explore"
              options={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="movie/[slug]"
              options={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="watch/[slug]"
              options={{
                headerShown: false,
                animation: "fade",
                orientation: "all",
              }}
            />
            <Stack.Screen
              name="search"
              options={{
                headerShown: false,
                animation: "fade_from_bottom",
              }}
            />
          </Stack>

          {/* Global Mobile Explore Bottom Sheet */}
          <MobileExploreSheet />

          {/* Global Account Drawer & Auth Modal */}
          <AccountSheet />
          <AuthModal />

          {/* Cinematic Animated Startup Loading Screen */}
          <AppLoadingScreen minDuration={1800} />
        </ExploreSheetProvider>
      </UserAuthProvider>
    </SafeAreaProvider>
  );
}

export default ObserveRoot.wrap(RootLayout);
