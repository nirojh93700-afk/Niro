// Manifest PWA : nom + icône quand on ajoute le site à l'écran d'accueil.
export default function manifest() {
  return {
    name: "Niv Création",
    short_name: "Niv Création",
    description: "Bijoux, mariage & cadeaux personnalisés au laser, personnalisés en France.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#a98935",
    icons: [
      { src: "/icon", sizes: "256x256", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
