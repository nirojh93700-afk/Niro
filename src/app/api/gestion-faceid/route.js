// Entrée dans Gestion par Face ID (15/11/2026). Public, mais ne donne une clé que contre une signature valide
// d'un appareil déjà enregistré (Réglages › Appareils connectés).
import { NextResponse } from "next/server";
import { generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { getAdminDevices, modifierAdminDevices, ouvrirSessionAdmin } from "@/lib/stock";
import { rpDe, depuisB64, defiDeReponse } from "@/lib/faceIdServeur";

export const dynamic = "force-dynamic";

export async function POST(req) {
  let b = {};
  try { b = await req.json(); } catch { /* vide */ }
  const { rpID, origin } = rpDe(req);
  const d = await getAdminDevices();
  if (!d.devices.length) return NextResponse.json({ aucun: true, error: "Aucun appareil enregistré : entrez avec le mot de passe." }, { status: 404 });

  if (b.action === "options") {
    const opts = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
      allowCredentials: d.devices.map((x) => ({ id: x.id, transports: x.transports })),
    });
    await modifierAdminDevices((x) => ({ ...x, challenges: [...x.challenges, { c: opts.challenge, kind: "auth", exp: Date.now() + 3 * 60000 }] }));
    return NextResponse.json({ options: opts });
  }

  if (b.action === "verifier") {
    const response = b.response || {};
    const defi = defiDeReponse(response);
    if (!d.challenges.some((c) => c.c === defi && c.kind === "auth" && c.exp > Date.now())) {
      return NextResponse.json({ error: "Demande expirée, recommencez." }, { status: 400 });
    }
    const dev = d.devices.find((x) => x.id === response.id);
    if (!dev) return NextResponse.json({ error: "Cet appareil a été retiré. Entrez avec le mot de passe." }, { status: 401 });
    let v;
    try {
      v = await verifyAuthenticationResponse({
        response, expectedChallenge: defi, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true,
        credential: { id: dev.id, publicKey: depuisB64(dev.pk), counter: dev.counter || 0, transports: dev.transports },
      });
    } catch (e) {
      return NextResponse.json({ error: "Face ID refusé : " + (e.message || "erreur") }, { status: 401 });
    }
    if (!v.verified) return NextResponse.json({ error: "Face ID refusé." }, { status: 401 });
    await modifierAdminDevices((x) => ({
      ...x,
      challenges: x.challenges.filter((c) => c.c !== defi),
      devices: x.devices.map((y) => (y.id === dev.id ? { ...y, counter: v.authenticationInfo.newCounter } : y)),
    }));
    const key = await ouvrirSessionAdmin(dev.id);
    return NextResponse.json({ ok: true, key });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
