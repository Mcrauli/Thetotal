module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg:       '#0d0d1a',
        card:     '#1a1a2e',
        card2:    '#16213e',
        accent:   '#e63946',
        gold:     '#ffd700',
        muted:    '#888888',
        iron:     '#cd7f32',
        bronze:   '#cd7f32',
        silver:   '#c0c0c0',
        goldrank: '#ffd700',
        elite:    '#00bfff',
        titan:    '#9b59b6',
      },
    },
  },
  plugins: [],
}
