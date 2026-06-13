import type { Locale } from './i18n'

const MUSCLE_LABELS: Record<string, { fi: string; en: string }> = {
  Rinta:       { fi: 'Rinta', en: 'Chest' },
  Selkä:       { fi: 'Selkä', en: 'Back' },
  Jalat:       { fi: 'Jalat', en: 'Legs' },
  Hartiat:     { fi: 'Hartiat', en: 'Shoulders' },
  Hauikset:    { fi: 'Hauikset', en: 'Biceps' },
  Ojentajat:   { fi: 'Ojentajat', en: 'Triceps' },
  Takareidet:  { fi: 'Takareidet', en: 'Hamstrings' },
  Pakarat:     { fi: 'Pakarat', en: 'Glutes' },
  Pohjelihas:  { fi: 'Pohkeet', en: 'Calves' },
  Calves:      { fi: 'Pohkeet', en: 'Calves' },
  Vatsa:       { fi: 'Vatsa', en: 'Abs' },
  Kardio:      { fi: 'Kardio', en: 'Cardio' },
  Voimamies:   { fi: 'Voimamies', en: 'Strongman' },
  'Full Body': { fi: 'Koko keho', en: 'Full Body' },
  Traps:       { fi: 'Epäkäs', en: 'Traps' },
  'Lower Back':{ fi: 'Alaselkä', en: 'Lower Back' },
  Muut:        { fi: 'Muut', en: 'Other' },
}

export function muscleLabel(group: string | null | undefined, locale: Locale): string {
  if (!group) return locale === 'fi' ? 'Muut' : 'Other'
  return MUSCLE_LABELS[group]?.[locale] ?? group
}
