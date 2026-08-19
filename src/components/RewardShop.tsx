import { useEffect, useState } from 'react'
import { rewardProducts } from '../data/rewards'
import type { RewardProduct, RewardRedemptionResult } from '../types'
import { Icon } from './Icon'

const WON_PER_POINT = 1

type RewardShopProps = {
  participantId: string
  balance: number
  completedStamps: number
  onRedeem: (rewardId: RewardProduct['id'], pointsToUse: number) => Promise<RewardRedemptionResult>
}

type ShopCollection = 'wishlist' | 'cart'

type ShopPreferences = {
  version: 1
  wishlist: RewardProduct['id'][]
  cart: RewardProduct['id'][]
}

const rewardById = new Map<string, RewardProduct>(rewardProducts.map((reward) => [reward.id, reward]))

function loadShopPreferences(storageKey: string): ShopPreferences {
  const emptyPreferences: ShopPreferences = { version: 1, wishlist: [], cart: [] }
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return emptyPreferences
    const parsed = JSON.parse(stored) as Partial<ShopPreferences>
    const validIds = (values: unknown) => Array.isArray(values)
      ? values.filter((value): value is RewardProduct['id'] => typeof value === 'string' && rewardById.has(value))
      : []
    return { version: 1, wishlist: validIds(parsed.wishlist), cart: validIds(parsed.cart) }
  } catch {
    return emptyPreferences
  }
}

function requiredStampCount(reward: RewardProduct) {
  if (reward.requirement === 'passport') return 5
  if (reward.requirement === 'one-stamp') return 1
  return 0
}

