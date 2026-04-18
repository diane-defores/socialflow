export type ThemeMode = 'light' | 'dark' | 'auto'
export type AutoThemeSource = 'sun' | 'system'

export interface AutoThemeResolution {
  isDark: boolean
  source: AutoThemeSource
  nextCheckAt: number | null
}

interface PermissionStatusLike {
  state: 'granted' | 'denied' | 'prompt'
}

function resolveSystemTheme(): AutoThemeResolution {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return {
    isDark,
    source: 'system',
    nextCheckAt: null,
  }
}

async function getGeolocationPermissionState() {
  if (!('permissions' in navigator) || typeof navigator.permissions.query !== 'function')
    return null

  try {
    const status = await navigator.permissions.query({
      // TS libdom still misses geolocation in some targets.
      name: 'geolocation' as PermissionName,
    })
    return status as PermissionStatusLike
  } catch {
    return null
  }
}

async function getCurrentPosition(allowPrompt: boolean): Promise<GeolocationPosition | null> {
  if (!('geolocation' in navigator))
    return null

  const permission = await getGeolocationPermissionState()
  if (permission?.state === 'denied')
    return null
  if (!allowPrompt && permission?.state !== 'granted')
    return null

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 30 * 60 * 1000,
      },
    )
  })
}

function toJulianDay(date: Date) {
  return date.getTime() / 86400000 + 2440587.5
}

function fromJulianDay(day: number) {
  return new Date((day - 2440587.5) * 86400000)
}

function toDays(date: Date) {
  return toJulianDay(date) - 2451545
}

function solarMeanAnomaly(days: number) {
  return (357.5291 + 0.98560028 * days) * Math.PI / 180
}

function eclipticLongitude(meanAnomaly: number) {
  const equationOfCenter =
    (1.9148 * Math.sin(meanAnomaly)
      + 0.02 * Math.sin(2 * meanAnomaly)
      + 0.0003 * Math.sin(3 * meanAnomaly))
    * Math.PI / 180
  const perihelion = 102.9372 * Math.PI / 180
  return meanAnomaly + equationOfCenter + perihelion + Math.PI
}

function declination(solarLongitude: number) {
  const earthTilt = 23.4397 * Math.PI / 180
  return Math.asin(Math.sin(solarLongitude) * Math.sin(earthTilt))
}

function julianCycle(days: number, longitudeWest: number) {
  return Math.round(days - 0.0009 - longitudeWest / (2 * Math.PI))
}

function approxTransit(hourAngle: number, longitudeWest: number, cycle: number) {
  return 0.0009 + (hourAngle + longitudeWest) / (2 * Math.PI) + cycle
}

function solarTransitJulianDay(days: number, meanAnomaly: number, solarLongitude: number) {
  return 2451545 + days + 0.0053 * Math.sin(meanAnomaly) - 0.0069 * Math.sin(2 * solarLongitude)
}

function hourAngle(sunAltitude: number, latitude: number, solarDeclination: number) {
  const numerator = Math.sin(sunAltitude) - Math.sin(latitude) * Math.sin(solarDeclination)
  const denominator = Math.cos(latitude) * Math.cos(solarDeclination)
  const ratio = numerator / denominator

  if (ratio <= -1)
    return Math.PI
  if (ratio >= 1)
    return 0
  return Math.acos(ratio)
}

function getSunTimes(date: Date, latitude: number, longitude: number) {
  const longitudeWest = -longitude * Math.PI / 180
  const latitudeRad = latitude * Math.PI / 180
  const solarDeclinationAngle = -0.833 * Math.PI / 180
  const workingDate = new Date(date)
  workingDate.setHours(12, 0, 0, 0)

  const days = toDays(workingDate)
  const cycle = julianCycle(days, longitudeWest)
  const solarTransitApprox = approxTransit(0, longitudeWest, cycle)
  const meanAnomaly = solarMeanAnomaly(solarTransitApprox)
  const solarLongitude = eclipticLongitude(meanAnomaly)
  const solarDeclinationValue = declination(solarLongitude)
  const angle = hourAngle(solarDeclinationAngle, latitudeRad, solarDeclinationValue)
  const setApprox = approxTransit(angle, longitudeWest, cycle)
  const riseApprox = approxTransit(-angle, longitudeWest, cycle)
  const sunriseTransit = solarTransitJulianDay(riseApprox, meanAnomaly, solarLongitude)
  const sunsetTransit = solarTransitJulianDay(setApprox, meanAnomaly, solarLongitude)

  return {
    sunrise: fromJulianDay(sunriseTransit),
    sunset: fromJulianDay(sunsetTransit),
  }
}

function resolveFromSunCycle(now: Date, latitude: number, longitude: number): AutoThemeResolution {
  const { sunrise, sunset } = getSunTimes(now, latitude, longitude)
  const currentTime = now.getTime()
  const sunriseTime = sunrise.getTime()
  const sunsetTime = sunset.getTime()

  if (sunriseTime === sunsetTime) {
    return resolveSystemTheme()
  }

  if (currentTime >= sunsetTime || currentTime < sunriseTime) {
    const nextSunrise = currentTime < sunriseTime
      ? sunriseTime
      : getSunTimes(new Date(currentTime + 86400000), latitude, longitude).sunrise.getTime()
    return {
      isDark: true,
      source: 'sun',
      nextCheckAt: nextSunrise,
    }
  }

  return {
    isDark: false,
    source: 'sun',
    nextCheckAt: sunsetTime,
  }
}

export async function resolveAutoTheme(options?: {
  allowPrompt?: boolean
  now?: Date
}): Promise<AutoThemeResolution> {
  const now = options?.now ?? new Date()
  const position = await getCurrentPosition(Boolean(options?.allowPrompt))

  if (!position) {
    return resolveSystemTheme()
  }

  try {
    return resolveFromSunCycle(
      now,
      position.coords.latitude,
      position.coords.longitude,
    )
  } catch {
    return resolveSystemTheme()
  }
}
