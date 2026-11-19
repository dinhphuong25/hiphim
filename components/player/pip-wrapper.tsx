"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { pipStore } from "@/lib/pip-store";

const GlobalPipPlayer = dynamic(
  () => import("@/components/player/global-pip-player"),
  { ssr: false }
);

/**
 * Lazily mounts GlobalPipPlayer ONLY when user actually activates Picture-in-Picture,
 * avoiding downloading and hydrating PiP + HLS code on every normal page visit.
 */
export default function PipWrapper() {
  const [hasActivatedPip, setHasActivatedPip] = useState(false);

  useEffect(() => {
    if (pipStore.get()) {
      setHasActivatedPip(true);
    }
    return pipStore.subscribe((data) => {
      if (data) {
        setHasActivatedPip(true);
      }
    });
  }, []);

  if (!hasActivatedPip) return null;
  return <GlobalPipPlayer />;
}
