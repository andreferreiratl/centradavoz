import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Loader2, AlertTriangle, RefreshCw, Download, RotateCcw, Play, Pause, Check, ChevronRight, Volume2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSubscription } from "../lib/useSubscription";
import GradientButton from "../components/GradientButton";
import AudioMixer from "../components/AudioMixer";
import { cn } from "@/lib/utils";

export default function GenerateAudio() {
  const { subscription, loading, user, isActive, remainingChars, setSubscription } = useSubscription();
  const [step, setStep] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voiceStyle, setVoiceStyle] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [error, setError] = useState(null);
  const generatedAudioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.ElevenLabsVoice.filter({ is_active: true }, "sort_order").then(setVoices);
    base44.auth.me().then(u => {
      base44.entities.VoiceStyle.filter({ user_email: u.email, is_active: true }).then(styles => {
        if (styles.length > 0) setVoiceStyle(styles[0]);
      });
    });
  }, []);

  const charCount = text.length;

  // Preview de voz via elemento audio HTML
  function stopAllPreviews() {
    document.querySelectorAll("audio.voice-preview").forEach(a => { a.pause(); a.currentTime = 0; });
    setPlayingId(null);
  }

  function togglePreview(voice) {
    if (!voice.preview_url) return;
    const existingAudio = document.getElementById(`preview-${voice.id}`);

    if (playingId === voice.id) {
      existingAudio?.pause();
      setPlayingId(null);
    } else {
      stopAllPreviews();
      const audio = existingAudio || new Audio();
      audio.id = `preview-${voice.id}`;
      audio.className = "voice-preview";
      audio.src = voice.preview_url;
      audio.crossOrigin = "anonymous";
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      audio.play().then(() => setPlayingId(voice.id)).catch(() => {
        // fallback: open in new tab
        window.open(voice.preview_url, "_blank");
        setPlayingId(null);
      });
    }
  }

  function toggleGenerated() {
    const audio = generatedAudioRef.current;
    if (!audio) return;
    if (audioPlaying) {
      audio.pause();
      setAudioPlaying(false);
    } else {
      audio.play().catch(() => setAudioPlaying(false));
      setAudioPlaying(true);
    }
  }

  const handleGenerate = async () => {
    if (!isActive || charCount === 0 || charCount > remainingChars) return;
    setGenerating(true);
    setAudioUrl(null);
    setAudioPlaying(false);
    setError(null);
    generatedAudioRef.current = null;

    const record = await base44.entities.AudioRecord.create({
      user_email: user.email,
      text,
      character_count: charCount,
      voice_style: selectedVoice?.name || "Padrão",
      voice_gender: selectedVoice?.gender || "feminina",
      status: "processing"
    });

    let generatedUrl = null;
    let errorMsg = null;

    try {
      // Busca a API key no SystemConfig
      const configs = await base44.entities.SystemConfig.filter({ key: "ELEVENLABS_API_KEY" });
      const apiKey = configs[0]?.value;

      if (!apiKey || !selectedVoice?.voice_id) {
        errorMsg = !apiKey
          ? "Chave da API ElevenLabs não configurada. Acesse Admin → Configurações e cadastre ELEVENLABS_API_KEY."
          : "Voice ID não definido para esta voz.";
      } else {
        // Mapear emoção → parâmetros ElevenLabs
        const emotionMap = {
          alegre:        { stability: 0.25, similarity_boost: 0.85, style: 0.75, use_speaker_boost: true },
          animado:       { stability: 0.20, similarity_boost: 0.85, style: 0.80, use_speaker_boost: true },
          entusiasmado:  { stability: 0.18, similarity_boost: 0.85, style: 0.85, use_speaker_boost: true },
          emocional:     { stability: 0.20, similarity_boost: 0.90, style: 0.85, use_speaker_boost: true },
          dramático:     { stability: 0.15, similarity_boost: 0.90, style: 0.90, use_speaker_boost: true },
          triste:        { stability: 0.35, similarity_boost: 0.80, style: 0.60, use_speaker_boost: true },
          calmo:         { stability: 0.60, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true },
          suave:         { stability: 0.55, similarity_boost: 0.75, style: 0.25, use_speaker_boost: true },
          sério:         { stability: 0.65, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
          profissional:  { stability: 0.65, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true },
          neutro:        { stability: 0.50, similarity_boost: 0.75, style: 0.00, use_speaker_boost: false },
          urgente:       { stability: 0.20, similarity_boost: 0.85, style: 0.80, use_speaker_boost: true },
          empolgante:    { stability: 0.18, similarity_boost: 0.85, style: 0.85, use_speaker_boost: true },
        };
        const emotion = voiceStyle?.emotion?.toLowerCase() || "";
        const voiceSettings = emotionMap[emotion] || { stability: 0.40, similarity_boost: 0.80, style: 0.45, use_speaker_boost: true };

        // Construir stage direction para o ElevenLabs entender a emoção
        const stageDirectionParts = [];
        if (voiceStyle?.emotion) stageDirectionParts.push(voiceStyle.emotion);
        if (voiceStyle?.tone) stageDirectionParts.push(voiceStyle.tone);
        if (voiceStyle?.rhythm) stageDirectionParts.push(voiceStyle.rhythm);
        if (voiceStyle?.description) stageDirectionParts.push(voiceStyle.description);

        // Texto enriquecido: stage direction no início guia a emoção do modelo
        const enrichedText = stageDirectionParts.length > 0
          ? `(${stageDirectionParts.join(", ")}) ${text}`
          : text;

        const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice.voice_id}`, {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
          },
          body: JSON.stringify({
            text: enrichedText,
            model_id: "eleven_turbo_v2_5",
            voice_settings: voiceSettings
          })
        });

        if (resp.ok) {
          const blob = await resp.blob();
          generatedUrl = URL.createObjectURL(blob);
          const audio = new Audio(generatedUrl);
          audio.onended = () => setAudioPlaying(false);
          generatedAudioRef.current = audio;
        } else {
          const body = await resp.json().catch(() => ({}));
          errorMsg = body?.detail?.message || `Erro ElevenLabs: ${resp.status}`;
        }
      }
    } catch (e) {
      errorMsg = "Erro ao conectar com a API ElevenLabs. Verifique a chave e o Voice ID.";
    }

    const newUsage = (subscription.characters_used || 0) + charCount;
    await base44.entities.Subscription.update(subscription.id, { characters_used: newUsage });
    setSubscription(prev => ({ ...prev, characters_used: newUsage }));

    await base44.entities.AudioRecord.update(record.id, {
      status: generatedUrl ? "completed" : "failed",
      audio_url: generatedUrl || ""
    });

    await base44.entities.ActivityLog.create({
      user_email: user.email,
      action: "audio_generated",
      details: `Gerou áudio com ${charCount} caracteres. Voz: ${selectedVoice?.name || "padrão"}. ${errorMsg ? "ERRO: " + errorMsg : ""}`,
      entity_type: "AudioRecord",
      entity_id: record.id
    });

    setGenerating(false);
    if (errorMsg) setError(errorMsg);
    setAudioUrl(generatedUrl || null);
    setStep(3);
  };

  const resetAll = () => {
    setAudioUrl(null);
    setAudioPlaying(false);
    setError(null);
    generatedAudioRef.current = null;
    setStep(2);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const genderIcon = { masculina: "♂", feminina: "♀", neutro: "⊙" };

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-heading text-xl font-bold">Gerar Áudio</h1>
        </div>
        <img src="https://media.base44.com/images/public/69da50375cc9660ed0fab63a/c9d2e48da_file_000000009a48720eaaa61bf4a204e45c.png" alt="Central da Voz" className="h-8 w-auto object-contain" />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        {[{ n: 1, label: "Escolher Voz" }, { n: 2, label: "Escrever Texto" }, { n: 3, label: "Resultado" }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1.5", step === s.n ? "text-foreground" : step > s.n ? "text-secondary" : "text-muted-foreground")}>
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                step === s.n ? "gradient-primary text-white" : step > s.n ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"
              )}>{step > s.n ? <Check className="w-3 h-3" /> : s.n}</div>
              <span className="text-xs font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
          </div>
        ))}
      </div>

      {/* Access Warning */}
      {!isActive && (
        <div className="glass-card rounded-2xl p-4 mb-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-400">Acesso Restrito</p>
              <p className="text-xs text-muted-foreground mt-1">Você precisa de um plano ativo para gerar áudios.</p>
              <Link to="/plans"><GradientButton size="sm" className="mt-2">Ver Planos</GradientButton></Link>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Voice Selection */}
      {step === 1 && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Ouça o preview e escolha a voz ideal para seu projeto</p>

          {/* Voice Style Badge */}
          {voiceStyle ? (
            <div className="glass-card rounded-xl p-3 mb-4 border-secondary/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary font-semibold">Estilo Ativo</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[voiceStyle.tone, voiceStyle.rhythm, voiceStyle.emotion].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Link to="/voice-assistant" className="text-xs text-primary hover:underline">Alterar</Link>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-3 mb-4 border-yellow-500/20 bg-yellow-500/5 flex items-center justify-between">
              <p className="text-xs text-yellow-400">Nenhum estilo definido — emoção padrão será usada</p>
              <Link to="/voice-assistant" className="text-xs text-secondary hover:underline">Definir</Link>
            </div>
          )}

          {voices.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <Mic className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Nenhuma voz disponível</p>
              <p className="text-xs text-muted-foreground mt-1">Aguarde o administrador cadastrar as vozes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {voices.map(voice => (
                <div key={voice.id} className={cn(
                  "glass-card rounded-2xl p-4 transition-all duration-200 cursor-pointer",
                  selectedVoice?.id === voice.id ? "border-primary/50 bg-primary/5 glow-primary" : "hover:border-primary/20"
                )} onClick={() => setSelectedVoice(voice)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0",
                      selectedVoice?.id === voice.id ? "gradient-primary" : "bg-muted"
                    )}>
                      {selectedVoice?.id === voice.id ? <Check className="w-5 h-5 text-white" /> : <span>{genderIcon[voice.gender] || "🎙"}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{voice.name}</p>
                      <p className="text-xs text-muted-foreground">{voice.style || voice.gender}</p>
                      {voice.description && <p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-1">{voice.description}</p>}
                    </div>
                    {voice.preview_url ? (
                      <button onClick={e => { e.stopPropagation(); togglePreview(voice); }}
                        className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 border",
                          playingId === voice.id
                            ? "bg-secondary border-secondary/40 text-background"
                            : "bg-muted border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30"
                        )}>
                        {playingId === voice.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 opacity-30">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <GradientButton
            onClick={() => setStep(2)}
            disabled={!selectedVoice || !isActive}
            className="w-full mt-5"
            size="lg"
          >
            Continuar com {selectedVoice ? `"${selectedVoice.name}"` : "uma voz"}
            <ChevronRight className="w-5 h-5 ml-1 inline" />
          </GradientButton>
        </div>
      )}

      {/* STEP 2: Text Input */}
      {step === 2 && (
        <div>
          <div className="glass-card rounded-2xl p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold">{selectedVoice?.name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedVoice?.style || selectedVoice?.gender}</p>
              </div>
            </div>
            <button onClick={() => setStep(1)} className="text-xs text-secondary hover:underline flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Trocar
            </button>
          </div>

          <div className="glass-card rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Texto para Locução</span>
              <span className={cn("text-xs font-medium", charCount > remainingChars ? "text-red-400" : "text-muted-foreground")}>
                {charCount.toLocaleString()} / {remainingChars.toLocaleString()}
              </span>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Digite ou cole o texto que deseja transformar em áudio..."
              className="w-full bg-muted rounded-xl p-3 text-sm min-h-[200px] outline-none resize-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/30 transition-all"
              disabled={!isActive}
            />
          </div>

          <GradientButton
            onClick={handleGenerate}
            disabled={!isActive || charCount === 0 || charCount > remainingChars || generating}
            className={cn("w-full", generating && "animate-pulse-glow")}
            size="lg"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 mr-2 inline animate-spin" />Gerando áudio...</>
            ) : (
              <><Mic className="w-5 h-5 mr-2 inline" />Gerar Áudio</>
            )}
          </GradientButton>
        </div>
      )}

      {/* STEP 3: Result */}
      {step === 3 && (
        <div>
          <div className="glass-card rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 glow-primary">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold">{audioUrl ? "Áudio Gerado" : "Processamento Concluído"}</p>
                <p className="text-xs text-muted-foreground">{charCount} caracteres • {selectedVoice?.name}</p>
              </div>
              <div className="ml-auto">
                {audioUrl
                  ? <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full">✓ Pronto</span>
                  : <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-full">✗ Erro</span>
                }
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <p className="text-xs text-red-400 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Play Button */}
            {audioUrl && (
              <button
                onClick={toggleGenerated}
                className={cn(
                  "w-full flex items-center justify-center gap-3 py-4 rounded-xl mb-4 transition-all font-semibold",
                  audioPlaying
                    ? "bg-secondary/20 border border-secondary/40 text-secondary"
                    : "gradient-primary text-white glow-primary"
                )}
              >
                {audioPlaying ? <><Pause className="w-5 h-5" /> Pausar áudio</> : <><Play className="w-5 h-5" /> Ouvir áudio gerado</>}
              </button>
            )}

            {/* Download buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {audioUrl ? (
                <>
                  <a href={audioUrl} download="audio.mp3"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium gradient-primary text-white glow-primary transition-all">
                    <Download className="w-4 h-4" /> MP3
                  </a>
                  <a href={audioUrl} download="audio.wav"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-secondary/10 border border-secondary/30 text-secondary transition-all">
                    <Download className="w-4 h-4" /> WAV
                  </a>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-muted text-muted-foreground cursor-not-allowed opacity-50">
                    <Download className="w-4 h-4" /> MP3
                  </div>
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-muted text-muted-foreground cursor-not-allowed opacity-50">
                    <Download className="w-4 h-4" /> WAV
                  </div>
                </>
              )}
            </div>

            <button onClick={resetAll} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium transition-all">
              <RotateCcw className="w-4 h-4" /> Não gostei — Gerar Novamente
            </button>
          </div>

          {audioUrl && <AudioMixer generatedAudioUrl={audioUrl} />}
        </div>
      )}
    </div>
  );
}