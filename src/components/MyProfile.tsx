import { useState } from 'react'
import type { MissionId, ParticipantProfile } from '../types'
import { Icon } from './Icon'

type MyProfileProps = {
  profile: ParticipantProfile
  completedBooths: ReadonlySet<MissionId>
  onLogout: () => void
  onDeleteAccount: () => Promise<string | null>
  onOpenBooths: () => void
}

const stampBooths: readonly { id: MissionId; number: string; hall: string; title: string; icon: 'train' | 'snowflake' | 'wind' | 'paw' | 'butterfly' }[] = [
  { id: 1, number: '01', hall: '1관', title: '초고속 냉동사이클', icon: 'train' },
  { id: 5, number: '02', hall: '환경 부스 1', title: '펭귄 구조', icon: 'snowflake' },
  { id: 2, number: '03', hall: '환경 부스 2', title: '무더운 여름', icon: 'wind' },
  { id: 3, number: '04', hall: '환경 부스 3', title: '동물 구하기', icon: 'paw' },
  { id: 4, number: '05', hall: '환경 부스 4', title: '나비효과', icon: 'butterfly' },
]

export function MyProfile({ profile, completedBooths, onLogout, onDeleteAccount, onOpenBooths }: MyProfileProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const passportReady = completedBooths.size === stampBooths.length

  async function deleteAccount() {
    setIsDeleting(true)
    const error = await onDeleteAccount()
    setIsDeleting(false)
    if (error) setDeleteError(error)
  }

  return (
    <main id="main-content" className="page my-page">
      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-identity">
          <div className="profile-avatar"><Icon name="leaf" /></div>
          <div><h1 id="profile-title">{profile.name}님의 에코 여정</h1><p>{profile.email} · {profile.joinedAt} 탑승</p></div>
        </div>
        <div className="profile-hero__actions"><button type="button" onClick={onLogout}>로그아웃</button></div>
      </section>

      <section className={`eco-passport${passportReady ? ' eco-passport--issued' : ''}`} aria-labelledby="eco-passport-title">
        <header className="eco-passport__heading">
          <div><h2 id="eco-passport-title">ECO PASSPORT</h2><p>{passportReady ? '모든 부스를 완주해 에코 패스포트가 발급되었습니다.' : `스탬프 ${5 - completedBooths.size}개를 더 모으면 에코 패스포트가 완성됩니다.`}</p></div>
          <strong>{completedBooths.size} / 5</strong>
        </header>
        <div className="eco-passport__stamps">
          {stampBooths.map((booth) => {
            const completed = completedBooths.has(booth.id)
            return <article className={completed ? 'is-stamped' : ''} key={booth.id}><span className="eco-stamp__number">{booth.number}</span><span className="eco-stamp__seal"><Icon name={completed ? booth.icon : 'lock'} /></span><p><small>{booth.hall}</small><strong>{booth.title}</strong><em>{completed ? 'STAMPED' : '체험 전'}</em></p></article>
          })}
        </div>
        <div className="eco-passport__result"><span><Icon name={passportReady ? 'check' : 'sparkle'} /></span><p><strong>{passportReady ? `${profile.name}님의 ECO PASSPORT` : '다섯 부스를 모두 방문해 주세요'}</strong><small>{passportReady ? '지구를 위한 다섯 번의 행동을 완료한 에코 트래블러입니다.' : '완료한 부스마다 스탬프 한 개가 자동으로 기록됩니다.'}</small></p>{passportReady ? <em>ISSUED</em> : <button type="button" onClick={onOpenBooths}>부스 체험하기 <Icon name="arrow" /></button>}</div>
      </section>

      <section className="profile-account-card" aria-label="계정 정보"><div><span><Icon name="my" /></span><p><strong>참가자 계정</strong><small>{profile.name} · {profile.email}</small></p></div><button className="profile-account-delete" type="button" onClick={() => setShowDeleteDialog(true)}>회원탈퇴</button></section>

      {showDeleteDialog ? <div className="account-dialog-backdrop" role="presentation"><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><span className="account-dialog__icon"><Icon name="my" /></span><h2 id="delete-account-title">정말 회원탈퇴할까요?</h2><p>현재 참가자의 부스 스탬프, ECO POINT, 굿즈 교환 내역이 모두 삭제됩니다. 이 작업은 되돌릴 수 없어요.</p>{deleteError ? <p className="account-dialog__error" role="alert">{deleteError}</p> : null}<div><button type="button" className="secondary-button" autoFocus onClick={() => setShowDeleteDialog(false)}>계속 이용하기</button><button type="button" className="account-delete-button" disabled={isDeleting} onClick={deleteAccount}>{isDeleting ? '삭제 중...' : '모든 데이터 삭제'}</button></div></section></div> : null}
    </main>
  )
}
