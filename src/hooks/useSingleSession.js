import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

const CHECK_INTERVAL = 30 * 1000; // verifica a cada 30 segundos

function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function useSingleSession() {
  const tokenRef = useRef(null);

  useEffect(() => {
    let intervalId = null;

    async function init() {
      const user = await base44.auth.me();
      if (!user) return;

      // Gera token único para esta sessão e grava no banco
      const token = generateToken();
      tokenRef.current = token;
      await base44.auth.updateMe({ session_token: token });

      // Verifica periodicamente se o token ainda é o mesmo
      intervalId = setInterval(async () => {
        const fresh = await base44.auth.me();
        if (!fresh) return;

        if (fresh.session_token !== tokenRef.current) {
          // Outro dispositivo logou — desloga sem aviso
          clearInterval(intervalId);
          base44.auth.logout();
        }
      }, CHECK_INTERVAL);
    }

    init();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}