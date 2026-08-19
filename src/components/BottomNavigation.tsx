import { Icon } from './Icon'
import type { TabId } from '../types'

const navigationItems: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'home', label: '홈' },
  { id: 'education', label: '교육' },
  { id: 'experiment', label: '실험' },
  { id: 'booths', label: '부스' },
  { id: 'shop', label: '리워드' },
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
