import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AudioLines, FileText, CreditCard, Zap, Plus, AlertTriangle, Mic2, RotateCcw } from "lucide-react";
import Logo from "../components/Logo";
import { base44 } from "@/api/base44Client";
import { useSubscription } from "../lib/useSubscription";
import StatCard from "../components/StatCard";
import GradientButton from "../components/GradientButton";
import StatusBadge from "../components/StatusBadge";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { subscription, loading, user, isActive, remainingChars } = useSubscription();
  const [audioCount, setAudioCount] = useState(0);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function loadAudios() {
      if (!user) return;
      const audios = await base44.entities.AudioRecord.filter({ user_email: user.email });
      setAudioCount(audios.length);
    }
    if (user) loadAudios();
  }, [user]);

  const handleReset = async () => {
    if (!confirm("Zerar todos os áudios gerados e caracteres utilizados? Esta ação não pode ser desfeita.")) return;
    setResetting(true);
    const audios = await base44.entities.AudioRecord.filter({ user_email: user.email });
    for (const a of audios) await base44.entities.AudioRecord.delete(a.id);
    if (subscription) await base44.entities.Subscription.update(subscription.id, { characters_used: 0 });
    setAudioCount(0);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const usagePercent = subscription
    ? Math.min(100, ((subscription.characters_used || 0) / subscription.character_limit) * 100)
    : 0;

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Logo />
        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <Link to="/admin" className="text-xs text-secondary hover:underline">Admin</Link>
          )}
          <div className="relative w-10 h-10 rounded-full gradient-primary flex items-center justify-center glow-primary flex-shrink-0">
            <Mic2 className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-background">
              {(user?.full_name || "U")[0].toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription Warning */}
      {!isActive && (
        <div className="glass-card rounded-2xl p-4 mb-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-400">Assinatura Inativa</p>
              <p className="text-xs text-muted-foreground mt-1">
                {subscription ? "Sua assinatura expirou." : "Você não possui um plano ativo."} Assine um plano para começar a gerar áudios.
              </p>
              <Link to="/plans">
                <GradientButton size="sm" className="mt-3">Ver Planos</GradientButton>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={AudioLines} label="Áudios Criados" value={audioCount} />
        <StatCard icon={FileText} label="Caracteres Usados" value={(subscription?.characters_used || 0).toLocaleString()} glowColor="secondary" />
        <StatCard icon={Zap} label="Limite Disponível" value={remainingChars.toLocaleString()} />
        <StatCard icon={CreditCard} label="Plano Atual" value={subscription?.plan_name || "Nenhum"} glowColor="secondary" />
      </div>

      {/* Usage Bar */}
      {subscription && (
        <div className="glass-card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Uso de Caracteres</span>
            <span className="text-xs text-muted-foreground">{usagePercent.toFixed(0)}%</span>
          </div>
          <Progress value={usagePercent} className="h-2 bg-muted [&>[data-state=complete]]:gradient-primary [&>div]:gradient-primary" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{(subscription.characters_used || 0).toLocaleString()} usados</span>
            <span className="text-xs text-muted-foreground">{subscription.character_limit.toLocaleString()} total</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <StatusBadge status={subscription.status} />
          </div>
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={handleReset}
        disabled={resetting}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted hover:bg-destructive/10 border border-border hover:border-destructive/30 text-muted-foreground hover:text-destructive text-sm font-medium transition-all mb-3 disabled:opacity-50"
      >
        <RotateCcw className="w-4 h-4" />
        {resetting ? "Zerando..." : "Zerar áudios e caracteres"}
      </button>

      {/* Quick Actions */}
      <Link to="/generate">
        <div className="gradient-primary rounded-2xl p-5 flex items-center justify-between glow-primary active:scale-[0.98] transition-transform">
          <div>
            <h3 className="font-heading font-bold text-lg text-white">Clique aqui e gere sua Locução!</h3>
            <p className="text-white/70 text-sm">Transforme texto em voz profissional</p>
          </div>
          <Plus className="w-8 h-8 text-white" />
        </div>
      </Link>
    </div>
  );
}