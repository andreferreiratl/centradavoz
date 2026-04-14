import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

const isMobile = () => /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

export default function InstallAppBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (!isMobile()) return;

    // Já instalou antes?
    if (localStorage.getItem("app_installed")) return;

    // Captura o evento de instalação PWA (Android/Chrome)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS não dispara beforeinstallprompt — mostra banner informativo mesmo assim
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone === true;
    if (isIOS && !isInStandaloneMode) {
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem("app_installed", "1");
        setShow(false);
      }
    }
  };

  const dismiss = () => {
    // Fechar sem instalar — aparece novamente no próximo login
    setShow(false);
  };

  if (!show) return null;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="glass-card rounded-2xl p-4 border border-primary/30 shadow-xl">
        <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 pr-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 glow-primary">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold font-heading">Instale o App!</p>
            {isIOS && !deferredPrompt ? (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Toque em <span className="text-secondary font-semibold">Compartilhar</span> e depois <span className="text-secondary font-semibold">"Adicionar à Tela de Início"</span> para acesso rápido.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">
                Adicione Central da Voz à sua tela inicial para acesso rápido.
              </p>
            )}
          </div>
        </div>
        {deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full mt-3 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold transition-all active:scale-95"
          >
            Instalar agora
          </button>
        )}
      </div>
    </div>
  );
}