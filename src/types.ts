export type TabId = 'home' | 'education' | 'experiment' | 'booths' | 'shop' | 'my'

export type MissionId = 1 | 2 | 3 | 4 | 5

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

export type RewardId =
  | 'cycle-parts-keyring'
  | 'thermo-sticker'
  | 'eco-tumbler'
  | 'recycled-plastic-pen'
  | 'mini-eco-pouch'
  | 'cooling-keycap'
  | 'eco-power-bank'
  | 'mini-fan'

export type RewardPaymentMethod = 'points' | 'cash' | 'free'

export type RewardProduct = {
  id: RewardId
  name: string
  image: string
  imageAlt: string
  cashPrice: number
  points: number | null
  category: 'tech' | 'lifestyle' | 'limited'
  icon: 'leaf' | 'recycle' | 'train' | 'cup' | 'snowflake' | 'thermometer' | 'sparkle' | 'wind'
  theme: 'mint' | 'sky' | 'navy' | 'aqua'
  pickupNote: string
  requirement?: 'participant' | 'one-stamp' | 'passport'
}

export type RewardRedemptionResult =
  | { status: 'success'; orderCode: string; paymentMethod: RewardPaymentMethod }
  | { status: 'insufficient'; shortage: number }
  | { status: 'locked'; requiredStamps: number }
  | { status: 'already_claimed' }
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
