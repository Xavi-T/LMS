"use client";

import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !src) {
      return;
    }

    const saved = videoPositions[lessonId];
    if (saved && saved > 0 && saved < player.duration) {
      player.currentTime = saved;
    }
  }, [lessonId, src, videoPositions]);

  if (!src) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-zinc-400 md:h-96">
        Nội dung dạng văn bản - không có video cho bài này.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="overflow-hidden rounded-2xl border border-border"
        onContextMenu={(e) => e.preventDefault()}
      >
        <video
          ref={videoRef}
          src={src}
          className="h-60 w-full bg-black object-cover md:h-[460px]"
          controls={false}
          controlsList="nodownload noplaybackrate"
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
