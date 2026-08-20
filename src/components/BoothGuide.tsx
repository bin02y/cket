import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import kitFinalImage from '../assets/academy/kit-final-4way.png'
import kitMaterialsImage from '../assets/academy/kit-materials-4way.png'
import kitPrincipleImage from '../assets/academy/kit-principle-4way.png'
import kitProcessImage from '../assets/academy/kit-process-4way.png'
import willisCarrierImage from '../assets/willis-carrier.jpg'
import type { RoadViewGateCode, RoadViewGateRewardResult } from '../types'
import { Icon } from './Icon'

const RoadView3D = lazy(() => import('./RoadView3D'))

type BoothGuideProps = {
  section: BoothSection
  onRoadViewGatePassed: (gateCode: RoadViewGateCode) => Promise<RoadViewGateRewardResult>
}

type BoothSection = 'education' | 'booths'

type AcademyContent = {
  label: string
  title: string
  description: string
  image: string
  imageAlt: string
}

const academyContents: readonly AcademyContent[] = [
  {
    label: '완성품',
    title: '최종 완성본',
    description: '냉방과 난방의 냉매 흐름을 빨간색과 파란색 배관으로 표현한 교육용 키트의 완성 모습을 살펴보세요.',
    image: kitFinalImage,
    imageAlt: '빨간색과 파란색 냉매 배관, 압축기와 4-way 밸브가 조립된 교육용 키트 완성본',
  },
  {
    label: '구성품',
    title: '키트 재료 구성',
    description: '베이스판, 압축기, 4-way 밸브, 열교환기와 제어 부품 등 키트 제작에 필요한 재료를 확인해 보세요.',
    image: kitMaterialsImage,
    imageAlt: '냉난방 4-way 밸브 교육용 키트에 필요한 14가지 구성 재료와 예상 비용',
  },
  {
    label: '제작과정',
    title: '키트 제작 과정',
    description: '베이스판 준비부터 부품 조립, 배관 연결, 작동 테스트까지 전체 제작 순서를 한눈에 확인해 보세요.',
    image: kitProcessImage,
    imageAlt: '냉난방 4-way 밸브 교육용 키트를 완성하는 13단계 제작 과정',
  },
  {
    label: '작동원리',
    title: '냉방·난방 작동원리',
    description: '4-way 밸브가 냉매 이동 경로를 바꾸어 실내기와 실외기의 역할을 전환하는 원리를 비교해 보세요.',
    image: kitPrincipleImage,
    imageAlt: '냉각 운전과 가열 운전에서 4-way 밸브와 냉매 흐름이 바뀌는 작동원리',
  },
]

