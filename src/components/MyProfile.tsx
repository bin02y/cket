import { useState } from 'react'
import type { MissionId, ParticipantProfile, PointTransaction } from '../types'
import { Icon } from './Icon'

type MyProfileProps = {
  profile: ParticipantProfile
  transactions: readonly PointTransaction[]
  completedBooths: ReadonlySet<MissionId>
  balance: number
  rewardOrderCount: number
  onLogout: () => void
  onDeleteAccount: () => Promise<string | null>
  onOpenBooths: () => void
}

const levelSteps = [
  { level: 1, min: 0, max: 150, name: 'ECO SEED', label: '에코 새싹' },
  { level: 2, min: 150, max: 300, name: 'ECO LEAF', label: '에코 잎새' },
  { level: 3, min: 300, max: 500, name: 'ECO TREE', label: '에코 나무' },
  { level: 4, min: 500, max: 640, name: 'ECO FOREST', label: '에코 숲' },
] as const

const stampBooths: readonly { id: MissionId; number: string; hall: string; title: string; icon: 'train' | 'snowflake' | 'wind' | 'paw' | 'butterfly' }[] = [
  { id: 1, number: '01', hall: '1관', title: '초고속 냉동사이클', icon: 'train' },
  { id: 5, number: '02', hall: '환경 부스 1', title: '펭귄 구조', icon: 'snowflake' },
  { id: 2, number: '03', hall: '환경 부스 2', title: '무더운 여름', icon: 'wind' },
  { id: 3, number: '04', hall: '환경 부스 3', title: '동물 구하기', icon: 'paw' },
  { id: 4, number: '05', hall: '환경 부스 4', title: '나비효과', icon: 'butterfly' },
]

export function MyProfile({ profile, transactions, completedBooths, balance, rewardOrderCount, onLogout, onDeleteAccount, onOpenBooths }: MyProfileProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const earnedPoints = transactions.reduce((total, transaction) => transaction.type === 'earn' ? total + transaction.amount : total, 0)
  const ecoActions = completedBooths.size
  const energySaved = completedBooths.size * 1.08
  const carbonSaved = energySaved * 0.46
  const currentLevel = levelSteps.reduce((level, step) => earnedPoints >= step.min ? step : level, levelSteps[0])
  const isMaximumLevel = currentLevel.level === levelSteps.length
  const levelProgress = isMaximumLevel ? 100 : ((earnedPoints - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100
  const pointsToNext = Math.max(currentLevel.max - earnedPoints, 0)
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
          <div className="profile-avatar"><Icon name="leaf" /><span>{currentLevel.level}</span></div>
          <div><h1 id="profile-title">{profile.name}님의 에코 여정</h1><p>{profile.email} · {profile.joinedAt} 탑승</p></div>
        </div>
        <div className="profile-hero__actions"><button type="button" onClick={onLogout}>로그아웃</button><button type="button" onClick={() => setShowDeleteDialog(true)}>회원탈퇴</button></div>
      </section>

      <section className="level-card" aria-label={`현재 에코 레벨 ${currentLevel.level}`}>
        <div className="level-card__copy">
          <h2>LEVEL {currentLevel.level}<em>{currentLevel.name}</em></h2>
          <p>{currentLevel.label} 단계예요. 부스를 체험하고 친환경 선택을 이어가며 나만의 에코 숲을 키워보세요.</p>
          <div className="level-progress-label"><span>{earnedPoints.toLocaleString('ko-KR')} XP</span><strong>{isMaximumLevel ? '최고 레벨 달성' : `다음 레벨까지 ${pointsToNext.toLocaleString('ko-KR')} XP`}</strong></div>
          <div className="level-progress"><i style={{ width: `${Math.min(levelProgress, 100)}%` }} /></div>
        </div>
        <div className="level-orbit" aria-hidden="true"><i /><i /><i /><span><Icon name={currentLevel.level >= 3 ? 'train' : 'leaf'} /></span></div>
        <div className="level-stats"><div><small>보유 포인트</small><strong>{balance.toLocaleString('ko-KR')} P</strong></div><div><small>완료 부스</small><strong>{completedBooths.size} / 5</strong></div><div><small>리워드 수령</small><strong>{rewardOrderCount}회</strong></div></div>
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

      <section className="impact-report" aria-labelledby="impact-report-title">
        <header className="impact-report__heading"><div><h2 id="impact-report-title">나의 실천이 만든 변화</h2><p>부스에서 선택한 친환경 행동을 이해하기 쉬운 체험 환산값으로 보여드려요.</p></div></header>
        <div className="impact-summary-grid">
          <article><span><Icon name="gauge" /></span><p><small>ENERGY SAVED</small><strong>{energySaved.toFixed(1)} <em>kWh</em></strong><i>예상 에너지 절감</i></p></article>
          <article><span><Icon name="leaf" /></span><p><small>CARBON DOWN</small><strong>{carbonSaved.toFixed(1)} <em>kgCO₂</em></strong><i>예상 탄소 저감</i></p></article>
          <article><span><Icon name="check" /></span><p><small>ECO ACTIONS</small><strong>{ecoActions} <em>회</em></strong><i>부스·친환경 선택</i></p></article>
        </div>
        <div className="impact-insight"><span><Icon name="leaf" /></span><p><strong>{completedBooths.size > 0 ? `${completedBooths.size}개의 부스가 나의 에코 습관으로 연결되고 있어요.` : '첫 부스에서 나의 에코 리포트를 시작해 보세요.'}</strong><small>환산값은 아카데미 체험을 위한 가상 지표이며 실제 절감 효과와 다를 수 있습니다.</small></p><button type="button" onClick={onOpenBooths}>{passportReady ? '부스 다시 보기' : '다음 부스 체험'} <Icon name="arrow" /></button></div>
      </section>

      <section className="profile-account-card" aria-label="계정 정보"><div><span><Icon name="my" /></span><p><strong>참가자 계정</strong><small>{profile.name} · {profile.email}</small></p></div><span className="profile-mode-chip"><Icon name="lock" /> 보호 계정</span></section>

      {showDeleteDialog ? <div className="account-dialog-backdrop" role="presentation"><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><span className="account-dialog__icon"><Icon name="my" /></span><h2 id="delete-account-title">정말 회원탈퇴할까요?</h2><p>현재 참가자의 부스 스탬프, ECO POINT, 굿즈 교환 내역이 모두 삭제됩니다. 이 작업은 되돌릴 수 없어요.</p>{deleteError ? <p className="account-dialog__error" role="alert">{deleteError}</p> : null}<div><button type="button" className="secondary-button" autoFocus onClick={() => setShowDeleteDialog(false)}>계속 이용하기</button><button type="button" className="account-delete-button" disabled={isDeleting} onClick={deleteAccount}>{isDeleting ? '삭제 중...' : '모든 데이터 삭제'}</button></div></section></div> : null}
    </main>
  )
}
