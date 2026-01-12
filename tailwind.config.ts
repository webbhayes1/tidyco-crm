import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // TidyCo Brand Colors
        tidyco: {
          blue: '#4BA3E3',      // Primary blue (apron, buttons, accents)
          navy: '#1E3A5F',      // Navy (headings, dark text)
          'light-blue': '#E8F4FB', // Light blue (backgrounds, cards)
          50: '#F5FBFE',        // Lightest blue (hover states)
          100: '#E8F4FB',       // Light blue backgrounds
          200: '#C5E4F7',       // Light accents
          300: '#A0D4F2',       // Medium light
          400: '#75BDE9',       // Medium
          500: '#4BA3E3',       // Primary brand blue
          600: '#3A8AC4',       // Darker blue
          700: '#2D6B99',       // Dark blue
          800: '#1E3A5F',       // Navy (headings)
          900: '#152A45',       // Darkest navy
        },
        // Extend default blue for compatibility
        primary: {
          50: '#F5FBFE',
          100: '#E8F4FB',
          200: '#C5E4F7',
          300: '#A0D4F2',
          400: '#75BDE9',
          500: '#4BA3E3',
          600: '#3A8AC4',
          700: '#2D6B99',
          800: '#1E3A5F',
          900: '#152A45',
        },
      },
    },
  },
  plugins: [],
};
export default config;