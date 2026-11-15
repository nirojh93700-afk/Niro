"use client";
// =============================================================================
// GESTION → RÉGLAGES → FACTURE ÉLECTRONIQUE (15/11/2026, maquette « Niv Admin »)
// Ce qui change en 2026 et 2027 pour une micro-entreprise, et ce qui est prêt. Dates vérifiées le 15/11/2026 :
// réception obligatoire pour toutes les entreprises le 1er septembre 2026 ; émission obligatoire pour les PME et
// micro-entreprises le 1er septembre 2027, par une « plateforme agréée » (ex-PDP) choisie par l'entreprise
// (sources : entreprendre.service-public.fr/actualites/A18759, economie.gouv.fr). Rien ne se branche ici tant
// que le gérant n'a pas choisi sa plateforme.
// =============================================================================
import Link from "next/link";
import PageHead from "@/components/admin/PageHead";

const auj = new Date();
const passee = (d) => auj >= d;

export default function FactureElectroniquePage() {
  const reception = new Date("2026-09-01T00:00:00");
  const emission = new Date("2027-09-01T00:00:00");
  const jours = Math.max(0, Math.ceil((emission - auj) / 86400000));
  return (
    <div className="fq">
      <PageHead eyebrow="Réglages" title="Facture électronique"
        subtitle="La loi change pour toutes les entreprises, micro-entrepreneurs compris. Dates vérifiées le 15/11/2026 sur service-public.fr et economie.gouv.fr."
        kpis={[
          { label: "Recevoir des factures électroniques", value: passee(reception) ? "Obligatoire" : "1/9/2026", sub: "depuis le 1er septembre 2026", tone: "warn" },
          { label: "Émettre vos factures", value: "1/9/2027", sub: `dans ${jours} jours` },
        ]} />
      <div className="ef-tl">
        <div className={`ef-s${passee(reception) ? " done" : ""}`}><b>1er septembre 2026</b><span>Pouvoir <b>recevoir</b> des factures électroniques de vos fournisseurs.</span><em>À faire : choisir une plateforme agréée (plusieurs proposent la réception gratuitement) et la donner à vos fournisseurs qui la demandent.</em></div>
        <div className="ef-s"><b>1er septembre 2027</b><span><b>Émettre</b> vos factures en électronique, par une plateforme agréée.</span><em>Le site enverra vos factures et vos devis payés à cette plateforme : vous ne retaperez rien.</em></div>
      </div>
      <section className="cp-box" style={{ marginTop: 14 }}><h3>Ce qui est prêt</h3>
        <ul className="cp-ech">
          <li><b>Numéros</b><span>Devis et factures numérotés à la suite, sans trou (Gestion › Commandes › Devis & factures).</span></li>
          <li><b>Mentions</b><span>SIRET 105 914 774 00010, adresse, « TVA non applicable, art. 293 B du CGI » sur les devis et factures.</span></li>
          <li><b>Classeur</b><span>Les factures reçues sont gardées 10 ans dans leur fichier d&apos;origine, avec une empreinte.</span><Link className="fq-btn sm ghost" href="/gestion/achats">Ouvrir</Link></li>
          <li className="warn"><b>Plateforme</b><span>À choisir avec vous avant l&apos;été 2027. Un rappel apparaîtra dans « Comptabilité » à partir du 1er mars 2027.</span></li>
        </ul>
      </section>
      <p className="cp-sub" style={{ marginTop: 12 }}>À vérifier le moment venu : les obligations de transmission des ventes aux particuliers (« e-reporting ») pour une micro-entreprise en franchise de TVA, et leur date.</p>
    </div>
  );
}
