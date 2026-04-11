import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Zap, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import GradientButton from "../components/GradientButton";
import { cn } from "@/lib/utils";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await base44.entities.Plan.filter({ is_active: true }, "sort_order");
      setPlans(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading text-xl font-bold">Planos</h1>
      </div>

      <p className="text-muted-foreground text-sm mb-6">
        Escolha o plano ideal para suas necessidades
      </p>

      <div className="space-y-4">
        {plans.map((plan, i) => (
          <div
            key={plan.id}
            className={cn(
              "glass-card rounded-2xl p-5 transition-all",
              i === 1 && "border-primary/40 glow-primary"
            )}
          >
            {i === 1 && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full gradient-primary text-xs font-semibold text-white mb-3">
                <Zap className="w-3 h-3" />
                Popular
              </div>
            )}
            
            <h3 className="font-heading text-lg font-bold">{plan.name}</h3>
            <div className="flex items-baseline gap-1 my-2">
              <span className="text-3xl font-heading font-bold">R${plan.price?.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">/{plan.duration_label || "mês"}</span>
            </div>
            
            <p className="text-xs text-secondary mb-4">
              {plan.character_limit?.toLocaleString()} caracteres
            </p>

            <div className="space-y-2 mb-5">
              {(plan.benefits || []).map((b, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{b}</span>
                </div>
              ))}
            </div>

            <a
              href="https://wa.me/?text=Olá! Gostaria de assinar o plano " 
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <GradientButton className="w-full" variant={i === 1 ? "primary" : "secondary"}>
                Assinar
              </GradientButton>
            </a>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-16">
          <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum plano disponível no momento</p>
        </div>
      )}

      {/* Support */}
      <div className="mt-8 text-center">
        <p className="text-xs text-muted-foreground mb-3">Dúvidas sobre os planos?</p>
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GradientButton variant="secondary" size="sm">
            <MessageCircle className="w-4 h-4 mr-2 inline" />
            Falar com Suporte
          </GradientButton>
        </a>
      </div>
    </div>
  );
}