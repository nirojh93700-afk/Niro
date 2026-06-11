// Palette Pronoz — thème sombre & néon.
export const colors = {
  // Fonds
  bg: "#0a0e1a",
  bgDeep: "#06090f",
  surface: "#121826",
  surfaceAlt: "#1a2234",
  surfaceHi: "#222c42",

  // Néons
  neon: "#39ff9e", // vert néon (action principale)
  neonDim: "#1ed988",
  violet: "#9b6bff", // violet néon (accent secondaire)
  cyan: "#27e8ff",
  pink: "#ff4d8d",

  // Texte
  text: "#eef2ff",
  textMuted: "#8a93ad",
  textFaint: "#5a627a",

  // États
  green: "#39ff9e",
  amber: "#ffcc4d",
  red: "#ff5f6d",

  border: "#24304a",
  borderHi: "#2f3d5e",
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

// Lueur néon (effet « glow » via shadow coloré).
export function glow(color, opacity = 0.6, radiusPx = 16) {
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radiusPx,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  };
}

export const shadow = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
