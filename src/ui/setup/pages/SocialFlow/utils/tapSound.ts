export const TAP_SOUND_STORAGE_KEY = 'sfz_tap_sound_variant'
export const DEFAULT_TAP_SOUND_VARIANT = 'classic'

export type TapSoundVariant = 'classic' | 'soft' | 'pop'

export const TAP_SOUND_VARIANTS: Array<{
  value: TapSoundVariant
  labelKey: string
}> = [
  { value: 'classic', labelKey: 'settings.tap_sound_variant_classic' },
  { value: 'soft', labelKey: 'settings.tap_sound_variant_soft' },
  { value: 'pop', labelKey: 'settings.tap_sound_variant_pop' },
]

export function normalizeTapSoundVariant(value: string | null | undefined): TapSoundVariant {
  if (value === 'soft' || value === 'pop') return value
  return DEFAULT_TAP_SOUND_VARIANT
}
