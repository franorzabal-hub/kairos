/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#8B1538',
        primaryLight: '#F5E6EA',
        gray: '#666666',
        lightGray: '#F5F5F5',
        darkGray: '#333333',
        border: '#E0E0E0',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
        tabActive: '#007AFF',
        tabInactive: '#8E8E93',
        tabBadge: '#FF3B30',
        pillBackground: '#F2F2F7',
        pillActive: '#007AFF',
        // Slack-style sidebar colors
        sidebar: {
          bg: '#0F172A', // slate-900
          text: '#CBD5E1', // slate-300
          textActive: '#FFFFFF',
          textMuted: '#94A3B8', // slate-400
          border: '#1E293B', // slate-800
          hover: 'rgba(255, 255, 255, 0.1)',
          accent: '#8B1538', // primary
        },
        content: {
          bg: '#F8FAFC', // slate-50
        }
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};
