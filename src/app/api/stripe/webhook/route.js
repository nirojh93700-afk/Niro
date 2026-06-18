// Alias : Stripe est configuré pour appeler /api/stripe/webhook, alors que le
// gestionnaire réel est dans /api/webhooks/stripe. On réexporte le même
// gestionnaire ici pour que les deux URL fonctionnent (évite le 404 côté Stripe).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export { POST } from "../../webhooks/stripe/route";
