// Page personnelle (favoris de la visiteuse) : on la retire de l'index Google
// (elle n'a pas de valeur SEO et est propre à chaque personne).
export const metadata = {
  title: "Mes favoris",
  robots: { index: false, follow: true },
};

export default function FavorisLayout({ children }) {
  return children;
}
