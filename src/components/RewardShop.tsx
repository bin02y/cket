import { useState } from 'react'
import { rewardProducts } from '../data/rewards'
import type { RewardPaymentMethod, RewardProduct, RewardRedemptionResult } from '../types'
import { Icon } from './Icon'

type RewardShopProps = {
  balance: number
  completedStamps: number
  onRedeem: (rewardId: RewardProduct['id'], paymentMethod: RewardPaymentMethod) => Promise<RewardRedemptionResult>
}

function requiredStampCount(reward: RewardProduct) {
  if (reward.requirement === 'passport') return 5
  if (reward.requirement === 'one-stamp') return 1
  return 0
}

export function RewardShop({ balance, completedStamps, onRedeem }: RewardShopProps) {
  const [selectedReward, setSelectedReward] = useState<RewardProduct | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<RewardPaymentMethod>('points')
  const [redemption, setRedemption] = useState<RewardRedemptionResult | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  function openReward(reward: RewardProduct, method: RewardPaymentMethod) {
    setSelectedReward(reward)
    setPaymentMethod(method)
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
      <section className="reward-catalog" aria-labelledby="reward-catalog-title">
        <header className="reward-catalog__heading">
          <h1 id="reward-catalog-title">굿즈샵</h1>
          <div className="shop-wallet-chip" aria-label={`현재 에코 포인트 ${balance}점`}>
            <span><Icon name="wallet" /></span>
            <small>MY ECO POINT</small>
            <strong>{balance.toLocaleString('ko-KR')} P</strong>
          </div>
        </header>

        <div className="reward-product-grid">
          {rewardProducts.map((reward) => {
            const requiredStamps = requiredStampCount(reward)
            const unlocked = completedStamps >= requiredStamps
            const affordable = reward.points !== null && balance >= reward.points
            return (
              <article className={`reward-product-card${unlocked ? '' : ' is-locked'}`} key={reward.id}>
                <div className={`reward-product-card__visual reward-product-card__visual--${reward.theme}`}>
                  <img className="reward-product-image" src={reward.image} alt={reward.imageAlt} loading="lazy" decoding="async" />
                </div>
                <div className="reward-product-card__body">
                  <h3>{reward.name}</h3>
                  <div className="reward-price-options">
                    {reward.cashPrice > 0 ? <button type="button" disabled={!unlocked} onClick={() => openReward(reward, 'cash')}><small>현금</small><strong>{reward.cashPrice.toLocaleString('ko-KR')}원</strong></button> : null}
                    {reward.points !== null ? <button className={affordable ? 'is-affordable' : ''} type="button" disabled={!unlocked} onClick={() => openReward(reward, 'points')}><small>포인트</small><strong>{reward.points.toLocaleString('ko-KR')} P</strong></button> : null}
                    {reward.cashPrice === 0 && reward.points === null ? <button className="is-free" type="button" disabled={!unlocked} onClick={() => openReward(reward, 'free')}><small>참가 혜택</small><strong>무료 지급</strong></button> : null}
                  </div>
                  {!unlocked ? <p className="reward-product-card__locked"><Icon name="lock" /> 스탬프 {requiredStamps}개 필요</p> : null}
                </div>
              </article>
            )
          })}
        </div>
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
                <div className={`reward-dialog__visual reward-product-card__visual--${selectedReward.theme}`}><img className="reward-product-image" src={selectedReward.image} alt={selectedReward.imageAlt} decoding="async" /></div>
                <div className="reward-dialog__content">
                  <h2 id="reward-dialog-title">{selectedReward.name}</h2>
                  {selectedReward.cashPrice > 0 && selectedReward.points !== null ? <div className="payment-methods" role="radiogroup" aria-label="결제 방식"><button type="button" role="radio" aria-checked={paymentMethod === 'points'} onClick={() => setPaymentMethod('points')}><Icon name="wallet" /><span><small>ECO POINT</small><strong>{selectedReward.points.toLocaleString('ko-KR')} P</strong></span></button><button type="button" role="radio" aria-checked={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')}><Icon name="shop" /><span><small>현장 현금</small><strong>{selectedReward.cashPrice.toLocaleString('ko-KR')}원</strong></span></button></div> : null}
                  <div className="reward-dialog__checkout">
                    <div><small>{paymentSummary(selectedReward, paymentMethod).label}</small><strong>{paymentSummary(selectedReward, paymentMethod).value.replace('-', '')}</strong></div>
                    <button type="button" onClick={redeemSelectedReward} disabled={isRedeeming}>{isRedeeming ? '신청 처리 중...' : paymentMethod === 'cash' ? '현금 구매 신청하기' : paymentMethod === 'free' ? '무료로 받기' : '포인트로 교환하기'} {!isRedeeming ? <Icon name="arrow" /> : null}</button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </main>
  )
}
