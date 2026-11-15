// Réglages › Appareils connectés (15/11/2026) : liste, activer Face ID sur cet appareil, retirer, tout déconnecter.
import { NextResponse } from "next/server";
import { generateRegistrationOptions, verifyRegistrationResponse } from "@simplewebauthn/server";
import { isAdmin, getAdminDevices, modifierAdminDevices, appareilDuJeton, ouvrirSessionAdmin } from "@/lib/stock";
import { rpDe, nomAppareil, versB64, defiDeReponse } from "@/lib/faceIdServeur";

export const dynamic = "force-dynamic";

function liste(d, cet) {
  return {
    devices: d.devices.map((x) => ({ id: x.id, nom: x.nom, at: x.at, lastAt: x.lastAt || null, cet: x.id === cet })),
    vus: [...d.vus].reverse(),
  };
}

export async function GET(req) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const d = await getAdminDevices();
  return NextResponse.json(liste(d, await appareilDuJeton(req.headers.get("x-admin-key"))));
}

export async function POST(req) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  let b = {};
  try { b = await req.json(); } catch { /* vide */ }
  const { rpID, origin } = rpDe(req);
  const ua = req.headers.get("user-agent") || "";

  if (b.action === "vu") {
    const nom = nomAppareil(ua) + (b.app ? " · Niv Admin" : "");
    const at = new Date().toISOString();
    await modifierAdminDevices((d) => {
      const autres = d.vus.filter((v) => v.nom !== nom);
      return { ...d, vus: [...autres, { nom, at, mode: "mdp" }] };
    });
    return NextResponse.json({ ok: true });
  }

  if (b.action === "options") {
    const d = await getAdminDevices();
    const opts = await generateRegistrationOptions({
      rpName: "Niv Création — Gestion",
      rpID,
      userName: "gestion",
      userDisplayName: "Niv Création",
      userID: new TextEncoder().encode("niv-gestion"),
      attestationType: "none",
      excludeCredentials: d.devices.map((x) => ({ id: x.id, transports: x.transports })),
      authenticatorSelection: { residentKey: "preferred", userVerification: "required", authenticatorAttachment: "platform" },
    });
    await modifierAdminDevices((x) => ({ ...x, challenges: [...x.challenges, { c: opts.challenge, kind: "reg", exp: Date.now() + 5 * 60000 }] }));
    return NextResponse.json({ options: opts });
  }

  if (b.action === "inscrire") {
    const response = b.response;
    const defi = defiDeReponse(response || {});
    const d = await getAdminDevices();
    if (!d.challenges.some((c) => c.c === defi && c.kind === "reg" && c.exp > Date.now())) {
      return NextResponse.json({ error: "Demande expirée : touchez de nouveau « Activer Face ID »." }, { status: 400 });
    }
    let v;
    try {
      v = await verifyRegistrationResponse({ response, expectedChallenge: defi, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true });
    } catch (e) {
      return NextResponse.json({ error: "Face ID n'a pas pu être enregistré : " + (e.message || "erreur") }, { status: 400 });
    }
    if (!v.verified || !v.registrationInfo) return NextResponse.json({ error: "Face ID n'a pas pu être vérifié." }, { status: 400 });
    const cred = v.registrationInfo.credential;
    const at = new Date().toISOString();
    const nom = String(b.nom || "").trim().slice(0, 60) || nomAppareil(ua) + (b.app ? " · Niv Admin" : "");
    await modifierAdminDevices((x) => ({
      ...x,
      challenges: x.challenges.filter((c) => c.c !== defi),
      devices: [...x.devices.filter((y) => y.id !== cred.id), { id: cred.id, pk: versB64(cred.publicKey), counter: cred.counter || 0, transports: cred.transports || response.response?.transports || [], nom, at, lastAt: at }],
    }));
    // Cet appareil continue avec un jeton (il ne garde plus le mot de passe en mémoire).
    const jeton = await ouvrirSessionAdmin(cred.id);
    return NextResponse.json({ ok: true, id: cred.id, key: jeton });
  }

  if (b.action === "retirer" && b.id) {
    await modifierAdminDevices((x) => ({ ...x, devices: x.devices.filter((y) => y.id !== b.id) }));
    return NextResponse.json({ ok: true });
  }

  if (b.action === "tout") {
    await modifierAdminDevices((x) => ({ ...x, devices: [], sessions: [], challenges: [] }));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
