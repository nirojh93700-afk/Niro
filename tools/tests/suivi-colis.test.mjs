// Lien de suivi des colis (14/10/2026). `npm run test-suivi`.
import { lienSuivi, estNumeroLaPoste } from "@/lib/suiviColis";
let ok = 0, ko = 0;
const v = (c, m) => { if (c) ok++; else { ko++; console.log("✗", m); } };
v(estNumeroLaPoste("1L01234567890"), "lettre suivie reconnue");
v(estNumeroLaPoste("6A 1234 5678 901"), "Colissimo avec espaces reconnu");
v(estNumeroLaPoste("ll123456789fr"), "format international en minuscules reconnu");
v(!estNumeroLaPoste("12345678"), "Mondial Relay (8 chiffres) : pas La Poste");
const l = lienSuivi("6A12345678901");
v(l.nom === "La Poste" && l.url === "https://www.laposte.fr/outils/suivre-vos-envois?code=6A12345678901", "lien La Poste avec le numéro dedans");
v(lienSuivi("12345678").nom === "Boxtal", "autre numéro → Boxtal comme avant");
v(lienSuivi("") === null && lienSuivi(null) === null, "pas de numéro → pas de lien");
console.log(`${ok}/${ok + ko} vérifications au vert`);
if (ko) process.exit(1);
