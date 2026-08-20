export type TabId = 'education' | 'booths' | 'shop' | 'my'

export type RoadViewGateCode = 'L01' | 'E01' | 'R01' | 'B01' | 'B02' | 'B03' | 'B04'

export type RoadViewGateRewardResult =
  | { status: 'completed'; awardedPoints: number }
  | { status: 'already_completed'; awardedPoints: 0 }
  | { status: 'error'; message: string }

export type ParticipantProfile = {
  id: string
  name: string
  email: string
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
  theme: 'mint' | 'sky' | 'navy' | 'aqua'
}

export type RewardRedemptionResult =
  | { status: 'success'; pointsSpent: number; cashPaid: number; paymentMethod: SimulatedPaymentMethod | 'free' }
  | { status: 'insufficient'; shortage: number }
  | { status: 'already_claimed' }
  | { status: 'error'; message: string }

export type RewardOrder = {
  id: string
  rewardId: string
  pointsSpent: number
  cashPaid: number
  status: 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  recipientName: string
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
  amount: number
  roadViewGateCode?: RoadViewGateCode
}
