import { useState, useRef, useEffect, useCallback } from "react";
import { Music, Upload, Volume2, Play, Pause, X, Download, Loader2, Library, Timer, Clock, Headphones, CheckCircle2 } from "lucide-react";
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

function TimingField({ label, icon: Icon, value, onChange }) {
  return (
    <div className="flex-1 bg-muted rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-secondary" />
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="180"
          value={value}
          onChange={(e) => {
            const v = Math.max(0, Math.min(180, Number(e.target.value)));
            onChange(v);
          }}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-semibold text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
        <span className="text-xs text-muted-foreground font-medium flex-shrink-0">seg</span>
      </div>
      <input
        type="range"
        min="0"
        max="180"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-secondary cursor-pointer"
      />
    </div>
  );
}

function TrackPreviewRow({ track, selected, onSelect, previewingId, onPreview }) {
  const isPreviewing = previewingId === track.id;
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer border transition-all ${selected ? "border-primary/60 bg-primary/10" : "border-border bg-muted hover:border-primary/30"}`}
    >
      {selected && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        {track.category && <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{track.category} · </span>}
        <span className="text-xs font-medium truncate">{track.name}</span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onPreview(track.id, track.audio_url); }}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all flex-shrink-0 ${isPreviewing ? "bg-secondary/20 border-secondary/50 text-secondary" : "bg-muted border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}
      >
        {isPreviewing ? <><Pause className="w-3 h-3" /> Pausar</> : <><Headphones className="w-3 h-3" /> Ouvir</>}
      </button>
    </div>
  );
}

// Trilha abaixa para 20% do volume definido enquanto o áudio gerado toca
const DUCK_RATIO = 0.2;
// Duração da transição de ducking (fade suave)
const DUCK_FADE = 1.0;

export default function AudioMixer({ generatedAudioUrl }) {
  const [mode, setMode] = useState("library");
  const [catalogTracks, setCatalogTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [bgFile, setBgFile] = useState(null);
  const [bgObjectUrl, setBgObjectUrl] = useState(null);
  const [mainVolume, setMainVolume] = useState(80);
  const [bgVolume, setBgVolume] = useState(40);
  const [mainAudioStartOffset, setMainAudioStartOffset] = useState(0);
  const [bgExtraAfterMain, setBgExtraAfterMain] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewingTrackId, setPreviewingTrackId] = useState(null);
  const [trackListCollapsed, setTrackListCollapsed] = useState(false);

  const audioCtxRef = useRef(null);
  const mainSourceRef = useRef(null);
  const bgSourceRef = useRef(null);
  const mainGainRef = useRef(null);
  const bgGainRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewAudioRef = useRef(null);

  useEffect(() => {
    base44.entities.BackgroundTrack.filter({ is_active: true }, "sort_order").then(setCatalogTracks);
  }, []);

  const activeBgUrl = mode === "library"
    ? catalogTracks.find(t => t.id === selectedTrackId)?.audio_url || null
    : bgObjectUrl;

  const stopPlayback = useCallback(() => {
    try { mainSourceRef.current?.stop(); } catch (_) {}
    try { bgSourceRef.current?.stop(); } catch (_) {}
    mainSourceRef.current = null;
    bgSourceRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setIsPlaying(false);
  }, []);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  useEffect(() => { if (mainGainRef.current) mainGainRef.current.gain.value = mainVolume / 100; }, [mainVolume]);

  const handleTrackPreview = (trackId, audioUrl) => {
    // Se já está tocando esta trilha, para
    if (previewingTrackId === trackId) {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
      setPreviewingTrackId(null);
      return;
    }
    // Para qualquer preview em andamento
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    // Inicia o novo preview
    const audio = new Audio(audioUrl);
    audio.play();
    audio.onended = () => setPreviewingTrackId(null);
    previewAudioRef.current = audio;
    setPreviewingTrackId(trackId);
  };

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

    const bgFull = bgVolume / 100;
    const bgDucked = bgFull * DUCK_RATIO;
    const now = ctx.currentTime;

    // Tempo absoluto em que o áudio gerado começa
    const mainStartAt = now + mainAudioStartOffset;
    const mainDuration = mainBuf.duration;

    // --- Automação de volume da trilha de fundo ---
    // 1. Começa no volume cheio
    bgGain.gain.setValueAtTime(bgFull, now);

    // 2. Abaixa suavemente antes do áudio gerado iniciar (duck down)
    const duckDownEnd = mainStartAt;
    const duckDownStart = Math.max(now, mainStartAt - DUCK_FADE);
    bgGain.gain.setValueAtTime(bgFull, duckDownStart);
    bgGain.gain.linearRampToValueAtTime(bgDucked, duckDownEnd);

    // 3. Mantém volume baixo durante o áudio gerado
    bgGain.gain.setValueAtTime(bgDucked, duckDownEnd);

    // 4. Sobe de volta ao volume cheio logo após o áudio gerado terminar
    const mainEndAt = mainStartAt + mainDuration;
    bgGain.gain.linearRampToValueAtTime(bgFull, mainEndAt + DUCK_FADE);

    // 5. Mantém no volume cheio pelo tempo extra configurado
    // 6. Fade final: começa 1s antes do fim
    const extra = Math.max(bgExtraAfterMain, 0);
    const fadeOutEnd = mainEndAt + DUCK_FADE + extra;
    const fadeOutStart = Math.max(mainEndAt + DUCK_FADE, fadeOutEnd - 1.0);
    bgGain.gain.setValueAtTime(bgFull, mainEndAt + DUCK_FADE);
    bgGain.gain.linearRampToValueAtTime(bgFull, fadeOutStart);
    bgGain.gain.linearRampToValueAtTime(0, fadeOutEnd);

    bgSrc.start(0);
    mainSrc.start(mainStartAt);
    setIsPlaying(true);

    // Para a reprodução logo após o fade final
    const totalMs = (fadeOutEnd - now + 0.1) * 1000;
    setTimeout(() => stopPlayback(), totalMs);
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
    const mainDuration = mainBuf.duration;

    // Duração total = offset + áudio gerado + duck up + extra + fade
    const extra = Math.max(bgExtraAfterMain, 0);
    const totalDuration = mainAudioStartOffset + mainDuration + DUCK_FADE + extra;
    const totalLength = Math.ceil(totalDuration * sampleRate);

    const offlineCtx = new OfflineAudioContext(1, totalLength, sampleRate);

    const mainGain = offlineCtx.createGain();
    mainGain.gain.value = mainVolume / 100;

    const bgGain = offlineCtx.createGain();

    const bgFull = bgVolume / 100;
    const bgDucked = bgFull * DUCK_RATIO;

    const mainStartAt = mainAudioStartOffset;
    const mainEndAt = mainStartAt + mainDuration;

    // 1. Começa no volume cheio
    bgGain.gain.setValueAtTime(bgFull, 0);

    // 2. Duck down ao iniciar o áudio gerado
    const duckDownStart = Math.max(0, mainStartAt - DUCK_FADE);
    bgGain.gain.setValueAtTime(bgFull, duckDownStart);
    bgGain.gain.linearRampToValueAtTime(bgDucked, mainStartAt);

    // 3. Mantém ducked durante o áudio gerado
    bgGain.gain.setValueAtTime(bgDucked, mainStartAt);

    // 4. Sobe ao volume cheio após o áudio gerado terminar
    bgGain.gain.linearRampToValueAtTime(bgFull, mainEndAt + DUCK_FADE);

    // 5. Mantém cheio e faz fade final 1s antes do fim
    const fadeOutEnd = mainEndAt + DUCK_FADE + extra;
    const fadeOutStart = Math.max(mainEndAt + DUCK_FADE, fadeOutEnd - 1.0);
    bgGain.gain.setValueAtTime(bgFull, mainEndAt + DUCK_FADE);
    bgGain.gain.linearRampToValueAtTime(bgFull, fadeOutStart);
    bgGain.gain.linearRampToValueAtTime(0, fadeOutEnd);

    // Criar buffer de BG em loop para cobrir toda a duração
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

    bgSrc.start(0);
    mainSrc.start(mainAudioStartOffset);

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
          ) : trackListCollapsed ? (
            <div
              onClick={() => setTrackListCollapsed(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-primary/40 bg-primary/10 cursor-pointer hover:bg-primary/15 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium flex-1 truncate">
                {catalogTracks.find(t => t.id === selectedTrackId)?.name || "Trilha selecionada"}
              </span>
              <span className="text-[10px] text-muted-foreground">Trocar</span>
            </div>
          ) : (
            <div className="space-y-2">
              {catalogTracks.map(t => (
                <TrackPreviewRow
                  key={t.id}
                  track={t}
                  selected={selectedTrackId === t.id}
                  onSelect={() => {
                    setSelectedTrackId(t.id);
                    stopPlayback();
                    setTrackListCollapsed(true);
                  }}
                  previewingId={previewingTrackId}
                  onPreview={handleTrackPreview}
                />
              ))}
            </div>
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

      {/* Volume BG + Timing Controls */}
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

          {/* Timing Fields */}
          <div className="flex gap-3 mb-4">
            <TimingField
              label="Início do áudio gerado"
              icon={Timer}
              value={mainAudioStartOffset}
              onChange={setMainAudioStartOffset}
            />
            <TimingField
              label="Trilha permanece após o áudio"
              icon={Clock}
              value={bgExtraAfterMain}
              onChange={setBgExtraAfterMain}
            />
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