"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useAppState } from "@/contexts/app-context";

export function VideoPlayer({
  lessonId,
  src,
}: {
  lessonId: string;
  src?: string;
}) {
  const { videoPositions, saveVideoPosition } = useAppState();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const normalizedSrc = src?.trim() ?? "";
  const isBunnyPlayerUrl =
    /^https:\/\/player\.mediadelivery\.net\/play\/\d+\/[a-z0-9-]+(?:\?.*)?$/i.test(
      normalizedSrc,
    );

  if (!normalizedSrc) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-zinc-400 md:h-96">
        Nội dung dạng văn bản - không có video cho bài này.
      </div>
    );
  }

  if (isBunnyPlayerUrl) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-3">
        <div
          className="overflow-hidden rounded-2xl border border-border bg-black"
          style={{ aspectRatio: `${videoAspectRatio}` }}
        >
          <iframe
            src={normalizedSrc}
            loading="lazy"
            allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
        <div className="card p-3 text-xs text-zinc-400">
          Video đang phát qua Bunny Player URL.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3">
      <div
        className="overflow-hidden rounded-2xl border border-border bg-black"
        style={{ aspectRatio: `${videoAspectRatio}` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <video
          ref={videoRef}
          src={normalizedSrc}
          className="h-full w-full bg-black object-contain"
          controls={false}
          controlsList="nodownload noplaybackrate"
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            const player = event.currentTarget;
            setIsPlaying(false);
            setProgress(0);
            setVideoAspectRatio(16 / 9);

            if (player.videoWidth > 0 && player.videoHeight > 0) {
              setVideoAspectRatio(player.videoWidth / player.videoHeight);
            }

            const saved = videoPositions[lessonId];
            if (
              typeof saved === "number" &&
              saved > 0 &&
              Number.isFinite(player.duration) &&
              saved < player.duration
            ) {
              player.currentTime = saved;
            }
          }}
          onTimeUpdate={(event) => {
            const current = event.currentTarget.currentTime;
            const duration = event.currentTarget.duration || 1;
            setProgress((current / duration) * 100);
            saveVideoPosition(lessonId, current);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
      <div className="card flex items-center gap-3 p-3">
        <button
          className="rounded-lg bg-accent p-2 text-black"
          onClick={() => {
            const player = videoRef.current;
            if (!player) return;
            if (player.paused) {
              void player.play();
            } else {
              player.pause();
            }
          }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
