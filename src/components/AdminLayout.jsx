import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, LogOut, AudioLines } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { base44 } from "@/api/base44Client";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 glass-card border-b border-border/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-muted-foreground hover:text-foreground">
                
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 lg:hidden">
                <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                  <AudioLines className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-heading font-bold">Central da VOZ - Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-xs text-muted-foreground hover:text-secondary transition-colors">
                
                Área do Usuário
              </button>
              <button
                onClick={() => base44.auth.logout()}
                className="text-muted-foreground hover:text-foreground transition-colors">
                
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>);

}