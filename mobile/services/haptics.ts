import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const haptic = {
  light: () => {
    if (Platform.OS === "ios") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  },
  medium: () => {
    if (Platform.OS === "ios") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
  },
  heavy: () => {
    if (Platform.OS === "ios") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }
  },
  success: () => {
    if (Platform.OS === "ios") {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
  },
  error: () => {
    if (Platform.OS === "ios") {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  },
  warning: () => {
    if (Platform.OS === "ios") {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
    }
  },
  selection: () => {
    if (Platform.OS === "ios") {
      try {
        Haptics.selectionAsync();
      } catch {}
    }
  },
};
