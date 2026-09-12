"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
} from "react";
import { Spinner } from "@/components/ui/spinner";
import { api, getAccessToken, mediaPublicUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const QUALITIES = [
  { id: "auto", label: "Auto" },
  { id: "1080", label: "1080p" },
  { id: "720", label: "720p" },
  { id: "480", label: "480p" },
] as const;

type SettingsView = "root" | "quality" | "speed";

function extractFileId(src: string) {
  const fromPath = src.match(/\/files\/([a-f0-9]{24})(?:\/|$)/i);
  if (fromPath?.[1]) return fromPath[1];
  if (/^[a-f0-9]{24}$/i.test(src.trim())) return src.trim();
  return null;
}

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

type ProtectedVideoPlayerProps = {
  src?: string | null;
  title?: string;
  className?: string;
};

export function ProtectedVideoPlayer({
  src,
  title,
  className,
}: ProtectedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [volumeBeforeMute, setVolumeBeforeMute] = useState(1);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<SettingsView>("root");
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] =
    useState<(typeof QUALITIES)[number]["id"]>("auto");
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    setStarted(false);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setSettingsOpen(false);
    setSettingsView("root");
    setSpeed(1);
    setQuality("auto");
    setVolumeOpen(false);
  }, [src]);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    async function resolve() {
      setError("");
      setBlobUrl(null);
      if (!src?.trim()) return;

      const token = getAccessToken();
      if (!token || token.startsWith("demo")) {
        setError("Sign in required to play this lesson.");
        return;
      }

      const fileId = extractFileId(src);
      if (fileId) {
        setLoading(true);
        try {
          const response = await api.get<Blob>(`/files/${fileId}/download`, {
            responseType: "blob",
            timeout: 180_000,
          });
          if (cancelled) return;
          const url = URL.createObjectURL(response.data);
          revoked = url;
          setBlobUrl(url);
        } catch {
          if (!cancelled) setError("Could not load protected video.");
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      setBlobUrl(mediaPublicUrl(src) ?? src);
    }

    void resolve();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [src]);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (settingsOpen || volumeOpen) return;
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 2800);
  }, [settingsOpen, volumeOpen]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = speed;
    el.volume = volume;
    el.muted = muted || volume === 0;
  }, [speed, volume, muted, blobUrl]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      setStarted(true);
      void el.play();
    } else {
      el.pause();
    }
  }, []);

  const skip = useCallback(
    (delta: number) => {
      const el = videoRef.current;
      if (!el) return;
      el.currentTime = Math.min(
        Math.max(el.currentTime + delta, 0),
        el.duration || 0,
      );
      setCurrent(el.currentTime);
      showControlsTemporarily();
    },
    [showControlsTemporarily],
  );

  const applyVolume = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next));
    setVolume(clamped);
    if (clamped > 0) {
      setMuted(false);
      setVolumeBeforeMute(clamped);
    } else {
      setMuted(true);
    }
    const el = videoRef.current;
    if (el) {
      el.volume = clamped;
      el.muted = clamped === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (muted || volume === 0) {
      const restore = volumeBeforeMute > 0 ? volumeBeforeMute : 1;
      applyVolume(restore);
    } else {
      setVolumeBeforeMute(volume);
      applyVolume(0);
    }
  }, [applyVolume, muted, volume, volumeBeforeMute]);

  function onSeek(value: number) {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = value;
    setCurrent(value);
  }

  const toggleFullscreen = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell) return;
    if (!document.fullscreenElement) {
      await shell.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  function blockContext(e: MouseEvent) {
    e.preventDefault();
  }

  function openSettings() {
    setVolumeOpen(false);
    setSettingsOpen((v) => !v);
    setSettingsView("root");
    setControlsVisible(true);
  }

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement> | KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const key = e.key;
      const lower = key.toLowerCase();

      const map: Record<string, () => void> = {
        " ": () => togglePlay(),
        k: () => togglePlay(),
        ArrowLeft: () => skip(-5),
        j: () => skip(-10),
        ArrowRight: () => skip(5),
        l: () => skip(10),
        ArrowUp: () => applyVolume(volume + 0.05),
        ArrowDown: () => applyVolume(volume - 0.05),
        m: () => toggleMute(),
        f: () => void toggleFullscreen(),
        Escape: () => {
          if (settingsOpen) {
            setSettingsOpen(false);
            return;
          }
          if (document.fullscreenElement) void toggleFullscreen();
        },
      };

      if (map[key] || map[lower]) {
        e.preventDefault();
        (map[key] ?? map[lower])();
        showControlsTemporarily();
        return;
      }

      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        const el = videoRef.current;
        if (!el || !el.duration) return;
        el.currentTime = (el.duration * Number(key)) / 10;
        setCurrent(el.currentTime);
        showControlsTemporarily();
      }
    },
    [
      applyVolume,
      settingsOpen,
      showControlsTemporarily,
      skip,
      toggleFullscreen,
      toggleMute,
      togglePlay,
      volume,
    ],
  );

  useEffect(() => {
    function onDocKey(e: KeyboardEvent) {
      const shell = shellRef.current;
      if (!shell) return;
      const active = document.activeElement;
      const focusedInside =
        shell === active || (active instanceof Node && shell.contains(active));
      if (!focusedInside && document.fullscreenElement !== shell) return;
      handleKeyDown(e);
    }
    window.addEventListener("keydown", onDocKey);
    return () => window.removeEventListener("keydown", onDocKey);
  }, [handleKeyDown]);

  useEffect(() => {
    function onFsChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const progressPct =
    duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const qualityLabel =
    QUALITIES.find((q) => q.id === quality)?.label ?? "Auto";
  const VolumeIcon =
    muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  if (!src?.trim()) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-2xl border border-border bg-black text-white",
          className,
        )}
      >
        <div className="px-6 text-center">
          <p className="text-sm text-white/60">Lesson video</p>
          <p className="mt-2 text-xl font-bold">{title ?? "Select a lesson"}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      tabIndex={0}
      role="application"
      aria-label={title ? `Video player: ${title}` : "Video player"}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[#2A2A2A] bg-black shadow-lg select-none outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        className,
      )}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => setVolumeOpen(false)}
      onContextMenu={blockContext}
      onClick={() => shellRef.current?.focus()}
    >
      {loading ? (
        <div className="flex aspect-video items-center justify-center">
          <Spinner className="on-primary" label="Loading video" />
        </div>
      ) : error ? (
        <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-white/80">
          {error}
        </div>
      ) : blobUrl ? (
        <>
          <video
            ref={videoRef}
            key={blobUrl}
            src={blobUrl}
            className={cn(
              "aspect-video w-full bg-black object-contain",
              quality === "480" && "scale-[0.92]",
              quality === "720" && "scale-[0.97]",
            )}
            playsInline
            preload="metadata"
            controls={false}
            controlsList="nodownload noremoteplayback noplaybackrate"
            disablePictureInPicture
            onContextMenu={blockContext}
            onPlay={() => {
              setPlaying(true);
              setStarted(true);
              showControlsTemporarily();
            }}
            onPause={() => {
              setPlaying(false);
              setControlsVisible(true);
            }}
            onTimeUpdate={() => setCurrent(videoRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => {
              const el = videoRef.current;
              if (!el) return;
              setDuration(el.duration ?? 0);
              el.playbackRate = speed;
              el.volume = volume;
              el.muted = muted || volume === 0;
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (settingsOpen) {
                setSettingsOpen(false);
                return;
              }
              togglePlay();
            }}
          />

          {!playing && !settingsOpen ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/20"
              aria-label="Play lesson video"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:scale-105">
                <Play className="ml-0.5 h-7 w-7 fill-white" />
              </span>
            </button>
          ) : null}

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-20 transition-opacity",
              controlsVisible || !playing || settingsOpen || volumeOpen
                ? "opacity-100"
                : "opacity-0 pointer-events-none",
            )}
          >
            {settingsOpen ? (
              <div className="absolute bottom-14 right-3 z-30 w-56 overflow-hidden rounded-xl border border-white/15 bg-[#121212]/95 text-white shadow-2xl backdrop-blur-md">
                {settingsView === "root" ? (
                  <div className="py-1.5">
                    <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                      Settings
                    </p>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-white/10"
                      onClick={() => setSettingsView("quality")}
                    >
                      <span>Quality</span>
                      <span className="flex items-center gap-1 text-white/60">
                        {qualityLabel}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-white/10"
                      onClick={() => setSettingsView("speed")}
                    >
                      <span>Speed</span>
                      <span className="flex items-center gap-1 text-white/60">
                        {speed === 1 ? "Normal" : `${speed}x`}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                  </div>
                ) : null}

                {settingsView === "quality" ? (
                  <div className="py-1.5">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                      onClick={() => setSettingsView("root")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Quality
                    </button>
                    {QUALITIES.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-white/10"
                        onClick={() => {
                          setQuality(q.id);
                          setSettingsOpen(false);
                          setSettingsView("root");
                        }}
                      >
                        <span>{q.label}</span>
                        {quality === q.id ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}

                {settingsView === "speed" ? (
                  <div className="py-1.5">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                      onClick={() => setSettingsView("root")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Speed
                    </button>
                    {SPEEDS.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-white/10"
                        onClick={() => {
                          setSpeed(rate);
                          setSettingsOpen(false);
                          setSettingsView("root");
                        }}
                      >
                        <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
                        {speed === rate ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="bg-gradient-to-t from-black via-black/70 to-transparent px-3 pb-3 pt-10">
              <div className="group/seek relative mb-3 h-5 cursor-pointer">
                <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/35" />
                <div
                  className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white"
                  style={{ width: `${progressPct}%` }}
                />
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
                  style={{ left: `${progressPct}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.05}
                  value={current}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  aria-label="Seek"
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => skip(-10)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10"
                    aria-label="Rewind 10 seconds"
                  >
                    <RotateCcw className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    <span className="pointer-events-none absolute text-[8px] font-bold leading-none">
                      10
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10"
                    aria-label={playing ? "Pause" : "Play"}
                  >
                    {playing ? (
                      <Pause className="h-5 w-5 fill-white" strokeWidth={1.5} />
                    ) : (
                      <Play className="h-5 w-5 fill-white" strokeWidth={1.5} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => skip(10)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10"
                    aria-label="Forward 10 seconds"
                  >
                    <RotateCw className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    <span className="pointer-events-none absolute text-[8px] font-bold leading-none">
                      10
                    </span>
                  </button>

                  <div
                    className="flex items-center"
                    onMouseEnter={() => {
                      setVolumeOpen(true);
                      setControlsVisible(true);
                    }}
                    onMouseLeave={() => setVolumeOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10"
                      aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
                    >
                      <VolumeIcon
                        className="h-[18px] w-[18px]"
                        strokeWidth={1.75}
                      />
                    </button>
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-200",
                        volumeOpen
                          ? "ml-1 w-[88px] opacity-100"
                          : "w-0 opacity-0",
                      )}
                    >
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={muted ? 0 : volume}
                        onChange={(e) => applyVolume(Number(e.target.value))}
                        className="h-1 w-[88px] cursor-pointer appearance-none rounded-full bg-white/25 accent-white [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                        aria-label="Volume"
                      />
                    </div>
                  </div>

                  <span className="ml-1 text-xs tabular-nums tracking-wide text-white/95 sm:text-[13px]">
                    {formatClock(current)}/{formatClock(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    onClick={openSettings}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10",
                      settingsOpen && "bg-white/10",
                    )}
                    aria-label="Settings"
                    aria-expanded={settingsOpen}
                  >
                    <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleFullscreen()}
                    className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/10"
                    aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {fullscreen ? (
                      <Minimize
                        className="h-[18px] w-[18px]"
                        strokeWidth={1.75}
                      />
                    ) : (
                      <Maximize
                        className="h-[18px] w-[18px]"
                        strokeWidth={1.75}
                      />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {started ? (
            <span className="sr-only">
              Keyboard: Space or K play pause, J or Left rewind, L or Right
              forward, Up Down volume, M mute, F fullscreen, 0-9 seek.
              Protected stream · download disabled · quality {qualityLabel} ·
              speed {speed}x
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
