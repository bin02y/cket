export type TabId = 'education' | 'experiment' | 'booths' | 'shop' | 'my'

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
  | { status: 'success'; pointsSpent: number; cashPaid: number; paymentMethod: SimulatedPaymentMethod | 'free' }
  | { status: 'insufficient'; shortage: number }
  | { status: 'locked'; requiredStamps: number }
  | { status: 'already_claimed' }
  | { status: 'error'; message: string }

export type RewardOrder = {
  id: string
  rewardId: string
  pointsSpent: number
  cashPaid: number
  status: 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  recipientName: string
  recipientPhone: string
  postalCode: string
  address: string
  addressDetail: string
  paymentMethod: SimulatedPaymentMethod | 'free' | 'cash'
  createdAt: string
}

export type SimulatedPaymentMethod = 'card' | 'kakao_pay' | 'naver_pay' | 'bank_transfer'

export type CheckoutDetails = {
  recipientName: string
  recipientPhone: string
  postalCode: string
  address: string
  addressDetail: string
  paymentMethod: SimulatedPaymentMethod
}

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
