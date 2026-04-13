import { Outlet, Link } from "react-router-dom";
import BottomNav from "./BottomNav";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { LogOut, ShieldCheck, Mic2 } from "lucide-react";

export default function UserLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/20">
        <div className="flex items-center justify-between px-4 py-2 max-w-xl mx-auto">
          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full gradient-primary flex items-center justify-center glow-primary flex-shrink-0">
              <Mic2 className="w-4 h-4 text-white" />
              {user?.full_name && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-background">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-foreground hidden sm:block truncate max-w-[100px]">
              {user?.full_name?.split(" ")[0] || "Usuário"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="pt-14 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}