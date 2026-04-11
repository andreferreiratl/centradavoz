import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AudioPlayer({ url, className }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress((audio.currentTime / audio.duration) * 100);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => { setIsPlaying(false); setProgress(0); };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [url]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("glass-card rounded-2xl p-4", className)}>
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
        >
          {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
        </button>
        
        <div className="flex-1 min-w-0">
          {/* Waveform bars */}
          <div className="flex items-end gap-[2px] h-8 mb-1">
            {Array.from({ length: 40 }).map((_, i) => {
              const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10;
              const filled = (i / 40) * 100 < progress;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-all duration-100",
                    filled ? "gradient-primary" : "bg-muted"
                  )}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-muted-foreground">{formatTime(audioRef.current?.currentTime)}</span>
            <span className="text-[10px] text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        <a
          href={url}
          download
          className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
        >
          <Download className="w-4 h-4 text-secondary" />
        </a>
      </div>
    </div>
  );
}