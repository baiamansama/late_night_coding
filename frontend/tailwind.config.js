/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#10B981',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        'warm-bg': '#F8F7F5',
        'text-primary': '#2C2C2C',
        'calm-blue': '#E3F2FD',
        'calm-green': '#E8F5E9',
      },
      fontFamily: {
        lexend: ['var(--font-lexend)', 'sans-serif'],
        'open-sans': ['var(--font-open-sans)', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      fontSize: {
        'reading': '1.875rem',
        'reading-lg': '2.25rem',
      },
      letterSpacing: {
        'accessible': '0.12em',
        'dyslexia': '0.2em',
      }
    },
  },
  plugins: [],
}
