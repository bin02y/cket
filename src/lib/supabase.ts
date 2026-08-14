import { createClient, type User } from '@supabase/supabase-js'
import type { ParticipantProfile } from '../types'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function profileFromAuthUser(user: User): ParticipantProfile {
  const fallbackName = user.email?.split('@')[0] || '에코 메이트'
  return {
    id: user.id,
    name: typeof user.user_metadata.display_name === 'string' ? user.user_metadata.display_name : fallbackName,
    email: user.email ?? '',
    joinedAt: new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(user.created_at)),
  }
}

export function translateAuthError(message: string) {
  if (message.includes('Invalid login credentials')) return '이메일 또는 비밀번호를 확인해 주세요.'
  if (message.includes('User already registered')) return '이미 가입된 이메일입니다. 로그인 탭을 이용해 주세요.'
  if (message.includes('Email not confirmed')) return '이메일 인증을 완료한 뒤 로그인해 주세요.'
  if (message.includes('Password should be')) return '비밀번호 보안 기준을 확인해 주세요.'
  return `인증 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요. (${message})`
}
