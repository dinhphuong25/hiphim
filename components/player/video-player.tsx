"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import HLS from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Loader2,
  SkipForward,
  SkipBack,
  ChevronsRight,
  ChevronsLeft,
  Settings,
  Check,
  Tv,
  Rewind,
  FastForward,
  X,
  Sun,
  Subtitles,
  Upload,
  Zap,
  RotateCcw,
  RotateCw,
  PictureInPicture2,
  Clock,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import TVCPlayerOverlay from "./tvc-player-overlay";
import { Slider } from "@/components/ui/slider";
import { AdRange, fetchAndParseAllAdRanges, extractAllAdRangesFromFragments } from "@/lib/ad-parser";
import { pipStore } from "@/lib/pip-store";
export type VideoFitMode = 'contain' | 'cover' | 'fill' | '4:3' | '21:9';

export interface SubtitleCue {
  id: number;
  start: number;
  end: number;
  text: string;
}

function parseSubtitles(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  const cues: SubtitleCue[] = [];
  let idCounter = 0;

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (!lines.length) continue;

    const timeIndex = lines.findIndex((l) => l.includes('-->'));
    if (timeIndex === -1) continue;

    const timeLine = lines[timeIndex];
    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    if (!startStr || !endStr) continue;

    const parseTime = (t: string) => {
      const clean = t.replace(',', '.').trim();
      const parts = clean.split(':');
      if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      } else if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      return 0;
    };

    const start = parseTime(startStr);
    const end = parseTime(endStr);
    const textLines = lines.slice(timeIndex + 1).join('\n').replace(/<[^>]+>/g, '').trim();

    if (textLines && end > start) {
      cues.push({
        id: ++idCounter,
        start,
        end,
        text: textLines,
      });
    }
  }

  return cues;
}

interface VideoPlayerProps {
  videoUrl: string;
  autoplay?: boolean;
  poster?: string;
  initialTime?: number;
  onError?: (error: any) => void;
  onEnded?: () => void;
  onSwitchToEmbed?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
  movieName?: string;
  episodeName?: string;
  movieSlug?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  hasAlternativeServer?: boolean;
  onSwitchServer?: () => void;
  onReportError?: () => void;
}

