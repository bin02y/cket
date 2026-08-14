import type { MissionId } from '../types'

export const missionRewards: Record<MissionId, { title: string; basePoints: number; category: 'academy' | 'popup' }> = {
  1: { title: '초고속 냉동사이클 체험', basePoints: 100, category: 'academy' },
  2: { title: '무더운 여름에서 살아남기', basePoints: 100, category: 'popup' },
  3: { title: '기후 위기에서 동물들을 구하라', basePoints: 120, category: 'popup' },
  4: { title: '나비효과로부터 지구를 지켜라', basePoints: 120, category: 'popup' },
  5: { title: '녹는 빙하 위에서 펭귄을 구해내라!', basePoints: 100, category: 'popup' },
}
