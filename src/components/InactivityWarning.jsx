import { Clock } from "lucide-react";

export default function InactivityWarning({ secondsLeft, onStayActive }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 max-w-sm w-full mx-4 border border-yellow-500/30 bg-yellow-500/5 text-center">
        <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-yellow-400" />
        </div>
        <h2 className="font-heading font-bold text-lg mb-2">Sessão prestes a expirar</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Por inatividade, você será deslogado em:
        </p>
        <p className="text-4xl font-heading font-bold text-yellow-400 my-4">{secondsLeft}s</p>
        <p className="text-xs text-muted-foreground mb-5">
          Deseja continuar usando a plataforma?
        </p>
        <button
          onClick={onStayActive}
          className="w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm transition-all active:scale-95"
        >
          Continuar sessão
        </button>
      </div>
    </div>
  );
}