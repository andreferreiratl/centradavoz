import { createClient } from "@base44/sdk";
import { appId, token, functionsVersion, appBaseUrl } from "@/lib/app-params";

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: 'https://centraldavoz.base44.app',
  requiresAuth: false,
  appBaseUrl
});