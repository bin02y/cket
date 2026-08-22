import type { SVGProps } from 'react'

export type IconName = 'home' | 'education' | 'shop' | 'my' | 'arrow' | 'leaf' | 'train' | 'wallet' | 'point' | 'warning' | 'search' | 'heart' | 'cart' | 'check' | 'lock' | 'map' | 'jump'

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
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
    wallet: <><path d="M3 6.5h15.5a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2z" /><path d="M3 7V5a2 2 0 0 1 2-2h12M15 12h5.5v4H15a2 2 0 1 1 0-4Z" /></>,
    point: <><circle cx="12" cy="12" r="9" /><path d="M9 17V7h3.2a3.2 3.2 0 0 1 0 6.4H9M9 10.2h3.2" /></>,
    shop: <><path d="M4 9v12h16V9M3 9l2-6h14l2 6" /><path d="M3 9a3 3 0 0 0 5 2.2A3 3 0 0 0 12 11a3 3 0 0 0 4 .2A3 3 0 0 0 21 9M9 21v-6h6v6" /></>,
    my: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    leaf: <><path d="M20 4C12 4 5 8 5 14c0 3 2 5 5 5 6 0 10-7 10-15Z" /><path d="M4 21c3-6 7-9 12-12" /></>,
    train: <><path d="M6 3h12a2 2 0 0 1 2 2v10a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2Z" /><path d="M4 11h16M8 7h8M8 19l-2 3M16 19l2 3" /><circle cx="8" cy="15" r="1" fill="currentColor" stroke="none" /><circle cx="16" cy="15" r="1" fill="currentColor" stroke="none" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    warning: <><path d="M10.3 3.6 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    heart: <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
    cart: <><path d="M3 3h2l2.3 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.5L21 7H6" /><circle cx="10" cy="20" r="1" fill="currentColor" stroke="none" /><circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" /></>,
    map: <><path d="m3 6 5-2 8 2 5-2v14l-5 2-8-2-5 2Z" /><path d="M8 4v14M16 6v14" /></>,
    jump: <><path d="M5 18h14" /><path d="m8 12 4-4 4 4M12 8v8" /></>,
  }

  return <svg {...commonProps}>{paths[name]}</svg>
}
