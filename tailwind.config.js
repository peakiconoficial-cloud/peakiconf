/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0b0b',
        primary: '#ff1e9d',
        cyan: '#00fff7',
        surface: 'rgba(255, 255, 255, 0.05)',
        surfaceGlow: 'rgba(255, 30, 157, 0.15)',
        surfaceGlowCyan: 'rgba(0, 255, 247, 0.15)'
      },
      boxShadow: {
        'neon-pink': '0 0 15px rgba(255, 30, 157, 0.5)',
        'neon-cyan': '0 0 15px rgba(0, 255, 247, 0.5)',
      }
    },
  },
  plugins: [],
}
