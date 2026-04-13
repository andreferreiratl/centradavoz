import { Outlet, Link } from "react-router-dom";
import BottomNav from "./BottomNav";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { LogOut, ShieldCheck } from "lucide-react";

export default function UserLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/20">
        <div className="flex items-center justify-between px-4 py-2 max-w-xl mx-auto">
          



          
          <div className="flex items-center gap-2">
            {isAdmin &&
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold transition-all">
              
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </Link>
            }
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold transition-all">
              
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
    </div>);

}