/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["DM Sans", "sans-serif"]
      },
      colors: {
        primary: "#f59e0b",
        "primary-dark": "#d97706",
        "primary-light": "#fef3c7",
        bg: "#f5efe6",
        sidebar: "#e8dcc8",
        card: "#ffffff",
        border: "#e5e7eb",
        text1: "#1f2937",
        text2: "#6b7280",

        /* compatibility aliases used by existing auth pages */
        background: "#f5efe6",
        textPrimary: "#1f2937",
        textSecondary: "#6b7280",
        warm: {
          sidebar: "#e8dcc8"
        },
        amber: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
          deep: "#92400e"
        },
        text: {
          primary: "#1f2937",
          secondary: "#6b7280"
        },
        espresso: "#1c1612"
      },
      borderRadius: {
        md: "8px",
        lg: "12px"
      }
    }
  },
  plugins: []
};

