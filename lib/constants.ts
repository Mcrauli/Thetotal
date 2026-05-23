export const COLORS = {
  bg:        '#0a0a14',
  bg2:       '#1a0d2e',
  bg3:       '#0d1530',
  card:      '#161628',
  card2:     '#1c2540',
  cardEdge:  '#2a2a4a',
  accent:    '#e63946',
  accentDim: '#5a1e26',
  gold:      '#ffd700',
  muted:     '#888888',
  white:     '#ffffff',
  green:     '#2ecc71',
}

export type RankName =
  | 'Aloittelija' | 'Harrastaja' | 'Kilpailija' | 'Alueellinen' | 'Kansallinen'
  | 'Kansainvälinen' | 'Eliitti' | 'Mestari' | 'Maailmaluokka' | 'Legenda'

export const RANKS: { name: RankName; xpRequired: number; color: string; icon: string }[] = [
  { name: 'Aloittelija',    xpRequired: 0,      color: '#708090', icon: '🏋️'  },
  { name: 'Harrastaja',     xpRequired: 300,    color: '#A8A9AD', icon: '💪'  },
  { name: 'Kilpailija',     xpRequired: 800,    color: '#CD7F32', icon: '⚡'  },
  { name: 'Alueellinen',    xpRequired: 1800,   color: '#4CAF50', icon: '🟢'  },
  { name: 'Kansallinen',    xpRequired: 3500,   color: '#FFD700', icon: '🔵'  },
  { name: 'Kansainvälinen', xpRequired: 6500,   color: '#B8C4D0', icon: '🟡'  },
  { name: 'Eliitti',        xpRequired: 11000,  color: '#e63946', icon: '🔴'  },
  { name: 'Mestari',        xpRequired: 18000,  color: '#FF6B35', icon: '🔥'  },
  { name: 'Maailmaluokka',  xpRequired: 28000,  color: '#9B59B6', icon: '👑'  },
  { name: 'Legenda',        xpRequired: 42000,  color: '#FF4444', icon: '🏆'  },
]

export const SBD_RANK_THRESHOLDS: { name: RankName; bwMultiple: number }[] = [
  { name: 'Aloittelija',    bwMultiple: 0    },
  { name: 'Harrastaja',     bwMultiple: 2.0  },
  { name: 'Kilpailija',     bwMultiple: 3.0  },
  { name: 'Alueellinen',    bwMultiple: 4.0  },
  { name: 'Kansallinen',    bwMultiple: 5.0  },
  { name: 'Kansainvälinen', bwMultiple: 6.0  },
  { name: 'Eliitti',        bwMultiple: 6.75 },
  { name: 'Mestari',        bwMultiple: 7.5  },
  { name: 'Maailmaluokka',  bwMultiple: 8.0  },
  { name: 'Legenda',        bwMultiple: 8.75 },
]

export const XP_REWARDS = {
  WORKOUT:          100,
  PR:               25,
  STREAK_BONUS:     25,
  STREAK_THRESHOLD: 7,
}
