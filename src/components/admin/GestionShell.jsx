"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Enveloppe les SOUS-PAGES de gestion (Atelier, CRM, Emballages…) avec la barre
// latérale, pour que le menu reste toujours visible. La page /gestion principale
// garde sa propre barre → on ne l'enveloppe pas ici (évite le doublon).
export default function GestionShell({ children }) {
  const path = usePathname();
  if (path === "/gestion") return children;
  return (
    <section className="section admin-section">
      <div className="container admin-shell">
        <AdminSidebar />
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </section>
  );
}
