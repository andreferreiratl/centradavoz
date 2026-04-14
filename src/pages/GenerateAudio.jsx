import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle, Download, Play, Pause, RotateCcw, Sparkles, UserCircle2, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSubscription } from "../lib/useSubscription";
import GradientButton from "../components/GradientButton";
import AudioMixer from "../components/AudioMixer";
import { cn } from "@/lib/utils";

export default function GenerateAudio() {
  const { subscription, loading, user, isActive, remainingChars, setSubscription } = useSubscription();
  const [voices, setVoices] = useState([]);
  const [voiceStyles, setVoiceStyles] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [selectedStyleId, setSelectedStyleId] = useState("");
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [hasResult, setHasResult] = useState(false);
  const [improving, setImproving] = useState(false);
  const generatedAudioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.ElevenLabsVoice.filter({ is_active: true }, "sort_order").then(setVoices);
    base44.auth.me().then((u) => {
      base44.entities.VoiceStyle.filter({ user_email: u.email, is_active: true }).then((styles) => {
        setVoiceStyles(styles);
        if (styles.length > 0) setSelectedStyleId(styles[0].id);
      });
    });
  }, []);

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId) || null;
  const charCount = text.length;

  function toggleGenerated() {
    const audio = generatedAudioRef.current;
    if (!audio) return;
    if (audioPlaying) {
      audio.pause();
      setAudioPlaying(false);
    } else {
      audio.play().then(() => setAudioPlaying(true)).catch(console.error);
    }
  }

  const handleImproveText = async () => {
    if (!text.trim() || improving) return;
    setImproving(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em copywriting e locução profissional. Melhore o texto abaixo para soar mais profissional, envolvente e impactante, mantendo a mensagem original e o mesmo idioma. Retorne apenas o texto melhorado, sem explicações.\n\nTexto:\n${text}`
    });
    if (result) setText(result);
    setImproving(false);
  };

  const handleGenerate = async () => {
    if (!isActive || charCount === 0 || charCount > remainingChars || !selectedVoice) return;
    setGenerating(true);
    setAudioUrl(null);
    setAudioPlaying(false);
    setError(null);
    setHasResult(false);

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
      const configs = await base44.entities.SystemConfig.filter({ key: "LMNT_API_KEY" });
      const apiKey = configs[0]?.value;

      if (!apiKey || !selectedVoice?.voice_id) {
        errorMsg = !apiKey ?
        "Chave da API LMNT não configurada. Acesse Admin → Configurações." :
        "Voice ID não definido para esta voz.";
      } else {
        const resp = await fetch("https://api.lmnt.com/v1/ai/speech", {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text,
            voice: selectedVoice.voice_id,
            format: "mp3"
          })
        });

        if (resp.ok) {
          const contentType = resp.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const json = await resp.json();
            // LMNT returns { audio: "base64...", ... }
            const b64 = json.audio;
            if (b64) {
              const binary = atob(b64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const blob = new Blob([bytes], { type: "audio/mpeg" });
              generatedUrl = URL.createObjectURL(blob);
            } else {
              errorMsg = json?.message || json?.error || "Resposta inesperada da API LMNT.";
            }
          } else {
            const arrayBuffer = await resp.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
            generatedUrl = URL.createObjectURL(blob);
          }
        } else {
          const body = await resp.json().catch(() => ({}));
          errorMsg = body?.message || body?.error || `Erro LMNT: ${resp.status}`;
        }
      }
    } catch (e) {
      errorMsg = "Erro ao conectar com a API LMNT. Verifique a chave e o Voice ID.";
    }

    const newUsage = (subscription.characters_used || 0) + charCount;
    await base44.entities.Subscription.update(subscription.id, { characters_used: newUsage });
    setSubscription((prev) => ({ ...prev, characters_used: newUsage }));

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
    setHasResult(true);
  };

  const resetResult = () => {
    if (generatedAudioRef.current) {
      generatedAudioRef.current.pause();
    }
    setAudioUrl(null);
    setAudioPlaying(false);
    setError(null);
    setHasResult(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>);


  return (
    <div className="px-4 pt-4 pb-28 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-heading text-xl font-bold">Gerar Locução</h1>
        </div>
        <img
          src="https://media.base44.com/images/public/69da50375cc9660ed0fab63a/c9d2e48da_file_000000009a48720eaaa61bf4a204e45c.png"
          alt="Central da Voz"
          className="h-8 w-auto object-contain" />
        
      </div>

      {/* Access Warning */}
      {!isActive &&
      <div className="glass-card rounded-2xl p-4 mb-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-400">Acesso Restrito</p>
              <p className="text-xs text-muted-foreground mt-1">Você precisa de um plano ativo para gerar locuções.</p>
              <Link to="/plans"><GradientButton size="sm" className="font-heading font-semibold rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none px-4 py-2 text-sm gradient-primary hover:gradient-primary-hover text-white glow-primary mt-2">Ver Planos</GradientButton></Link>
            </div>
          </div>
        </div>
      }

      {/* Configurações da Voz */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle2 className="w-5 h-5 text-primary" />
          <span className="font-heading font-semibold text-base">Configurações da Voz</span>
        </div>

        <div className="mb-3">
          <label className="block text-[10px] font-bold tracking-widest text-muted-foreground mb-1.5 uppercase">Lista de locutores</label>
          <select
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer">
            
            <option value="">— Selecione uma voz —</option>
            {voices.map((v) =>
            <option key={v.id} value={v.id}>
                {v.gender?.toUpperCase() === "MASCULINA" ? "MASCULINO" : v.gender?.toUpperCase() === "FEMININA" ? "FEMININO" : v.gender?.toUpperCase() || ""}{v.gender ? " - " : ""}{v.name.toUpperCase()}
              </option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold tracking-widest text-muted-foreground mb-1.5 uppercase">Tom da Voz</label>
          {voiceStyles.length > 0 ?
          <select
            value={selectedStyleId}
            onChange={(e) => setSelectedStyleId(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer">
            
              <option value="">— Selecione um tom —</option>
              {voiceStyles.map((s) =>
            <option key={s.id} value={s.id}>
                  {[s.style, s.tone].filter(Boolean).join(" - ").toUpperCase() || s.description?.toUpperCase().slice(0, 60)}
                </option>
            )}
            </select> :

          <div className="w-full bg-muted border border-border rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Nenhum estilo definido</span>
              <Link to="/voice-assistant" className="text-xs text-secondary hover:underline font-medium">Definir</Link>
            </div>
          }
        </div>
      </div>

      {/* Roteiro / Texto */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading font-semibold text-base">Roteiro / Texto</span>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium", charCount > remainingChars ? "text-red-400" : "text-muted-foreground")}>
              {charCount.toLocaleString()} / {remainingChars.toLocaleString()} CARACTERES
            </span>
            <button
              onClick={handleImproveText}
              disabled={!text.trim() || improving}
              title="Melhorar texto com IA"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              
              {improving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              {improving ? "Melhorando..." : "IA"}
            </button>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite ou cole o texto que deseja transformar em áudio profissional..."
          className="w-full bg-muted rounded-xl p-3 text-sm min-h-[180px] outline-none resize-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/30 transition-all leading-relaxed"
          disabled={!isActive} />
        
      </div>

      {/* Gerar Áudio Button */}
      <GradientButton
        onClick={handleGenerate}
        disabled={!isActive || charCount === 0 || charCount > remainingChars || generating || !selectedVoice}
        className={cn("w-full mb-4", generating && "animate-pulse-glow")}
        size="lg">
        
        {generating ?
        <><Loader2 className="w-5 h-5 mr-2 inline animate-spin" />Gerando áudio...</> :

        <><Sparkles className="w-5 h-5 mr-2 inline" />Gerar Áudio</>
        }
      </GradientButton>

      {/* Resultado */}
      {hasResult &&
      <div className="glass-card rounded-2xl p-4">
          <h3 className="font-heading font-semibold text-base mb-4">Resultado</h3>

          {error &&
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-400 leading-relaxed">{error}</p>
            </div>
        }

          {audioUrl &&
        <>
              <audio
            ref={generatedAudioRef}
            src={audioUrl}
            onEnded={() => setAudioPlaying(false)}
            preload="auto"
            style={{ display: "none" }} />
          

              <button
            onClick={toggleGenerated}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-4 rounded-xl mb-3 transition-all font-semibold",
              audioPlaying ?
              "bg-secondary/20 border border-secondary/40 text-secondary" :
              "gradient-primary text-white glow-primary"
            )}>
            
                {audioPlaying ?
            <><Pause className="w-5 h-5" /> Pausar áudio</> :
            <><Play className="w-5 h-5" /> Ouvir áudio gerado</>
            }
              </button>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <a href={audioUrl} download="audio.mp3"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium gradient-primary text-white transition-all">
                  <Download className="w-4 h-4" /> Baixar MP3
                </a>
                <a href={audioUrl} download="audio.wav"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-secondary/10 border border-secondary/30 text-secondary transition-all">
                  <Download className="w-4 h-4" /> Baixar WAV
                </a>
              </div>

              <AudioMixer generatedAudioUrl={audioUrl} />
            </>
        }

          <button
          onClick={resetResult}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium transition-all mt-3">
          
            <RotateCcw className="w-4 h-4" /> Gerar Novamente
          </button>
        </div>
      }
    </div>);

}