import { cn } from "@/lib/utils";

const statusConfig = {
  active: { label: "Ativo", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  expired: { label: "Vencido", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  cancelled: { label: "Cancelado", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  blocked: { label: "Bloqueado", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  processing: { label: "Processando", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  completed: { label: "Concluído", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  failed: { label: "Falhou", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      config.className
    )}>
      {config.label}
    </span>
  );
}