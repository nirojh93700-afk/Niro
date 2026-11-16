import { NextResponse } from "next/server";

// Expose le chemin demandé dans un en-tête, pour que le layout puisse
// laisser l'admin (/gestion) en dehors du code d'accès du site.
export function middleware(request) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Les fichiers (photos, vidéos, polices, modèles 3D) ne passent plus par ici (16/11/2026) : le middleware rendait
  // chaque photo « privée », donc jamais gardée en cache.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|png|webp|gif|svg|avif|mp4|webm|woff2?|ttf|otf|glb|pdf)$).*)"],
};
