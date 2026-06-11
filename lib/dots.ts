// DOTS-kerroin: kehonpainoon suhteutettu voimapistemäärä.
const MEN = [-0.000001093, 0.0007391293, -0.1918759221, 24.0900756, -307.75076]
const WOMEN = [-0.0000010706, 0.0005158568, -0.1126655495, 13.6175032, -57.96288]

// DOTS-pisteet: total (SBD kg) suhteutettuna kehonpainoon.
export function calcDOTS(total: number, bodyweightKg: number, isMale = true): number {
  if (total <= 0 || bodyweightKg <= 0) return 0
  const bw = Math.min(Math.max(bodyweightKg, 40), 210)
  const [a, b, c, d, e] = isMale ? MEN : WOMEN
  const denom = a * bw ** 4 + b * bw ** 3 + c * bw ** 2 + d * bw + e
  if (denom === 0) return 0
  return Math.round(total * (500 / denom) * 10) / 10
}
