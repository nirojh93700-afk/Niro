import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: "Gestion — Niv Création", robots: { index: false, follow: false } };

// Toutes les pages /gestion/* partagent le même squelette (menu + barre du haut).
export default function GestionLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
