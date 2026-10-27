"use client";

import dynamic from "next/dynamic";

const GlobalPipPlayer = dynamic(
  () => import("@/components/player/global-pip-player"),
  { ssr: false }
);

export default function PipWrapper() {
  return <GlobalPipPlayer />;
}
