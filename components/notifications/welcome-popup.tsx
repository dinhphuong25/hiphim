"use client";

import type { UserProfile } from "@/context/user-auth-context";

export interface WelcomeEventDetail {
  type: "new_register" | "welcome_back";
  user?: Partial<UserProfile> | null;
}

export default function WelcomePopup() {
  return null;
}
