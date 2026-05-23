module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg:       '#0a0a14',
        bg2:      '#1a0d2e',
        bg3:      '#0d1530',
        card:     '#161628',
        card2:    '#1c2540',
        cardEdge: '#2a2a4a',
        accentDim:'#5a1e26',
        accent:   '#e63946',
        gold:     '#ffd700',
        muted:    '#888888',
        iron:     '#708090',
        steel:    '#a8a9ad',
        bronze:   '#cd7f32',
        silver:   '#c0c0c0',
        goldrank: '#ffd700',
        platinum: '#b8c4d0',
        elite:    '#00bfff',
        master:   '#ff6b35',
        titan:    '#9b59b6',
        legend:   '#ff4444',
      },
    },
  },
  plugins: [],
}
