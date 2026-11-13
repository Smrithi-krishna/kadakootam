/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kerala: {
          50: '#fbf8f2',
          100: '#f5eee0',
          200: '#ebd8bd',
          300: '#dcbc92',
          400: '#cda06a',
          500: '#b88147',
          600: '#9b643a',
          700: '#7d4c31',
          800: '#673e2c',
          900: '#553427',
        },
        spicy: {
          50: '#fef3f2',
          100: '#fee4e2',
          500: '#f04438',
          600: '#d92d20',
          700: '#b42318',
        },
        leaf: {
          50: '#edfcf2',
          100: '#d3f8df',
          500: '#16b364',
          600: '#099250',
          700: '#087443',
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
