/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base institucional
        navy: "#003366",

        // Neutros “Figma-like” (mais limpos que os grays do Tailwind)
        app: {
          bg: "#F5F7FA",       // fundo da aplicação
          surface: "#FFFFFF",  // cards/tabelas
          border: "#E6EAF0",   // bordas suaves
          muted: "#6B7280",    // texto secundário
          text: "#111827",     // texto principal
        },

        // Status (ajuste fino para ficar “institucional”, menos saturado)
        status: {
          freeBg: "#EAF7EF",
          freeText: "#1E7A3A",
          occBg: "#EAF1FF",
          occText: "#1E4FBF",
          maintBg: "#FFF5E6",
          maintText: "#A16207",
        },
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        soft: "0 8px 20px rgba(17, 24, 39, 0.06)",
      },
    },
  },
  plugins: [],
};