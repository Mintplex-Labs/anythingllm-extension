/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./sidepanel.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        shimmer: "shimmer 3s linear infinite"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        }
      }
    }
  },
  plugins: [
    function ({ addVariant }) {
      addVariant("light", "@media (prefers-color-scheme: light)")
    },
    // Enter/exit animation utilities (`animate-in`, `fade-in-0`, ...) as
    // defined by `tailwindcss-animate`, used by the chain of thought.
    function ({ addBase, addUtilities }) {
      addBase({
        "@keyframes enter": {
          from: {
            opacity: "var(--tw-enter-opacity, 1)",
            transform:
              "translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0)"
          }
        },
        "@keyframes exit": {
          to: {
            opacity: "var(--tw-exit-opacity, 1)",
            transform:
              "translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0)"
          }
        }
      })
      addUtilities({
        ".animate-in": {
          animationName: "enter",
          animationDuration: "150ms",
          animationFillMode: "both"
        },
        ".animate-out": {
          animationName: "exit",
          animationDuration: "150ms",
          animationFillMode: "both"
        },
        ".fade-in-0": { "--tw-enter-opacity": "0" },
        ".fade-out-0": { "--tw-exit-opacity": "0" },
        ".slide-in-from-top-2": { "--tw-enter-translate-y": "-0.5rem" },
        ".slide-out-to-top-2": { "--tw-exit-translate-y": "-0.5rem" }
      })
    }
  ]
}
