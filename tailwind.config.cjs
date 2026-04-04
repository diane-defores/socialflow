/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['src/**/*.{html,vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        // Matches breakpoints used across AppHeader, AppSidebar, DashboardFilters
        'md': '768px',
        'lg': '1200px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    // require('@tailwindcss/forms'),
    require('daisyui'),
  ],
  daisyui: {
    themes: ['light', 'dark'],
    logs: false,
  },
}