export function BoothGuide({ section, onRoadViewGatePassed }: BoothGuideProps) {
  const [academyStep, setAcademyStep] = useState<number | null>(null)
  const [roadViewOpen, setRoadViewOpen] = useState(false)
  const roadViewHistoryEntry = useRef(false)
  const currentAcademyContent = academyStep !== null ? academyContents[academyStep] : null

  const openRoadView = useCallback(() => {
    if (roadViewOpen) return
    window.history.pushState({ ...window.history.state, cketRoadView: true }, '')
    roadViewHistoryEntry.current = true
    setRoadViewOpen(true)
  }, [roadViewOpen])

  const closeRoadView = useCallback(() => {
    if (roadViewHistoryEntry.current) {
      roadViewHistoryEntry.current = false
      window.history.back()
      return
    }
    setRoadViewOpen(false)
  }, [])

  useEffect(() => {
    if (academyStep === null) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAcademyStep(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [academyStep])

  useEffect(() => {
    if (!roadViewOpen) return

    const handlePopState = () => {
      roadViewHistoryEntry.current = false
      setRoadViewOpen(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [roadViewOpen])

  return (
    <main id="main-content" className="page booth-page">
      {section === 'education' ? (
        <div id="experience-panel-education" className="kit-education" role="region" aria-labelledby="kit-education-title">
          <section className="kit-education__board">
            <header className="kit-education__header">
              <div>
                <h1 id="kit-education-title">냉·난방 4-way 밸브 교육용 키트</h1>
              </div>
            </header>
            <div className="kit-education__grid">
              {academyContents.map((content, index) => (
                <button className="kit-education-card" type="button" aria-haspopup="dialog" onClick={() => setAcademyStep(index)} key={content.label}>
                  <span className="kit-education-card__image"><img src={content.image} alt="" decoding="async" /></span>
                  <span className="kit-education-card__copy"><strong>{content.label}</strong></span>
                  <span className="kit-education-card__arrow"><Icon name="arrow" /></span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div id="experience-panel-booths" className="experience-section-panel" role="region" aria-label="부스 콘텐츠">
          <section className="roadview-entry" aria-labelledby="roadview-entry-title">
            <div className="roadview-entry__copy">
              <h1 id="roadview-entry-title">3D 전시관 로드뷰</h1>
            </div>
            <button className="roadview-entry__trigger" type="button" aria-label="3D 전시관 로드뷰 열기" onClick={openRoadView}>
              <span><Icon name="arrow" /></span>
            </button>
          </section>

          <section className="carrier-story" aria-label="윌리스 캐리어의 주요 발명 배경과 원리">
            <div className="carrier-story__grid">
              <article className="carrier-card carrier-card--profile">
                <figure className="carrier-card__portrait">
                  <img src={willisCarrierImage} alt="윌리스 캐리어 흑백 인물 사진" decoding="async" />
                  <figcaption>Willis Haviland Carrier · 1876—1950</figcaption>
                </figure>
                <div className="carrier-card__body">
                  <p>윌리스 캐리어(Willis Haviland Carrier, 1876~1950)는 현대식 공기조화 시스템(에어컨)을 발명하고 상용화한 미국의 기계공학자이자 발명가입니다.</p>
                </div>
              </article>

              <article className="carrier-card">
                <div className="carrier-card__body">
                  <h3>인쇄소의 습기 문제 해결</h3>
                  <p>버펄로 포지 컴퍼니(Buffalo Forge Company) 입사 후, 여름철 고온다습한 날씨로 인해 종이가 변형되어 인쇄가 번지는 뉴욕 브루클린 출판사의 문제를 의뢰받았습니다.</p>
                </div>
              </article>

              <article className="carrier-card">
                <div className="carrier-card__body">
                  <h3>공기조화의 4대 요소 정립</h3>
                  <p>차가운 물 코일을 통해 공기 중 수분을 응결시켜 제습하는 역발상을 고안하여 온도 조절, 습도 조절, 공기 순환/환기, 공기 정화 기능을 갖춘 최초의 에어컨 시스템을 설계했습니다.</p>
                </div>
              </article>

              <article className="carrier-card">
                <div className="carrier-card__body">
                  <h3>특허와 이론 정립</h3>
                  <p>1906년 ‘공기 취급 장치’ 특허를 취득하고, 1911년 온습도와 이슬점 상관관계를 체계화한 논문(캐리어 차트의 기초)을 발표해 공기조화학의 표준을 세웠습니다.</p>
                </div>
              </article>
            </div>
          </section>

        </div>
      )}

      {academyStep !== null && currentAcademyContent ? (
        <div className="academy-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAcademyStep(null)}>
          <button
            className="academy-image-viewer"
            type="button"
            aria-label={`${currentAcademyContent.label} 이미지 닫기`}
            onClick={() => setAcademyStep(null)}
            autoFocus
          >
            <img src={currentAcademyContent.image} alt={currentAcademyContent.imageAlt} decoding="async" />
          </button>
        </div>
      ) : null}

      {roadViewOpen ? createPortal(
        <Suspense fallback={<div className="roadview-loading" role="status">3D 전시장을 준비하고 있습니다…</div>}>
          <RoadView3D onClose={closeRoadView} onGatePassed={onRoadViewGatePassed} />
        </Suspense>,
        document.body,
      ) : null}
    </main>
  )
}
