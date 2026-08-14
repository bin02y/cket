import type { User } from '@supabase/supabase-js'
import type { MissionId, ParticipantProfile, PointTransaction, RewardId, RewardRedemptionResult } from '../types'
import type { Json, Tables } from './database.types'
import { profileFromAuthUser, supabase } from './supabase'

type ProfileRow = Tables<'profiles'>
type TransactionRow = Tables<'point_transactions'>

const rewardIds = new Set<RewardId>(['seed-ticket', 'reusable-kit', 'ktx-pouch', 'eco-tumbler'])
const joinedAtFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })
const transactionTimeFormatter = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })

function isMissionId(value: number | null): value is MissionId {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

function isRewardId(value: string | null): value is RewardId {
  return value !== null && rewardIds.has(value as RewardId)
}

function isJsonObject(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toParticipantProfile(row: ProfileRow, fallback: ParticipantProfile): ParticipantProfile {
  return {
    id: row.id,
    name: row.display_name || fallback.name,
    email: row.email || fallback.email,
    joinedAt: joinedAtFormatter.format(new Date(row.created_at)),
  }
}

function toPointTransaction(row: TransactionRow): PointTransaction {
  const missionId = isMissionId(row.mission_id) ? row.mission_id : undefined
  const rewardId = isRewardId(row.reward_id) ? row.reward_id : undefined
  const category = row.source === 'reward' ? 'reward' : missionId && missionId <= 2 ? 'academy' : 'popup'

  return {
    id: row.id,
    type: row.kind === 'spend' ? 'spend' : 'earn',
    amount: row.amount,
    title: row.title,
    description: row.description,
    category,
    missionId,
    rewardId,
    createdAt: transactionTimeFormatter.format(new Date(row.created_at)),
  }
}

export async function loadParticipantData(user: User) {
  if (!supabase) throw new Error('Supabase 연결 정보가 없습니다.')

  const fallbackProfile = profileFromAuthUser(user)
  const [profileResult, transactionResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('point_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  if (profileResult.error) throw profileResult.error
  if (transactionResult.error) throw transactionResult.error

  return {
    profile: toParticipantProfile(profileResult.data, fallbackProfile),
    transactions: transactionResult.data.map(toPointTransaction),
  }
}

export async function saveBoothCompletion(missionId: MissionId, bonusPoints: number) {
  if (!supabase) throw new Error('Supabase 연결 정보가 없습니다.')
  const { data, error } = await supabase.rpc('complete_mission', {
    p_mission_id: missionId,
    p_bonus_points: bonusPoints,
  })
  if (error) throw error
  if (!isJsonObject(data)) throw new Error('부스 체험 저장 응답 형식이 올바르지 않습니다.')
  return data.status === 'completed' || data.status === 'already_completed'
}

export async function saveRewardRedemption(rewardId: RewardId): Promise<RewardRedemptionResult> {
  if (!supabase) return { status: 'error', message: 'Supabase 연결 정보가 없습니다.' }

  const { data, error } = await supabase.rpc('redeem_reward', { p_reward_id: rewardId })
  if (error) throw error
  if (!isJsonObject(data)) return { status: 'error', message: '굿즈 교환 응답을 확인하지 못했습니다.' }

  if (data.status === 'success' && typeof data.pickup_code === 'string') {
    return { status: 'success', orderCode: data.pickup_code }
  }
  if (data.status === 'insufficient' && typeof data.shortage === 'number') {
    return { status: 'insufficient', shortage: data.shortage }
  }
  return { status: 'error', message: '굿즈 교환 결과를 확인하지 못했습니다.' }
}

export function translateDataError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Invalid mission bonus')) return '체험 보너스 점수를 확인해 주세요.'
  if (message.includes('Reward out of stock')) return '현재 굿즈 재고가 모두 소진됐어요.'
  if (message.includes('Authentication required') || message.includes('JWT')) return '로그인 세션이 만료됐습니다. 다시 로그인해 주세요.'
  return '데이터를 저장하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.'
}
