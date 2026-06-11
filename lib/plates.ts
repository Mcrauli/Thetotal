// Vakiolevyt (kg) raskaimmasta keveimpään + IPF-värit
export const PLATES: { kg: number; color: string; text: string }[] = [
  { kg: 25,   color: '#e2231a', text: '#fff' },
  { kg: 20,   color: '#1c4fa1', text: '#fff' },
  { kg: 15,   color: '#f7c331', text: '#1a1a1a' },
  { kg: 10,   color: '#2a8a3e', text: '#fff' },
  { kg: 5,    color: '#e8e8e8', text: '#1a1a1a' },
  { kg: 2.5,  color: '#9aa0a6', text: '#1a1a1a' },
  { kg: 1.25, color: '#c9a227', text: '#1a1a1a' },
]

export interface PlateResult {
  plates: number[]   // levyt per puoli, raskaimmasta keveimpään
  leftover: number   // jää jos ei mene tasan
}

// Laskee levyt per puoli annetulle kokonaispainolle ja tangolle.
export function calcPlates(target: number, bar = 20): PlateResult {
  const plates: number[] = []
  if (target <= bar) return { plates, leftover: 0 }
  let perSide = (target - bar) / 2
  for (const p of PLATES) {
    while (perSide >= p.kg - 0.001) {
      plates.push(p.kg)
      perSide -= p.kg
    }
  }
  return { plates, leftover: Math.round(perSide * 100) / 100 }
}
