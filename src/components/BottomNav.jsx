import { Link, useLocation } from "react-router-dom";
import { Home, Mic, AudioLines, Library, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Início" },
  { path: "/voice-assistant", icon: Mic, label: "Assistente" },
  { path: "/generate", icon: AudioLines, label: "Gerar" },
  { path: "/library", icon: Library, label: "Biblioteca" },
  { path: "/plans", icon: CreditCard, label: "Planos" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/30 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 min-w-[56px]",
                isActive
                  ? "text-secondary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all duration-300",
                isActive && "gradient-primary glow-primary"
              )}>
                <Icon className={cn("w-5 h-5", isActive && "text-white")} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}