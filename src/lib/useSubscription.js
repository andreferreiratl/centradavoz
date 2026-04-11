import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const subs = await base44.entities.Subscription.filter(
          { user_email: me.email, status: "active" },
          "-created_date",
          1
        );
        if (subs.length > 0) {
          const sub = subs[0];
          // Check if expired
          if (sub.expiration_date && new Date(sub.expiration_date) < new Date()) {
            await base44.entities.Subscription.update(sub.id, { status: "expired" });
            sub.status = "expired";
          }
          setSubscription(sub);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isActive = subscription?.status === "active";
  const remainingChars = subscription ? subscription.character_limit - (subscription.characters_used || 0) : 0;

  return { subscription, loading, user, isActive, remainingChars, setSubscription };
}