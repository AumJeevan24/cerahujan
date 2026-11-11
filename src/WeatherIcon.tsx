import type { WeatherIcon as Icon } from './wmo'

/** Small line icons for weather conditions; colour follows the surrounding text. */
export default function WeatherIcon({ icon, isDay = true, size = 24 }: { icon: Icon; isDay?: boolean; size?: number }) {
  const sun = (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  )
  const moon = <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
  const cloud = <path d="M7 18h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 7 9.5 4.3 4.3 0 0 0 7 18Z" />
  const smallSun = isDay ? (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2v1.5M2 8h1.5M3.8 3.8l1 1M12.2 3.8l-1 1" />
    </>
  ) : (
    <path d="M12 9.5A4.5 4.5 0 0 1 6.5 4a4.5 4.5 0 1 0 5.5 5.5Z" />
  )

  const shapes: Record<Icon, React.ReactNode> = {
    clear: isDay ? sun : moon,
    partly: (
      <>
        {smallSun}
        <path d="M9 20h8a3.5 3.5 0 0 0 .4-7A4.8 4.8 0 0 0 9 12.5 3.8 3.8 0 0 0 9 20Z" />
      </>
    ),
    cloudy: cloud,
    fog: (
      <>
        <path d="M7 13h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 7 4.5" />
        <path d="M3 16h18M5 20h14" />
      </>
    ),
    drizzle: (
      <>
        <path d="M7 14h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 7 5.5 4.3 4.3 0 0 0 7 14Z" />
        <path d="M9 18v1M13 18v1M17 18v1" />
      </>
    ),
    rain: (
      <>
        <path d="M7 14h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 7 5.5 4.3 4.3 0 0 0 7 14Z" />
        <path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" />
      </>
    ),
    showers: (
      <>
        {smallSun}
        <path d="M9 16h8a3.5 3.5 0 0 0 .4-7A4.8 4.8 0 0 0 9 8.5 3.8 3.8 0 0 0 9 16Z" />
        <path d="M11 19l-.7 2M15 19l-.7 2" />
      </>
    ),
    storm: (
      <>
        <path d="M7 14h10a4 4 0 0 0 .5-8A5.5 5.5 0 0 0 7 5.5 4.3 4.3 0 0 0 7 14Z" />
        <path d="M12.5 15l-2 3.5h3l-2 3.5" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {shapes[icon]}
    </svg>
  )
}