const formatTime = (seconds: number, forceHours = false) => {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0 || forceHours) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function VideoPlayer({
  videoUrl,
  autoplay = true,
  poster,
  initialTime = 0,
  onError,
  onEnded,
  onSwitchToEmbed,
  onProgress,
  hasNextEpisode,
  onNextEpisode,
  movieName,
  episodeName,
  movieSlug,
  onFullscreenChange,
  hasAlternativeServer = false,
  onSwitchServer,
  onReportError,
}: VideoPlayerProps) {
  // 1. REFS (Defined at the very top)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<HLS | null>(null);
  const router = useRouter();

  const movieNameRef = useRef(movieName);
  const movieSlugRef = useRef(movieSlug);
  const videoUrlRef = useRef(videoUrl);
  const posterRef = useRef(poster);
  const isPlayingRef = useRef<boolean>(false);
  const currentTimeRef = useRef<number>(0);
  
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressSecondRef = useRef<number>(-1);
  const didSeekInitialTimeRef = useRef<boolean>(false);
  const autoplayMutedRef = useRef<boolean>(false);
  const lastNonZeroVolumeRef = useRef<number>(1);
  const userExplicitlyMutedRef = useRef<boolean>(false);
  const hasUserInteractedRef = useRef<boolean>(false);
  const lastTimeUpdateRef = useRef<number>(0);
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' | 'center' }>({ time: 0, side: 'center' });
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevVideoUrlRef = useRef<string>("");
  const isUserPausedRef = useRef<boolean>(false);

  // Callback Refs to keep useEffect pure and prevent unwanted reload loops
  const initialTimeRef = useRef(initialTime);
  initialTimeRef.current = initialTime;
  const autoplayRef = useRef(autoplay);
  autoplayRef.current = autoplay;
  const onSwitchToEmbedRef = useRef(onSwitchToEmbed);
  onSwitchToEmbedRef.current = onSwitchToEmbed;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onNextEpisodeRef = useRef(onNextEpisode);
  onNextEpisodeRef.current = onNextEpisode;
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onFullscreenChangeRef = useRef(onFullscreenChange);
  onFullscreenChangeRef.current = onFullscreenChange;

  // 2. STATES
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const isSeekingRef = useRef<boolean>(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isAutoplayMuted, setIsAutoplayMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState<number>(-1);
  const [qualities, setQualities] = useState<{ height: number, level: number }[]>([]);
  const retryCountRef = useRef(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [skipAnimation, setSkipAnimation] = useState<{ side: 'left' | 'right', id: number } | null>(null);
  const [shortcutFeedback, setShortcutFeedback] = useState<{
    icon: 'play' | 'pause' | 'volume' | 'mute' | 'seek';
    text?: string;
    id: number;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'quality' | 'speed' | 'sub' | 'filter' | 'fit'>('quality');
  const [videoFit, setVideoFit] = useState<VideoFitMode>('contain');
  const [containerAspect, setContainerAspect] = useState<number>(16 / 9);
  const [visualFilter, setVisualFilter] = useState<'normal' | 'oled' | 'vivid' | 'bright'>('normal');
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // TVC Pre-Roll Ad State
  const [showTVC, setShowTVC] = useState<boolean>(true);
  const showTVCRef = useRef<boolean>(true);
  const [tvcConfig, setTvcConfig] = useState({
    enabled: true,
    videoUrl: "https://bf.333xbet.com/18881999/video9922.mp4",
    targetUrl: "https://154.82.109.157/2138063.html",
    skipAfterSeconds: 5,
  });

  useEffect(() => {
    fetch("/api/announcement")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ads) {
          const ads = data.ads;
          if (ads.tvcEnabled === false || ads.enabled === false) {
            setShowTVC(false);
            showTVCRef.current = false;
          } else {
            setTvcConfig((prev) => ({
              ...prev,
              videoUrl: ads.tvcVideoUrl || prev.videoUrl,
              targetUrl: ads.targetUrl || prev.targetUrl,
              skipAfterSeconds: ads.tvcSkipAfterSeconds ?? prev.skipAfterSeconds,
            }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleTVCComplete = useCallback(() => {
    showTVCRef.current = false;
    setShowTVC(false);
    if (videoRef.current) {
      const savedVol = typeof window !== 'undefined' ? Number(localStorage.getItem('cinema_volume') || 1) : 1;
      const targetVol = savedVol > 0 ? savedVol : 1;
      try {
        videoRef.current.volume = targetVol;
        videoRef.current.muted = false;
      } catch {}
      setIsMuted(false);
      setIsAutoplayMuted(false);
      autoplayMutedRef.current = false;
      setIsPlaying(true);
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Mobile Touch Gestures & Screen Brightness
  const [brightness, setBrightness] = useState<number>(100);
  const [gestureHUD, setGestureHUD] = useState<{
    type: 'brightness' | 'volume' | 'seek';
    value: number;
    delta?: number;
  } | null>(null);
  const gestureHUDTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    zone: 'left' | 'center' | 'right';
    startBrightness: number;
    startVolume: number;
    startTime: number;
    lockedGesture: 'brightness' | 'volume' | 'seek' | null;
  } | null>(null);
  const targetSeekRef = useRef<number | null>(null);

  // Auto-Failover Buffer Recovery
  const stallCountRef = useRef<number>(0);
  const failoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // External Subtitles (.SRT / .VTT)
  const [customCues, setCustomCues] = useState<SubtitleCue[]>([]);
  const [subtitleEnabled, setSubtitleEnabled] = useState<boolean>(true);
  const [subtitleSize, setSubtitleSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [subtitleBg, setSubtitleBg] = useState<'transparent' | 'dim' | 'black'>('dim');
  const subtitleFileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentLevelPlaying, setCurrentLevelPlaying] = useState<number>(-1);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [hasRenderedFirstFrame, setHasRenderedFirstFrame] = useState(false);
  const slowNetworkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialSlowWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const initialFatalWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const lastBufferedRef = useRef<number>(0);

  const clearInitialWatchdogs = useCallback(() => {
    if (initialSlowWatchdogRef.current) {
      clearTimeout(initialSlowWatchdogRef.current);
      initialSlowWatchdogRef.current = null;
    }
    if (initialFatalWatchdogRef.current) {
      clearTimeout(initialFatalWatchdogRef.current);
      initialFatalWatchdogRef.current = null;
    }
    setIsSlowNetwork(false);
  }, []);
  // Anti-Ad Banner Shield (Tự động phát hiện & chỉ che dải quảng cáo bài bạc khi có quảng cáo)
  const [adShieldMode, setAdShieldMode] = useState<'auto' | 'always' | 'off'>('auto');
  const [isAdDetected, setIsAdDetected] = useState(false);
  const detectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveMissesRef = useRef(0);
  const prevFrameLuminanceRef = useRef<Uint8Array | null>(null);
  const isVisualAdDetectedRef = useRef(false);

  const handleAdShieldModeChange = useCallback((mode: 'auto' | 'always' | 'off') => {
    setAdShieldMode(mode);
    if (mode === 'always') {
      setIsAdDetected(true);
    } else if (mode === 'off') {
      setIsAdDetected(false);
    } else {
      setIsAdDetected(false);
      consecutiveDetectionsRef.current = 0;
      consecutiveMissesRef.current = 0;
      prevFrameLuminanceRef.current = null;
    }
    try {
      localStorage.setItem('cinema_ad_shield', mode);
      localStorage.setItem('cinema_ad_shield_manual', 'true');
    } catch (e) {}
  }, []);



  // Auto-Skip Video Ads (Tự động phát hiện & bỏ qua các đoạn video clip quảng cáo nổ hũ/cá độ chèn cắt ngang phim)
  const [autoSkipAds, setAutoSkipAds] = useState<boolean>(true);
  const adRangesRef = useRef<AdRange[]>([]);
  const bannerRangesRef = useRef<AdRange[]>([]);
  const hasExtractedFromHlsRef = useRef<boolean>(false);
  const [adRanges, setAdRanges] = useState<AdRange[]>([]);

  const handleToggleAutoSkipAds = useCallback((enabled: boolean) => {
    setAutoSkipAds(enabled);
    try {
      localStorage.setItem('cinema_auto_skip_ads', String(enabled));
    } catch (e) {}
  }, []);

  const handleCancelCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  }, []);

  const handlePlayNextImmediately = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
    onNextEpisodeRef.current?.();
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelCountdown();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [countdown, handleCancelCountdown]);



  // Auto Unmute Helper - immediately unmute and restore audio whenever called (never forces play if paused)
  const attemptUnmute = useCallback(() => {
    userExplicitlyMutedRef.current = false;
    const video = videoRef.current;
    if (!video) return;

    if (video.muted || isMuted || autoplayMutedRef.current) {
      video.muted = false;
      const targetVolume = lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 1;
      try { video.volume = targetVolume; } catch (e) {}
      setVolume(targetVolume);
      setIsMuted(false);
      setIsAutoplayMuted(false);
      autoplayMutedRef.current = false;
      try { localStorage.setItem('cinema_muted', 'false'); } catch (e) {}
      try { localStorage.setItem('cinema_volume', String(targetVolume)); } catch (e) {}
    }
  }, [isMuted]);

  // User interaction listener to unmute audio if browser started playback muted
  useEffect(() => {
    const onUserInteraction = () => {
      hasUserInteractedRef.current = true;
      const video = videoRef.current;
      // Only unmute audio if currently playing and muted. NEVER resume or touch playback if paused!
      if (video && !video.paused && (video.muted || autoplayMutedRef.current)) {
        if (!userExplicitlyMutedRef.current) {
          video.muted = false;
          const targetVol = lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 1;
          try { video.volume = targetVol; } catch (e) {}
          setIsMuted(false);
          setIsAutoplayMuted(false);
          autoplayMutedRef.current = false;
        }
      }
    };

    window.addEventListener('click', onUserInteraction, { passive: true });
    window.addEventListener('keydown', onUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
    };
  }, []);

  // Close settings menu on outside click
  useEffect(() => {
    if (!showSettings) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showSettings]);

  // Load saved volume preferences on mount - ensure sound is ALWAYS enabled and ready by default
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedVol = localStorage.getItem('cinema_volume');
    const volNum = savedVol !== null ? Number(savedVol) : 1;
    // Always default to 100% full volume if not set or if 0, guaranteeing audio is on
    const initialVol = !isNaN(volNum) && volNum > 0 && volNum <= 1 ? volNum : 1;
    
    lastNonZeroVolumeRef.current = initialVol;
    userExplicitlyMutedRef.current = false;
    setVolume(initialVol);
    setIsMuted(false);
    try { localStorage.setItem('cinema_muted', 'false'); } catch (e) {}
    try { localStorage.setItem('cinema_volume', String(initialVol)); } catch (e) {}

    if (videoRef.current) {
      videoRef.current.volume = initialVol;
      videoRef.current.muted = false;
    }

    try {
      // Remove obsolete global visual filter key so it never leaks across movies
      localStorage.removeItem('cinema_visual_filter');
      const savedFit = localStorage.getItem('cinema_video_fit') as VideoFitMode;
      if (savedFit && ['contain', 'cover', 'fill', '4:3', '21:9'].includes(savedFit)) {
        setVideoFit(savedFit);
      }

      // Khiên chắn quảng cáo mép trên: mặc định 'auto' (chỉ che khi thực tế phát hiện có quảng cáo, không che phim sạch)
      const isManual = localStorage.getItem('cinema_ad_shield_manual');
      const savedShield = localStorage.getItem('cinema_ad_shield') as 'auto' | 'always' | 'off';
      if (isManual && (savedShield === 'off' || savedShield === 'always' || savedShield === 'auto')) {
        setAdShieldMode(savedShield);
        setIsAdDetected(savedShield === 'always');
      } else {
        setAdShieldMode('auto');
        setIsAdDetected(false);
        try { localStorage.setItem('cinema_ad_shield', 'auto'); } catch (e) {}
      }

      // Tải cấu hình tự động bỏ qua video quảng cáo cờ bạc (mặc định luôn BẬT)
      const savedAutoSkip = localStorage.getItem('cinema_auto_skip_ads');
      if (savedAutoSkip === 'false') {
        setAutoSkipAds(false);
      } else {
        setAutoSkipAds(true);
        if (!savedAutoSkip) {
          try { localStorage.setItem('cinema_auto_skip_ads', 'true'); } catch (e) {}
        }
      }
    } catch (e) {}
  }, []);

  // Proactively auto-unmute whenever video starts playing - sound is always on and ready
  useEffect(() => {
    if (isPlaying && !userExplicitlyMutedRef.current) {
      const v = videoRef.current;
      if (v) {
        if (v.muted) v.muted = false;
        if (v.volume === 0) v.volume = 1;
      }
      if (isMuted) setIsMuted(false);
      if (volume === 0) setVolume(1);
    }
  }, [isPlaying, isMuted, volume]);

  // 3. ACTIONS (Strictly defined before any useEffect)
  const showControlsHandler = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (videoRef.current && !videoRef.current.paused && !isLoading && countdown === null && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [countdown, showSettings, isLoading]);

  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    attemptUnmute();
    lastTapRef.current = { time: 0, side: 'center' };

    try {
      if (videoRef.current.paused) {
        setIsLoading(false);
        autoplayRef.current = true;
        isUserPausedRef.current = false;
        if (hlsRef.current) {
          hlsRef.current.startLoad();
        }
        // Always play unmuted with full sound on user action
        videoRef.current.muted = false;
        setIsMuted(false);
        setIsAutoplayMuted(false);
        autoplayMutedRef.current = false;
        await videoRef.current.play();
      } else {
        autoplayRef.current = false;
        isUserPausedRef.current = true;
        videoRef.current.pause();
      }
    } catch (err: any) {
      console.warn("Play/Pause error:", err);
      if (err.name === 'NotAllowedError') {
        setIsLoading(false);
      } else if (err.name === 'AbortError') {
        console.warn("Play request was interrupted");
      }
    }
    showControlsHandler();
  }, [attemptUnmute, showControlsHandler]);

  const skip = useCallback((seconds: number) => {
    if (videoRef.current) {
      const maxDuration = videoRef.current.duration || 999999;
      let newTime = Math.max(0, Math.min(maxDuration, videoRef.current.currentTime + seconds));
      if (adRangesRef.current.length > 0) {
        for (const range of adRangesRef.current) {
          if (newTime >= range.start - 0.35 && newTime < range.end - 0.1) {
            newTime = seconds >= 0 ? range.end + 0.15 : Math.max(0, range.start - 0.5);
            break;
          }
        }
      }
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      let isBuffered = false;
      const b = videoRef.current.buffered;
      for (let i = 0; i < b.length; i++) {
        if (newTime >= b.start(i) && newTime <= b.end(i) - 0.5) {
          isBuffered = true;
          break;
        }
      }
      if (!isBuffered) {
        setIsLoading(true);
      }
      if (hlsRef.current) {
        hlsRef.current.startLoad(newTime);
      }
      showControlsHandler();
    }
  }, [showControlsHandler]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      userExplicitlyMutedRef.current = newVolume === 0;
      if (newVolume > 0) {
        lastNonZeroVolumeRef.current = newVolume;
        try { localStorage.setItem('cinema_volume', String(newVolume)); } catch (e) {}
        try { localStorage.setItem('cinema_muted', 'false'); } catch (e) {}
      } else {
        try { localStorage.setItem('cinema_muted', 'true'); } catch (e) {}
      }
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      setIsAutoplayMuted(false);
      autoplayMutedRef.current = false;
    }
  }, []);

  const handleSeekChange = useCallback((value: number[]) => {
    isSeekingRef.current = true;
    setSeekTime(value[0]);
    showControlsHandler();
  }, [showControlsHandler]);

  const handleSeekCommit = useCallback((value: number[]) => {
    let targetTime = value[0];
    // Tự động bỏ qua quảng cáo nếu người xem tua trúng vào vùng video quảng cáo cờ bạc
    if (adRangesRef.current.length > 0) {
      for (const range of adRangesRef.current) {
        if (targetTime >= range.start - 0.35 && targetTime < range.end - 0.1) {
          targetTime = range.end + 0.15;
          break;
        }
      }
    }
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      let isBuffered = false;
      const b = videoRef.current.buffered;
      for (let i = 0; i < b.length; i++) {
        if (targetTime >= b.start(i) && targetTime <= b.end(i) - 0.5) {
          isBuffered = true;
          break;
        }
      }
      if (!isBuffered) {
        setIsLoading(true);
      }
    }
    setCurrentTime(targetTime);
    setSeekTime(null);
    if (hlsRef.current) {
      hlsRef.current.startLoad(targetTime);
    }
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 250);
    showControlsHandler();
  }, [showControlsHandler]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      userExplicitlyMutedRef.current = nextMuted;
      setIsMuted(nextMuted);
      setIsAutoplayMuted(false);
      autoplayMutedRef.current = false;
      if (nextMuted) {
        if (videoRef.current.volume > 0) {
          lastNonZeroVolumeRef.current = videoRef.current.volume;
        }
        setVolume(0);
        try { localStorage.setItem('cinema_muted', 'true'); } catch (e) {}
      } else {
        const restoredVolume = Math.max(0.1, lastNonZeroVolumeRef.current || 1);
        videoRef.current.volume = restoredVolume;
        setVolume(restoredVolume);
        try { localStorage.setItem('cinema_volume', String(restoredVolume)); } catch (e) {}
        try { localStorage.setItem('cinema_muted', 'false'); } catch (e) {}
      }
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current || !videoRef.current) return;
    
    try {
      const isHtml5Fullscreen = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      const isCurrent = isHtml5Fullscreen || isFullscreen;

      if (!isCurrent) {
        // 1. On iPhone / iOS Safari where container Element.requestFullscreen is NOT supported:
        // Use video.webkitEnterFullscreen() to launch the REAL native fullscreen player directly!
        const isIos = typeof navigator !== 'undefined' && /iPhone|iPod|iPad/i.test(navigator.userAgent);
        const canWebkitFs = typeof (videoRef.current as any).webkitEnterFullscreen === 'function';

        if ((isIos || !containerRef.current.requestFullscreen) && canWebkitFs) {
          try {
            (videoRef.current as any).webkitEnterFullscreen();
            setIsFullscreen(true);
            return;
          } catch (e) {
            console.warn('iOS webkitEnterFullscreen error:', e);
          }
        }

        // 2. Try HTML5 Fullscreen on container element (Desktop, Android, iPadOS)
        let enteredContainerFullscreen = false;
        if (containerRef.current.requestFullscreen) {
          try {
            await containerRef.current.requestFullscreen();
            enteredContainerFullscreen = true;
          } catch (e) {}
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          try {
            await (containerRef.current as any).webkitRequestFullscreen();
            enteredContainerFullscreen = true;
          } catch (e) {}
        }

        // Fallback for any other device supporting webkitEnterFullscreen if container FS failed
        if (!enteredContainerFullscreen && canWebkitFs) {
          try {
            (videoRef.current as any).webkitEnterFullscreen();
            setIsFullscreen(true);
            return;
          } catch (e) {}
        }

        setIsFullscreen(true);

        // Lock orientation to landscape on Android / devices that support Screen Orientation API
        try {
          if (typeof screen !== 'undefined' && screen.orientation && (screen.orientation as any).lock) {
            (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch (e) {}
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          try { await document.exitFullscreen(); } catch (e) {}
        } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
          try { await (document as any).webkitExitFullscreen(); } catch (e) {}
        }

        if (typeof (videoRef.current as any).webkitExitFullscreen === 'function') {
          try { (videoRef.current as any).webkitExitFullscreen(); } catch (e) {}
        }

        setIsFullscreen(false);

        try {
          if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
      setIsFullscreen((prev) => !prev);
    }
  }, [isFullscreen]);

  const togglePictureInPicture = useCallback(async () => {
    try {
      const video = videoRef.current;
      if (!video) return;

      // 1. Thoát fullscreen nếu đang bật để tránh xung đột trình duyệt
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {}
      }

      // 2. Nếu đang trong chế độ Picture-in-Picture -> Đóng PiP
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
        toast.info("Đã tắt chế độ hình trong hình");
        return;
      }

      // 3. Chuẩn HTML5 Picture-in-Picture API (Chrome, Edge, Firefox, Brave...)
      if (document.pictureInPictureEnabled && typeof video.requestPictureInPicture === "function") {
        video.disablePictureInPicture = false;
        await video.requestPictureInPicture();
        setIsPiPActive(true);
        toast.success("Đã bật chế độ hình trong hình (PiP)");
        return;
      }

      // 4. Hỗ trợ Safari / WebKit Presentation Mode (macOS / iOS)
      const webkitVideo = video as any;
      if (webkitVideo.webkitSupportsPresentationMode && typeof webkitVideo.webkitSetPresentationMode === "function") {
        if (webkitVideo.webkitPresentationMode === "picture-in-picture") {
          webkitVideo.webkitSetPresentationMode("inline");
          setIsPiPActive(false);
          toast.info("Đã tắt chế độ hình trong hình");
        } else {
          webkitVideo.webkitSetPresentationMode("picture-in-picture");
          setIsPiPActive(true);
          toast.success("Đã bật chế độ hình trong hình (PiP)");
        }
        return;
      }

      // 5. Dự phòng: Trình phát thu nhỏ nổi trong trang (Mini Player)
      if (videoUrl) {
        video.pause();
        pipStore.set({
          videoUrl,
          movieName: movieName || "Phim",
          movieSlug: movieSlug || "",
          poster,
          currentTime: video.currentTime || 0,
        });
        toast.info("Đã mở trình phát thu nhỏ (Mini Player)");
        return;
      }

      toast.info("Trình duyệt không hỗ trợ chế độ hình trong hình (PiP)");
    } catch (err: any) {
      console.warn("PiP toggle error:", err);
      // Fallback mini player nếu trình duyệt chặn native PiP
      if (videoUrl && videoRef.current) {
        try {
          videoRef.current.pause();
          pipStore.set({
            videoUrl,
            movieName: movieName || "Phim",
            movieSlug: movieSlug || "",
            poster,
            currentTime: videoRef.current.currentTime || 0,
          });
          toast.info("Đã mở trình phát thu nhỏ (Mini Player)");
          return;
        } catch {}
      }
      toast.error("Không thể mở chế độ hình trong hình");
    }
  }, [videoUrl, movieName, movieSlug, poster]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      toast.info(`Tốc độ phát: ${rate === 1 ? '1.0x (Chuẩn)' : `${rate}x`}`);
    }
  }, []);

  const handleQualityChange = useCallback((level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setQuality(level);
      if (level === -1) {
        toast.info("Chất lượng: Tự động (Thích ứng theo mạng)");
      } else {
        const selected = qualities.find(q => q.level === level);
        toast.success(`Chất lượng: ${selected?.height || ''}p Siêu Nét`);
      }
    }
  }, [qualities]);

  const handleVisualFilterChange = useCallback((filter: 'normal' | 'oled' | 'vivid' | 'bright') => {
    setVisualFilter(filter);
    const slug = movieSlugRef.current;
    if (slug) {
      try {
        if (filter === 'normal') {
          localStorage.removeItem(`cinema_visual_filter_${slug}`);
        } else {
          localStorage.setItem(`cinema_visual_filter_${slug}`, filter);
        }
      } catch (e) {}
    }
    try { localStorage.removeItem('cinema_visual_filter'); } catch (e) {}

    const label = filter === 'oled' 
      ? 'OLED Cinema Pro (Đề xuất)' 
      : filter === 'vivid' 
      ? 'Sống động (Vivid Colors)' 
      : filter === 'bright'
      ? 'Sáng rõ (Night Clarify)'
      : 'Chuẩn (Natural)';
    toast.success(`Chế độ màu: ${label}`);
  }, []);

  const handleVideoFitChange = useCallback((newFit: VideoFitMode) => {
    setVideoFit(newFit);
    try {
      localStorage.setItem('cinema_video_fit', newFit);
    } catch (e) {}

    const titles: Record<VideoFitMode, string> = {
      contain: 'Mặc định (16:9)',
      cover: 'Phóng to lấp đầy (Zoom Fill)',
      '4:3': 'Tỷ lệ 4:3 (TV/Anime)',
      '21:9': 'Điện ảnh (21:9)',
      fill: 'Kéo giãn (Stretch)',
    };
    toast.success(`Tỷ lệ: ${titles[newFit] || newFit}`);
  }, []);

  // Track container width/height ratio for responsive aspect fitting
  useEffect(() => {
    const updateAspect = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          setContainerAspect(w / h);
        }
      }
    };
    updateAspect();
    window.addEventListener('resize', updateAspect);
    window.addEventListener('orientationchange', updateAspect);
    return () => {
      window.removeEventListener('resize', updateAspect);
      window.removeEventListener('orientationchange', updateAspect);
    };
  }, [isFullscreen]);

  // Synchronize HTML5 fullscreen events (e.g. user presses Esc or hardware gesture)
  useEffect(() => {
    const onFsChange = () => {
      const isHtml5Fs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (!isHtml5Fs && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, [isFullscreen]);

  // Prevent background scrolling and dispatch global events when in fullscreen mode
  useEffect(() => {
    onFullscreenChangeRef.current?.(isFullscreen);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('video-fullscreen-change', {
        detail: { isFullscreen }
      }));
      document.body.classList.toggle('has-video-fullscreen', isFullscreen);
      document.documentElement.classList.toggle('has-video-fullscreen', isFullscreen);
    }
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Full clean-up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('video-fullscreen-change', {
          detail: { isFullscreen: false }
        }));
        document.body.classList.remove('has-video-fullscreen');
        document.documentElement.classList.remove('has-video-fullscreen');
        document.body.style.overflow = '';
        try {
          if (screen?.orientation?.unlock) {
            screen.orientation.unlock();
          }
        } catch (e) {}
      }
    };
  }, []);

  // Compute CSS transform & fit styling for <video>
  const getVideoTransformStyle = useCallback((): React.CSSProperties => {
    switch (videoFit) {
      case 'cover': {
        // Trên màn hình siêu rộng (màn hình 21:9 hoặc điện thoại tràn viền), object-fit: cover tự lấp đầy
        // Trên màn 16:9 chuẩn, scale(1.334) phóng to 133.4% để cắt sạch 2 viền đen trên dưới (letterbox 2.35:1)
        const scale = containerAspect > 2.0 ? 1 : 1.334;
        return {
          objectFit: 'cover',
          transform: `translateZ(0) scale(${scale})`,
          transformOrigin: 'center center',
        };
      }
      case 'fill': {
        return {
          objectFit: 'fill',
          transform: 'translateZ(0) scale(1)',
          transformOrigin: 'center center',
        };
      }
      case '4:3': {
        // Tỷ lệ chuẩn 4:3 = 1.3333 so với 16:9 (1.7777) => co lại 75% chiều ngang
        return {
          objectFit: 'fill',
          transform: 'translateZ(0) scaleX(0.75)',
          transformOrigin: 'center center',
        };
      }
      case '21:9': {
        // Tỷ lệ chuẩn 21:9 = 2.3333 so với 16:9 (1.7777) => ép 76.2% chiều cao
        return {
          objectFit: 'fill',
          transform: 'translateZ(0) scaleY(0.762)',
          transformOrigin: 'center center',
        };
      }
      case 'contain':
      default: {
        return {
          objectFit: 'contain',
          transform: 'translateZ(0) scale(1)',
          transformOrigin: 'center center',
        };
      }
    }
  }, [videoFit, containerAspect]);


  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  }, [router]);

  useEffect(() => { movieNameRef.current = movieName; }, [movieName]);
  useEffect(() => { movieSlugRef.current = movieSlug; }, [movieSlug]);

  // Chế độ màu luôn mặc định là 'normal' (Chuẩn), chỉ nạp lại nếu người dùng đã chỉnh riêng cho phim này
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!movieSlug) {
      setVisualFilter('normal');
      return;
    }
    try {
      const savedForMovie = localStorage.getItem(`cinema_visual_filter_${movieSlug}`);
      if (savedForMovie && ['oled', 'vivid', 'bright'].includes(savedForMovie)) {
        setVisualFilter(savedForMovie as any);
      } else {
        setVisualFilter('normal');
      }
    } catch {
      setVisualFilter('normal');
    }
  }, [movieSlug]);
  useEffect(() => { videoUrlRef.current = videoUrl; }, [videoUrl]);
  useEffect(() => { posterRef.current = poster; }, [poster]);

  // DNS preconnect and prefetch video CDN origin to eliminate connection handshake latency without transferring heavy video data
  useEffect(() => {
    if (!videoUrl || typeof document === 'undefined') return;
    try {
      const parsed = new URL(videoUrl);
      const origin = parsed.origin;
      if (origin && origin.startsWith('http')) {
        let preconnect = document.querySelector(`link[rel="preconnect"][data-origin="${origin}"]`);
        if (!preconnect) {
          preconnect = document.createElement('link');
          preconnect.setAttribute('rel', 'preconnect');
          preconnect.setAttribute('href', origin);
          preconnect.setAttribute('crossorigin', '');
          preconnect.setAttribute('data-origin', origin);
          document.head.appendChild(preconnect);
        }
        let dnsPrefetch = document.querySelector(`link[rel="dns-prefetch"][data-origin="${origin}"]`);
        if (!dnsPrefetch) {
          dnsPrefetch = document.createElement('link');
          dnsPrefetch.setAttribute('rel', 'dns-prefetch');
          dnsPrefetch.setAttribute('href', origin);
          dnsPrefetch.setAttribute('data-origin', origin);
          document.head.appendChild(dnsPrefetch);
        }
      }
    } catch {}
  }, [videoUrl]);

  // Tự động phân tích luồng phát m3u8 để trích xuất dải thời gian các video quảng cáo cờ bạc & banner che
  // Tối ưu băng thông: Nếu Hls.js đang chạy, LEVEL_LOADED sẽ trích xuất trực tiếp từ RAM mà không tốn request mạng.
  // Không fetch lại qua mạng nếu Hls.js đã trích xuất, bảo vệ tuyệt đối băng thông và giới hạn của máy chủ nguồn.
  useEffect(() => {
    adRangesRef.current = [];
    bannerRangesRef.current = [];
    hasExtractedFromHlsRef.current = false;
    setAdRanges([]);

    if (!videoUrl) return;

    let isCancelled = false;
    const fetchTimer = setTimeout(() => {
      // Nếu Hls.js đã trích xuất xong từ fragments trong RAM, không cần fetch lại qua mạng
      if (hasExtractedFromHlsRef.current || adRangesRef.current.length > 0 || bannerRangesRef.current.length > 0) return;

      fetchAndParseAllAdRanges(videoUrl).then((data) => {
        if (!isCancelled) {
          if (data.commercialRanges.length > 0) {
            adRangesRef.current = data.commercialRanges;
            setAdRanges(data.commercialRanges);
            if (videoRef.current && autoSkipAds) {
              const current = videoRef.current.currentTime;
              for (const range of data.commercialRanges) {
                if (current >= range.start - 0.35 && current < range.end - 0.1) {
                  videoRef.current.currentTime = range.end + 0.15;
                  break;
                }
              }
            }
          }
          if (data.bannerRanges.length > 0) {
            bannerRangesRef.current = data.bannerRanges;
          }
        }
      }).catch(() => {});
    }, 6000);

    return () => {
      isCancelled = true;
      clearTimeout(fetchTimer);
    };
  }, [videoUrl]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      if (!videoRef.current) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      
      const showFeedback = (icon: 'play' | 'pause' | 'volume' | 'mute' | 'seek', text?: string) => {
        setShortcutFeedback({ icon, text, id: Date.now() });
      };

      switch (e.code) {
        case 'Space': case 'KeyK': togglePlay(); break;
        case 'ArrowRight': case 'KeyL': skip(10); setSkipAnimation({ side: 'right', id: Date.now() }); break;
        case 'ArrowLeft': case 'KeyJ': skip(-10); setSkipAnimation({ side: 'left', id: Date.now() }); break;
        case 'ArrowUp':
          const volUp = Math.min(videoRef.current.volume + 0.1, 1);
          handleVolumeChange([volUp]); showFeedback('volume', `${Math.round(volUp * 100)}%`); break;
        case 'ArrowDown':
          const volDown = Math.max(videoRef.current.volume - 0.1, 0);
          handleVolumeChange([volDown]); showFeedback('volume', `${Math.round(volDown * 100)}%`); break;
        case 'KeyF': toggleFullscreen(); break;
        case 'KeyM': toggleMute(); showFeedback(videoRef.current.muted ? 'mute' : 'volume'); break;
        case 'KeyA':
        case 'KeyZ': {
          const modes: VideoFitMode[] = ['contain', 'cover', '4:3', '21:9', 'fill'];
          setVideoFit((prev) => {
            const currentIndex = modes.indexOf(prev);
            const nextMode = modes[(currentIndex + 1) % modes.length];
            handleVideoFitChange(nextMode);
            return nextMode;
          });
          break;
        }
        case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5':
        case 'Digit6': case 'Digit7': case 'Digit8': case 'Digit9': case 'Digit0':
          const percent = e.code === 'Digit0' ? 0 : parseInt(e.code.replace('Digit', '')) * 10;
          if (videoRef.current.duration) { handleSeekCommit([(percent / 100) * videoRef.current.duration]); showFeedback('seek', `${percent}%`); }
          break;
      }
      showControlsHandler();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skip, handleVolumeChange, handleSeekCommit, toggleMute, toggleFullscreen, showControlsHandler, handleVideoFitChange]);

  // Clear shortcut feedback automatically
  useEffect(() => {
    if (shortcutFeedback) {
      const timer = setTimeout(() => setShortcutFeedback(null), 800);
      return () => clearTimeout(timer);
    }
  }, [shortcutFeedback]);

  // Clear skip animation feedback automatically
  useEffect(() => {
    if (skipAnimation) {
      const timer = setTimeout(() => setSkipAnimation(null), 700);
      return () => clearTimeout(timer);
    }
  }, [skipAnimation]);

  // HLS/Video Setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) {
      setIsLoading(false);
      return;
    }
    setError(null); 
    setIsLoading(true);
    retryCountRef.current = 0;
    didSeekInitialTimeRef.current = false;
    lastProgressSecondRef.current = -1;

    // Detect mobile and iOS Safari
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    // Strict inline video playback configuration for iOS Safari
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-playsinline', 'true');
    video.setAttribute('x5-video-player-type', 'h5-page');
    video.playsInline = true;
    try { video.crossOrigin = "anonymous"; } catch (e) {}

    // Helper for fast, non-blocking playback start - Always keep sound unmuted when allowed
    const playWithAutoplayFallback = () => {
      clearInitialWatchdogs();
      setIsLoading(false);
      if (showTVCRef.current) {
        return;
      }
      if (!autoplayRef.current || isUserPausedRef.current || !video) return;

      const savedVol = typeof window !== 'undefined' ? Number(localStorage.getItem('cinema_volume') || 1) : 1;
      const targetVol = savedVol > 0 ? savedVol : 1;
      try { video.volume = targetVol; } catch (e) {}

      // Always attempt unmuted sound first
      video.muted = false;
      setIsMuted(false);
      setIsAutoplayMuted(false);
      autoplayMutedRef.current = false;

      const p = video.play();
      if (p !== undefined) {
        p.then(() => {
          clearInitialWatchdogs();
          setIsLoading(false);
          video.muted = false;
          setIsMuted(false);
          setIsAutoplayMuted(false);
          autoplayMutedRef.current = false;
        }).catch((err) => {
          console.warn("Autoplay without sound restriction notice:", err);
          clearInitialWatchdogs();
          setIsLoading(false);
          // When browser restricts unmuted autoplay, do NOT automatically mute the sound!
          // Keep sound unmuted and pause playback, so when the user taps to watch,
          // the video plays with full sound as expected.
          if (err?.name === 'NotAllowedError') {
            video.muted = false;
            setIsMuted(false);
            setIsAutoplayMuted(false);
            autoplayMutedRef.current = false;
            setIsPlaying(false);
            setShowControls(true);
            try { video.pause(); } catch (e) {}
          }
        });
      }
    };

    const targetStartPosition = initialTimeRef.current > 0 ? initialTimeRef.current : -1;

    // Seamless in-place source switch when changing episode/server (preserves decoder & avoids black flash)
    if (prevVideoUrlRef.current && prevVideoUrlRef.current !== videoUrl) {
      prevVideoUrlRef.current = videoUrl;
      isUserPausedRef.current = false;
      autoplayRef.current = true;
      hasExtractedFromHlsRef.current = false;
      setHasRenderedFirstFrame(false);
      setError(null);
      setIsLoading(true);
      setIsSlowNetwork(false);
      retryCountRef.current = 0;
      didSeekInitialTimeRef.current = false;
      lastProgressSecondRef.current = -1;

      // Arm watchdogs for the new episode
      if (initialSlowWatchdogRef.current) clearTimeout(initialSlowWatchdogRef.current);
      initialSlowWatchdogRef.current = setTimeout(() => {
        setIsSlowNetwork(true);
        if (hlsRef.current) {
          hlsRef.current.startLoad();
        }
      }, 3500);

      if (initialFatalWatchdogRef.current) clearTimeout(initialFatalWatchdogRef.current);
      initialFatalWatchdogRef.current = setTimeout(() => {
        if (hlsRef.current) {
          hlsRef.current.recoverMediaError();
          hlsRef.current.startLoad();
        }
        setIsSlowNetwork(true);
        setIsLoading(false);
      }, 7500);

      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
          hlsRef.current.config.startPosition = targetStartPosition;
          hlsRef.current.loadSource(videoUrl);
          hlsRef.current.startLoad(targetStartPosition);
          return;
        } catch (err) {
          console.warn("Seamless HLS switch fallback to reinit:", err);
        }
      } else if (isIOS && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        if (targetStartPosition > 0) {
          const onMeta = () => {
            try { video.currentTime = targetStartPosition; } catch (e) {}
          };
          video.addEventListener('loadedmetadata', onMeta, { once: true });
        } else {
          try { video.currentTime = 0; } catch (e) {}
        }
        playWithAutoplayFallback();
        return;
      }
    }

    prevVideoUrlRef.current = videoUrl;
    isUserPausedRef.current = false;
    setHasRenderedFirstFrame(false);
    setIsSlowNetwork(false);

    // Watchdog: If initial load takes more than 3.5s, trigger active buffer recovery and flag slow network
    if (initialSlowWatchdogRef.current) clearTimeout(initialSlowWatchdogRef.current);
    initialSlowWatchdogRef.current = setTimeout(() => {
      setIsSlowNetwork(true);
      if (hlsRef.current) {
        hlsRef.current.startLoad();
      }
    }, 3500);

    // Watchdog: If still loading after 7.5s, try recovery once and offer backup
    if (initialFatalWatchdogRef.current) clearTimeout(initialFatalWatchdogRef.current);
    initialFatalWatchdogRef.current = setTimeout(() => {
      if (hlsRef.current) {
        hlsRef.current.recoverMediaError();
        hlsRef.current.startLoad();
      }
      setIsSlowNetwork(true);
      setIsLoading(false);
    }, 7500);

    const initHls = () => {
      // 1. Prefer Native HLS for Apple iOS devices (iPhone, iPad)
      // Apple's AVPlayer handles HLS natively with hardware acceleration, avoiding MSE/ManagedMediaSource stalls
      const useNativeHls = isIOS && video.canPlayType('application/vnd.apple.mpegurl');

      if (useNativeHls) {
        const handleReady = () => { 
          clearInitialWatchdogs();
          setIsLoading(false);
          setIsSlowNetwork(false);
          setHasRenderedFirstFrame(true);
          if (video.buffered.length > 0) {
            const firstStart = video.buffered.start(0);
            if (video.currentTime < firstStart && firstStart > 0.05 && firstStart < 5) {
              try { video.currentTime = firstStart + 0.02; } catch (e) {}
            }
          }
        };

        const handleMetadata = () => {
          setIsLoading(false);
          if (targetStartPosition > 0 && Math.abs(video.currentTime - targetStartPosition) > 1) {
            try { video.currentTime = targetStartPosition; } catch (e) {}
          } else if (video.buffered.length > 0) {
            const firstStart = video.buffered.start(0);
            if (video.currentTime < firstStart && firstStart > 0.05 && firstStart < 5) {
              try { video.currentTime = firstStart + 0.02; } catch (e) {}
            }
          }
        };

        const handleNativeError = () => { 
          if (!video.src && !video.currentSrc) return;
          console.warn("Native HLS error on video element:", video.error);
          setIsLoading(false);
          if (video.error && (video.error.code === 2 || video.error.code === 4)) {
            setError("Tập phim tạm thời chưa thể phát hoặc máy chủ đang gián đoạn.");
          }
        };

        video.addEventListener('loadedmetadata', handleMetadata);
        video.addEventListener('loadeddata', handleReady);
        video.addEventListener('canplay', handleReady);
        video.addEventListener('canplaythrough', handleReady);
        video.addEventListener('playing', handleReady);
        video.addEventListener('error', handleNativeError);

        video.preload = "auto";
        video.src = videoUrl;
        try { video.load(); } catch (e) {}

        playWithAutoplayFallback();

        return () => {
          video.removeEventListener('loadedmetadata', handleMetadata);
          video.removeEventListener('loadeddata', handleReady);
          video.removeEventListener('canplay', handleReady);
          video.removeEventListener('canplaythrough', handleReady);
          video.removeEventListener('playing', handleReady);
          video.removeEventListener('error', handleNativeError);
        };
      } else if (HLS.isSupported()) {
        const hls = new HLS({
          enableWorker: true,
          lowLatencyMode: false,
          progressive: true,
          startFragPrefetch: true,
          autoStartLoad: true,
          startPosition: targetStartPosition,
          
          backBufferLength: 30, // Giữ 30s đệm cũ để tua lùi tức thì mượt mà không cần tải lại
          maxBufferLength: isMobile ? 45 : 75, // Tăng bộ đệm xem phim mượt mà liên tục, triệt tiêu đứng hình do mạng
          maxMaxBufferLength: isMobile ? 90 : 150,
          maxBufferSize: isMobile ? 64 * 1024 * 1024 : 128 * 1024 * 1024,
          maxBufferHole: 0.5, // Nhảy ngay qua khe hở timestamp gián đoạn (0.5s) thay vì chờ 8.5s
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 15,
          
          startLevel: -1,
          capLevelToPlayerSize: true,
          testBandwidth: false,
          
          abrEwmaDefaultEstimate: 5_000_000, // 5 Mbps khởi động ngay chất lượng 1080p Full HD siêu nét
          abrBandWidthFactor: 0.85,
          abrBandWidthUpFactor: 0.75,
          
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 3,
          levelLoadingRetryDelay: 500,
          fragLoadingMaxRetry: 4,
          fragLoadingRetryDelay: 500,
          fragLoadingMaxRetryTimeout: 20_000,
          
          manifestLoadingTimeOut: 6_000, // Phát hiện mất kết nối/máy chủ chết siêu nhanh để chuyển dự phòng
          levelLoadingTimeOut: 6_000,
          fragLoadingTimeOut: 12_000,
          
          xhrSetup: (xhr) => {
            xhr.withCredentials = false;
          }
        });
        
        hlsRef.current = hls;
        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(HLS.Events.MANIFEST_PARSED, (e, data) => {
          retryCountRef.current = 0;
          const availableQualities = data.levels
            .map((l, index) => ({ height: l.height || 0, level: index, bitrate: l.bitrate }))
            .filter(q => q.height > 0)
            .sort((a, b) => b.height - a.height);
          setQualities(availableQualities);
          playWithAutoplayFallback();
        });

        // Auto-align video playhead to first buffered audio/video sample if stream starts at non-zero PTS (e.g. 1.48s VTVgo capture offset)
        hls.on(HLS.Events.BUFFER_APPENDED, () => {
          const v = videoRef.current;
          if (v && v.buffered.length > 0) {
            const firstStart = v.buffered.start(0);
            if (v.currentTime < firstStart && firstStart > 0.05 && firstStart < 5) {
              try { v.currentTime = firstStart + 0.02; } catch (e) {}
            }
          }
        });

        hls.on(HLS.Events.FRAG_LOADED, () => {
          clearInitialWatchdogs();
          setIsLoading(false);
          setIsSlowNetwork(false);
        });

        hls.on(HLS.Events.FRAG_PARSED, () => {
          clearInitialWatchdogs();
          setIsLoading(false);
        });

        hls.on(HLS.Events.LEVEL_LOADED, (e, data) => {
          try {
            hasExtractedFromHlsRef.current = true;
            // Instantly pre-align video playhead before fragment download finishes
            if (targetStartPosition <= 0 && data?.details?.fragments?.length > 0) {
              const firstFrag = data.details.fragments[0];
              if (firstFrag.start > 0.05 && firstFrag.start < 5) {
                const v = videoRef.current;
                if (v && v.currentTime < firstFrag.start) {
                  try { v.currentTime = firstFrag.start + 0.02; } catch (e) {}
                }
              }
            }

            if (data?.details?.fragments) {
              const parsedData = extractAllAdRangesFromFragments(data.details.fragments);
              if (parsedData?.commercialRanges?.length > 0) {
                adRangesRef.current = parsedData.commercialRanges;
                setAdRanges(parsedData.commercialRanges);
                if (videoRef.current && autoSkipAds) {
                  const current = videoRef.current.currentTime;
                  for (const range of parsedData.commercialRanges) {
                    if (current >= range.start - 0.35 && current < range.end - 0.1) {
                      videoRef.current.currentTime = range.end + 0.15;
                      break;
                    }
                  }
                }
              }
              if (parsedData?.bannerRanges?.length > 0) {
                bannerRangesRef.current = parsedData.bannerRanges;
              }
            }
          } catch (err) {
            console.warn("Non-fatal ad range parse error:", err);
          }
        });

        hls.on(HLS.Events.LEVEL_SWITCHED, (e, data) => {
          setCurrentLevelPlaying(data.level);
        });

        hls.on(HLS.Events.ERROR, (e, data) => {
          if (
            data.details === HLS.ErrorDetails.BUFFER_STALLED_ERROR ||
            data.details === HLS.ErrorDetails.BUFFER_NUDGE_ON_STALL ||
            data.details === HLS.ErrorDetails.BUFFER_SEEK_OVER_HOLE
          ) {
            setIsSlowNetwork(true);
            if (hlsRef.current) hlsRef.current.startLoad();
            const v = videoRef.current;
            if (v && !v.paused) {
              if (v.buffered.length > 0) {
                const cur = v.currentTime;
                const firstStart = v.buffered.start(0);
                if (cur < firstStart && firstStart < 5) {
                  v.currentTime = firstStart + 0.02;
                  return;
                }
                for (let i = 0; i < v.buffered.length; i++) {
                  const start = v.buffered.start(i);
                  if (start > cur && start - cur <= 8.5) {
                    v.currentTime = start + 0.02;
                    return;
                  }
                }
              }
              v.currentTime += 0.5;
            }
            return;
          }
          if (data.fatal) {
            switch (data.type) {
              case HLS.ErrorTypes.NETWORK_ERROR:
                if (retryCountRef.current < 3) {
                  retryCountRef.current += 1;
                  console.warn(`HLS Network error, retrying (${retryCountRef.current}/3)...`);
                  setIsSlowNetwork(true);
                  setTimeout(() => {
                    if (hlsRef.current) hlsRef.current.startLoad();
                  }, 600 * retryCountRef.current);
                } else {
                  setError("Máy chủ đang phản hồi chậm hoặc tạm thời bận. Vui lòng thử lại kết nối.");
                }
                break;
              case HLS.ErrorTypes.MEDIA_ERROR:
                console.warn("HLS Media error, recovering...");
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setError("Đã có sự cố kết nối tới máy chủ phát video. Vui lòng thử lại.");
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback Native HLS for Safari without MSE
        const handleReady = () => { 
          setIsLoading(false); 
        };

        const handleMetadata = () => {
          setIsLoading(false);
          if (targetStartPosition > 0 && Math.abs(video.currentTime - targetStartPosition) > 1) {
            try { video.currentTime = targetStartPosition; } catch (e) {}
          }
        };

        const handleNativeError = () => { 
          if (!video.src && !video.currentSrc) return;
          console.warn("Native HLS error on video element:", video.error);
          setIsLoading(false);
          setError("Không thể tải video từ máy chủ này. Vui lòng thử lại kết nối.");
        };

        video.addEventListener('loadedmetadata', handleMetadata);
        video.addEventListener('loadeddata', handleReady);
        video.addEventListener('canplay', handleReady);
        video.addEventListener('canplaythrough', handleReady);
        video.addEventListener('playing', handleReady);
        video.addEventListener('error', handleNativeError);

        video.preload = "auto";
        video.src = videoUrl;

        playWithAutoplayFallback();

        return () => {
          video.removeEventListener('loadedmetadata', handleMetadata);
          video.removeEventListener('loadeddata', handleReady);
          video.removeEventListener('canplay', handleReady);
          video.removeEventListener('canplaythrough', handleReady);
          video.removeEventListener('playing', handleReady);
          video.removeEventListener('error', handleNativeError);
        };
      }
    };

    const cleanupNative = initHls();
    return () => { 
      clearInitialWatchdogs();
      if (cleanupNative) cleanupNative();
    };
  }, [videoUrl]);

  // Full resource cleanup only when VideoPlayer unmounts from page
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      // 2. Dọn dẹp tài nguyên HLS và video
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        video.removeAttribute('src');
        video.load();
      }
    };
  }, []);

  // Event Listeners for State
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => {
      const cur = video.currentTime;
      currentTimeRef.current = cur;
      const now = performance.now();
      if (cur > 0.05) {
        if (!hasRenderedFirstFrame) {
          setHasRenderedFirstFrame(true);
        }
        clearInitialWatchdogs();
        if (!video.paused) {
          hideLoading();
        }
      }

      // Auto-Skip Video Ads: Tự động tua qua ngay lập tức, không chờ, không hiện nút, không hiện thông báo
      if (adRangesRef.current.length > 0 && !isSeekingRef.current) {
        for (const range of adRangesRef.current) {
          if (cur >= range.start - 0.35 && cur < range.end - 0.1) {
            video.currentTime = range.end + 0.15;
            return;
          }
        }
      }

      // Tự động kích hoạt khiên che quảng cáo thông minh:
      // 1. Phân đoạn banner từ playlist m3u8 (convertv8 / banner_ad)
      // 2. Đoạn intro sponsor cờ bạc đầu phim (0s - 480s / 8 phút) nơi video stream lồng dải quảng cáo bài bạc như 9922.com (cả chế độ thường & toàn màn hình web mobile)
      // 3. Quét hình ảnh thời gian thực (visual OCR / edge detector)
      // 4. KHI HẾT QUẢNG CÁO (cur > 480s hoặc ngoài dải banner), khiên che tự động tắt mượt mà, trả lại video nguyên bản cho người xem!
      if (adShieldMode === 'always') {
        setIsAdDetected(true);
      } else if (adShieldMode === 'auto') {
        let isAdNow = false;

        // Ưu tiên 1: Dải banner từ playlist m3u8 nếu segment chứa từ khóa banner
        if (bannerRangesRef.current.length > 0) {
          for (const range of bannerRangesRef.current) {
            if (cur >= range.start - 0.5 && cur <= range.end + 0.5) {
              isAdNow = true;
              break;
            }
          }
        }

        // Ưu tiên 2: Quét hình ảnh thời gian thực phát hiện text quảng cáo mép trên
        if (!isAdNow && isVisualAdDetectedRef.current) {
          isAdNow = true;
        }

        setIsAdDetected(isAdNow);
      } else {
        setIsAdDetected(false);
      }


      // Throttle UI currentTime state updates to ~250ms to save CPU & avoid frame drops on mobile
      if (!isSeekingRef.current && (now - lastTimeUpdateRef.current >= 250 || video.ended)) {
        lastTimeUpdateRef.current = now;
        setCurrentTime(cur);
      }
      if (video.buffered.length > 0) {
        const end = video.buffered.end(video.buffered.length - 1);
        if (Math.abs(end - lastBufferedRef.current) >= 1) {
          lastBufferedRef.current = end;
          setBuffered(end);
        }
      }
      const currentSecond = Math.floor(cur);
      if (currentSecond !== lastProgressSecondRef.current) { 
        lastProgressSecondRef.current = currentSecond; 
        onProgressRef.current?.(cur, video.duration || 0); 
      }
    };
    const onEndedEvent = () => {
      if (hasNextEpisode && onNextEpisodeRef.current) {
        setCountdown(5);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown(p => {
            if (p === null || p <= 1) { 
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current); 
              onNextEpisodeRef.current?.(); 
              return null; 
            }
            return p - 1;
          });
        }, 1000);
      } else {
        onEndedRef.current?.();
      }
    };
    const hideLoading = () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      if (slowNetworkTimerRef.current) {
        clearTimeout(slowNetworkTimerRef.current);
        slowNetworkTimerRef.current = null;
      }
      clearInitialWatchdogs();
      setIsLoading(false);
    };

    const onWaiting = () => {
      // If paused or ended, NEVER show waiting/loading spinner!
      if (video.paused || video.ended) return;

      // Smart buffer check: auto-jump start gap and discontinuity gaps
      if (video.buffered.length > 0) {
        const cur = video.currentTime;
        const firstStart = video.buffered.start(0);
        // If playhead is behind the first available media frame (e.g. 1.48s start offset from VTV capture)
        if (cur < firstStart && firstStart < 5) {
          video.currentTime = firstStart + 0.02;
          return;
        }

        for (let i = 0; i < video.buffered.length; i++) {
          const start = video.buffered.start(i);
          const end = video.buffered.end(i);
          // If current playhead is comfortably buffered >= 0.4s ahead, ignore spurious waiting event
          if (cur >= start - 0.1 && end - cur >= 0.4) {
            return;
          }
          // Smart micro-gap auto-skip: If playback hits a timestamp gap across splice/discontinuity up to 8.5s, jump it immediately!
          if (start > cur && start - cur <= 8.5) {
            video.currentTime = start + 0.02;
            return;
          }
        }
      }

      if (waitingTimerRef.current) clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = setTimeout(() => {
        // Only trigger loading if the video is genuinely stuck and not playing frames
        if (!video.paused && !video.ended && video.readyState < 3) {
          setIsLoading(true);
        }
      }, 600);

      if (slowNetworkTimerRef.current) clearTimeout(slowNetworkTimerRef.current);
      slowNetworkTimerRef.current = setTimeout(() => {
        if (!video.paused && !video.ended && video.readyState < 3) {
          setIsSlowNetwork(true);
        }
      }, 4000);

      // Safe recovery: if stalled for 2.0s, trigger HLS load or nudge playhead past hole
      const stallTimeout = setTimeout(() => {
        if (video.paused || isUserPausedRef.current) return;
        if (hlsRef.current) {
          hlsRef.current.startLoad();
          if (video.buffered.length > 0) {
            const firstStart = video.buffered.start(0);
            if (video.currentTime < firstStart && firstStart < 5) {
              video.currentTime = firstStart + 0.02;
              return;
            }
          }
          video.currentTime += 0.5;
        } else {
          try {
            if (video.buffered.length > 0 && video.currentTime < video.buffered.start(0)) {
              video.currentTime = video.buffered.start(0) + 0.02;
            } else if (video.readyState >= 2) {
              video.play().catch(() => {});
            }
          } catch (e) {
            console.warn("Native recovery play failed:", e);
          }
        }
      }, 2500);

      // Smart Auto-Failover: If stalled for > 6.5s continuously
      if (failoverTimeoutRef.current) clearTimeout(failoverTimeoutRef.current);
      failoverTimeoutRef.current = setTimeout(() => {
        if (video.paused) return;
        stallCountRef.current += 1;
        if (hlsRef.current) {
          try {
            hlsRef.current.recoverMediaError();
          } catch {}
        }
        if (stallCountRef.current >= 2) {
          setIsSlowNetwork(true);
        }
      }, 6500);

      const clearWaiting = () => {
        clearTimeout(stallTimeout);
        if (failoverTimeoutRef.current) {
          clearTimeout(failoverTimeoutRef.current);
          failoverTimeoutRef.current = null;
        }
        stallCountRef.current = 0;
        if (slowNetworkTimerRef.current) {
          clearTimeout(slowNetworkTimerRef.current);
          slowNetworkTimerRef.current = null;
        }
        hideLoading();
      };

      video.addEventListener('playing', clearWaiting, { once: true });
      video.addEventListener('canplay', clearWaiting, { once: true });
      video.addEventListener('canplaythrough', clearWaiting, { once: true });
      video.addEventListener('pause', clearWaiting, { once: true });
    };

    const onErrorEvent = () => {
      if (!video.currentSrc && !video.src) return;
      const err = video.error;
      if (!err) return;
      console.error("Native video error:", err);
      if (err.code === 4) {
        setError("Tập phim tạm thời chưa thể phát hoặc máy chủ đang gián đoạn.");
      } else {
        setError("Đã có sự cố kết nối tới máy chủ phát video.");
      }
      onErrorRef.current?.(err);
    };

    const checkAndSkipIfInAdRange = () => {
      if (adRangesRef.current.length > 0 && video) {
        const cur = video.currentTime;
        for (const range of adRangesRef.current) {
          if (cur >= range.start - 0.35 && cur < range.end - 0.1) {
            video.currentTime = range.end + 0.15;
            break;
          }
        }
      }
    };

    const onPlayEvent = () => {
      isPlayingRef.current = true;
      setIsPlaying(true);
      isUserPausedRef.current = false;
      setHasRenderedFirstFrame(true);
      clearInitialWatchdogs();
      setIsSlowNetwork(false);
      hideLoading();
      checkAndSkipIfInAdRange();

      // Always ensure audio is ON and ready unless user explicitly muted
      if (!userExplicitlyMutedRef.current) {
        if (video.muted) video.muted = false;
        if (video.volume === 0) video.volume = 1;
        setIsMuted(false);
        setVolume(video.volume > 0 ? video.volume : 1);
      }

      // Cập nhật MediaSession state và đảm bảo không tự ý bật PiP mà không có tương tác người dùng
      try {
        video.removeAttribute('autopictureinpicture');
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      } catch {}
    };
    const onPauseEvent = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      autoplayRef.current = false;
      isUserPausedRef.current = true;
      hideLoading();
      try {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      } catch {}
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      if (slowNetworkTimerRef.current) {
        clearTimeout(slowNetworkTimerRef.current);
        slowNetworkTimerRef.current = null;
      }
    };

    const onSeekingEvent = () => {
      if (adShieldMode !== 'always') {
        isVisualAdDetectedRef.current = false;
        setIsAdDetected(false);
        consecutiveDetectionsRef.current = 0;
        consecutiveMissesRef.current = 0;
        prevFrameLuminanceRef.current = null;
      }

      let isBuffered = false;
      if (video.buffered.length > 0) {
        const cur = video.currentTime;
        for (let i = 0; i < video.buffered.length; i++) {
          if (cur >= video.buffered.start(i) && cur <= video.buffered.end(i) - 0.3) {
            isBuffered = true;
            break;
          }
        }
      }
      if (!isBuffered) {
        setIsLoading(true);
      }
      if (hlsRef.current) {
        hlsRef.current.startLoad(video.currentTime);
      }
    };

    const onSeekedEvent = () => {
      checkAndSkipIfInAdRange();
      hideLoading();
    };

    const onProgressBufferCheck = () => {
      if (video.buffered.length > 0 && !video.paused) {
        const cur = video.currentTime;
        for (let i = 0; i < video.buffered.length; i++) {
          if (cur >= video.buffered.start(i) && cur <= video.buffered.end(i) - 0.5) {
            hideLoading();
            break;
          }
        }
      }
    };

    const onVolumeChangeEvent = () => {
      if (!video) return;
      // If browser/system tried to mute without user explicitly pressing mute, automatically restore sound
      if ((video.muted || video.volume === 0) && !userExplicitlyMutedRef.current) {
        try {
          video.muted = false;
          video.volume = 1;
        } catch {}
        setIsMuted(false);
        setVolume(1);
        return;
      }
      setIsMuted(video.muted || video.volume === 0);
      setVolume(video.volume);
    };

    const onWebkitBeginFs = () => setIsFullscreen(true);
    const onWebkitEndFs = () => setIsFullscreen(false);
    const onWebkitPresMode = () => {
      if ((video as any).webkitPresentationMode) {
        setIsFullscreen((video as any).webkitPresentationMode === 'fullscreen');
        setIsPiPActive((video as any).webkitPresentationMode === 'picture-in-picture');
      }
    };
    const onEnterPiP = () => setIsPiPActive(true);
    const onLeavePiP = () => setIsPiPActive(false);

    video.addEventListener('canplay', hideLoading);
    video.addEventListener('canplaythrough', hideLoading);
    video.addEventListener('loadeddata', hideLoading);
    video.addEventListener('playing', hideLoading);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('progress', onProgressBufferCheck);
    video.addEventListener('seeking', onSeekingEvent);
    video.addEventListener('seeked', onSeekedEvent);
    video.addEventListener('ended', onEndedEvent);
    video.addEventListener('play', onPlayEvent);
    video.addEventListener('pause', onPauseEvent);
    video.addEventListener('durationchange', () => setDuration(video.duration));
    video.addEventListener('volumechange', onVolumeChangeEvent);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onErrorEvent);
    video.addEventListener('webkitbeginfullscreen', onWebkitBeginFs);
    video.addEventListener('webkitendfullscreen', onWebkitEndFs);
    video.addEventListener('webkitpresentationmodechanged', onWebkitPresMode);
    video.addEventListener('enterpictureinpicture', onEnterPiP);
    video.addEventListener('leavepictureinpicture', onLeavePiP);
    
    return () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      video.removeEventListener('play', onPlayEvent);
      video.removeEventListener('pause', onPauseEvent);
      video.removeEventListener('seeking', onSeekingEvent);
      video.removeEventListener('seeked', onSeekedEvent);
      video.removeEventListener('canplay', hideLoading);
      video.removeEventListener('canplaythrough', hideLoading);
      video.removeEventListener('loadeddata', hideLoading);
      video.removeEventListener('playing', hideLoading);
      video.removeEventListener('timeupdate', onTimeUpdate); 
      video.removeEventListener('progress', onProgressBufferCheck);
      video.removeEventListener('ended', onEndedEvent);
      video.removeEventListener('volumechange', onVolumeChangeEvent);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onErrorEvent);
      video.removeEventListener('webkitbeginfullscreen', onWebkitBeginFs);
      video.removeEventListener('webkitendfullscreen', onWebkitEndFs);
      video.removeEventListener('webkitpresentationmodechanged', onWebkitPresMode);
      video.removeEventListener('enterpictureinpicture', onEnterPiP);
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [hasNextEpisode]);

  // Initial Seek Fail-safe (Hls.js config handles startPosition natively, this is a fallback for non-HLS or edge cases)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || initialTime <= 0 || didSeekInitialTimeRef.current || hlsRef.current) return;
    const seek = () => {
      if (didSeekInitialTimeRef.current || !video.duration) return;
      if (Math.abs(video.currentTime - initialTime) > 2) {
        try { video.currentTime = Math.min(initialTime, video.duration - 1); } catch (e) {}
      }
      didSeekInitialTimeRef.current = true;
    };
    if (video.readyState >= 1) {
      seek();
    } else {
      video.addEventListener('loadedmetadata', seek, { once: true });
    }
    return () => video.removeEventListener('loadedmetadata', seek);
  }, [initialTime]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Intelligent Real-Time Ad Banner Detector Loop (Tự động nhận diện banner cờ bạc mép trên - chỉ che khi có quảng cáo)
  useEffect(() => {
    if (adShieldMode === 'off') {
      setIsAdDetected(false);
      isVisualAdDetectedRef.current = false;
      consecutiveDetectionsRef.current = 0;
      consecutiveMissesRef.current = 0;
      prevFrameLuminanceRef.current = null;
      return;
    }
    if (adShieldMode === 'always') {
      setIsAdDetected(true);
      return;
    }

    // Chế độ 'auto': bắt đầu ở trạng thái không che, tuyệt đối chỉ che khi thực tế quét thấy banner
    setIsAdDetected(false);
    isVisualAdDetectedRef.current = false;
    consecutiveDetectionsRef.current = 0;
    consecutiveMissesRef.current = 0;
    prevFrameLuminanceRef.current = null;

    const checkInterval = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended || video.readyState < 2) return;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      let detected = false;
      try {
        const CW = 320;
        const CH = 48;
        let canvas = detectorCanvasRef.current;
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.width = CW;
          canvas.height = CH;
          detectorCanvasRef.current = canvas;
        } else if (canvas.width !== CW || canvas.height !== CH) {
          canvas.width = CW;
          canvas.height = CH;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          // Lấy dải mép trên 16% nơi in đóng dấu watermark quảng cáo cờ bạc
          const sampleHeight = Math.max(Math.round(vh * 0.16), 36);
          ctx.drawImage(video, 0, 0, vw, sampleHeight, 0, 0, CW, CH);

          const imgData = ctx.getImageData(0, 0, CW, CH);
          const data = imgData.data;

          const currentLum = new Uint8Array(CW * CH);
          let centerEdgeTransitions = 0;
          let activeTextRows = 0;
          let yellowGoldPixels = 0;
          let textContrastPixels = 0;

          // Quét ma trận hàng ngang ở vùng giữa khung hình (x từ ~12% đến 88% width = 38 -> 282)
          for (let y = 4; y < CH - 4; y++) {
            let prevLum = -1;
            let rowTransitions = 0;
            let rowTextPixels = 0;

            for (let x = 38; x < 282; x++) {
              const idx = (y * CW + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
              currentLum[y * CW + x] = lum;

              // Nhận diện pixel màu vàng kim đặc trưng cờ bạc (9922.com, OKVIP, v.v.)
              const isYellowGold = r > 165 && g > 125 && b < 110 && (r - b) > 40;
              // Nhận diện pixel chữ trắng gắt hoặc nền đen viền nét
              const isBrightWhite = lum > 195 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25;
              const isDarkStroke = lum < 40;

              if (isYellowGold) {
                yellowGoldPixels++;
                rowTextPixels++;
              }
              if (isBrightWhite || isDarkStroke) {
                textContrastPixels++;
                rowTextPixels++;
              }

              // Đếm chuyển tiếp nét chữ có độ tương phản cao
              if (prevLum >= 0 && Math.abs(lum - prevLum) > 28) {
                rowTransitions++;
                centerEdgeTransitions++;
              }
              prevLum = lum;
            }

            // Hàng chữ quảng cáo sẽ có nhiều lần dao động nét viền-thân chữ
            if (rowTransitions >= 14 && rowTextPixels >= 10) {
              activeTextRows++;
            }
          }

          // Kiểm tra tính tĩnh theo thời gian (Temporal Invariance):
          // Watermark cờ bạc in cố định tọa độ trên video, sai số pixel giữa các frame rất nhỏ.
          // Cảnh phim tự nhiên (người chuyển động, góc máy lia, phong cảnh) pixel thay đổi liên tục.
          let isTemporallyStatic = false;
          const prevLum = prevFrameLuminanceRef.current;
          if (prevLum && prevLum.length === currentLum.length) {
            let diffSum = 0;
            let comparedCount = 0;
            for (let i = 0; i < currentLum.length; i += 4) {
              if (currentLum[i] > 160 || currentLum[i] < 45) {
                diffSum += Math.abs(currentLum[i] - prevLum[i]);
                comparedCount++;
              }
            }
            if (comparedCount > 50) {
              const avgDiff = diffSum / comparedCount;
              // Ngưỡng 18 cho phép dung sai do nén video H264 hoặc hiệu ứng lấp lánh nhẹ
              if (avgDiff < 18) {
                isTemporallyStatic = true;
              }
            }
          }
          prevFrameLuminanceRef.current = currentLum;

          // Tiêu chí nhận diện thông minh, chặt chẽ:
          // Trường hợp 1: Chữ vàng cờ bạc đặc trưng rõ nét với cấu trúc chữ theo hàng
          const hasYellowAdSignature = yellowGoldPixels >= 35 && activeTextRows >= 1 && centerEdgeTransitions >= 80;
          // Trường hợp 2: Chữ watermark tương phản cao tĩnh bất động qua thời gian
          const hasStaticWatermark = isTemporallyStatic && activeTextRows >= 1 && centerEdgeTransitions >= 90 && (textContrastPixels >= 100 || yellowGoldPixels >= 20);
          // Trường hợp 3: Banner 2 hàng chữ dày đặc
          const hasDenseMultiLineAd = activeTextRows >= 2 && centerEdgeTransitions >= 140 && (textContrastPixels >= 140 || yellowGoldPixels >= 20);

          if (hasYellowAdSignature || hasStaticWatermark || hasDenseMultiLineAd) {
            detected = true;
          }
        }
      } catch {
        detected = false;
      }

      // Check thêm phân đoạn banner đã xác định từ m3u8 playlist (nếu có segment banner)
      if (!detected && bannerRangesRef.current.length > 0) {
        const cur = video.currentTime;
        for (const range of bannerRangesRef.current) {
          if (cur >= range.start - 0.5 && cur <= range.end + 0.5) {
            detected = true;
            break;
          }
        }
      }

      if (detected) {
        consecutiveDetectionsRef.current++;
        consecutiveMissesRef.current = 0;
        // Xác nhận 2 lần quét liên tiếp (~1.2s) mới kích hoạt khiên che
        if (consecutiveDetectionsRef.current >= 2) {
          isVisualAdDetectedRef.current = true;
          setIsAdDetected(true);
        }
      } else {
        consecutiveMissesRef.current++;
        consecutiveDetectionsRef.current = 0;
        // Tắt che nhanh chóng khi hết quảng cáo (2 lần quét không thấy ~1.2s)
        if (consecutiveMissesRef.current >= 2) {
          isVisualAdDetectedRef.current = false;
          setIsAdDetected(false);
          prevFrameLuminanceRef.current = null;
        }
      }
    }, 600);

    return () => {
      clearInterval(checkInterval);
    };
  }, [adShieldMode, videoUrl]);

  // Đảm bảo không tự bật PiP khi đổi tab
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      try {
        video.removeAttribute("autopictureinpicture");
      } catch {}
    }
  }, []);

  // Subtitle Upload Handler (.SRT / .VTT)
  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const cues = parseSubtitles(text);
      if (cues.length === 0) {
        toast.error("Không tìm thấy dòng phụ đề hợp lệ (.srt hoặc .vtt).");
        return;
      }
      setCustomCues(cues);
      setSubtitleEnabled(true);
      toast.success(`Đã tải thành công ${cues.length} câu phụ đề (${file.name})!`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Mobile Touch Gestures (Brightness left edge, Volume right edge, Horizontal Scrub Seek)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    attemptUnmute();
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relX = (touch.clientX - rect.left) / rect.width;
    const zone: 'left' | 'center' | 'right' = relX < 0.35 ? 'left' : relX > 0.65 ? 'right' : 'center';

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      zone,
      startBrightness: brightness,
      startVolume: videoRef.current ? videoRef.current.volume : volume,
      startTime: videoRef.current ? videoRef.current.currentTime : 0,
      lockedGesture: null,
    };
    targetSeekRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touchStartRef.current.y - touch.clientY; // positive = dragging UP

    // Gesture detection threshold
    if (!touchStartRef.current.lockedGesture) {
      if (Math.abs(deltaY) > 12 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (touchStartRef.current.zone === 'left') {
          touchStartRef.current.lockedGesture = 'brightness';
        } else if (touchStartRef.current.zone === 'right') {
          touchStartRef.current.lockedGesture = 'volume';
        }
      } else if (Math.abs(deltaX) > 18 && Math.abs(deltaX) > Math.abs(deltaY)) {
        touchStartRef.current.lockedGesture = 'seek';
      }
    }

    if (!touchStartRef.current.lockedGesture) return;

    if (gestureHUDTimerRef.current) clearTimeout(gestureHUDTimerRef.current);

    if (touchStartRef.current.lockedGesture === 'brightness') {
      const step = (deltaY / (rect.height * 0.7)) * 100;
      const nextBrightness = Math.round(Math.min(150, Math.max(30, touchStartRef.current.startBrightness + step)));
      setBrightness(nextBrightness);
      setGestureHUD({ type: 'brightness', value: nextBrightness });
    } else if (touchStartRef.current.lockedGesture === 'volume') {
      const step = deltaY / (rect.height * 0.7);
      const nextVol = Math.min(1, Math.max(0, touchStartRef.current.startVolume + step));
      setVolume(nextVol);
      if (videoRef.current) videoRef.current.volume = nextVol;
      if (nextVol > 0 && isMuted) setIsMuted(false);
      setGestureHUD({ type: 'volume', value: Math.round(nextVol * 100) });
    } else if (touchStartRef.current.lockedGesture === 'seek') {
      const seekSec = Math.round((deltaX / rect.width) * 90);
      const targetTime = Math.min(duration, Math.max(0, touchStartRef.current.startTime + seekSec));
      targetSeekRef.current = targetTime;
      setGestureHUD({ type: 'seek', value: targetTime, delta: seekSec });
    }
  };

  const handleTouchEnd = () => {
    if (touchStartRef.current?.lockedGesture === 'seek' && targetSeekRef.current !== null) {
      handleSeekCommit([targetSeekRef.current]);
    }
    touchStartRef.current = null;
    targetSeekRef.current = null;

    if (gestureHUDTimerRef.current) clearTimeout(gestureHUDTimerRef.current);
    gestureHUDTimerRef.current = setTimeout(() => {
      setGestureHUD(null);
    }, 700);
  };

  // Smart Click / Touch
  const handleSmartClick = (e: React.MouseEvent<HTMLDivElement>, side: 'left' | 'right' | 'center') => {
    e.stopPropagation();
    attemptUnmute();
    if (gestureHUD) return;

    const isMobileDevice = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // When paused: clicking anywhere on the video resumes playback IMMEDIATELY on first click (no double-click needed!)
    if (videoRef.current?.paused) {
      lastTapRef.current = { time: 0, side };
      showControlsHandler();
      togglePlay();
      return;
    }

    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current.time < 320 && lastTapRef.current.side === side;
    lastTapRef.current = { time: now, side };

    if (isDoubleTap) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (side === 'left') {
        skip(-10);
        setSkipAnimation({ side: 'left', id: Date.now() });
      } else if (side === 'right') {
        skip(10);
        setSkipAnimation({ side: 'right', id: Date.now() });
      } else {
        toggleFullscreen();
      }
      return;
    }

    // On Desktop: Clicking the video toggles play/pause IMMEDIATELY with 0ms latency (Standard YouTube / Netflix behavior)
    if (!isMobileDevice) {
      showControlsHandler();
      togglePlay();
      return;
    }

    // On Mobile: Single tap when playing toggles controls overlay
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      if (!showControls) {
        showControlsHandler();
      } else {
        setShowControls(false);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      }
    }, 220);
  };

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative bg-black group overflow-hidden select-none w-full touch-manipulation", 
        isFullscreen 
          ? "fixed inset-0 z-[99999] w-screen h-[100dvh] rounded-none aspect-auto bg-black" 
          : "aspect-video rounded-xl lg:rounded-2xl"
      )} 
      style={{ transform: "translateZ(0)" }}
      onMouseMove={showControlsHandler} 
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragStart={(e) => e.preventDefault()}
    >
      <video 
        ref={(el) => {
          (videoRef as any).current = el;
          if (el) {
            try {
              el.disablePictureInPicture = false;
            } catch {}
          }
        }} 
        crossOrigin="anonymous"
        controls={false}
        controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
        disableRemotePlayback
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
        className="w-full h-full pointer-events-none select-none"
          style={{
            ...getVideoTransformStyle(),
            backfaceVisibility: "hidden",
            filter: (() => {
              const base = visualFilter === 'oled' 
                ? 'contrast(1.20) saturate(1.24) brightness(0.96)' 
                : visualFilter === 'vivid' 
                ? 'contrast(1.10) saturate(1.42) brightness(1.02)' 
                : visualFilter === 'bright'
                ? 'contrast(1.08) saturate(1.12) brightness(1.15)'
                : '';
              if (brightness !== 100) {
                return (base ? `${base} ` : '') + `brightness(${brightness / 100})`;
              }
              return base || 'none';
            })(),
            transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), filter 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform, filter",
          }}
          poster={poster} 
          playsInline 
          preload="auto" 
        />

      {/* Poster Backdrop while video hasn't rendered first frame */}
      {!hasRenderedFirstFrame && poster && (
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden transition-opacity duration-700">
          <img
            src={poster}
            alt={movieName || "Movie Poster"}
            className="w-full h-full object-cover filter blur-md scale-105 opacity-30 pointer-events-none"
          />
          <img
            src={poster}
            alt={movieName || "Movie Poster"}
            className="w-full h-full object-contain absolute inset-0 z-10 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 z-20 pointer-events-none" />
        </div>
      )}

      {/* Intelligent Anti-Ad Banner Shield (Che sạch hoàn toàn dải watermark quảng cáo cờ bạc mép trên) */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 z-[28] transition-all duration-300 overflow-hidden pointer-events-none select-none",
          isAdDetected
            ? "opacity-100 h-[17.5%] sm:h-[16.5%]" 
            : "opacity-0 h-0 pointer-events-none"
        )}
      >
        {/* Cinematic gradient mask with frosted blur to obliterate gambling text */}
        <div className="w-full h-full bg-gradient-to-b from-black via-black/95 via-55% to-transparent backdrop-blur-[6px]" />
      </div>


      <div 
        className="absolute inset-0 flex z-10 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="w-[35%] h-full z-20 cursor-pointer" 
          onClick={(e) => handleSmartClick(e, 'left')} 
        />
        <div 
          className="w-[30%] h-full z-20 cursor-pointer" 
          onClick={(e) => handleSmartClick(e, 'center')} 
        />
        <div 
          className="w-[35%] h-full z-20 cursor-pointer" 
          onClick={(e) => handleSmartClick(e, 'right')} 
        />
      </div>


      {skipAnimation && (
        <div key={skipAnimation.id} className={cn("absolute top-0 bottom-0 flex items-center justify-center w-[30%] z-30 bg-white/5 pointer-events-none animate-in fade-in zoom-in duration-300", skipAnimation.side === 'left' ? "left-0 rounded-r-full" : "right-0 rounded-l-full")} onAnimationEnd={() => setSkipAnimation(null)}>
          <div className="flex flex-col items-center text-white">
            {skipAnimation.side === 'left' ? <><ChevronsLeft className="w-12 h-12" /><span>-10s</span></> : <><ChevronsRight className="w-12 h-12" /><span>+10s</span></>}
          </div>
        </div>
      )}

      {/* Mobile Touch Gesture HUD Overlay */}
      {gestureHUD && (
        <div className="absolute inset-0 flex items-center justify-center z-[58] pointer-events-none select-none">
          <div className="flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/20 shadow-2xl min-w-[130px] animate-in fade-in zoom-in-95 duration-150">
            {gestureHUD.type === 'brightness' && (
              <>
                <Sun className="w-8 h-8 text-amber-400" />
                <span className="text-xs font-bold text-white/85 uppercase tracking-wider">Độ sáng</span>
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-75" 
                    style={{ width: `${Math.min(100, Math.max(0, ((gestureHUD.value - 30) / 120) * 100))}%` }}
                  />
                </div>
                <span className="text-xs font-black text-white font-mono">{gestureHUD.value}%</span>
              </>
            )}

            {gestureHUD.type === 'volume' && (
              <>
                {gestureHUD.value === 0 ? (
                  <VolumeX className="w-8 h-8 text-red-400" />
                ) : (
                  <Volume2 className="w-8 h-8 text-brand-green" />
                )}
                <span className="text-xs font-bold text-white/85 uppercase tracking-wider">Âm lượng</span>
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-brand-green rounded-full transition-all duration-75" 
                    style={{ width: `${gestureHUD.value}%` }}
                  />
                </div>
                <span className="text-xs font-black text-white font-mono">{gestureHUD.value}%</span>
              </>
            )}

            {gestureHUD.type === 'seek' && (
              <>
                {gestureHUD.delta !== undefined && gestureHUD.delta >= 0 ? (
                  <FastForward className="w-8 h-8 text-brand-green" />
                ) : (
                  <SkipBack className="w-8 h-8 text-amber-400" />
                )}
                <span className="text-base font-black text-white font-mono">
                  {gestureHUD.delta !== undefined && gestureHUD.delta >= 0 ? `+${gestureHUD.delta}s` : `${gestureHUD.delta}s`}
                </span>
                <span className="text-xs text-white/70 font-mono">
                  {formatTime(gestureHUD.value)} / {formatTime(duration)}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* External Subtitle Display Overlay */}
      {subtitleEnabled && customCues.length > 0 && (() => {
        const active = customCues.find(c => currentTime >= c.start && currentTime <= c.end);
        if (!active) return null;
        return (
          <div className="absolute bottom-16 sm:bottom-20 inset-x-0 flex justify-center items-center pointer-events-none z-30 px-4 text-center">
            <span
              className={cn(
                "inline-block font-semibold text-white leading-snug rounded-lg px-3 py-1.5 shadow-md transition-all whitespace-pre-line select-none",
                subtitleSize === 'sm' && "text-xs sm:text-sm",
                subtitleSize === 'md' && "text-sm sm:text-base md:text-lg",
                subtitleSize === 'lg' && "text-base sm:text-lg md:text-xl font-bold",
                subtitleBg === 'transparent' && "bg-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]",
                subtitleBg === 'dim' && "bg-black/75 backdrop-blur-xs",
                subtitleBg === 'black' && "bg-black/95 border border-white/20"
              )}
            >
              {active.text}
            </span>
          </div>
        );
      })()}

      {shortcutFeedback && (
        <div key={shortcutFeedback.id} className="absolute inset-0 flex items-center justify-center z-[55] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300 fill-mode-forwards">
            <div className="p-4 bg-white/10 rounded-full">
              {shortcutFeedback.icon === 'play' && <Play className="w-8 h-8 text-white fill-white" />}
              {shortcutFeedback.icon === 'pause' && <Pause className="w-8 h-8 text-white fill-white" />}
              {shortcutFeedback.icon === 'volume' && <Volume2 className="w-8 h-8 text-white" />}
              {shortcutFeedback.icon === 'mute' && <VolumeX className="w-8 h-8 text-red-500" />}
              {shortcutFeedback.icon === 'seek' && <ChevronsRight className="w-8 h-8 text-white" />}
            </div>
            {shortcutFeedback.text && <span className="text-xl font-bold text-white tracking-widest">{shortcutFeedback.text}</span>}
          </div>
        </div>
      )}

      {/* Top Header Bar inside Video: Brand watermark (tên phim đã bỏ theo yêu cầu) */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-40 flex items-center justify-end px-3.5 sm:px-5 pt-3 sm:pt-4 pb-8 bg-gradient-to-b from-black/60 via-transparent to-transparent transition-opacity duration-300 pointer-events-none select-none",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="text-[11px] sm:text-xs font-black tracking-widest text-white/50 uppercase font-mono">
          HIPHIM<span className="text-brand-green">.</span>
        </div>
      </div>

      {/* Big Center Play/Pause Button for Mobile & Desktop */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center z-40 pointer-events-none transition-opacity duration-300",
          showControls && countdown === null && !error && !isLoading ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className={cn(
            "w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl active:scale-90 transition-all cursor-pointer",
            showControls && countdown === null && !error && !isLoading ? "pointer-events-auto" : "pointer-events-none"
          )}
          aria-label={isPlaying ? "Tạm dừng" : "Phát"}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white" />
          ) : (
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-0.5" />
          )}
        </button>
      </div>

      {isLoading && (!hasRenderedFirstFrame || !isPlaying) && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center z-30 cursor-pointer pointer-events-auto transition-opacity duration-300",
            hasRenderedFirstFrame ? "bg-black/35 backdrop-blur-[2px]" : "bg-black/60 backdrop-blur-xs"
          )}
        >
          <Loader2 className="w-11 h-11 sm:w-12 sm:h-12 text-brand-green animate-spin mb-3" />
          <p className="text-white/90 text-sm font-bold tracking-wide">
            {isSlowNetwork ? "Đang tăng tốc bộ đệm giờ cao điểm..." : "Đang tải video..."}
          </p>
        </div>
      )}

      {countdown !== null && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md px-4 text-center animate-in fade-in duration-200 select-none"
        >
          {/* Cinema Hub */}
          <div className="relative flex flex-col items-center max-w-sm w-full p-6 sm:p-8 rounded-3xl bg-[#0c130e]/95 border border-brand-green/30">
            {/* SVG Progress Ring */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#20d66b"
                  strokeWidth="6"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * (countdown / 5))}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter">
                  {countdown}
                </span>
                <span className="text-[10px] text-brand-green uppercase tracking-widest font-bold">giây</span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 line-clamp-1">
              Tự động chuyển tập tiếp theo
            </h3>
            <p className="text-xs text-white/60 mb-6 line-clamp-1">
              {movieName ? `Phim: ${movieName}` : "Tập tiếp theo sẽ tự động phát sau ít giây..."}
            </p>

            <div className="flex items-center gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelCountdown}
                className="flex-1 py-2.5 h-auto text-xs sm:text-sm font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10 transition-all cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handlePlayNextImmediately}
                className="flex-1 py-2.5 h-auto text-xs sm:text-sm font-bold rounded-xl bg-brand-green hover:bg-brand-green/90 text-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FastForward className="w-3.5 h-3.5 fill-black" />
                <span>Phát ngay</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[65] flex flex-col items-center justify-center bg-[#070908]/95 px-6 text-center backdrop-blur-md animate-in fade-in select-none">
          <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-sm sm:text-base mb-1.5">
            Không thể phát video
          </h3>
          <p className="text-white/70 text-xs sm:text-sm mb-5 max-w-sm leading-relaxed">
            {error}
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                if (hlsRef.current) {
                  hlsRef.current.loadSource(videoUrl);
                  hlsRef.current.startLoad();
                } else if (videoRef.current) {
                  videoRef.current.src = videoUrl;
                  videoRef.current.load();
                }
              }}
              variant="outline"
              size="sm"
              className="text-white border-white/20 bg-white/5 hover:bg-white/10 font-bold rounded-xl h-9 px-4 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Thử lại kết nối
            </Button>

            {onReportError && (
              <Button
                onClick={onReportError}
                size="sm"
                variant="ghost"
                className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 font-bold rounded-xl cursor-pointer h-9 px-3 border border-amber-400/20"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                Báo lỗi
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bottom controls bar */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute bottom-0 left-0 right-0 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-50 pointer-events-none select-none",
          showControls && countdown === null && !error ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Row 1: Timeline Slider & Timestamps */}
        <div className="px-3.5 sm:px-5 pb-1 flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
          {/* Current Time */}
          <span className="text-[11px] sm:text-xs font-mono font-medium text-white/90 tabular-nums shrink-0 select-none">
            {formatTime(seekTime !== null ? seekTime : currentTime, duration >= 3600)}
          </span>

          {/* Timeline Slider Track */}
          <div className="flex-1 relative flex items-center">
            {/* Ad range markers on timeline */}
            {duration > 0 && adRanges.length > 0 && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 pointer-events-none overflow-hidden z-0 rounded-full">
                {adRanges.map((range, idx) => {
                  const leftPercent = Math.max(0, Math.min(100, (range.start / duration) * 100));
                  const widthPercent = Math.max(0.5, Math.min(100 - leftPercent, (range.duration / duration) * 100));
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 bg-amber-400/70 rounded-full"
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      title={`Video quảng cáo (${Math.round(range.duration)}s)`}
                    />
                  );
                })}
              </div>
            )}
            <Slider 
              value={[seekTime !== null ? seekTime : currentTime]} 
              min={0} 
              max={duration > 0 ? duration : 100} 
              step={1}
              onValueChange={handleSeekChange} 
              onValueCommit={handleSeekCommit} 
              className="py-2.5 cursor-pointer relative z-10 [&>span:first-child]:h-1 hover:[&>span:first-child]:h-1.5 [&>span:first-child]:transition-all [&>span:last-child]:h-3 sm:[&>span:last-child]:h-3.5 [&>span:last-child]:w-3 sm:[&>span:last-child]:w-3.5 [&>span:last-child]:rounded-full [&>span:last-child]:bg-white [&>span:last-child]:border-0 [&>span:last-child]:shadow-md hover:[&>span:last-child]:scale-125" 
            />
          </div>

          {/* Total Duration */}
          <span className="text-[11px] sm:text-xs font-mono font-medium text-white/90 tabular-nums shrink-0 select-none">
            {formatTime(duration, duration >= 3600)}
          </span>
        </div>

        {/* Row 2: Player Action Buttons */}
        <div className="px-2.5 sm:px-5 pb-3 sm:pb-4 flex items-center justify-between gap-2 sm:gap-3 pointer-events-auto">
          {/* Left Cluster: Play/Pause, Rewind 10s, Forward 10s, Volume */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play / Pause Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label={isPlaying ? "Tạm dừng" : "Phát"}
              className="text-white hover:text-brand-green hover:bg-white/10 active:scale-90 transition-all cursor-pointer p-2 sm:p-2.5 rounded-full flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              )}
            </button>

            {/* Rewind 10s Button (RotateCcw with 10 inside) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                skip(-10);
                setSkipAnimation({ side: 'left', id: Date.now() });
                showControlsHandler();
              }}
              title="Lùi 10 giây"
              aria-label="Lùi video 10 giây"
              className="relative text-white hover:text-brand-green hover:bg-white/10 active:scale-90 transition-all cursor-pointer p-2 sm:p-2.5 rounded-full flex items-center justify-center select-none"
            >
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black pointer-events-none pt-0.5">
                10
              </span>
            </button>

            {/* Fast-forward 10s Button (RotateCw with 10 inside) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                skip(10);
                setSkipAnimation({ side: 'right', id: Date.now() });
                showControlsHandler();
              }}
              title="Tua 10 giây"
              aria-label="Tua video 10 giây"
              className="relative text-white hover:text-brand-green hover:bg-white/10 active:scale-90 transition-all cursor-pointer p-2 sm:p-2.5 rounded-full flex items-center justify-center select-none"
            >
              <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black pointer-events-none pt-0.5">
                10
              </span>
            </button>

            {/* Volume Control (Button always visible on mobile & desktop) */}
            <div className="flex items-center gap-1 group/volume ml-0.5 sm:ml-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="text-white/90 hover:text-brand-green hover:bg-white/10 active:scale-90 transition-all cursor-pointer p-2 sm:p-2.5 rounded-full flex items-center justify-center"
                aria-label={isMuted || volume === 0 ? "Bật âm lượng" : "Tắt âm lượng"}
                title={isMuted || volume === 0 ? "Bật âm lượng" : "Tắt âm lượng"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
              <div className="hidden md:flex items-center w-16">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-16 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Cluster: Next Episode, PiP, Settings, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Next Episode Button */}
            {hasNextEpisode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasNextEpisode && onNextEpisode) {
                    onNextEpisode();
                  }
                }}
                title="Tập tiếp theo"
                aria-label="Tập tiếp theo"
                className="text-white hover:text-brand-green hover:bg-white/10 active:scale-90 transition-all cursor-pointer p-2 sm:p-2.5 rounded-full flex items-center justify-center"
              >
                <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 fill-current stroke-[2.2]" />
              </button>
            )}

            {/* Picture-in-Picture Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePictureInPicture();
              }}
              title={isPiPActive ? "Đóng hình trong hình (PiP)" : "Hình trong hình (PiP)"}
              aria-label="Hình trong hình"
              className={cn(
                "p-2 sm:p-2.5 rounded-full transition-all cursor-pointer active:scale-90 flex items-center justify-center",
                isPiPActive
                  ? "text-brand-green bg-brand-green/20 shadow-[0_0_15px_rgba(32,214,107,0.4)] ring-1 ring-brand-green/30"
                  : "text-white hover:text-brand-green hover:bg-white/10"
              )}
            >
              <PictureInPicture2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
              aria-label={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
              className="text-white hover:text-brand-green hover:bg-white/10 active:scale-90 transition-all cursor-pointer p-2 sm:p-2.5 rounded-full flex items-center justify-center"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              ) : (
                <Maximize className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Redesigned Universal Settings Modal (Bottom Sheet on Mobile, Dialog on Desktop) */}
      {showSettings && isMounted && (() => {
        const modalContent = (
          <div
            className={cn(
              "fixed inset-0 z-[999999] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200 p-0 sm:p-4",
              isFullscreen && "absolute"
            )}
            onClick={() => setShowSettings(false)}
          >
            <div
              ref={settingsMenuRef}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg max-h-[85vh] sm:max-h-[82vh] flex flex-col bg-[#111714] border-t sm:border border-white/20 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.95)] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-green/15 text-brand-green">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                      Cài Đặt Phát & Chất Lượng
                    </h3>
                    <p className="text-[11px] text-white/50">
                      Tùy chỉnh độ nét, tốc độ, màu sắc và tỷ lệ khung hình
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-[11px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2.5 py-1 rounded-full">
                    {quality === -1 ? (currentLevelPlaying >= 0 && qualities[currentLevelPlaying] ? `${qualities[currentLevelPlaying].height}p Auto` : "FHD Auto") : `${qualities.find(q => q.level === quality)?.height || 1080}p`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer active:scale-90"
                    aria-label="Đóng cài đặt"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 5 Tab Navigation Pills (Large & Touch-friendly) */}
              <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-black/40 rounded-2xl mb-4 text-xs font-bold shrink-0 border border-white/5">
                <button
                  type="button"
                  onClick={() => setSettingsTab('quality')}
                  className={cn(
                    "py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1",
                    settingsTab === 'quality'
                      ? "bg-brand-green text-black font-black shadow-lg shadow-brand-green/20 scale-[1.02]"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Nét</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('speed')}
                  className={cn(
                    "py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1",
                    settingsTab === 'speed'
                      ? "bg-brand-green text-black font-black shadow-lg shadow-brand-green/20 scale-[1.02]"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Tốc độ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('sub')}
                  className={cn(
                    "py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1",
                    settingsTab === 'sub'
                      ? "bg-brand-green text-black font-black shadow-lg shadow-brand-green/20 scale-[1.02]"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  <span>Phụ đề</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('filter')}
                  className={cn(
                    "py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1",
                    settingsTab === 'filter'
                      ? "bg-brand-green text-black font-black shadow-lg shadow-brand-green/20 scale-[1.02]"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Màu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('fit')}
                  className={cn(
                    "py-2 sm:py-2.5 rounded-xl transition-all cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1",
                    settingsTab === 'fit'
                      ? "bg-brand-green text-black font-black shadow-lg shadow-brand-green/20 scale-[1.02]"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Tỷ lệ</span>
                </button>
              </div>

              {/* Tab Content: Quality */}
              {settingsTab === 'quality' && (
                <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => handleQualityChange(-1)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer border",
                      quality === -1
                        ? "bg-brand-green/15 text-brand-green font-bold border-brand-green/40 shadow-sm"
                        : "hover:bg-white/5 text-white/80 border-white/5"
                    )}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="font-bold text-sm">Tự động (Thích ứng mạng)</span>
                      <span className="text-[11px] text-white/40">Tự động chọn độ nét mượt nhất theo đường truyền</span>
                    </div>
                    {quality === -1 && <Check className="w-4 h-4 text-brand-green" />}
                  </button>

                  {qualities.length > 0 ? (
                    qualities.map((q) => (
                      <button
                        key={q.level}
                        type="button"
                        onClick={() => handleQualityChange(q.level)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer border",
                          quality === q.level
                            ? "bg-brand-green/15 text-brand-green font-bold border-brand-green/40 shadow-sm"
                            : "hover:bg-white/5 text-white/80 border-white/5"
                        )}
                      >
                        <div className="flex flex-col items-start text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">
                              {q.height >= 1080 ? `${q.height}p FHD (Siêu Nét)` : `${q.height}p HD`}
                            </span>
                            {q.height >= 1080 && (
                              <span className="text-[9px] bg-brand-green/20 text-brand-green px-1.5 py-0.5 rounded font-black">PRO</span>
                            )}
                          </div>
                          <span className="text-[11px] text-white/40">
                            {q.height >= 1080 ? "Chất lượng hình ảnh gốc cao cấp" : "Tiết kiệm dung lượng và tải nhanh"}
                          </span>
                        </div>
                        {quality === q.level && <Check className="w-4 h-4 text-brand-green" />}
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-white/60 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5">
                      <div className="flex flex-col items-start text-left">
                        <span className="font-bold text-sm">FHD 1080p (Chất lượng gốc cao nhất)</span>
                        <span className="text-[11px] text-white/40">Nguồn phát chất lượng cao từ server</span>
                      </div>
                      <Check className="w-4 h-4 text-brand-green" />
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Speed */}
              {settingsTab === 'speed' && (
                <div className="grid grid-cols-3 gap-2 flex-1 min-h-0 overflow-y-auto pr-1 py-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={cn(
                        "py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 border",
                        playbackRate === rate
                          ? "bg-brand-green text-black font-black border-brand-green shadow-lg shadow-brand-green/20"
                          : "bg-white/5 hover:bg-white/10 text-white/80 border-white/5"
                      )}
                    >
                      <span className="text-sm">{rate === 1 ? "1.0x" : `${rate}x`}</span>
                      <span className="text-[10px] opacity-70">{rate === 1 ? "Chuẩn" : rate > 1 ? "Nhanh" : "Chậm"}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Tab Content: Subtitles */}
              {settingsTab === 'sub' && (
                <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto pr-1 py-1">
                  <input
                    type="file"
                    ref={subtitleFileInputRef}
                    accept=".srt,.vtt,.txt"
                    className="hidden"
                    onChange={handleSubtitleUpload}
                  />
                  
                  <button
                    type="button"
                    onClick={() => subtitleFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-brand-green/15 hover:bg-brand-green/25 border border-brand-green/40 text-brand-green text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{customCues.length > 0 ? "Tải file phụ đề khác (.srt, .vtt)" : "Tải phụ đề từ máy (.srt, .vtt)"}</span>
                  </button>

                  {customCues.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
                        <span className="text-white/80 font-bold">Hiện phụ đề ({customCues.length} câu)</span>
                        <button
                          type="button"
                          onClick={() => setSubtitleEnabled(!subtitleEnabled)}
                          className={cn(
                            "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                            subtitleEnabled ? "bg-brand-green" : "bg-white/20"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full bg-white transition-transform absolute top-1",
                            subtitleEnabled ? "left-6" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">Cỡ chữ phụ đề:</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'sm', label: 'Nhỏ (16px)' },
                            { id: 'md', label: 'Vừa (20px)' },
                            { id: 'lg', label: 'Lớn (24px)' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSubtitleSize(item.id as any)}
                              className={cn(
                                "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                                subtitleSize === item.id
                                  ? "bg-brand-green text-black border-brand-green shadow"
                                  : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                              )}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] text-white/60 font-semibold uppercase tracking-wider">Nền phụ đề:</span>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'transparent', label: 'Trong suốt' },
                            { id: 'dim', label: 'Mờ tối' },
                            { id: 'black', label: 'Đen đậm' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSubtitleBg(item.id as any)}
                              className={cn(
                                "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                                subtitleBg === item.id
                                  ? "bg-brand-green text-black border-brand-green shadow"
                                  : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                              )}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1 text-xs text-white/50">
                      <p className="font-semibold text-white/70">Chưa có file phụ đề ngoài</p>
                      <p className="text-[11px] leading-relaxed">Bạn có thể tải file phụ đề định dạng .srt hoặc .vtt từ máy tính/điện thoại để hiển thị trực tiếp trên phim.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Color & Visual Filter */}
              {settingsTab === 'filter' && (
                <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
                  {[
                    { id: 'normal', title: 'Chuẩn (Natural)', desc: 'Màu sắc gốc mặc định của phim' },
                    { id: 'oled', title: 'OLED Cinema Pro', desc: 'Đen sâu, tương phản cao, rõ cảnh tối', badge: 'ĐỀ XUẤT' },
                    { id: 'vivid', title: 'Sống động (Vivid Colors)', desc: 'Rực rỡ, thích hợp Anime & Hoạt hình' },
                    { id: 'bright', title: 'Sáng rõ (Night Clarify)', desc: 'Tăng sáng, làm rõ cảnh đêm & phim kinh dị' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVisualFilterChange(item.id as any);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer border",
                        visualFilter === item.id
                          ? "bg-brand-green/15 text-brand-green font-bold border-brand-green/40 shadow-sm"
                          : "hover:bg-white/5 text-white/80 border-white/5"
                      )}
                    >
                      <div className="flex flex-col items-start text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{item.title}</span>
                          {item.badge && (
                            <span className="text-[9px] bg-amber-500/25 text-amber-300 px-1.5 py-0.5 rounded font-black border border-amber-500/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-white/40">{item.desc}</span>
                      </div>
                      {visualFilter === item.id && <Check className="w-4 h-4 text-brand-green shrink-0" />}
                    </button>
                  ))}

                  {/* Brightness Adjustment Slider */}
                  <div className="pt-2 px-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        Độ sáng màn hình
                      </span>
                      <span className="font-mono font-bold text-brand-green">{brightness}%</span>
                    </div>
                    <Slider
                      value={[brightness]}
                      min={50}
                      max={150}
                      step={5}
                      onValueChange={(val) => setBrightness(val[0])}
                      className="w-full cursor-pointer"
                    />
                  </div>

                  {/* Anti-Ad Shield Control */}
                  <div className="pt-3 px-1 space-y-2 border-t border-white/10 mt-1">
                    <div className="flex items-center justify-between text-xs text-white/80">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Shield className="w-3.5 h-3.5 text-brand-green" />
                        Khiên che quảng cáo mép trên
                      </span>
                      <span className="text-[10px] text-brand-green font-bold bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-full">
                        {adShieldMode === 'auto' ? (isAdDetected ? 'Đang che QC' : 'Tự động (Sạch)') : adShieldMode === 'always' ? 'Luôn che' : 'Đã tắt'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'auto', label: 'Tự động', desc: 'Chỉ che khi có QC' },
                        { id: 'always', label: 'Luôn che', desc: 'Che cố định mép trên' },
                        { id: 'off', label: 'Tắt khiên', desc: 'Xem nguyên bản' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdShieldModeChange(item.id as any);
                          }}
                          className={cn(
                            "py-2 px-1.5 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border",
                            adShieldMode === item.id
                              ? "bg-brand-green text-black font-extrabold border-brand-green shadow-sm"
                              : "bg-white/5 hover:bg-white/10 text-white/70 border-white/5"
                          )}
                        >
                          <span className="text-xs font-bold leading-tight">{item.label}</span>
                          <span className={cn(
                            "text-[9px] leading-tight mt-0.5",
                            adShieldMode === item.id ? "text-black/80 font-semibold" : "text-white/40"
                          )}>
                            {item.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Aspect Ratio */}
              {settingsTab === 'fit' && (
                <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
                  {[
                    { id: 'contain', title: 'Mặc định (16:9)', desc: 'Giữ đúng tỷ lệ gốc chuẩn 16:9' },
                    { id: 'cover', title: 'Phóng to lấp đầy (Zoom Fill)', desc: 'Cắt viền đen trên dưới (Zoom 1.33x)' },
                    { id: '4:3', title: 'Tỷ lệ 4:3', desc: 'Chuẩn TV & Anime cổ điển' },
                    { id: '21:9', title: 'Điện ảnh (21:9)', desc: 'Chuẩn chiếu rạp CinemaScope' },
                    { id: 'fill', title: 'Kéo giãn (Stretch)', desc: 'Lấp đầy toàn bộ khung phát' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleVideoFitChange(item.id as VideoFitMode)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer border",
                        videoFit === item.id
                          ? "bg-brand-green/15 text-brand-green font-bold border-brand-green/40 shadow-sm"
                          : "hover:bg-white/5 text-white/80 border-white/5"
                      )}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="font-bold text-sm">{item.title}</span>
                        <span className="text-[11px] text-white/40">{item.desc}</span>
                      </div>
                      {videoFit === item.id && <Check className="w-4 h-4 text-brand-green shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

        const targetNode = isFullscreen && containerRef.current ? containerRef.current : (typeof document !== 'undefined' ? document.body : null);
        if (!targetNode) return null;
        return createPortal(modalContent, targetNode);
      })()}

      {/* Pre-Roll TVC Video Player Overlay */}
      {showTVC && (
        <TVCPlayerOverlay
          tvcUrl={tvcConfig.videoUrl}
          targetUrl={tvcConfig.targetUrl}
          skipAfterSeconds={tvcConfig.skipAfterSeconds}
          onComplete={handleTVCComplete}
        />
      )}
    </div>
  );
}
