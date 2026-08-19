import { useState } from 'react'
import { rewardProducts } from '../data/rewards'
import type { RewardProduct, RewardRedemptionResult } from '../types'
import { Icon } from './Icon'

const WON_PER_POINT = 1

type RewardShopProps = {
  balance: number
  completedStamps: number
  onRedeem: (rewardId: RewardProduct['id'], pointsToUse: number) => Promise<RewardRedemptionResult>
}

function requiredStampCount(reward: RewardProduct) {
  if (reward.requirement === 'passport') return 5
  if (reward.requirement === 'one-stamp') return 1
  return 0
}

export function RewardShop({ balance, completedStamps, onRedeem }: RewardShopProps) {
  const [selectedReward, setSelectedReward] = useState<RewardProduct | null>(null)
  const [usePoints, setUsePoints] = useState(true)
  const [redemption, setRedemption] = useState<RewardRedemptionResult | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)

  const availableDiscountPoints = selectedReward
    ? Math.min(balance, selectedReward.cashPrice)
    : 0
  const pointsToUse = usePoints ? availableDiscountPoints : 0
  const cashToPay = selectedReward ? selectedReward.cashPrice - pointsToUse * WON_PER_POINT : 0

  function openReward(reward: RewardProduct) {
    setSelectedReward(reward)
    setUsePoints(balance > 0 && reward.cashPrice > 0)
    setRedemption(null)
    setIsRedeeming(false)
  }

  function closeDialog() {
    setSelectedReward(null)
    setRedemption(null)
    setIsRedeeming(false)
  }

  function returnToReward() {
    setRedemption(null)
  }

  async function redeemSelectedReward() {
    if (!selectedReward) return
    setIsRedeeming(true)
    setRedemption(null)
    const result = await onRedeem(selectedReward.id, pointsToUse)
    setRedemption(result)
    setIsRedeeming(false)
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
            return (
              <button className={`reward-product-card${unlocked ? '' : ' is-locked'}`} type="button" disabled={!unlocked} onClick={() => openReward(reward)} key={reward.id}>
                <div className={`reward-product-card__visual reward-product-card__visual--${reward.theme}`}>
                  <img className="reward-product-image" src={reward.image} alt={reward.imageAlt} loading="lazy" decoding="async" />
                </div>
                <div className="reward-product-card__body">
                  <h3>{reward.name}</h3>
                  <span className="reward-product-card__price">{reward.cashPrice > 0 ? `${reward.cashPrice.toLocaleString('ko-KR')}원` : '무료 지급'}</span>
                  {!unlocked ? <p className="reward-product-card__locked"><Icon name="lock" /> 스탬프 {requiredStamps}개 필요</p> : null}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {selectedReward ? (
        <div className="reward-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDialog()}>
          <section className={`reward-dialog${redemption ? ' reward-dialog--result' : ''}`} role="dialog" aria-modal="true" aria-labelledby="reward-dialog-title">
            <button className="reward-dialog__close" type="button" aria-label="리워드 상세 닫기" onClick={closeDialog}>×</button>
            {redemption?.status === 'success' ? (() => {
              return <div className="reward-result reward-result--success">
                <span className="reward-result__icon"><Icon name="check" /></span>
                <h2 id="reward-dialog-title">{selectedReward.cashPrice === 0 ? '무료 리워드가 준비됐어요!' : redemption.cashPaid === 0 ? '포인트 전액 구매가 완료됐어요!' : '현장 구매 신청이 완료됐어요!'}</h2>
                <p><strong>{selectedReward.name}</strong>을 준비하고 있습니다.<br />아래 코드를 현장 스태프에게 보여주세요.</p>
                <div className="pickup-code"><small>PICK-UP CODE</small><strong>{redemption.orderCode}</strong></div>
                <div className="reward-result__summary"><div><span>{redemption.cashPaid > 0 ? '현장 현금 결제' : '현장 결제 금액'}</span>{redemption.pointsSpent > 0 ? <small>{redemption.pointsSpent.toLocaleString('ko-KR')} P 사용</small> : null}</div><strong>{redemption.cashPaid.toLocaleString('ko-KR')}원</strong></div>
                <p className="reward-result__note"><Icon name="shop" /> {redemption.cashPaid > 0 ? '표시된 금액을 현장에서 현금 결제한 뒤 상품을 수령해 주세요.' : selectedReward.pickupNote}</p>
                <div className="reward-result__actions"><button type="button" className="secondary-button" onClick={closeDialog}>계속 둘러보기</button><button type="button" className="primary-button" onClick={closeDialog}>확인 <Icon name="arrow" /></button></div>
              </div>
            })() : redemption?.status === 'insufficient' ? (
              <div className="reward-result reward-result--warning">
                <span className="reward-result__icon"><Icon name="warning" /></span>
                <h2 id="reward-dialog-title">포인트 잔액이 변경됐어요</h2>
                <p>결제 중 잔액이 바뀌어 선택한 포인트보다<br /><em>{redemption.shortage.toLocaleString('ko-KR')} P</em>가 부족합니다.</p>
                <p className="reward-result__note"><Icon name="shop" /> 상품으로 돌아가 최신 잔액에 맞춰 다시 신청해 주세요.</p>
                <div className="reward-result__actions"><button type="button" className="primary-button" onClick={returnToReward}>상품으로 돌아가기</button></div>
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
                <div className="reward-result__actions"><button type="button" className="secondary-button" onClick={returnToReward}>상품으로 돌아가기</button><button type="button" className="primary-button" onClick={closeDialog}>확인</button></div>
              </div>
            ) : (
              <>
                <div className={`reward-dialog__visual reward-product-card__visual--${selectedReward.theme}`}><img className="reward-product-image" src={selectedReward.image} alt={selectedReward.imageAlt} decoding="async" /></div>
                <div className="reward-dialog__content">
                  <h2 id="reward-dialog-title">{selectedReward.name}</h2>
                  {selectedReward.cashPrice > 0 ? <label className={`point-discount-option${usePoints ? ' is-selected' : ''}`}><input type="checkbox" checked={usePoints} disabled={availableDiscountPoints === 0} onChange={(event) => setUsePoints(event.target.checked)} /><span className="point-discount-option__icon"><Icon name="wallet" /></span><span><small>ECO POINT 할인</small><strong>{availableDiscountPoints > 0 ? `${availableDiscountPoints.toLocaleString('ko-KR')} P 사용 · ${(availableDiscountPoints * WON_PER_POINT).toLocaleString('ko-KR')}원 할인` : '사용 가능한 포인트가 없어요'}</strong></span></label> : null}
                  {selectedReward.cashPrice > 0 ? <div className="reward-payment-breakdown"><span><small>상품 금액</small><strong>{selectedReward.cashPrice.toLocaleString('ko-KR')}원</strong></span><span><small>포인트 할인</small><strong>-{(pointsToUse * WON_PER_POINT).toLocaleString('ko-KR')}원</strong></span></div> : null}
                  <div className="reward-dialog__checkout">
                    <div><small>{cashToPay > 0 ? '현장 결제 금액' : selectedReward.cashPrice > 0 ? '포인트 전액 결제' : '무료 지급'}</small><strong>{cashToPay.toLocaleString('ko-KR')}원</strong></div>
                    <button type="button" onClick={redeemSelectedReward} disabled={isRedeeming}>{isRedeeming ? '처리 중...' : selectedReward.cashPrice === 0 ? '받기' : '구매'} {!isRedeeming ? <Icon name="arrow" /> : null}</button>
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
