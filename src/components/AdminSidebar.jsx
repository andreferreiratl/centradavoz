import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CreditCard, FileText, AudioLines, Settings, Shield, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/users", icon: Users, label: "Usuários" },
  { path: "/admin/plans", icon: CreditCard, label: "Planos" },
  { path: "/admin/subscriptions", icon: FileText, label: "Assinaturas" },
  { path: "/admin/audios", icon: AudioLines, label: "Áudios" },
  { path: "/admin/settings", icon: Settings, label: "Configurações" },
  { path: "/admin/logs", icon: Shield, label: "Logs" },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <AudioLines className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg">VozPro</span>
            <span className="text-xs text-secondary font-semibold bg-secondary/10 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "gradient-primary text-white glow-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-3 right-3">
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Suporte WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
}