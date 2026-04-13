import { useState, useRef, useEffect, useCallback } from "react";
import { Music, Upload, Volume2, Play, Pause, X, Download, Loader2, Library } from "lucide-react";
import { base44 } from "@/api/base44Client";

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

async function loadAudioBuffer(audioCtx, url) {
  const resp = await fetch(url);
  const arrayBuffer = await resp.arrayBuffer();
  return audioCtx.decodeAudioData(arrayBuffer);
}

export default function AudioMixer({ generatedAudioUrl }) {
  const [mode, setMode] = useState("library"); // "library" | "device"
  const [catalogTracks, setCatalogTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [bgFile, setBgFile] = useState(null);
  const [bgObjectUrl, setBgObjectUrl] = useState(null);
  const [mainVolume, setMainVolume] = useState(80);
  const [bgVolume, setBgVolume] = useState(40);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);

  const audioCtxRef = useRef(null);
  const mainSourceRef = useRef(null);
  const bgSourceRef = useRef(null);
  const mainGainRef = useRef(null);
  const bgGainRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    base44.entities.BackgroundTrack.filter({ is_active: true }, "sort_order").then(setCatalogTracks);
  }, []);

  const activeBgUrl = mode === "library"
    ? catalogTracks.find(t => t.id === selectedTrackId)?.audio_url || null
    : bgObjectUrl;

  const stopPlayback = useCallback(() => {
    mainSourceRef.current?.stop();
    bgSourceRef.current?.stop();
    mainSourceRef.current = null;
    bgSourceRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setIsPlaying(false);
  }, []);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  useEffect(() => { if (mainGainRef.current) mainGainRef.current.gain.value = mainVolume / 100; }, [mainVolume]);
  useEffect(() => { if (bgGainRef.current) bgGainRef.current.gain.value = bgVolume / 100; }, [bgVolume]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
    setBgFile(file);
    setBgObjectUrl(URL.createObjectURL(file));
    stopPlayback();
  };

  const togglePreview = async () => {
    if (isPlaying) { stopPlayback(); return; }
    if (!generatedAudioUrl || !activeBgUrl) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const [mainBuf, bgBuf] = await Promise.all([
      loadAudioBuffer(ctx, generatedAudioUrl),
      loadAudioBuffer(ctx, activeBgUrl),
    ]);

    const mainGain = ctx.createGain();
    mainGain.gain.value = mainVolume / 100;
    mainGainRef.current = mainGain;

    const bgGain = ctx.createGain();
    bgGain.gain.value = bgVolume / 100;
    bgGainRef.current = bgGain;

    const mainSrc = ctx.createBufferSource();
    mainSrc.buffer = mainBuf;
    mainSrc.connect(mainGain).connect(ctx.destination);

    const bgSrc = ctx.createBufferSource();
    bgSrc.buffer = bgBuf;
    bgSrc.loop = true;
    bgSrc.connect(bgGain).connect(ctx.destination);

    mainSourceRef.current = mainSrc;
    bgSourceRef.current = bgSrc;

    mainSrc.start(0);
    bgSrc.start(0);
    setIsPlaying(true);

    mainSrc.onended = () => {
      if (!audioCtxRef.current) return;
      const now = ctx.currentTime;
      bgGain.gain.setValueAtTime(bgVolume / 100, now);
      bgGain.gain.linearRampToValueAtTime(1.0, now + 1.0);
      bgGain.gain.linearRampToValueAtTime(0, now + 2.0);
      setTimeout(() => stopPlayback(), 2100);
    };
  };

  const handleExport = async () => {
    if (!generatedAudioUrl || !activeBgUrl) return;
    setExporting(true);

    const tmpCtx = new AudioContext();
    const [mainBuf, bgBuf] = await Promise.all([
      loadAudioBuffer(tmpCtx, generatedAudioUrl),
      loadAudioBuffer(tmpCtx, activeBgUrl),
    ]);
    await tmpCtx.close();

    const sampleRate = mainBuf.sampleRate;
    const length = mainBuf.length;
    const extraSamples = sampleRate * 2;
    const totalLength = length + extraSamples;
    const offlineCtx = new OfflineAudioContext(1, totalLength, sampleRate);

    const mainGain = offlineCtx.createGain();
    mainGain.gain.value = mainVolume / 100;
    const bgGain = offlineCtx.createGain();
    bgGain.gain.value = bgVolume / 100;

    const mainDuration = length / sampleRate;
    bgGain.gain.setValueAtTime(bgVolume / 100, mainDuration);
    bgGain.gain.linearRampToValueAtTime(1.0, mainDuration + 1.0);
    bgGain.gain.linearRampToValueAtTime(0, mainDuration + 2.0);

    const bgData = bgBuf.getChannelData(0);
    const loopedBg = offlineCtx.createBuffer(1, totalLength, sampleRate);
    const loopedData = loopedBg.getChannelData(0);
    for (let i = 0; i < totalLength; i++) loopedData[i] = bgData[i % bgData.length];

    const mainSrc = offlineCtx.createBufferSource();
    mainSrc.buffer = mainBuf;
    mainSrc.connect(mainGain).connect(offlineCtx.destination);

    const bgSrc = offlineCtx.createBufferSource();
    bgSrc.buffer = loopedBg;
    bgSrc.connect(bgGain).connect(offlineCtx.destination);

    mainSrc.start(0);
    bgSrc.start(0);

    const rendered = await offlineCtx.startRendering();
    const wav = encodeWAV(rendered.getChannelData(0), sampleRate);
    const blob = new Blob([wav], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audio_mixado.wav";
    a.click();
    URL.revokeObjectURL(url);

    setExporting(false);
  };

  const removeBg = () => {
    stopPlayback();
    if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
    setBgFile(null);
    setBgObjectUrl(null);
  };

  const hasBg = !!activeBgUrl;

  return (
    <div className="glass-card rounded-2xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-4 h-4 text-secondary" />
        <span className="text-sm font-semibold">Mixagem de Áudio</span>
      </div>

      {/* Volume - Main */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Volume2 className="w-3 h-3" /> Áudio Gerado
          </span>
          <span className="text-xs font-medium">{mainVolume}%</span>
        </div>
        <input type="range" min="0" max="100" value={mainVolume}
          onChange={(e) => setMainVolume(Number(e.target.value))}
          className="w-full h-2 rounded-full accent-primary cursor-pointer" />
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => { setMode("library"); stopPlayback(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${mode === "library" ? "gradient-primary text-white border-transparent" : "bg-muted border-border text-muted-foreground"}`}
        >
          <Library className="w-3.5 h-3.5" /> Trilhas da Plataforma
        </button>
        <button
          onClick={() => { setMode("device"); stopPlayback(); }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${mode === "device" ? "gradient-primary text-white border-transparent" : "bg-muted border-border text-muted-foreground"}`}
        >
          <Upload className="w-3.5 h-3.5" /> Meu Dispositivo
        </button>
      </div>

      {/* Library mode */}
      {mode === "library" && (
        <div className="mb-3">
          {catalogTracks.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhuma trilha cadastrada ainda.</p>
          ) : (
            <select
              value={selectedTrackId}
              onChange={(e) => { setSelectedTrackId(e.target.value); stopPlayback(); }}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"
            >
              <option value="">— Selecione uma trilha —</option>
              {catalogTracks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.category ? `[${t.category}] ` : ""}{t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Device mode */}
      {mode === "device" && (
        <div className="mb-3">
          {!bgObjectUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-4 text-center transition-all group"
            >
              <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary mx-auto mb-2 transition-colors" />
              <p className="text-xs text-muted-foreground">Clique para adicionar trilha (MP3, WAV, OGG)</p>
              <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
              <Music className="w-4 h-4 text-secondary flex-shrink-0" />
              <span className="text-xs flex-1 truncate">{bgFile?.name}</span>
              <button onClick={removeBg} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Volume BG + controls */}
      {hasBg && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Volume2 className="w-3 h-3" /> Trilha de Fundo
              </span>
              <span className="text-xs font-medium">{bgVolume}%</span>
            </div>
            <input type="range" min="0" max="100" value={bgVolume}
              onChange={(e) => setBgVolume(Number(e.target.value))}
              className="w-full h-2 rounded-full accent-secondary cursor-pointer" />
          </div>

          <button
            onClick={togglePreview}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary text-sm font-medium transition-all mb-2"
          >
            {isPlaying ? <><Pause className="w-4 h-4" /> Pausar preview</> : <><Play className="w-4 h-4" /> Ouvir preview da mixagem</>}
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium transition-all disabled:opacity-40"
          >
            {exporting
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Exportando...</>
              : <><Download className="w-4 h-4" /> Baixar Áudio Mixado (WAV)</>}
          </button>
        </>
      )}
    </div>
  );
}