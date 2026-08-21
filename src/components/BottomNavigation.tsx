import type { TabId } from '../types'

const navigationItems: ReadonlyArray<{ id: TabId; label: string }> = [
  { id: 'education', label: '교육' },
  { id: 'booths', label: '홈' },
  { id: 'shop', label: '쇼핑' },
  { id: 'my', label: 'MY' },
]

type TopNavigationProps = {
  activeTab: TabId
  onChange: (tab: TabId) => void
}

export function TopNavigation({ activeTab, onChange }: TopNavigationProps) {
  return (
    <nav className="top-navigation" aria-label="주요 메뉴">
      {navigationItems.map((item) => (
        <button
          className="top-navigation__item"
          type="button"
          key={item.id}
          aria-current={activeTab === item.id ? 'page' : undefined}
          onClick={() => onChange(item.id)}
        >
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