export function RewardShop({ participantId, balance, completedStamps, onRedeem }: RewardShopProps) {
  const storageKey = `eco-express-shop:${participantId}:v1`
  const [selectedReward, setSelectedReward] = useState<RewardProduct | null>(null)
  const [usePoints, setUsePoints] = useState(true)
  const [redemption, setRedemption] = useState<RewardRedemptionResult | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCollection, setActiveCollection] = useState<ShopCollection | null>(null)
  const [shopNotice, setShopNotice] = useState('')
  const [preferences, setPreferences] = useState<ShopPreferences>(() => loadShopPreferences(storageKey))

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences))
    } catch {
      // The shop still works for this session when browser storage is unavailable.
    }
  }, [preferences, storageKey])

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR')
  const filteredRewards = normalizedQuery
    ? rewardProducts.filter((reward) => reward.name.toLocaleLowerCase('ko-KR').includes(normalizedQuery))
    : rewardProducts
  const wishlistProducts = preferences.wishlist.flatMap((id) => rewardById.get(id) ?? [])
  const cartProducts = preferences.cart.flatMap((id) => rewardById.get(id) ?? [])
  const collectionProducts = activeCollection === 'wishlist' ? wishlistProducts : cartProducts

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

  function togglePreference(collection: ShopCollection, reward: RewardProduct) {
    const alreadyAdded = preferences[collection].includes(reward.id)
    setPreferences((current) => ({
      ...current,
      [collection]: alreadyAdded
        ? current[collection].filter((id) => id !== reward.id)
        : [...current[collection], reward.id],
    }))
    const collectionLabel = collection === 'wishlist' ? '찜 목록' : '장바구니'
    setShopNotice(`${reward.name}을 ${collectionLabel}${alreadyAdded ? '에서 삭제했어요.' : '에 추가했어요.'}`)
  }

  function showCollection(collection: ShopCollection) {
    setActiveCollection((current) => current === collection ? null : collection)
  }

  async function redeemSelectedReward() {
    if (!selectedReward) return
    setIsRedeeming(true)
    setRedemption(null)
    const result = await onRedeem(selectedReward.id, pointsToUse)
    setRedemption(result)
    if (result.status === 'success') {
      setPreferences((current) => ({ ...current, cart: current.cart.filter((id) => id !== selectedReward.id) }))
    }
    setIsRedeeming(false)
  }

  return (
    <main id="main-content" className="page reward-shop-page">
      <section className="reward-catalog" aria-label="굿즈">
        <header className="shop-catalog-heading">
          <div className="shop-catalog-heading__main">
            <label className="shop-search">
              <Icon name="search" />
              <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="굿즈 검색" aria-label="굿즈 검색" />
            </label>
          </div>
          <div className="shop-catalog-heading__tools">
            <button className={`shop-collection-button${activeCollection === 'wishlist' ? ' is-active' : ''}`} type="button" aria-expanded={activeCollection === 'wishlist'} onClick={() => showCollection('wishlist')}><Icon name="heart" /><span>찜</span><strong>{preferences.wishlist.length}</strong></button>
            <button className={`shop-collection-button${activeCollection === 'cart' ? ' is-active' : ''}`} type="button" aria-expanded={activeCollection === 'cart'} onClick={() => showCollection('cart')}><Icon name="cart" /><span>장바구니</span><strong>{preferences.cart.length}</strong></button>
          </div>
        </header>

        <p className="shop-notice" role="status" aria-live="polite">{shopNotice}</p>

        {activeCollection ? (
          <aside className="shop-collection-panel" aria-labelledby="shop-collection-title">
            <header><div><Icon name={activeCollection === 'wishlist' ? 'heart' : 'cart'} /><h2 id="shop-collection-title">{activeCollection === 'wishlist' ? '찜한 굿즈' : '장바구니'}</h2><strong>{collectionProducts.length}</strong></div><button type="button" aria-label={`${activeCollection === 'wishlist' ? '찜 목록' : '장바구니'} 닫기`} onClick={() => setActiveCollection(null)}>×</button></header>
            {collectionProducts.length > 0 ? (
              <div className="shop-collection-list">
                {collectionProducts.map((reward) => {
                  const unlocked = completedStamps >= requiredStampCount(reward)
                  return <article key={reward.id}><img src={reward.image} alt="" /><div><strong>{reward.name}</strong><small>{reward.cashPrice > 0 ? `${reward.cashPrice.toLocaleString('ko-KR')}원` : '무료 지급'}</small></div><div>{activeCollection === 'wishlist' ? <button type="button" disabled={!unlocked} onClick={() => togglePreference('cart', reward)}>{preferences.cart.includes(reward.id) ? '장바구니 빼기' : '장바구니 담기'}</button> : <button type="button" disabled={!unlocked} onClick={() => { openReward(reward); setActiveCollection(null) }}>온라인 주문</button>}<button className="shop-collection-list__remove" type="button" onClick={() => togglePreference(activeCollection, reward)}>삭제</button></div></article>
                })}
              </div>
            ) : <p className="shop-collection-empty">{activeCollection === 'wishlist' ? '찜한 굿즈가 아직 없어요.' : '장바구니가 비어 있어요.'}</p>}
            {activeCollection === 'cart' && cartProducts.length > 0 ? <footer><span>총 상품 금액</span><strong>{cartProducts.reduce((total, reward) => total + reward.cashPrice, 0).toLocaleString('ko-KR')}원</strong><small>상품별 온라인 주문 시 포인트 할인을 선택할 수 있어요.</small></footer> : null}
          </aside>
        ) : null}

        <div className="reward-product-grid">
          {filteredRewards.map((reward) => {
            const requiredStamps = requiredStampCount(reward)
            const unlocked = completedStamps >= requiredStamps
            const isWishlisted = preferences.wishlist.includes(reward.id)
            const isInCart = preferences.cart.includes(reward.id)
            return (
              <article className={`reward-product-card-shell${unlocked ? '' : ' is-locked'}`} key={reward.id}>
                <button className={`reward-product-card${unlocked ? '' : ' is-locked'}`} type="button" disabled={!unlocked} onClick={() => openReward(reward)}>
                  <div className={`reward-product-card__visual reward-product-card__visual--${reward.theme}`}>
                    <img className="reward-product-image" src={reward.image} alt={reward.imageAlt} loading="lazy" decoding="async" />
                  </div>
                  <div className="reward-product-card__body">
                    <h3>{reward.name}</h3>
                    <span className="reward-product-card__price">{reward.cashPrice > 0 ? `${reward.cashPrice.toLocaleString('ko-KR')}원` : '무료 지급'}</span>
                    {!unlocked ? <p className="reward-product-card__locked"><Icon name="lock" /> 스탬프 {requiredStamps}개 필요</p> : null}
                  </div>
                </button>
                <div className="reward-product-card__quick-actions">
                  <button className={isWishlisted ? 'is-active' : ''} type="button" aria-label={`${reward.name} ${isWishlisted ? '찜 해제' : '찜하기'}`} aria-pressed={isWishlisted} onClick={() => togglePreference('wishlist', reward)}><Icon name="heart" /></button>
                  <button className={isInCart ? 'is-active' : ''} type="button" disabled={!unlocked} aria-label={`${reward.name} ${isInCart ? '장바구니에서 삭제' : '장바구니 담기'}`} aria-pressed={isInCart} onClick={() => togglePreference('cart', reward)}><Icon name="cart" /></button>
                </div>
              </article>
            )
          })}
        </div>
        {filteredRewards.length === 0 ? <div className="shop-search-empty"><Icon name="search" /><strong>검색 결과가 없어요</strong><p>다른 굿즈 이름으로 검색해 주세요.</p></div> : null}
      </section>

      {selectedReward ? (
        <div className="reward-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDialog()}>
          <section className={`reward-dialog${redemption ? ' reward-dialog--result' : ''}`} role="dialog" aria-modal="true" aria-labelledby="reward-dialog-title">
            <button className="reward-dialog__close" type="button" aria-label="굿즈 상세 닫기" onClick={closeDialog}>×</button>
            {redemption?.status === 'success' ? (() => {
              return <div className="reward-result reward-result--success">
                <span className="reward-result__icon"><Icon name="check" /></span>
                <h2 id="reward-dialog-title">{selectedReward.cashPrice === 0 ? '무료 굿즈가 준비됐어요!' : '온라인 주문이 완료됐어요!'}</h2>
                <p><strong>{selectedReward.name}</strong>을 준비하고 있습니다.<br />아래 코드를 현장 스태프에게 보여주세요.</p>
                <div className="pickup-code"><small>PICK-UP CODE</small><strong>{redemption.orderCode}</strong></div>
                <div className="reward-result__summary"><div><span>주문 금액</span>{redemption.pointsSpent > 0 ? <small>{redemption.pointsSpent.toLocaleString('ko-KR')} P 사용</small> : null}</div><strong>{redemption.cashPaid.toLocaleString('ko-KR')}원</strong></div>
                <p className="reward-result__note"><Icon name="shop" /> 온라인 주문이 접수됐어요. 수령 시 주문 코드를 제시해 주세요.</p>
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
                <p>이 한정 굿즈는 스탬프 <strong>{redemption.requiredStamps}개</strong>를 모은 참가자에게 지급합니다.</p>
                <div className="reward-result__actions"><button type="button" className="primary-button" onClick={closeDialog}>확인</button></div>
              </div>
            ) : redemption?.status === 'already_claimed' ? (
              <div className="reward-result reward-result--notice">
                <span className="reward-result__icon"><Icon name="check" /></span>
                <h2 id="reward-dialog-title">이미 신청한 무료 굿즈예요</h2>
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
                    <div><small>{cashToPay > 0 ? '온라인 주문 금액' : selectedReward.cashPrice > 0 ? '포인트 전액 결제' : '무료 지급'}</small><strong>{cashToPay.toLocaleString('ko-KR')}원</strong></div>
                    <button type="button" onClick={redeemSelectedReward} disabled={isRedeeming}>{isRedeeming ? '처리 중...' : selectedReward.cashPrice === 0 ? '받기' : '온라인 주문'} {!isRedeeming ? <Icon name="arrow" /> : null}</button>
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
