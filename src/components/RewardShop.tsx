import { useState } from 'react'
import { rewardProducts } from '../data/rewards'
import type { RewardProduct, RewardRedemptionResult } from '../types'
import { Icon } from './Icon'

type RewardFilter = 'all' | RewardProduct['category']

type RewardShopProps = {
  balance: number
  onRedeem: (rewardId: RewardProduct['id']) => Promise<RewardRedemptionResult>
}

const filters: readonly { id: RewardFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'lifestyle', label: '라이프스타일' },
  { id: 'upcycle', label: '업사이클' },
  { id: 'event', label: '현장 한정' },
]

export function RewardShop({ balance, onRedeem }: RewardShopProps) {
  const [filter, setFilter] = useState<RewardFilter>('all')
  const [selectedReward, setSelectedReward] = useState<RewardProduct | null>(null)
  const [redemption, setRedemption] = useState<RewardRedemptionResult | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const visibleRewards = filter === 'all' ? rewardProducts : rewardProducts.filter((reward) => reward.category === filter)

  function openReward(reward: RewardProduct) {
    setSelectedReward(reward)
    setRedemption(null)
    setIsRedeeming(false)
  }

  function closeDialog() {
    setSelectedReward(null)
    setRedemption(null)
    setIsRedeeming(false)
  }

  async function redeemSelectedReward() {
    if (!selectedReward) return
    setIsRedeeming(true)
    setRedemption(null)
    const result = await onRedeem(selectedReward.id)
    setRedemption(result)
    setIsRedeeming(false)
  }

  return (
    <main id="main-content" className="page reward-shop-page">
      <section className="reward-shop-hero" aria-labelledby="reward-shop-title">
        <div className="reward-shop-hero__copy">
          <h1 id="reward-shop-title">지구를 위한 마음을<br /><em>일상의 리워드로</em></h1>
          <p>부스 체험으로 모은 ECO POINT를 오래 쓰는 친환경 굿즈로 교환하세요. 모든 상품은 현장 굿즈 스테이션에서 수령합니다.</p>
          <div className="shop-wallet-chip">
            <span><Icon name="wallet" /></span>
            <small>MY ECO POINT</small>
            <strong>{balance.toLocaleString('ko-KR')} P</strong>
          </div>
        </div>
        <div className="reward-shop-hero__scene" aria-hidden="true">
          <span className="shop-sun" />
          <span className="shop-cloud shop-cloud--one" />
          <span className="shop-cloud shop-cloud--two" />
          <div className="reward-station">
            <span className="reward-station__sign">ECO REWARD</span>
            <i /><i /><i />
            <Icon name="shop" />
          </div>
          <div className="shop-track"><Icon name="train" /></div>
        </div>
      </section>

      <section className="reward-catalog" aria-labelledby="reward-catalog-title">
        <header className="reward-catalog__heading">
          <div>
            <h2 id="reward-catalog-title">오늘부터 함께할 굿즈</h2>
            <p>제품을 선택해 상세 정보와 필요한 포인트를 확인하세요.</p>
          </div>
          <div className="reward-filters" role="group" aria-label="굿즈 카테고리 필터">
            {filters.map((item) => (
              <button type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} key={item.id}>{item.label}</button>
            ))}
          </div>
        </header>

        <div className="reward-product-grid">
          {visibleRewards.map((reward) => {
            const affordable = balance >= reward.points
            return (
              <article className="reward-product-card" key={reward.id}>
                <div className={`reward-product-card__visual reward-product-card__visual--${reward.theme}`}>
                  <span>{reward.categoryLabel}</span>
                  <div className="reward-product-object"><Icon name={reward.icon} /><i /><i /></div>
                  <small>{reward.points.toLocaleString('ko-KR')} ECO POINT</small>
                </div>
                <div className="reward-product-card__body">
                  <p>{reward.subtitle}</p>
                  <h3>{reward.name}</h3>
                  <div className="reward-product-card__price">
                    <span className={affordable ? 'is-affordable' : ''}><Icon name="leaf" /> {reward.points.toLocaleString('ko-KR')} P</span>
                    <small>{affordable ? '교환 가능' : `${(reward.points - balance).toLocaleString('ko-KR')} P 부족`}</small>
                  </div>
                  <button type="button" onClick={() => openReward(reward)}>자세히 보기 <Icon name="arrow" /></button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="reward-pickup-guide" aria-label="굿즈 수령 방법">
        <span className="reward-pickup-guide__icon"><Icon name="shop" /></span>
        <div><h2>교환 완료 후 현장 스테이션에서 바로 수령</h2><p>교환 화면에 표시되는 6자리 수령 코드를 스태프에게 보여주세요.</p></div>
        <ol><li><strong>01</strong><span>굿즈 선택</span></li><li><strong>02</strong><span>포인트 교환</span></li><li><strong>03</strong><span>코드 제시</span></li></ol>
      </section>

      {selectedReward ? (
        <div className="reward-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDialog()}>
          <section className={`reward-dialog${redemption ? ' reward-dialog--result' : ''}`} role="dialog" aria-modal="true" aria-labelledby="reward-dialog-title">
            <button className="reward-dialog__close" type="button" aria-label="굿즈 상세 닫기" onClick={closeDialog}>×</button>
            {redemption?.status === 'success' ? (
              <div className="reward-result reward-result--success">
                <span className="reward-result__icon"><Icon name="check" /></span>
                <h2 id="reward-dialog-title">굿즈 교환이 완료됐어요!</h2>
                <p><strong>{selectedReward.name}</strong>을 준비하고 있어요.<br />아래 코드를 현장 스태프에게 보여주세요.</p>
                <div className="pickup-code"><small>PICK-UP CODE</small><strong>{redemption.orderCode}</strong></div>
                <div className="reward-result__summary"><span>사용 포인트</span><strong>-{selectedReward.points.toLocaleString('ko-KR')} P</strong></div>
                <p className="reward-result__note"><Icon name="shop" /> {selectedReward.pickupNote}</p>
                <div className="reward-result__actions">
                  <button type="button" className="secondary-button" onClick={closeDialog}>계속 둘러보기</button>
                  <button type="button" className="primary-button" onClick={closeDialog}>확인 <Icon name="arrow" /></button>
                </div>
              </div>
            ) : redemption?.status === 'insufficient' ? (
              <div className="reward-result reward-result--warning">
                <span className="reward-result__icon"><Icon name="warning" /></span>
                <h2 id="reward-dialog-title">ECO POINT가 조금 부족해요</h2>
                <p><strong>{selectedReward.name}</strong> 교환까지<br /><em>{redemption.shortage.toLocaleString('ko-KR')} P</em>가 더 필요합니다.</p>
                <div className="point-comparison"><span><small>보유 포인트</small><strong>{balance.toLocaleString('ko-KR')} P</strong></span><i /><span><small>필요 포인트</small><strong>{selectedReward.points.toLocaleString('ko-KR')} P</strong></span></div>
                <p className="reward-result__note"><Icon name="booths" /> 남은 부스를 체험하면 포인트를 더 모을 수 있어요.</p>
                <div className="reward-result__actions">
                  <button type="button" className="secondary-button" onClick={() => setRedemption(null)}>상품으로 돌아가기</button>
                  <button type="button" className="primary-button" onClick={closeDialog}>확인</button>
                </div>
              </div>
            ) : redemption?.status === 'error' ? (
              <div className="reward-result reward-result--notice">
                <span className="reward-result__icon"><Icon name="lock" /></span>
                <h2 id="reward-dialog-title">교환을 완료하지 못했어요</h2>
                <p>{redemption.message}</p>
                <div className="reward-result__actions">
                  <button type="button" className="secondary-button" onClick={() => setRedemption(null)}>상품으로 돌아가기</button>
                  <button type="button" className="primary-button" onClick={closeDialog}>확인</button>
                </div>
              </div>
            ) : (
              <>
                <div className={`reward-dialog__visual reward-product-card__visual--${selectedReward.theme}`}>
                  <span>{selectedReward.categoryLabel}</span>
                  <div className="reward-product-object"><Icon name={selectedReward.icon} /><i /><i /></div>
                </div>
                <div className="reward-dialog__content">
                  <h2 id="reward-dialog-title">{selectedReward.name}</h2>
                  <p className="reward-dialog__subtitle">{selectedReward.subtitle}</p>
                  <p className="reward-dialog__description">{selectedReward.description}</p>
                  <div className="reward-impact"><Icon name="leaf" /><p><strong>ECO IMPACT</strong>{selectedReward.impact}</p></div>
                  <div className="reward-dialog__checkout">
                    <div><small>필요 ECO POINT</small><strong>{selectedReward.points.toLocaleString('ko-KR')} P</strong></div>
                    <button type="button" onClick={redeemSelectedReward} disabled={isRedeeming}>{isRedeeming ? '교환 처리 중...' : '포인트로 교환하기'} {!isRedeeming ? <Icon name="arrow" /> : null}</button>
                  </div>
                  <p className="reward-dialog__balance">현재 보유 {balance.toLocaleString('ko-KR')} P · 교환 후 {Math.max(balance - selectedReward.points, 0).toLocaleString('ko-KR')} P</p>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </main>
  )
}
