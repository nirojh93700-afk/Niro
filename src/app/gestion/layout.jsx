import AdminShell from "@/components/admin/AdminShell";

// Métadonnées de l'APPLICATION ADMIN (raccourci écran d'accueil → ouvre direct la gestion en
// plein écran, comme une app). 02/10/2026 : ces réglages vivaient dans un `layout.js` EN DOUBLE
// de ce fichier — Next ne lisait que celui-ci, donc l'icône « Niv Admin », le plein écran et
// le manifeste ne s'appliquaient jamais. Fusionnés ici, le doublon est supprimé.
export const metadata = {
  title: "Gestion — Niv Création",
  manifest: "/gestion-app.webmanifest",
  appleWebApp: { capable: true, title: "Niv Admin", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: "#2b2620",
};

// Toutes les pages /gestion/* partagent le même squelette (menu + barre du haut).
export default function GestionLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
