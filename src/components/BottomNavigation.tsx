import { Icon } from './Icon'
import type { TabId } from '../types'

const navigationItems: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'home', label: '홈' },
  { id: 'missions', label: '미션' },
  { id: 'wallet', label: '포인트' },
  { id: 'shop', label: '굿즈 숍' },
  { id: 'my', label: 'MY' },
]

type BottomNavigationProps = {
  activeTab: TabId
  onChange: (tab: TabId) => void
}

export function BottomNavigation({ activeTab, onChange }: BottomNavigationProps) {
  return (
    <nav className="bottom-navigation" aria-label="주요 메뉴">
      {navigationItems.map((item) => (
        <button
          className="bottom-navigation__item"
          type="button"
          key={item.id}
          aria-current={activeTab === item.id ? 'page' : undefined}
          onClick={() => onChange(item.id)}
        >
          <Icon name={item.id} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
