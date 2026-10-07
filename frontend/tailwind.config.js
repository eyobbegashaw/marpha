/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary, #0D9488)',
          hover: 'var(--color-primary-hover, #0F766E)',
          light: 'var(--color-primary-light, #F0FDFA)',
          dark: 'var(--color-primary-dark, #115E59)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #0F766E)',
          hover: 'var(--color-secondary-hover, #115E59)',
          light: 'var(--color-secondary-light, #CCFBF1)',
        },
        accent: {
          DEFAULT: 'var(--color-accent, #F59E0B)',
          hover: 'var(--color-accent-hover, #D97706)',
          light: 'var(--color-accent-light, #FEF3C7)',
        },
        surface: {
          DEFAULT: 'var(--color-surface, #FFFFFF)',
          subtle: 'var(--color-surface-subtle, #F8FAFC)',
          muted: 'var(--color-surface-muted, #F1F5F9)',
          border: 'var(--color-border, #E2E8F0)',
        },
        text: {
          primary: 'var(--color-text-primary, #0F172A)',
          secondary: 'var(--color-text-secondary, #475569)',
          muted: 'var(--color-text-muted, #94A3B8)',
        },
        status: {
          success: '#10B981',
          'success-bg': '#ECFDF5',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          danger: '#EF4444',
          'danger-bg': '#FEF2F2',
          info: '#3B82F6',
          'info-bg': '#EFF6FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'sans-serif'],
        amharic: ['Noto Sans Ethiopic', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft-md': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'soft-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
