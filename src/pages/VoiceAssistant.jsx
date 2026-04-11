import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Mic, Check, ArrowLeft, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import GradientButton from "../components/GradientButton";
import { cn } from "@/lib/utils";

const suggestions = [
  "Voz masculina grave comercial",
  "Voz feminina suave emocional",
  "Voz animada para redes sociais",
  "Voz séria e profissional para corporativo",
  "Voz alegre e dinâmica para podcast",
];

export default function VoiceAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Olá! Sou seu assistente de voz. Descreva como deseja que sua locução soe e eu vou te ajudar a definir o estilo perfeito. 🎙️"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [styleResult, setStyleResult] = useState(null);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const conversationHistory = [...messages, userMsg]
      .map(m => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
      .join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um assistente especializado em definir estilos de locução de voz para geração de áudio com IA.

Conversa até agora:
${conversationHistory}

Com base na conversa, responda ao usuário de forma amigável e sugira um estilo de voz.
Se tiver informações suficientes, retorne o estilo definido em JSON.
Se precisar de mais detalhes, faça perguntas.

Sempre responda em português brasileiro.`,
      response_json_schema: {
        type: "object",
        properties: {
          message: { type: "string", description: "Sua resposta ao usuário" },
          style_ready: { type: "boolean", description: "Se o estilo está definido" },
          style: {
            type: "object",
            properties: {
              tone: { type: "string" },
              rhythm: { type: "string" },
              emotion: { type: "string" },
              style: { type: "string" },
              description: { type: "string" }
            }
          }
        }
      }
    });

    setMessages(prev => [...prev, { role: "assistant", content: result.message }]);
    
    if (result.style_ready && result.style) {
      setStyleResult(result.style);
    }
    setIsLoading(false);
  };

  const saveStyle = async () => {
    if (!styleResult) return;
    const user = await base44.auth.me();
    
    // Deactivate old styles
    const oldStyles = await base44.entities.VoiceStyle.filter({ user_email: user.email, is_active: true });
    for (const s of oldStyles) {
      await base44.entities.VoiceStyle.update(s.id, { is_active: false });
    }
    
    await base44.entities.VoiceStyle.create({
      user_email: user.email,
      tone: styleResult.tone,
      rhythm: styleResult.rhythm,
      emotion: styleResult.emotion,
      style: styleResult.style,
      description: styleResult.description,
      is_active: true
    });
    
    navigate("/generate");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="glass-card border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-heading font-semibold text-sm">Assistente de Voz</p>
            <p className="text-[10px] text-secondary">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              msg.role === "user"
                ? "gradient-primary text-white rounded-br-sm"
                : "glass-card rounded-bl-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Style Result Card */}
        {styleResult && (
          <div className="glass-card rounded-2xl p-4 border-primary/30">
            <p className="text-xs text-secondary font-semibold uppercase tracking-wider mb-3">Estilo Definido</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: "Tom", value: styleResult.tone },
                { label: "Ritmo", value: styleResult.rhythm },
                { label: "Emoção", value: styleResult.emotion },
                { label: "Estilo", value: styleResult.style },
              ].map((item, i) => (
                <div key={i} className="bg-muted rounded-xl p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                  <p className="text-sm font-medium">{item.value || "—"}</p>
                </div>
              ))}
            </div>
            <GradientButton onClick={saveStyle} className="w-full">
              <Check className="w-4 h-4 mr-2 inline" />
              Usar esse estilo
            </GradientButton>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 bg-gradient-to-t from-background via-background to-transparent pt-4">
        <div className="flex items-center gap-2 glass-card rounded-2xl p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Descreva como deseja a locução..."
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center disabled:opacity-50 transition-all active:scale-90"
          >
            {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}