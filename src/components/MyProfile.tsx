import { useState } from 'react'
import { missionRewards } from '../data/missions'
import type { MissionId, ParticipantProfile, PointTransaction } from '../types'
import { Icon } from './Icon'

type MyProfileProps = {
  profile: ParticipantProfile
  transactions: readonly PointTransaction[]
  completedMissions: ReadonlySet<MissionId>
  balance: number
  onLogout: () => void
  onDeleteAccount: () => Promise<string | null>
  onOpenMissions: () => void
}

const levelSteps = [
  { level: 1, min: 0, max: 150, name: 'ECO SEED', label: '에코 씨앗' },
  { level: 2, min: 150, max: 300, name: 'ECO LEAF', label: '에코 잎새' },
  { level: 3, min: 300, max: 500, name: 'ECO TREE', label: '에코 나무' },
  { level: 4, min: 500, max: 640, name: 'ECO FOREST', label: '에코 숲' },
] as const

export function MyProfile({ profile, transactions, completedMissions, balance, onLogout, onDeleteAccount, onOpenMissions }: MyProfileProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const earnedPoints = transactions.reduce((total, transaction) => transaction.type === 'earn' ? total + transaction.amount : total, 0)
  const popupBonus = transactions.reduce((total, transaction) => {
    if (transaction.category !== 'popup' || !transaction.missionId) return total
    return total + Math.max(transaction.amount - missionRewards[transaction.missionId].basePoints, 0)
  }, 0)
  const ecoActions = completedMissions.size + Math.round(popupBonus / 30)
  const energySaved = completedMissions.size * 0.9 + ecoActions * 0.18
  const carbonSaved = energySaved * 0.46
  const currentLevel = levelSteps.reduce((level, step) => earnedPoints >= step.min ? step : level, levelSteps[0])
  const isMaximumLevel = currentLevel.level === levelSteps.length
  const levelProgress = isMaximumLevel ? 100 : ((earnedPoints - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100
  const pointsToNext = Math.max(currentLevel.max - earnedPoints, 0)
  const rewardCount = transactions.filter((transaction) => transaction.type === 'spend').length

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
          <div><span className="section-label">MY ECO PROFILE</span><h1 id="profile-title">{profile.name}님의 에코 여정</h1><p>{profile.email} · {profile.joinedAt} 탑승</p></div>
        </div>
        <div className="profile-hero__actions"><button type="button" onClick={onLogout}>로그아웃</button><button type="button" onClick={() => setShowDeleteDialog(true)}>회원탈퇴</button></div>
      </section>

      <section className="level-card" aria-label={`현재 에코 레벨 ${currentLevel.level}`}>
        <div className="level-card__copy">
          <span className="level-card__eyebrow">CURRENT ECO LEVEL</span>
          <h2>LEVEL {currentLevel.level}<em>{currentLevel.name}</em></h2>
          <p>{currentLevel.label} 단계예요. 미션과 친환경 선택을 이어가며 나만의 에코 숲을 키워보세요.</p>
          <div className="level-progress-label"><span>{earnedPoints.toLocaleString('ko-KR')} XP</span><strong>{isMaximumLevel ? '최고 레벨 달성' : `다음 레벨까지 ${pointsToNext.toLocaleString('ko-KR')} XP`}</strong></div>
          <div className="level-progress"><i style={{ width: `${Math.min(levelProgress, 100)}%` }} /></div>
        </div>
        <div className="level-orbit" aria-hidden="true"><i /><i /><i /><span><Icon name={currentLevel.level >= 3 ? 'train' : 'leaf'} /></span></div>
        <div className="level-stats"><div><small>보유 포인트</small><strong>{balance.toLocaleString('ko-KR')} P</strong></div><div><small>완료 미션</small><strong>{completedMissions.size} / 4</strong></div><div><small>굿즈 교환</small><strong>{rewardCount} 회</strong></div></div>
      </section>

      <section className="impact-report" aria-labelledby="impact-report-title">
        <header className="impact-report__heading"><div><span className="section-label">MY ESG ACTION REPORT</span><h2 id="impact-report-title">나의 실천이 만든 변화</h2><p>미션 활동을 이해하기 쉬운 체험 환산값으로 보여드려요.</p></div><span><Icon name="sparkle" /> LIVE REPORT</span></header>
        <div className="impact-summary-grid">
          <article><span><Icon name="gauge" /></span><p><small>ENERGY SAVED</small><strong>{energySaved.toFixed(1)} <em>kWh</em></strong><i>예상 에너지 절감</i></p></article>
          <article><span><Icon name="leaf" /></span><p><small>CARBON DOWN</small><strong>{carbonSaved.toFixed(1)} <em>kgCO₂e</em></strong><i>예상 탄소 저감</i></p></article>
          <article><span><Icon name="check" /></span><p><small>ECO ACTIONS</small><strong>{ecoActions} <em>회</em></strong><i>미션·친환경 선택</i></p></article>
        </div>

        <div className="mission-impact-chart">
          <div className="mission-impact-chart__heading"><h3>미션별 임팩트 기여도</h3><span>획득 ECO POINT 기준</span></div>
          <div className="mission-impact-list">
            {([1, 2, 3, 4] as const).map((missionId) => {
              const transaction = transactions.find((item) => item.missionId === missionId)
              const maximum = missionRewards[missionId].basePoints + (missionRewards[missionId].category === 'popup' ? 90 : 0)
              const percentage = transaction ? Math.min((transaction.amount / maximum) * 100, 100) : 0
              return <div key={missionId}><span>0{missionId}</span><p><strong>{missionRewards[missionId].title}</strong><small>{transaction ? `${transaction.amount} ECO POINT` : '아직 도전 전'}</small></p><div><i style={{ width: `${percentage}%` }} /></div><em>{Math.round(percentage)}%</em></div>
            })}
          </div>
        </div>

        <div className="impact-insight"><span><Icon name="leaf" /></span><p><strong>{completedMissions.size > 0 ? `${completedMissions.size}개의 미션이 에코 습관으로 연결되고 있어요.` : '첫 미션으로 나의 에코 리포트를 채워보세요.'}</strong><small>환산값은 아카데미 체험을 위한 가상 지표이며 실제 절감량과 다를 수 있습니다.</small></p><button type="button" onClick={onOpenMissions}>{completedMissions.size === 4 ? '미션 다시 보기' : '다음 미션 도전'} <Icon name="arrow" /></button></div>
      </section>

      <section className="profile-account-card" aria-label="계정 정보">
        <div><span><Icon name="my" /></span><p><strong>참가자 계정</strong><small>{profile.name} · {profile.email}</small></p></div>
        <span className="profile-mode-chip"><Icon name="lock" /> Supabase 보호 계정</span>
      </section>

      {showDeleteDialog ? (
        <div className="account-dialog-backdrop" role="presentation">
          <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
            <span className="account-dialog__icon"><Icon name="my" /></span>
            <span className="section-label">LEAVE ECO EXPRESS</span>
            <h2 id="delete-account-title">정말 회원탈퇴할까요?</h2>
            <p>현재 참가자의 미션 진행도, ECO POINT, 굿즈 교환 내역이 모두 삭제됩니다. 이 작업은 되돌릴 수 없어요.</p>
            {deleteError ? <p className="account-dialog__error" role="alert">{deleteError}</p> : null}
            <div><button type="button" className="secondary-button" autoFocus onClick={() => setShowDeleteDialog(false)}>계속 이용하기</button><button type="button" className="account-delete-button" disabled={isDeleting} onClick={deleteAccount}>{isDeleting ? '삭제 중...' : '모든 데이터 삭제'}</button></div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
