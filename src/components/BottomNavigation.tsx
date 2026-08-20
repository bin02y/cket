import { Icon, type IconName } from './Icon'
import type { TabId } from '../types'

const navigationItems: ReadonlyArray<{ id: TabId; label: string; icon: IconName }> = [
  { id: 'education', label: '교육', icon: 'education' },
  { id: 'booths', label: '홈', icon: 'home' },
  { id: 'shop', label: '쇼핑', icon: 'shop' },
  { id: 'my', label: 'MY', icon: 'my' },
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
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
