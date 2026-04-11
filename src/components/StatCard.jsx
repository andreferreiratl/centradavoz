import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, subtitle, className, glowColor = "primary" }) {
  return (
    <div className={cn("glass-card rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-heading font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            glowColor === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}