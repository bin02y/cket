import { lazy, Suspense, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MissionId } from '../types'
import academyVideo from '../assets/academy/high-speed-refrigeration.mp4'
import kitCompleteImage from '../assets/academy/kit-complete.png'
import kitMaterialsImage from '../assets/academy/kit-materials.png'
import kitProcessImage from '../assets/academy/kit-process.png'
import boothOneImage from '../assets/booths/booth-1.png'
import boothTwoImage from '../assets/booths/booth-2.png'
import boothThreeImage from '../assets/booths/booth-3.png'
import boothFourImage from '../assets/booths/booth-4.png'
import { Icon } from './Icon'

const RoadView3D = lazy(() => import('./RoadView3D'))

type BoothGuideProps = {
  completedBooths: ReadonlySet<MissionId>
  section: BoothSection
}

type BoothSection = 'education' | 'booths'

type EnvironmentBooth = {
  id: MissionId
  number: string
  title: string
  description: string
  image: string
  imageAlt: string
  icon: 'snowflake' | 'wind' | 'paw' | 'butterfly'
  theme: 'blue' | 'red' | 'green' | 'yellow'
}

type AcademySlide = {
  title: string
  description: string
  image: string
  imageAlt: string
}

const sectionHeaders: Record<BoothSection, { lead: string; accent: string; description: string }> = {
  education: { lead: '기술을 이해하고', accent: '원리를 배우는 교육', description: '영상과 냉동사이클 키트 제작 과정을 따라 초고속 열차의 냉방 기술을 배워보세요.' },
  booths: { lead: '전시장을 걸으며', accent: '지구를 만나는 부스', description: '3D 로드뷰로 전시장을 둘러보고 네 가지 환경 체험 부스를 확인해 보세요.' },
}

const academySlides: readonly AcademySlide[] = [
  {
    title: '냉동사이클 키트 구성 재료',
    description: '아크릴판과 배관, 네 가지 핵심 장치, LED와 제어 장치를 먼저 확인해 보세요.',
    image: kitMaterialsImage,
    imageAlt: '냉동사이클 교육 키트에 필요한 구성 재료와 용도를 정리한 표',
  },
  {
    title: '냉동사이클 키트 제작 과정',
    description: '부품 배치부터 배관·LED·표시장치 설치와 작동 테스트까지 12단계를 따라가 보세요.',
    image: kitProcessImage,
    imageAlt: '냉동사이클 교육 키트를 조립하는 12단계 제작 과정',
  },
  {
    title: '냉동사이클 키트 완성본',
    description: '압축·응축·팽창·증발의 흐름과 구간별 온도·압력 변화를 완성된 키트에서 확인해 보세요.',
    image: kitCompleteImage,
    imageAlt: '빨간색과 파란색 LED로 냉매 순환을 표현한 냉동사이클 교육 키트 완성본',
  },
]

const environmentBooths: readonly EnvironmentBooth[] = [
  {
    id: 5,
    number: '01',
    title: '녹는 빙하 위에서 펭귄을 구해내라!',
    description: '점점 높아지는 수면과 갈라지는 빙하를 살피며 펭귄이 안전한 곳으로 이동하도록 도와주세요.',
    image: boothOneImage,
    imageAlt: '녹는 빙하 위 펭귄을 구조하는 환경 부스 안내 이미지',
    icon: 'snowflake',
    theme: 'blue',
  },
  {
    id: 2,
    number: '02',
    title: '무더운 여름에서 살아남기',
    description: '더운 방에서 에어컨과 부채 중 상황에 맞는 냉방 방법을 선택해 에너지를 아껴보세요.',
    image: boothTwoImage,
    imageAlt: '무더운 방에서 에어컨과 부채 중 냉방 방법을 선택하는 환경 부스 안내 이미지',
    icon: 'wind',
    theme: 'red',
  },
  {
    id: 3,
    number: '03',
    title: '기후 위기에서 동물들을 구하라',
    description: '에어컨 끄고 나가기, 쓰레기 분리수거 같은 선택으로 빙하와 동물들을 지켜주세요.',
    image: boothThreeImage,
    imageAlt: '기후 위기 속 북극곰과 빙하를 지키는 환경 부스 안내 이미지',
    icon: 'paw',
    theme: 'green',
  },
  {
    id: 4,
    number: '04',
    title: '나비효과로부터 지구를 지켜라',
    description: '두 개의 방을 살펴보고 에어컨 온도와 생활 습관이 만든 서로 다른 미래를 확인하세요.',
    image: boothFourImage,
    imageAlt: '생활 습관 선택에 따른 지구의 서로 다른 미래를 비교하는 환경 부스 안내 이미지',
    icon: 'butterfly',
    theme: 'yellow',
  },
]

