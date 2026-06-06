import { NextResponse } from "next/server";

// Expose le chemin courant aux composants serveur (via l'en-tête x-pathname).
// Sert au layout pour savoir s'il doit afficher la boutique ou l'espace plateforme.
export function middleware(req) {
  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // On évite les fichiers statiques et les images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
