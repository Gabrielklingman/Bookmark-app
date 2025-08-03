/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        
        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        
        // Border color
        'border-color': 'var(--border-color)',
        
        // Updated accent colors for the new gradient
        'accent-start': '#7955db', // Purple start
        'accent-end': '#0264fe',   // Blue end
      },
      boxShadow: {
        'custom-subtle': '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        // Add custom gradient utility
        'gradient-custom': 'linear-gradient(to right, #7955db, #0264fe)',
      }
    },
  },
  plugins: [],
};