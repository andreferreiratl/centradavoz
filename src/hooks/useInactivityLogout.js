import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
const WARNING_BEFORE = 60 * 1000; // aviso 1 minuto antes

export default function useInactivityLogout() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const logoutTimer = useRef(null);
  const warningTimer = useRef(null);
  const countdownRef = useRef(null);

  const clearTimers = () => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warningTimer.current);
    clearInterval(countdownRef.current);
  };

  const resetTimers = () => {
    clearTimers();
    setShowWarning(false);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(60);
      countdownRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    logoutTimer.current = setTimeout(() => {
      base44.auth.logout();
    }, INACTIVITY_TIMEOUT);
  };

  const stayActive = () => {
    resetTimers();
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    const handler = () => resetTimers();

    events.forEach(e => window.addEventListener(e, handler));
    resetTimers();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearTimers();
    };
  }, []);

  return { showWarning, secondsLeft, stayActive };
}