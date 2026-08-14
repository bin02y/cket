import { useState } from 'react'
import { rewardProducts } from '../data/rewards'
import type { RewardPaymentMethod, RewardProduct, RewardRedemptionResult } from '../types'
import { Icon } from './Icon'

type RewardFilter = 'all' | RewardProduct['category']

type RewardShopProps = {
  balance: number
  completedStamps: number
  onRedeem: (rewardId: RewardProduct['id'], paymentMethod: RewardPaymentMethod) => Promise<RewardRedemptionResult>
}

const filters: readonly { id: RewardFilter; label: string }[] = [
  { id: 'all', label: '전체 10종' },
  { id: 'tech', label: '공조 기술' },
  { id: 'lifestyle', label: '생활·ESG' },
  { id: 'limited', label: '무료·한정' },
]

function defaultPaymentMethod(reward: RewardProduct): RewardPaymentMethod {
  if (reward.points !== null) return 'points'
  if (reward.cashPrice > 0) return 'cash'
  return 'free'
}

function requiredStampCount(reward: RewardProduct) {
  if (reward.requirement === 'passport') return 5
  if (reward.requirement === 'one-stamp') return 1
  return 0
}

export function RewardShop({ balance, completedStamps, onRedeem }: RewardShopProps) {
  const [filter, setFilter] = useState<RewardFilter>('all')
  const [selectedReward, setSelectedReward] = useState<RewardProduct | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<RewardPaymentMethod>('points')
  const [redemption, setRedemption] = useState<RewardRedemptionResult | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const visibleRewards = filter === 'all' ? rewardProducts : rewardProducts.filter((reward) => reward.category === filter)

  function openReward(reward: RewardProduct) {
    setSelectedReward(reward)
    setPaymentMethod(defaultPaymentMethod(reward))
    setRedemption(null)
    setIsRedeeming(false)
  }

  function closeDialog() {
    setSelectedReward(null)
    setRedemption(null)
    setIsRedeeming(false)
  }

  function returnToReward(method = paymentMethod) {
    setPaymentMethod(method)
    setRedemption(null)
  }

  async function redeemSelectedReward() {
    if (!selectedReward) return
    setIsRedeeming(true)
    setRedemption(null)
    const result = await onRedeem(selectedReward.id, paymentMethod)
    setRedemption(result)
    setIsRedeeming(false)
  }

  function paymentSummary(reward: RewardProduct, method: RewardPaymentMethod) {
    if (method === 'cash') return { label: '현장 현금 결제', value: `${reward.cashPrice.toLocaleString('ko-KR')}원` }
    if (method === 'free') return { label: '무료 지급', value: '0원' }
    return { label: '사용 포인트', value: `-${(reward.points ?? 0).toLocaleString('ko-KR')} P` }
  }

  return (
    <main id="main-content" className="page reward-shop-page">
      <section className="reward-shop-hero" aria-labelledby="reward-shop-title">
        <div className="reward-shop-hero__copy">
          <h1 id="reward-shop-title">지구를 위한 마음을<br /><em>일상의 리워드로</em></h1>
          <p>열 가지 프로그램 굿즈를 현금 또는 ECO POINT로 선택할 수 있습니다. 결제와 수령은 현장 리워드 스테이션에서 진행합니다.</p>
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
          <div className="reward-station"><span className="reward-station__sign">ECO REWARD</span><i /><i /><i /><Icon name="shop" /></div>
          <div className="shop-track"><Icon name="train" /></div>
        </div>
      </section>

      <section className="reward-catalog" aria-labelledby="reward-catalog-title">
        <header className="reward-catalog__heading">
          <div><h2 id="reward-catalog-title">냉동공조 리워드 컬렉션</h2><p>카드를 선택하면 굿즈 설명과 현금·포인트 구매 방법을 확인할 수 있습니다.</p></div>
          <div className="reward-filters" role="group" aria-label="리워드 카테고리 필터">
            {filters.map((item) => <button type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} key={item.id}>{item.label}</button>)}
          </div>
        </header>

        <div className="reward-product-grid">
          {visibleRewards.map((reward) => {
            const requiredStamps = requiredStampCount(reward)
            const unlocked = completedStamps >= requiredStamps
            const affordable = reward.points !== null && balance >= reward.points
            return (
              <article className={`reward-product-card${unlocked ? '' : ' is-locked'}`} key={reward.id}>
                <div className={`reward-product-card__visual reward-product-card__visual--${reward.theme}`}>
                  <div className="reward-product-object"><Icon name={reward.icon} /><i /><i /></div>
                </div>
                <div className="reward-product-card__body">
                  <p>{reward.subtitle}</p>
                  <h3>{reward.name}</h3>
                  <div className="reward-price-options">
                    {reward.cashPrice > 0 ? <span><small>현금</small><strong>{reward.cashPrice.toLocaleString('ko-KR')}원</strong></span> : null}
                    {reward.points !== null ? <span className={affordable ? 'is-affordable' : ''}><small>포인트</small><strong>{reward.points.toLocaleString('ko-KR')} P</strong></span> : null}
                    {reward.cashPrice === 0 && reward.points === null ? <span className="is-free"><small>참가 혜택</small><strong>무료 지급</strong></span> : null}
                  </div>
                  <button type="button" onClick={() => openReward(reward)}>{unlocked ? reward.cashPrice === 0 ? '무료 수령 안내' : '구매 방법 선택' : `스탬프 ${requiredStamps}개 필요`} <Icon name={unlocked ? 'arrow' : 'lock'} /></button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="reward-pickup-guide" aria-label="리워드 결제 및 수령 방법">
        <span className="reward-pickup-guide__icon"><Icon name="shop" /></span>
        <div><h2>현금 또는 ECO POINT 선택 후 현장에서 수령</h2><p>신청 완료 화면의 6자리 코드를 스태프에게 보여주세요. 현금 구매는 리워드 스테이션에서 결제합니다.</p></div>
        <ol><li><strong>01</strong><span>리워드 선택</span></li><li><strong>02</strong><span>결제 방식 선택</span></li><li><strong>03</strong><span>코드 제시</span></li></ol>
      </section>

      {selectedReward ? (
        <div className="reward-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDialog()}>
          <section className={`reward-dialog${redemption ? ' reward-dialog--result' : ''}`} role="dialog" aria-modal="true" aria-labelledby="reward-dialog-title">
            <button className="reward-dialog__close" type="button" aria-label="리워드 상세 닫기" onClick={closeDialog}>×</button>
            {redemption?.status === 'success' ? (() => {
              const summary = paymentSummary(selectedReward, redemption.paymentMethod)
              return <div className="reward-result reward-result--success">
                <span className="reward-result__icon"><Icon name="check" /></span>
                <h2 id="reward-dialog-title">{redemption.paymentMethod === 'cash' ? '현장 구매 신청이 완료됐어요!' : redemption.paymentMethod === 'free' ? '무료 리워드가 준비됐어요!' : '포인트 교환이 완료됐어요!'}</h2>
                <p><strong>{selectedReward.name}</strong>을 준비하고 있습니다.<br />아래 코드를 현장 스태프에게 보여주세요.</p>
                <div className="pickup-code"><small>PICK-UP CODE</small><strong>{redemption.orderCode}</strong></div>
                <div className="reward-result__summary"><span>{summary.label}</span><strong>{summary.value}</strong></div>
                <p className="reward-result__note"><Icon name="shop" /> {redemption.paymentMethod === 'cash' ? '현장에서 현금 결제를 마친 뒤 상품을 수령해 주세요.' : selectedReward.pickupNote}</p>
                <div className="reward-result__actions"><button type="button" className="secondary-button" onClick={closeDialog}>계속 둘러보기</button><button type="button" className="primary-button" onClick={closeDialog}>확인 <Icon name="arrow" /></button></div>
              </div>
            })() : redemption?.status === 'insufficient' ? (
              <div className="reward-result reward-result--warning">
                <span className="reward-result__icon"><Icon name="warning" /></span>
                <h2 id="reward-dialog-title">ECO POINT가 조금 부족해요</h2>
                <p><strong>{selectedReward.name}</strong> 교환까지<br /><em>{redemption.shortage.toLocaleString('ko-KR')} P</em>가 더 필요합니다.</p>
                <div className="point-comparison"><span><small>보유 포인트</small><strong>{balance.toLocaleString('ko-KR')} P</strong></span><i /><span><small>필요 포인트</small><strong>{(selectedReward.points ?? 0).toLocaleString('ko-KR')} P</strong></span></div>
                <p className="reward-result__note"><Icon name="shop" /> 현금 구매를 선택하면 포인트 없이도 현장에서 구매할 수 있어요.</p>
                <div className="reward-result__actions"><button type="button" className="secondary-button" onClick={() => returnToReward()}>상품으로 돌아가기</button><button type="button" className="primary-button" onClick={() => returnToReward('cash')}>현금 구매로 변경</button></div>
              </div>
            ) : redemption?.status === 'locked' ? (
              <div className="reward-result reward-result--notice">
                <span className="reward-result__icon"><Icon name="lock" /></span>
                <h2 id="reward-dialog-title">스탬프가 조금 더 필요해요</h2>
                <p>이 한정 리워드는 스탬프 <strong>{redemption.requiredStamps}개</strong>를 모은 참가자에게 지급합니다.</p>
                <div className="reward-result__actions"><button type="button" className="primary-button" onClick={closeDialog}>확인</button></div>
              </div>
            ) : redemption?.status === 'already_claimed' ? (
              <div className="reward-result reward-result--notice">
                <span className="reward-result__icon"><Icon name="check" /></span>
                <h2 id="reward-dialog-title">이미 신청한 무료 리워드예요</h2>
                <p>무료 지급 상품은 참가자 계정당 한 번만 받을 수 있습니다.</p>
                <div className="reward-result__actions"><button type="button" className="primary-button" onClick={closeDialog}>확인</button></div>
              </div>
            ) : redemption?.status === 'error' ? (
              <div className="reward-result reward-result--notice">
                <span className="reward-result__icon"><Icon name="lock" /></span>
                <h2 id="reward-dialog-title">신청을 완료하지 못했어요</h2>
                <p>{redemption.message}</p>
                <div className="reward-result__actions"><button type="button" className="secondary-button" onClick={() => returnToReward()}>상품으로 돌아가기</button><button type="button" className="primary-button" onClick={closeDialog}>확인</button></div>
              </div>
            ) : (
              <>
                <div className={`reward-dialog__visual reward-product-card__visual--${selectedReward.theme}`}><div className="reward-product-object"><Icon name={selectedReward.icon} /><i /><i /></div></div>
                <div className="reward-dialog__content">
                  <h2 id="reward-dialog-title">{selectedReward.name}</h2>
                  <p className="reward-dialog__subtitle">{selectedReward.subtitle}</p>
                  <div className="reward-description-list">{selectedReward.descriptions.map((sentence) => <p key={sentence}>{sentence}</p>)}</div>
                  <div className="reward-impact"><Icon name="leaf" /><p><strong>ECO IMPACT</strong>{selectedReward.impact}</p></div>
                  {selectedReward.cashPrice > 0 && selectedReward.points !== null ? <div className="payment-methods" role="radiogroup" aria-label="결제 방식"><button type="button" role="radio" aria-checked={paymentMethod === 'points'} onClick={() => setPaymentMethod('points')}><Icon name="wallet" /><span><small>ECO POINT</small><strong>{selectedReward.points.toLocaleString('ko-KR')} P</strong></span></button><button type="button" role="radio" aria-checked={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')}><Icon name="shop" /><span><small>현장 현금</small><strong>{selectedReward.cashPrice.toLocaleString('ko-KR')}원</strong></span></button></div> : null}
                  <div className="reward-dialog__checkout">
                    <div><small>{paymentSummary(selectedReward, paymentMethod).label}</small><strong>{paymentSummary(selectedReward, paymentMethod).value.replace('-', '')}</strong></div>
                    <button type="button" onClick={redeemSelectedReward} disabled={isRedeeming}>{isRedeeming ? '신청 처리 중...' : paymentMethod === 'cash' ? '현금 구매 신청하기' : paymentMethod === 'free' ? '무료로 받기' : '포인트로 교환하기'} {!isRedeeming ? <Icon name="arrow" /> : null}</button>
                  </div>
                  <p className="reward-dialog__balance">{paymentMethod === 'points' ? `현재 보유 ${balance.toLocaleString('ko-KR')} P · 교환 후 ${Math.max(balance - (selectedReward.points ?? 0), 0).toLocaleString('ko-KR')} P` : paymentMethod === 'cash' ? '온라인 결제가 아닌 현장 현금 결제 신청입니다.' : selectedReward.pickupNote}</p>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </main>
  )
}
