import type { User } from '@supabase/supabase-js'
import type { CheckoutDetails, ParticipantProfile, PointTransaction, RewardId, RewardOrder, RewardRedemptionResult, RoadViewGateCode, RoadViewGateRewardResult, SimulatedPaymentMethod } from '../types'
import type { Json, Tables } from './database.types'
import { profileFromAuthUser, supabase } from './supabase'

type ProfileRow = Pick<Tables<'profiles'>, 'id' | 'display_name' | 'email'>
type TransactionRow = Pick<Tables<'point_transactions'>, 'amount' | 'metadata'>
type RewardOrderRow = Pick<Tables<'reward_orders'>, 'id' | 'reward_id' | 'points_spent' | 'cash_paid' | 'status' | 'recipient_name' | 'postal_code' | 'shipping_address' | 'shipping_address_detail' | 'payment_method' | 'created_at'>

const transactionTimeFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })

function isJsonObject(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRoadViewGateCode(value: Json | undefined): value is RoadViewGateCode {
  return value === 'L01' || value === 'E01' || value === 'R01' || value === 'B01' || value === 'B02' || value === 'B03' || value === 'B04'
}

function toParticipantProfile(row: ProfileRow, fallback: ParticipantProfile): ParticipantProfile {
  return {
    id: row.id,
    name: row.display_name || fallback.name,
    email: row.email || fallback.email,
  }
}

function toPointTransaction(row: TransactionRow): PointTransaction {
  const roadViewGateCode = isJsonObject(row.metadata) && isRoadViewGateCode(row.metadata.roadview_gate_code)
    ? row.metadata.roadview_gate_code
    : undefined

  return {
    amount: row.amount,
    roadViewGateCode,
  }
}

function toRewardOrder(row: RewardOrderRow): RewardOrder {
  const knownStatus: RewardOrder['status'] = row.status === 'cancelled'
    ? 'cancelled'
    : row.status === 'delivered' || row.status === 'picked_up'
      ? 'delivered'
      : row.status === 'shipped'
        ? 'shipped'
        : row.status === 'preparing' || row.status === 'ready'
          ? 'preparing'
          : 'paid'
  const knownPaymentMethod: RewardOrder['paymentMethod'] = row.payment_method === 'kakao_pay'
    || row.payment_method === 'naver_pay'
    || row.payment_method === 'bank_transfer'
    || row.payment_method === 'free'
    || row.payment_method === 'cash'
    ? row.payment_method
    : 'card'

  return {
    id: row.id,
    rewardId: row.reward_id,
    pointsSpent: row.points_spent,
    cashPaid: row.cash_paid,
    status: knownStatus,
    recipientName: row.recipient_name ?? '',
    postalCode: row.postal_code ?? '',
    address: row.shipping_address ?? '',
    addressDetail: row.shipping_address_detail ?? '',
    paymentMethod: knownPaymentMethod,
    createdAt: transactionTimeFormatter.format(new Date(row.created_at)),
  }
}

export async function loadParticipantData(user: User) {
  if (!supabase) throw new Error('Supabase 연결 정보가 없습니다.')

  const fallbackProfile = profileFromAuthUser(user)
  const [profileResult, transactionResult, orderResult] = await Promise.all([
    supabase.from('profiles').select('id, display_name, email').eq('id', user.id).single(),
    supabase.from('point_transactions').select('amount, metadata').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('reward_orders').select('id, reward_id, points_spent, cash_paid, status, recipient_name, postal_code, shipping_address, shipping_address_detail, payment_method, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  if (profileResult.error) throw profileResult.error
  if (transactionResult.error) throw transactionResult.error
  if (orderResult.error) throw orderResult.error

  return {
    profile: toParticipantProfile(profileResult.data, fallbackProfile),
    transactions: transactionResult.data.map(toPointTransaction),
    orders: orderResult.data.map(toRewardOrder),
  }
}

export async function saveRoadViewGateVisit(gateCode: RoadViewGateCode): Promise<RoadViewGateRewardResult> {
  if (!supabase) return { status: 'error', message: 'Supabase 연결 정보가 없습니다.' }

  const { data, error } = await supabase.rpc('claim_roadview_gate', { p_gate_code: gateCode })
  if (error) throw error
  if (!isJsonObject(data) || typeof data.awarded_points !== 'number') {
    return { status: 'error', message: '로드뷰 포인트 적립 결과를 확인하지 못했습니다.' }
  }
  if (data.status === 'completed') return { status: 'completed', awardedPoints: data.awarded_points }
  if (data.status === 'already_completed') return { status: 'already_completed', awardedPoints: 0 }
  return { status: 'error', message: '로드뷰 포인트 적립 결과를 확인하지 못했습니다.' }
}

export async function saveRewardRedemption(rewardId: RewardId, pointsToUse: number, checkout: CheckoutDetails): Promise<RewardRedemptionResult> {
  if (!supabase) return { status: 'error', message: 'Supabase 연결 정보가 없습니다.' }

  const { data, error } = await supabase.rpc('redeem_reward', {
    p_payment_method: checkout.paymentMethod,
    p_points_to_use: pointsToUse,
    p_postal_code: checkout.postalCode,
    p_recipient_name: checkout.recipientName,
    p_recipient_phone: checkout.recipientPhone,
    p_reward_id: rewardId,
    p_shipping_address: checkout.address,
    p_shipping_address_detail: checkout.addressDetail,
  })
  if (error) throw error
  if (!isJsonObject(data)) return { status: 'error', message: '굿즈 교환 응답을 확인하지 못했습니다.' }

  if (
    data.status === 'success'
    && typeof data.points_spent === 'number'
    && typeof data.cash_paid === 'number'
    && (data.payment_method === 'card' || data.payment_method === 'kakao_pay' || data.payment_method === 'naver_pay' || data.payment_method === 'bank_transfer' || data.payment_method === 'free')
  ) {
    return {
      status: 'success',
      pointsSpent: data.points_spent,
      cashPaid: data.cash_paid,
      paymentMethod: data.payment_method as SimulatedPaymentMethod | 'free',
    }
  }
  if (data.status === 'insufficient' && typeof data.shortage === 'number') {
    return { status: 'insufficient', shortage: data.shortage }
  }
  if (data.status === 'already_claimed') return { status: 'already_claimed' }
  return { status: 'error', message: '굿즈 교환 결과를 확인하지 못했습니다.' }
}

export function translateDataError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Invalid point discount') || message.includes('Point discount unavailable')) return '사용할 포인트를 다시 확인해 주세요.'
  if (message.includes('Invalid shipping details')) return '배송 정보를 다시 확인해 주세요.'
  if (message.includes('Invalid payment method')) return '결제수단을 다시 선택해 주세요.'
  if (message.includes('Reward out of stock')) return '현재 굿즈 재고가 모두 소진됐어요.'
  if (message.includes('Authentication required') || message.includes('JWT')) return '로그인 세션이 만료됐습니다. 다시 로그인해 주세요.'
  return '데이터를 저장하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.'
}
