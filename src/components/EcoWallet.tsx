import { useState } from 'react'
import { maximumMissionPoints, missionRewards } from '../data/missions'
import type { MissionId, PointTransaction } from '../types'
import { Icon } from './Icon'

type TransactionFilter = 'all' | 'earn' | 'spend'

type EcoWalletProps = {
  balance: number
  transactions: readonly PointTransaction[]
  completedMissions: ReadonlySet<MissionId>
  isDemo: boolean
  onOpenMissions: () => void
}

const filterLabels: Record<TransactionFilter, string> = {
  all: '전체',
  earn: '적립',
  spend: '사용',
}

export function EcoWallet({ balance, transactions, completedMissions, isDemo, onOpenMissions }: EcoWalletProps) {
  const [filter, setFilter] = useState<TransactionFilter>('all')
  const earnedPoints = transactions.reduce((total, transaction) => transaction.type === 'earn' ? total + transaction.amount : total, 0)
  const spentPoints = transactions.reduce((total, transaction) => transaction.type === 'spend' ? total + Math.abs(transaction.amount) : total, 0)
  const filteredTransactions = filter === 'all' ? transactions : transactions.filter((transaction) => transaction.type === filter)
  const progress = maximumMissionPoints === 0 ? 0 : Math.min((earnedPoints / maximumMissionPoints) * 100, 100)

  return (
    <main id="main-content" className="page wallet-page">
      <header className="wallet-page__header">
        <div>
          <span className="section-label">ECO WALLET</span>
          <h1>나의 에코 포인트</h1>
          <p>미션으로 만든 변화를 포인트와 활동 기록으로 확인하세요.</p>
        </div>
        <span className="wallet-security-chip"><Icon name="lock" /> {isDemo ? '체험 모드' : 'Supabase 저장'}</span>
      </header>

      <section className="wallet-balance-card" aria-label={`현재 보유 포인트 ${balance}점`}>
        <div className="wallet-balance-card__copy">
          <span>AVAILABLE ECO POINT</span>
          <strong>{balance.toLocaleString('ko-KR')}<small>P</small></strong>
          <p>굿즈 숍에서 지구를 위한 리워드로 교환할 수 있어요.</p>
        </div>
        <div className="wallet-balance-card__coin"><Icon name="leaf" /><i /><i /></div>
        <div className="wallet-summary">
          <div><span>총 적립</span><strong>+{earnedPoints.toLocaleString('ko-KR')} P</strong></div>
          <div><span>총 사용</span><strong>-{spentPoints.toLocaleString('ko-KR')} P</strong></div>
          <div><span>완료 미션</span><strong>{completedMissions.size} / 4</strong></div>
        </div>
      </section>

      <section className="wallet-grid" aria-label="에코 포인트 현황">
        <article className="wallet-progress-card">
          <div className="wallet-section-heading">
            <div><span className="section-label">MISSION REWARDS</span><h2>미션 포인트 여정</h2></div>
            <strong>{Math.round(progress)}%</strong>
          </div>
          <div className="wallet-progress-track"><i style={{ width: `${progress}%` }} /></div>
          <div className="wallet-mission-list">
            {([1, 2, 3, 4] as const).map((missionId: MissionId) => {
              const mission = missionRewards[missionId]
              const isCompleted = completedMissions.has(missionId)
              const missionTransaction = transactions.find((transaction) => transaction.missionId === missionId)
              return (
                <div className={isCompleted ? 'is-completed' : ''} key={missionId}>
                  <span>{isCompleted ? <Icon name="check" /> : `0${missionId}`}</span>
                  <p><strong>{mission.title}</strong><small>{mission.category === 'academy' ? 'ACADEMY' : 'POP-UP BOOTH'}</small></p>
                  <em>{missionTransaction ? `+${missionTransaction.amount} P` : '도전 전'}</em>
                </div>
              )
            })}
          </div>
          {completedMissions.size < 4 ? (
            <button className="wallet-mission-button" type="button" onClick={onOpenMissions}>남은 미션 도전하기 <Icon name="arrow" /></button>
          ) : (
            <p className="wallet-all-clear"><Icon name="sparkle" /> 모든 미션을 완료했어요!</p>
          )}
        </article>

        <article className="wallet-impact-card">
          <span className="section-label">TODAY'S IMPACT</span>
          <h2>작은 포인트,<br />큰 에코 임팩트</h2>
          <div className="impact-orbit"><Icon name="leaf" /><i /><i /><i /></div>
          <p>현재까지 <strong>{completedMissions.size}개</strong>의 미션에서<br /><strong>{earnedPoints} ECO POINT</strong>를 만들었어요.</p>
          <span className="impact-note">실제 탄소 환산 데이터는 MY 리포트에서 연결됩니다.</span>
        </article>
      </section>

      <section className="transaction-section" aria-labelledby="transaction-title">
        <div className="transaction-section__heading">
          <div><span className="section-label">POINT HISTORY</span><h2 id="transaction-title">포인트 획득·사용 내역</h2></div>
          <div className="transaction-filters" role="group" aria-label="포인트 내역 필터">
            {(Object.keys(filterLabels) as TransactionFilter[]).map((filterId) => (
              <button type="button" aria-pressed={filter === filterId} onClick={() => setFilter(filterId)} key={filterId}>{filterLabels[filterId]}</button>
            ))}
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="transaction-list">
            {filteredTransactions.map((transaction) => (
              <article key={transaction.id}>
                <span className={`transaction-icon transaction-icon--${transaction.type}`}><Icon name={transaction.type === 'earn' ? 'leaf' : 'shop'} /></span>
                <div><strong>{transaction.title}</strong><p>{transaction.description}</p><small>{transaction.createdAt}</small></div>
                <em className={`transaction-amount transaction-amount--${transaction.type}`}>{transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('ko-KR')} P</em>
              </article>
            ))}
          </div>
        ) : (
          <div className="transaction-empty">
            <span><Icon name={filter === 'spend' ? 'shop' : 'wallet'} /></span>
            <h3>{filter === 'spend' ? '아직 사용 내역이 없어요' : '아직 포인트 내역이 없어요'}</h3>
            <p>{filter === 'spend' ? '굿즈 숍에서 포인트로 리워드를 교환하면 여기에 기록됩니다.' : '미션을 완료하면 적립 내역이 이곳에 차곡차곡 쌓여요.'}</p>
          </div>
        )}
      </section>
    </main>
  )
}