export function BoothGuide({ completedBooths, section }: BoothGuideProps) {
  const [selectedBooth, setSelectedBooth] = useState<EnvironmentBooth | null>(null)
  const [academyStep, setAcademyStep] = useState<number | null>(null)
  const [roadViewOpen, setRoadViewOpen] = useState(false)
  const currentAcademySlide = academyStep ? academySlides[academyStep - 1] : null
  const sectionHeader = sectionHeaders[section]

  useEffect(() => {
    if (!selectedBooth && academyStep === null) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedBooth(null)
        setAcademyStep(null)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedBooth, academyStep])

  return (
    <main id="main-content" className="page booth-page">
      <section className="booth-hero" aria-labelledby="booth-hero-title">
        <div className="booth-hero__copy">
          <h1 id="booth-hero-title">{sectionHeader.lead}<br /><em>{sectionHeader.accent}</em></h1>
          <p className="booth-hero__description">{sectionHeader.description}</p>
        </div>
      </section>

      {section === 'education' ? (
        <div id="experience-panel-education" className="experience-section-panel" role="region" aria-label="교육 콘텐츠">
          <section className="booth-hall booth-hall--train" aria-labelledby="hall-one-title">
            <button className="booth-hall__trigger" type="button" aria-haspopup="dialog" aria-label="초고속 냉동사이클 영상과 키트 제작 과정 보기" onClick={() => setAcademyStep(0)} />
            <div className="booth-hall__visual" aria-hidden="true">
              <span className="booth-hall__number">01</span>
              <div className="booth-mini-train"><i /><i /><i /></div>
              <div className="booth-mini-rail" />
              <span className="booth-speed-chip"><Icon name="gauge" /> 350 km/h</span>
            </div>
            <div className="booth-hall__content">
              <h2 id="hall-one-title">달리는 열차 속에서 장비를 조정하여 살아남아라!</h2>
              <strong>초고속 냉동사이클 체험</strong>
              <p>초고속 환경에서 냉방이 유지되는 원리를 냉동 사이클 키트를 직접 제작하며 배우는 교육 프로그램입니다.</p>
              <div className="booth-hall__meta">
                <span><Icon name="snowflake" /> 냉동 사이클 핵심 원리</span>
                <span><Icon name="train" /> KTX 초고속 환경</span>
              </div>
              <span className="environment-booth__onsite"><span className="status-dot" /> 영상과 키트 제작 과정 보기 <Icon name="arrow" /></span>
            </div>
          </section>
        </div>
      ) : (
        <div id="experience-panel-booths" className="experience-section-panel" role="region" aria-label="부스 콘텐츠">
          <section className="roadview-entry" aria-labelledby="roadview-entry-title">
            <div className="roadview-entry__copy">
              <span>VIRTUAL EXHIBITION</span>
              <h2 id="roadview-entry-title">3D 전시장 로드뷰</h2>
              <p>전시장을 자유롭게 걸으며 여섯 개 체험 구역의 위치와 안내를 먼저 확인해 보세요.</p>
            </div>
            <button className="roadview-launch" type="button" onClick={() => setRoadViewOpen(true)}>
              <span><Icon name="map" /></span>
              <span><strong>3D 로드뷰</strong></span>
              <Icon name="arrow" />
            </button>
          </section>

          <section className="environment-hall" aria-labelledby="environment-hall-title">
            <header className="environment-hall__heading">
              <div><h2 id="environment-hall-title">환경 부스 체험관</h2><p>네 가지 상황에서 나의 선택이 환경과 동물에게 어떤 변화를 만드는지 확인해 보세요.</p></div>
              <span className="environment-hall__count"><strong>4</strong> BOOTHS</span>
            </header>
            <div className="environment-booth-grid">
              {environmentBooths.map((booth) => {
                const isCompleted = completedBooths.has(booth.id)
                return (
                  <button
                    className={`environment-booth environment-booth--${booth.theme}`}
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => {
                      setAcademyStep(null)
                      setSelectedBooth(booth)
                    }}
                    key={booth.id}
                  >
                    <div className="environment-booth__topline"><span>BOOTH {booth.number}</span><em>{isCompleted ? <><Icon name="check" /> 스탬프 완료</> : '체험 가능'}</em></div>
                    <span className="environment-booth__icon"><Icon name={booth.icon} /></span>
                    <span className="environment-booth__title">{booth.title}</span>
                    <span className="environment-booth__description">{booth.description}</span>
                    <span className="environment-booth__onsite"><span className="status-dot" /> 부스 이미지 보기 <Icon name="arrow" /></span>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      )}

      {selectedBooth ? (
        <div className="booth-image-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedBooth(null)}>
          <section className="booth-image-dialog" role="dialog" aria-modal="true" aria-labelledby="booth-image-dialog-title">
            <header>
              <div>
                <span>BOOTH {selectedBooth.number}</span>
                <h2 id="booth-image-dialog-title">{selectedBooth.title}</h2>
              </div>
              <button type="button" aria-label="부스 이미지 닫기" onClick={() => setSelectedBooth(null)} autoFocus>×</button>
            </header>
            <img src={selectedBooth.image} alt={selectedBooth.imageAlt} decoding="async" />
          </section>
        </div>
      ) : null}

      {academyStep !== null ? (
        <div className="academy-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAcademyStep(null)}>
          <section className="academy-dialog" role="dialog" aria-modal="true" aria-labelledby="academy-dialog-title">
            <header>
              <div>
                <span>HALL 01 · 초고속 냉동사이클</span>
                <h2 id="academy-dialog-title">{academyStep === 0 ? '달리는 열차 속 냉동공조 기술' : currentAcademySlide?.title}</h2>
              </div>
              <button type="button" aria-label="초고속 냉동사이클 체험 닫기" onClick={() => setAcademyStep(null)} autoFocus>×</button>
            </header>

            <div className={`academy-dialog__stage${academyStep === 0 ? ' academy-dialog__stage--video' : ' academy-dialog__stage--image'}`}>
              {academyStep === 0 ? (
                <video src={academyVideo} controls autoPlay playsInline preload="metadata" onEnded={() => setAcademyStep(1)}>
                  브라우저가 영상 재생을 지원하지 않습니다.
                </video>
              ) : currentAcademySlide ? (
                <figure>
                  <img src={currentAcademySlide.image} alt={currentAcademySlide.imageAlt} decoding="async" />
                  <figcaption>{currentAcademySlide.description}</figcaption>
                </figure>
              ) : null}
            </div>

            <footer>
              <div className="academy-dialog__progress" aria-label={`전체 4단계 중 ${academyStep + 1}단계`}>
                {['영상', '재료', '제작', '완성'].map((label, index) => (
                  <span className={index === academyStep ? 'is-current' : index < academyStep ? 'is-complete' : ''} key={label}><i>{index + 1}</i>{label}</span>
                ))}
              </div>
              {academyStep === 0 ? (
                <p className="academy-dialog__notice"><Icon name="play" /> 영상이 끝나면 키트 재료 화면으로 자동 이동해요.</p>
              ) : (
                <div className="academy-dialog__actions">
                  <button type="button" onClick={() => setAcademyStep(academyStep - 1)}><Icon name="chevronLeft" /> 이전</button>
                  {academyStep < academySlides.length ? (
                    <button className="primary-button" type="button" onClick={() => setAcademyStep(academyStep + 1)}>다음 단계 <Icon name="arrow" /></button>
                  ) : (
                    <button className="primary-button" type="button" onClick={() => setAcademyStep(null)}>체험 마치기 <Icon name="check" /></button>
                  )}
                </div>
              )}
            </footer>
          </section>
        </div>
      ) : null}

      {roadViewOpen ? createPortal(
        <Suspense fallback={<div className="roadview-loading" role="status">3D 전시장을 준비하고 있습니다…</div>}>
          <RoadView3D onClose={() => setRoadViewOpen(false)} />
        </Suspense>,
        document.body,
      ) : null}
    </main>
  )
}
