export type TabId = 'home' | 'booths' | 'missions' | 'wallet' | 'shop' | 'my'

export type MissionId = 1 | 2 | 3 | 4

export type ParticipantProfile = {
  id: string
  name: string
  email: string
  joinedAt: string
}

export type AuthCredentials = {
  email: string
  password: string
}

export type SignUpDetails = AuthCredentials & {
  name: string
}

export type AuthActionResult = {
  error?: string
  notice?: string
}

export type RewardId = 'seed-ticket' | 'reusable-kit' | 'ktx-pouch' | 'eco-tumbler'

export type RewardProduct = {
  id: RewardId
  name: string
  subtitle: string
  description: string
  impact: string
  points: number
  category: 'event' | 'lifestyle' | 'upcycle'
  categoryLabel: string
  icon: 'leaf' | 'recycle' | 'train' | 'cup'
  theme: 'mint' | 'sky' | 'navy' | 'aqua'
  pickupNote: string
}

export type RewardRedemptionResult =
  | { status: 'success'; orderCode: string }
  | { status: 'insufficient'; shortage: number }
  | { status: 'error'; message: string }

export type PointTransaction = {
  id: string
  type: 'earn' | 'spend'
  amount: number
  title: string
  description: string
  category: 'academy' | 'popup' | 'reward'
  missionId?: MissionId
  rewardId?: RewardId
  createdAt: string
}
