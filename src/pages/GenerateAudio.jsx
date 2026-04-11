import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Sparkles, Loader2, AlertTriangle, RefreshCw, Download, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSubscription } from "../lib/useSubscription";
import GradientButton from "../components/GradientButton";
import AudioPlayer from "../components/AudioPlayer";
import AudioMixer from "../components/AudioMixer";
import Logo from "../components/Logo";
import { cn } from "@/lib/utils";

export default function GenerateAudio() {
  const { subscription, loading, user, isActive, remainingChars, setSubscription } = useSubscription();
  const [text, setText] = useState("");
  const [voiceGender, setVoiceGender] = useState("feminina");
  const [activeStyle, setActiveStyle] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStyle() {
      if (!user) return;
      const styles = await base44.entities.VoiceStyle.filter({ user_email: user.email, is_active: true }, "-created_date", 1);
      if (styles.length > 0) setActiveStyle(styles[0]);
    }
    if (user) loadStyle();
  }, [user]);

  const charCount = text.length;

  const handleGenerate = async () => {
    if (!isActive || charCount === 0 || charCount > remainingChars) return;
    
    setGenerating(true);
    setAudioUrl(null);

    const styleDesc = activeStyle
      ? `Estilo: Tom ${activeStyle.tone}, Ritmo ${activeStyle.rhythm}, Emoção ${activeStyle.emotion}, ${activeStyle.style}. `
      : "";

    // Create audio record
    const record = await base44.entities.AudioRecord.create({
      user_email: user.email,
      text: text,
      character_count: charCount,
      voice_style: activeStyle?.description || "Padrão",
      voice_gender: voiceGender,
      status: "processing"
    });

    // Generate audio via LLM (simulated - in production would use a TTS API)
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um sistema de geração de áudio TTS. O usuário solicitou a geração de um áudio com as seguintes configurações:
      
${styleDesc}
Voz: ${voiceGender}
Texto: "${text}"

Responda com uma confirmação de que o áudio foi gerado com sucesso, descrevendo brevemente como ele soa.`,
      response_json_schema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          description: { type: "string" }
        }
      }
    });

    // Update character usage
    const newUsage = (subscription.characters_used || 0) + charCount;
    await base44.entities.Subscription.update(subscription.id, { characters_used: newUsage });
    setSubscription(prev => ({ ...prev, characters_used: newUsage }));

    // Update audio record
    await base44.entities.AudioRecord.update(record.id, {
      status: "completed",
      audio_url: ""
    });

    // Log activity
    await base44.entities.ActivityLog.create({
      user_email: user.email,
      action: "audio_generated",
      details: `Gerou áudio com ${charCount} caracteres. Voz: ${voiceGender}`,
      entity_type: "AudioRecord",
      entity_id: record.id
    });

    setGenerating(false);
    // Note: In production, audioUrl would come from a real TTS API
    setAudioUrl("generated");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-heading text-xl font-bold">Gerar Áudio</h1>
        </div>
        <Logo size="sm" />
      </div>

      {/* Access Warning */}
      {!isActive && (
        <div className="glass-card rounded-2xl p-4 mb-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-400">Acesso Restrito</p>
              <p className="text-xs text-muted-foreground mt-1">Você precisa de um plano ativo para gerar áudios.</p>
              <Link to="/plans">
                <GradientButton size="sm" className="mt-2">Ver Planos</GradientButton>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Voice Style */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Estilo de Voz</span>
          </div>
          <Link to="/voice-assistant" className="text-xs text-secondary hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Alterar
          </Link>
        </div>
        {activeStyle ? (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Tom", value: activeStyle.tone },
              { label: "Ritmo", value: activeStyle.rhythm },
              { label: "Emoção", value: activeStyle.emotion },
              { label: "Estilo", value: activeStyle.style },
            ].map((item, i) => (
              <div key={i} className="bg-muted rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                <p className="text-xs font-medium truncate">{item.value || "—"}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground mb-2">Nenhum estilo definido</p>
            <Link to="/voice-assistant">
              <GradientButton size="sm">Definir Estilo de Voz</GradientButton>
            </Link>
          </div>
        )}
      </div>

      {/* Voice Gender */}
      <div className="flex gap-2 mb-4">
        {[
          { value: "feminina", label: "Feminina", icon: "♀" },
          { value: "masculina", label: "Masculina", icon: "♂" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setVoiceGender(opt.value)}
            className={cn(
              "flex-1 glass-card rounded-xl p-3 text-center transition-all duration-200",
              voiceGender === opt.value ? "border-primary/50 bg-primary/10 glow-primary" : ""
            )}
          >
            <span className="text-xl block mb-1">{opt.icon}</span>
            <span className="text-xs font-medium">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Text Input */}
      <div className="glass-card rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Texto para Locução</span>
          <span className={cn(
            "text-xs font-medium",
            charCount > remainingChars ? "text-red-400" : "text-muted-foreground"
          )}>
            {charCount.toLocaleString()} / {remainingChars.toLocaleString()}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite ou cole o texto que deseja transformar em áudio..."
          className="w-full bg-muted rounded-xl p-3 text-sm min-h-[180px] outline-none resize-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/30 transition-all"
          disabled={!isActive}
        />
      </div>

      {/* Generate Button */}
      <GradientButton
        onClick={handleGenerate}
        disabled={!isActive || charCount === 0 || charCount > remainingChars || generating}
        className={cn("w-full", generating && "animate-pulse-glow")}
        size="lg"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 inline animate-spin" />
            Gerando áudio...
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 mr-2 inline" />
            Gerar Áudio
          </>
        )}
      </GradientButton>

      {/* Audio Result */}
      {audioUrl && (
        <div className="mt-6">
          <p className="text-sm font-semibold mb-3 text-secondary">✅ Áudio Gerado com Sucesso!</p>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Áudio processado</p>
                <p className="text-xs text-muted-foreground">{charCount} caracteres • Voz {voiceGender}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <a
                href={audioUrl !== "generated" ? audioUrl : "#"}
                download="audio.mp3"
                className={cn("flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                  audioUrl !== "generated"
                    ? "gradient-primary text-white glow-primary"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Download className="w-4 h-4" /> Baixar MP3
              </a>
              <a
                href={audioUrl !== "generated" ? audioUrl : "#"}
                download="audio.wav"
                className={cn("flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                  audioUrl !== "generated"
                    ? "bg-secondary/10 border border-secondary/30 text-secondary"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Download className="w-4 h-4" /> Baixar WAV
              </a>
            </div>

            <button
              onClick={() => { setAudioUrl(null); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Gerar Novamente
            </button>
          </div>

          {/* Mixer */}
          <AudioMixer generatedAudioUrl={audioUrl} />
        </div>
      )}
    </div>
  );
}