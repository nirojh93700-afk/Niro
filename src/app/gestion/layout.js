// Métadonnées de l'APPLICATION ADMIN (raccourci écran d'accueil → ouvre direct
// la gestion en plein écran, comme une app, sur le même site/les mêmes données).
export const metadata = {
  title: "Niv Admin",
  manifest: "/gestion-app.webmanifest",
  appleWebApp: { capable: true, title: "Niv Admin", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: "#2b2620",
};

import GestionShell from "@/components/admin/GestionShell";

export default function GestionLayout({ children }) {
  return <GestionShell>{children}</GestionShell>;
}
