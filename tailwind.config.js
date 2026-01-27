/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New Color System (CSS Variables)
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-overlay': 'var(--bg-overlay)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'border-subtle': 'var(--border-subtle)',
        'divider': 'var(--divider)',
        // Legacy colors for backward compatibility (will be phased out)
        'mtaji-primary': '#00A859',
        'mtaji-primary-dark': '#008C4A',
        'mtaji-primary-light': '#E6F9F0',
        'mtaji-accent': '#FF6B2C',
        'mtaji-purple': '#1A0B2E',
        'mtaji-navy': '#0A1F44',
        'mtaji-off-white': '#F8F9FA',
        'mtaji-light-gray': '#E5E7EB',
        'mtaji-medium-gray': '#6B7280',
        'mtaji-dark-gray': '#1F2937',
        'mtaji-secondary': '#95D5B2',
        'agriculture': '#52B788',
        'water': '#4ECDC4',
        'health': '#FF6B6B',
        'education': '#4DABF7',
        'infrastructure': '#FFD93D',
        'economic': '#FFA94D',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'heading': ['Fredoka', 'Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'hero': ['3.5rem', { lineHeight: '1.1' }],
        'hero-mobile': ['3rem', { lineHeight: '1.1' }],
      },
      spacing: {
        'section': '5rem',
        'section-mobile': '3rem',
      },
      borderRadius: {
        'mtaji': '1rem',
      },
      boxShadow: {
        'green': '0 10px 30px rgba(0, 168, 89, 0.2)',
        'green-lg': '0 10px 40px rgba(0, 168, 89, 0.3)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-in-out-custom': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      },
    },
  },
  plugins: [],
}




