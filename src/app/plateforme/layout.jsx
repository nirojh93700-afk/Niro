// Métadonnées propres à l'espace Lior (/plateforme) : nom et icône distincts
// de la boutique. Ainsi, « Ajouter à l'écran d'accueil » affiche « Lior ».

export const metadata = {
  title: { absolute: "Lior" },
  applicationName: "Lior",
  appleWebApp: {
    capable: true,
    title: "Lior",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/lior-icon.png",
    apple: "/lior-icon.png",
  },
};

export default function PlateformeLayout({ children }) {
  return children;
}
