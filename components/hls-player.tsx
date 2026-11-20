"use client";

import { useEffect, useRef } from "react";
import HLS from "hls.js";
import { createAdStrippingHlsLoader } from "@/lib/ad-parser";

const HLSPlayer = ({ videoUrl }: { videoUrl: string }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (HLS.isSupported()) {
      const AdStrippingLoader = createAdStrippingHlsLoader(HLS.DefaultConfig.loader);
      const hls = new HLS({
        ...(AdStrippingLoader ? { pLoader: AdStrippingLoader as any } : {}),
        enableWorker: true,
      });
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(HLS.Events.MANIFEST_LOADED, () => {
        video.play().catch(() => {});
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
      video.play().catch(() => {});
    }
  }, [videoUrl]);

  return (
    <div>
      <video
        ref={videoRef}
        className="w-full h-full rounded-lg"
        controls
        controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(event) => event.preventDefault()}
        draggable={false}
      />
    </div>
  );
};

export default HLSPlayer;
