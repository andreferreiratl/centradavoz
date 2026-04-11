import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Loader2, AlertTriangle, RefreshCw, Download, RotateCcw, Play, Pause, Check, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSubscription } from "../lib/useSubscription";
import GradientButton from "../components/GradientButton";
import AudioMixer from "../components/AudioMixer";
import { cn } from "@/lib/utils";

// Steps: 1 = voice selection, 2 = text input, 3 = result
export default function GenerateAudio() {
  const { subscription, loading, user, isActive, remainingChars, setSubscription } = useSubscription();
  const [step, setStep] = useState(1);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const previewRef = useRef(null);
  const generatedRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.ElevenLabsVoice.filter({ is_active: true }, "sort_order").then(setVoices);
  }, []);

  const charCount = text.length;

  function togglePreview(voice) {
    if (playingId === voice.id) {
      previewRef.current?.pause();
      setPlayingId(null);
    } else {
      previewRef.current?.pause();
      const audio = new Audio(voice.preview_url);
      previewRef.current = audio;
      audio.play();
      audio.onended = () => setPlayingId(null);
      setPlayingId(voice.id);
    }
  }

  function toggleGenerated() {
    if (!generatedRef.current) return;
    if (audioPlaying) {
      generatedRef.current.pause();
      setAudioPlaying(false);
    } else {
      generatedRef.current.play();
      setAudioPlaying(true);
    }
  }

  const handleGenerate = async () => {
    if (!isActive || charCount === 0 || charCount > remainingChars) return;
    setGenerating(true);
    setAudioUrl(null);
    setAudioPlaying(false);

    const record = await base44.entities.AudioRecord.create({
      user_email: user.email,
      text,
      character_count: charCount,
      voice_style: selectedVoice?.name || "Padrão",
      voice_gender: selectedVoice?.gender || "feminina",
      status: "processing"
    });

    // Call ElevenLabs TTS API
    let generatedUrl = null;
    try {
      const ELEVENLABS_KEY = (await base44.entities.SystemConfig.filter({ key: "ELEVENLABS_API_KEY" }))[0]?.value;
      const voiceId = selectedVoice?.voice_id;
      if (ELEVENLABS_KEY && voiceId) {
        const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: { "xi-api-key": ELEVENLABS_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
        });
        if (resp.ok) {
          const blob = await resp.blob();
          generatedUrl = URL.createObjectURL(blob);
          const audio = new Audio(generatedUrl);
          generatedRef.current = audio;
          audio.onended = () => setAudioPlaying(false);
        }
      }
    } catch (e) { /* fallback */ }

    const newUsage = (subscription.characters_used || 0) + charCount;
    await base44.entities.Subscription.update(subscription.id, { characters_used: newUsage });
    setSubscription(prev => ({ ...prev, characters_used: newUsage }));

    await base44.entities.AudioRecord.update(record.id, { status: generatedUrl ? "completed" : "failed", audio_url: generatedUrl || "" });

    await base44.entities.ActivityLog.create({
      user_email: user.email,
      action: "audio_generated",
      details: `Gerou áudio com ${charCount} caracteres. Voz: ${selectedVoice?.name || "padrão"}`,
      entity_type: "AudioRecord",
      entity_id: record.id
    });

    setGenerating(false);
    setAudioUrl(generatedUrl || "no-url");
    setStep(3);
  };

  const resetAll = () => {
    setAudioUrl(null);
    setAudioPlaying(false);
    generatedRef.current = null;
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
                    {voice.preview_url && (
                      <button onClick={e => { e.stopPropagation(); togglePreview(voice); }}
                        className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                          playingId === voice.id ? "bg-secondary text-background" : "bg-muted text-muted-foreground hover:text-foreground"
                        )}>
                        {playingId === voice.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
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
          {/* Selected voice recap */}
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

          {/* Text Input */}
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
                <p className="font-semibold">Áudio Gerado</p>
                <p className="text-xs text-muted-foreground">{charCount} caracteres • {selectedVoice?.name}</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full">✓ Pronto</span>
              </div>
            </div>

            {/* Play Button */}
            <button
              onClick={toggleGenerated}
              disabled={!audioUrl || audioUrl === "no-url"}
              className={cn(
                "w-full flex items-center justify-center gap-3 py-4 rounded-xl mb-4 transition-all font-semibold",
                audioUrl && audioUrl !== "no-url"
                  ? audioPlaying ? "bg-secondary/20 border border-secondary/40 text-secondary" : "gradient-primary text-white glow-primary"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {audioPlaying ? <><Pause className="w-5 h-5" /> Pausar áudio</> : <><Play className="w-5 h-5" /> Ouvir áudio gerado</>}
            </button>

            {(!audioUrl || audioUrl === "no-url") && (
              <p className="text-xs text-center text-muted-foreground mb-4">Configure a chave ElevenLabs no painel admin para ouvir o áudio</p>
            )}

            {/* Download buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <a href={audioUrl && audioUrl !== "no-url" ? audioUrl : "#"} download="audio.mp3"
                className={cn("flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
                  audioUrl && audioUrl !== "no-url" ? "gradient-primary text-white glow-primary" : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                )}>
                <Download className="w-4 h-4" /> MP3
              </a>
              <a href={audioUrl && audioUrl !== "no-url" ? audioUrl : "#"} download="audio.wav"
                className={cn("flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
                  audioUrl && audioUrl !== "no-url" ? "bg-secondary/10 border border-secondary/30 text-secondary" : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                )}>
                <Download className="w-4 h-4" /> WAV
              </a>
            </div>

            <button onClick={resetAll} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium transition-all">
              <RotateCcw className="w-4 h-4" /> Não gostei — Gerar Novamente
            </button>
          </div>

          <AudioMixer generatedAudioUrl={audioUrl !== "no-url" ? audioUrl : null} />
        </div>
      )}
    </div>
  );
}