import { useState, useRef, useEffect } from "react";
import { Music, Upload, Volume2, Play, Pause, X } from "lucide-react";
import GradientButton from "./GradientButton";

export default function AudioMixer({ generatedAudioUrl }) {
  const [bgFile, setBgFile] = useState(null);
  const [bgUrl, setBgUrl] = useState(null);
  const [bgVolume, setBgVolume] = useState(50);
  const [mainVolume, setMainVolume] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const mainAudioRef = useRef(null);
  const bgAudioRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (bgAudioRef.current) bgAudioRef.current.volume = bgVolume / 100;
  }, [bgVolume]);

  useEffect(() => {
    if (mainAudioRef.current) mainAudioRef.current.volume = mainVolume / 100;
  }, [mainVolume]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBgFile(file);
    const url = URL.createObjectURL(file);
    setBgUrl(url);
  };

  const togglePreview = () => {
    if (!bgUrl) return;
    if (isPlaying) {
      bgAudioRef.current?.pause();
      mainAudioRef.current?.pause();
    } else {
      bgAudioRef.current?.play();
      if (generatedAudioUrl && generatedAudioUrl !== "generated") {
        mainAudioRef.current?.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const removeBg = () => {
    setBgFile(null);
    setBgUrl(null);
    setIsPlaying(false);
    bgAudioRef.current?.pause();
  };

  return (
    <div className="glass-card rounded-2xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-4 h-4 text-secondary" />
        <span className="text-sm font-semibold">Mixagem de Áudio</span>
      </div>

      {/* Hidden audio elements */}
      {generatedAudioUrl && generatedAudioUrl !== "generated" && (
        <audio ref={mainAudioRef} src={generatedAudioUrl} loop />
      )}
      {bgUrl && <audio ref={bgAudioRef} src={bgUrl} loop />}

      {/* Volume - Main */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Volume2 className="w-3 h-3" /> Áudio Gerado
          </span>
          <span className="text-xs font-medium">{mainVolume}%</span>
        </div>
        <input
          type="range" min="0" max="100" value={mainVolume}
          onChange={(e) => setMainVolume(Number(e.target.value))}
          className="w-full h-2 rounded-full accent-primary cursor-pointer"
        />
      </div>

      {/* Upload BG Track */}
      {!bgFile ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-4 text-center transition-all group"
        >
          <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
          <p className="text-xs text-muted-foreground">Clique para adicionar trilha de fundo (MP3, WAV, OGG)</p>
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
        </button>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3 bg-muted rounded-xl p-3">
            <Music className="w-4 h-4 text-secondary flex-shrink-0" />
            <span className="text-xs flex-1 truncate">{bgFile.name}</span>
            <button onClick={removeBg} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Volume - BG */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Volume2 className="w-3 h-3" /> Trilha de Fundo
              </span>
              <span className="text-xs font-medium">{bgVolume}%</span>
            </div>
            <input
              type="range" min="0" max="100" value={bgVolume}
              onChange={(e) => setBgVolume(Number(e.target.value))}
              className="w-full h-2 rounded-full accent-secondary cursor-pointer"
            />
          </div>

          <button
            onClick={togglePreview}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary text-sm font-medium transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pausar preview" : "Ouvir preview da mixagem"}
          </button>
        </>
      )}
    </div>
  );
}