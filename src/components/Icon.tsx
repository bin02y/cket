import type { SVGProps } from 'react'
import type { TabId } from '../types'

type IconProps = SVGProps<SVGSVGElement> & {
  name: TabId | 'missions' | 'wallet' | 'arrow' | 'leaf' | 'sparkle' | 'train' | 'play' | 'pause' | 'rotate' | 'snowflake' | 'wind' | 'thermometer' | 'gauge' | 'chevronLeft' | 'lock' | 'check' | 'paw' | 'butterfly' | 'recycle' | 'warning' | 'car' | 'cup' | 'stamp' | 'map' | 'search' | 'heart' | 'cart'
}

export function Icon({ name, ...props }: IconProps) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }

  const paths = {
    home: <><path d="m3.5 10.5 8.5-7 8.5 7" /><path d="M5.5 9.2V21h13V9.2M9.5 21v-6h5v6" /></>,
    education: <><path d="m3 9 9-6 9 6" /><path d="M5 9v11h14V9M3 20h18M9 20v-6h6v6M8 10h.01M12 10h.01M16 10h.01" /></>,
    experiment: <><path d="M9 2h6M10 2v6l-5.4 9.2A3.2 3.2 0 0 0 7.4 22h9.2a3.2 3.2 0 0 0 2.8-4.8L14 8V2" /><path d="M7 16h10M9.5 13h5" /></>,
    booths: <><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /><path d="M7.5 7.5h.01M16.5 7.5h.01M7.5 16.5h.01M16.5 16.5h.01" /></>,
    missions: <><path d="M8 4h8M9 2h6v4H9z" /><path d="M6 4.5H4.5v17h15v-17H18M8 11l2 2 5-5M8 17h8" /></>,
    wallet: <><path d="M3 6.5h15.5a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2z" /><path d="M3 7V5a2 2 0 0 1 2-2h12M15 12h5.5v4H15a2 2 0 1 1 0-4Z" /></>,
    shop: <><path d="M4 9v12h16V9M3 9l2-6h14l2 6" /><path d="M3 9a3 3 0 0 0 5 2.2A3 3 0 0 0 12 11a3 3 0 0 0 4 .2A3 3 0 0 0 21 9M9 21v-6h6v6" /></>,
    my: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    leaf: <><path d="M20 4C12 4 5 8 5 14c0 3 2 5 5 5 6 0 10-7 10-15Z" /><path d="M4 21c3-6 7-9 12-12" /></>,
    sparkle: <><path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" /></>,
    train: <><path d="M6 3h12a2 2 0 0 1 2 2v10a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2Z" /><path d="M4 11h16M8 7h8M8 19l-2 3M16 19l2 3" /><circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" /><circle cx="16" cy="15" r="1" fill="currentColor" stroke="none" /></>,
    play: <path d="m8 5 11 7-11 7z" fill="currentColor" />,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    rotate: <><path d="M20 7v5h-5" /><path d="M18.4 17a8 8 0 1 1 1.4-8.5L20 12" /></>,
    snowflake: <><path d="M12 2v20M4.2 6.5l15.6 11M4.2 17.5l15.6-11" /><path d="m9 4 3 2 3-2M9 20l3-2 3 2M4.7 9.5 8 9l.5-3.2M19.3 14.5 16 15l-.5 3.2M4.7 14.5 8 15l.5 3.2M19.3 9.5 16 9l-.5-3.2" /></>,
    wind: <><path d="M3 8h10.5a2.5 2.5 0 1 0-2.2-3.7M3 12h16a2 2 0 1 1-1.7 3M3 16h8" /></>,
    thermometer: <><path d="M14 14.8V5a4 4 0 0 0-8 0v9.8a5.5 5.5 0 1 0 8 0Z" /><path d="M10 8v9" /><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" /></>,
    gauge: <><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 14 4-5M7 15h.01M17 15h.01M12 8h.01" /><path d="M5 20h14" /></>,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    paw: <><path d="M8.4 13.8c-2.4 1.4-3.1 4.8-1 6.2 1.4.9 2.9-.2 4.6-.2s3.2 1.1 4.6.2c2.1-1.4 1.4-4.8-1-6.2-2.1-1.3-5.1-1.3-7.2 0Z" /><ellipse cx="5.5" cy="10" rx="2" ry="2.8" /><ellipse cx="10" cy="6.5" rx="2" ry="2.8" /><ellipse cx="14.5" cy="6.5" rx="2" ry="2.8" /><ellipse cx="18.5" cy="10" rx="2" ry="2.8" /></>,
    butterfly: <><path d="M12 10C9 3 3 2 3 7c0 4 5 5 9 5M12 10c3-7 9-8 9-3 0 4-5 5-9 5" /><path d="M12 12c-4 0-8 2-7 6 1 3 5 2 7-4M12 12c4 0 8 2 7 6-1 3-5 2-7-4M12 9v9" /></>,
    recycle: <><path d="m8 5 2-3 2 3M10 2l3 5H8" /><path d="m17 9 3 .2-.8 2.9M20 9.2l-3 5.2-2.5-4.3" /><path d="m9 18-1 3-2-2M8 21l-3-5.2h5" /></>,
    warning: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    car: <><path d="m5 16-1 3M19 16l1 3M3 13l2-6h14l2 6v5H3z" /><path d="M6 13h12M7 17h.01M17 17h.01" /></>,
    cup: <><path d="M6 3h11l-1 18H8zM17 6h2a2 2 0 0 1 0 4h-2" /><path d="M8 7h8" /></>,
    stamp: <><path d="M9.5 3.5h5l.8 4.1a2.8 2.8 0 0 0 1.2 1.8l1.5 1V14H6v-3.6l1.5-1a2.8 2.8 0 0 0 1.2-1.8z" /><path d="M5 14h14v3H5zM4 21h16M6 17l-1 4M18 17l1 4" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    heart: <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
    cart: <><path d="M3 3h2l2.3 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 7H6" /><circle cx="10" cy="20" r="1" fill="currentColor" stroke="none" /><circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" /></>,
  }

  return <svg {...commonProps}>{paths[name]}</svg>
}
