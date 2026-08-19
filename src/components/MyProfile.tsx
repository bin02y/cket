import { useState } from 'react'
import { rewardProducts } from '../data/rewards'
import type { MissionId, ParticipantProfile, RewardOrder, RewardProduct } from '../types'
import { Icon } from './Icon'

type MyProfileProps = {
  profile: ParticipantProfile
  balance: number
  totalEarnedPoints: number
  completedBooths: ReadonlySet<MissionId>
  orders: readonly RewardOrder[]
  onLogout: () => void
  onDeleteAccount: () => Promise<string | null>
}

const rewardById = new Map<string, RewardProduct>(rewardProducts.map((reward) => [reward.id, reward]))
const orderStatusLabels: Record<RewardOrder['status'], string> = {
  paid: '결제 완료',
  preparing: '상품 준비중',
  shipped: '배송중',
  delivered: '배송 완료',
  cancelled: '주문 취소',
}
const orderPaymentLabels: Record<RewardOrder['paymentMethod'], string> = {
  card: '신용·체크카드',
  kakao_pay: '카카오페이',
  naver_pay: '네이버페이',
  bank_transfer: '무통장입금',
  free: '무료 지급',
  cash: '현금',
}

const stampBooths: readonly { id: MissionId; number: string; hall: string; title: string; icon: 'train' | 'snowflake' | 'wind' | 'paw' | 'butterfly' }[] = [
  { id: 1, number: '01', hall: '1관', title: '초고속 냉동사이클', icon: 'train' },
  { id: 5, number: '02', hall: '환경 부스 1', title: '펭귄 구조', icon: 'snowflake' },
  { id: 2, number: '03', hall: '환경 부스 2', title: '무더운 여름', icon: 'wind' },
  { id: 3, number: '04', hall: '환경 부스 3', title: '동물 구하기', icon: 'paw' },
  { id: 4, number: '05', hall: '환경 부스 4', title: '나비효과', icon: 'butterfly' },
]

export function MyProfile({ profile, balance, totalEarnedPoints, completedBooths, orders, onLogout, onDeleteAccount }: MyProfileProps) {
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
      <section className="profile-top-cards" aria-label="MY 메뉴">
        <article className="profile-journey-card">
          <div className="profile-avatar"><Icon name="leaf" /></div>
          <h1 id="profile-title">{profile.name}님의 에코여정</h1>
          <button className="profile-journey-logout" type="button" onClick={onLogout}>로그아웃</button>
        </article>
      </section>

      <section className="profile-point-summary" aria-label="포인트 현황">
        <article><span><Icon name="wallet" /></span><div><small>사용 가능 잔액</small><strong>{balance.toLocaleString('ko-KR')} P</strong></div></article>
        <article><span><Icon name="sparkle" /></span><div><small>누적 포인트</small><strong>{totalEarnedPoints.toLocaleString('ko-KR')} P</strong></div></article>
      </section>

      <section className={`eco-passport${passportReady ? ' eco-passport--issued' : ''}`} aria-labelledby="eco-passport-title">
        <header className="eco-passport__heading">
          <h2 id="eco-passport-title">CKET TICKET</h2>
          <strong>{completedBooths.size} / 5</strong>
        </header>
        <div className="eco-passport__stamps">
          {stampBooths.map((booth) => {
            const completed = completedBooths.has(booth.id)
            return <article className={completed ? 'is-stamped' : ''} key={booth.id}><span className="eco-stamp__number">{booth.number}</span><span className="eco-stamp__seal"><Icon name={completed ? booth.icon : 'lock'} /></span><p><small>{booth.hall}</small><strong>{booth.title}</strong><em>{completed ? 'STAMPED' : '체험 전'}</em></p></article>
          })}
        </div>
      </section>

      <section className="order-history" aria-labelledby="order-history-title">
        <header><div><span><Icon name="cart" /></span><div><h2 id="order-history-title">주문내역</h2><p>쇼핑 구매와 배송 상태를 확인하세요.</p></div></div><strong>{orders.length}건</strong></header>
        {orders.length > 0 ? (
          <div className="order-history__list">
            {orders.map((order) => {
              const reward = rewardById.get(order.rewardId)
              return <article key={order.id}>
                <div className="order-history__image">{reward ? <img src={reward.image} alt="" loading="lazy" decoding="async" /> : <Icon name="shop" />}</div>
                <div className="order-history__info"><span className={`order-status order-status--${order.status}`}>{orderStatusLabels[order.status]}</span><h3>{reward?.name ?? '굿즈 주문'}</h3><p>{order.createdAt}</p></div>
                <dl><div><dt>받는 분</dt><dd>{order.recipientName || '이전 주문'}</dd></div><div><dt>배송지</dt><dd>{order.address ? `(${order.postalCode}) ${order.address} ${order.addressDetail}` : '이전 현장 수령 주문'}</dd></div><div><dt>결제</dt><dd>{order.cashPaid === 0 && order.pointsSpent > 0 ? 'ECO POINT 전액' : orderPaymentLabels[order.paymentMethod]} · {order.cashPaid.toLocaleString('ko-KR')}원{order.pointsSpent > 0 ? ` · ${order.pointsSpent.toLocaleString('ko-KR')} P` : ''}</dd></div></dl>
              </article>
            })}
          </div>
        ) : <div className="order-history__empty"><Icon name="cart" /><strong>아직 주문내역이 없어요.</strong><p>쇼핑에서 굿즈를 구매하면 이곳에서 배송 상태를 확인할 수 있어요.</p></div>}
      </section>

      <section className="profile-account-card" aria-label="계정 정보"><div><span><Icon name="my" /></span><p><strong>참가자 계정</strong><small>{profile.name} · {profile.email}</small></p></div><button className="profile-account-delete" type="button" onClick={() => setShowDeleteDialog(true)}>회원탈퇴</button></section>

      {showDeleteDialog ? <div className="account-dialog-backdrop" role="presentation"><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><span className="account-dialog__icon"><Icon name="my" /></span><h2 id="delete-account-title">정말 회원탈퇴할까요?</h2><p>현재 참가자의 부스 스탬프, ECO POINT, 굿즈 구매 내역이 모두 삭제됩니다. 이 작업은 되돌릴 수 없어요.</p>{deleteError ? <p className="account-dialog__error" role="alert">{deleteError}</p> : null}<div><button type="button" className="secondary-button" autoFocus onClick={() => setShowDeleteDialog(false)}>계속 이용하기</button><button type="button" className="account-delete-button" disabled={isDeleting} onClick={deleteAccount}>{isDeleting ? '삭제 중...' : '모든 데이터 삭제'}</button></div></section></div> : null}
    </main>
  )
}
