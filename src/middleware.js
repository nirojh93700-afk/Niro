import { NextResponse } from "next/server";

// Expose le chemin demandé dans un en-tête, pour que le layout puisse
// laisser l'admin (/gestion) en dehors du code d'accès du site.
export function middleware(request) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
