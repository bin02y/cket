import type { MissionId } from '../types'

export const missionRewards: Record<MissionId, { title: string; basePoints: number; category: 'academy' | 'popup' }> = {
  1: { title: '냉동 사이클을 조립하라', basePoints: 100, category: 'academy' },
  2: { title: '초고속 냉방을 제어하라', basePoints: 120, category: 'academy' },
  3: { title: '기후 위기에서 동물들을 구하라', basePoints: 120, category: 'popup' },
  4: { title: '나비효과로부터 지구를 지켜라', basePoints: 120, category: 'popup' },
}

export const maximumMissionPoints = Object.values(missionRewards).reduce((total, mission) => {
  const popupBonus = mission.category === 'popup' ? 90 : 0
  return total + mission.basePoints + popupBonus
}, 0)
