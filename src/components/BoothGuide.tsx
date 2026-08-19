import { lazy, Suspense, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import kitFinalImage from '../assets/academy/kit-final-4way.png'
import kitMaterialsImage from '../assets/academy/kit-materials-4way.png'
import kitPrincipleImage from '../assets/academy/kit-principle-4way.png'
import kitProcessImage from '../assets/academy/kit-process-4way.png'
import { Icon } from './Icon'

const RoadView3D = lazy(() => import('./RoadView3D'))

type BoothGuideProps = {
  section: BoothSection
}

type BoothSection = 'education' | 'booths'

type EnvironmentBooth = {
  id: number
  number: string
  title: string
  theme: 'blue' | 'red' | 'green' | 'yellow'
}

type AcademyContent = {
  label: string
  eyebrow: string
  title: string
  description: string
  image: string
  imageAlt: string
}

const academyContents: readonly AcademyContent[] = [
  {
    label: '완성품',
    eyebrow: 'FINAL KIT',
    title: '최종 완성본',
    description: '냉방과 난방의 냉매 흐름을 빨간색과 파란색 배관으로 표현한 교육용 키트의 완성 모습을 살펴보세요.',
    image: kitFinalImage,
    imageAlt: '빨간색과 파란색 냉매 배관, 압축기와 4-way 밸브가 조립된 교육용 키트 완성본',
  },
  {
    label: '구성품',
    eyebrow: 'KIT MATERIALS',
    title: '키트 재료 구성',
    description: '베이스판, 압축기, 4-way 밸브, 열교환기와 제어 부품 등 키트 제작에 필요한 재료를 확인해 보세요.',
    image: kitMaterialsImage,
    imageAlt: '냉난방 4-way 밸브 교육용 키트에 필요한 14가지 구성 재료와 예상 비용',
  },
  {
    label: '제작과정',
    eyebrow: 'BUILD PROCESS',
    title: '키트 제작 과정',
    description: '베이스판 준비부터 부품 조립, 배관 연결, 작동 테스트까지 전체 제작 순서를 한눈에 확인해 보세요.',
    image: kitProcessImage,
    imageAlt: '냉난방 4-way 밸브 교육용 키트를 완성하는 13단계 제작 과정',
  },
  {
    label: '작동원리',
    eyebrow: 'HOW IT WORKS',
    title: '냉방·난방 작동원리',
    description: '4-way 밸브가 냉매 이동 경로를 바꾸어 실내기와 실외기의 역할을 전환하는 원리를 비교해 보세요.',
    image: kitPrincipleImage,
    imageAlt: '냉각 운전과 가열 운전에서 4-way 밸브와 냉매 흐름이 바뀌는 작동원리',
  },
]

const environmentBooths: readonly EnvironmentBooth[] = [
  {
    id: 5,
    number: '01',
    title: '녹는 빙하 위에서 펭귄을 구해내라!',
    theme: 'blue',
  },
  {
    id: 2,
    number: '02',
    title: '무더운 여름에서 살아남기',
    theme: 'red',
  },
  {
    id: 3,
    number: '03',
    title: '기후 위기에서 동물들을 구하라',
    theme: 'green',
  },
  {
    id: 4,
    number: '04',
    title: '나비효과로부터 지구를 지켜라',
    theme: 'yellow',
  },
]

export function BoothGuide({ section }: BoothGuideProps) {
  const [academyStep, setAcademyStep] = useState<number | null>(null)
  const [roadViewOpen, setRoadViewOpen] = useState(false)
  const currentAcademyContent = academyStep !== null ? academyContents[academyStep] : null

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

  return (
    <main id="main-content" className="page booth-page">
      {section === 'education' ? (
        <div id="experience-panel-education" className="kit-education" role="region" aria-labelledby="kit-education-title">
          <section className="kit-education__board">
            <header className="kit-education__header">
              <div>
                <span>HVAC EDUCATION KIT</span>
                <h1 id="kit-education-title">냉·난방 4-way 밸브 교육용 키트</h1>
              </div>
            </header>
            <div className="kit-education__grid">
              {academyContents.map((content, index) => (
                <button className="kit-education-card" type="button" aria-haspopup="dialog" onClick={() => setAcademyStep(index)} key={content.label}>
                  <span className="kit-education-card__image"><img src={content.image} alt="" decoding="async" /></span>
                  <span className="kit-education-card__copy"><small>{content.eyebrow}</small><strong>{content.label}</strong></span>
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
              <span>VIRTUAL EXHIBITION</span>
              <h1 id="roadview-entry-title">3D 전시장 로드뷰</h1>
            </div>
            <button className="roadview-launch" type="button" onClick={() => setRoadViewOpen(true)}>
              <span><Icon name="map" /></span>
              <span><strong>3D 로드뷰</strong></span>
              <Icon name="arrow" />
            </button>
          </section>

          <section className="environment-hall" aria-labelledby="environment-hall-title">
            <header className="environment-hall__heading">
              <h2 id="environment-hall-title">환경 부스 체험관</h2>
            </header>
            <div className="environment-booth-grid">
              {environmentBooths.map((booth) => (
                  <article className={`environment-booth environment-booth--${booth.theme}`} key={booth.id}>
                    <div className="environment-booth__topline"><span>BOOTH {booth.number}</span></div>
                    <span className="environment-booth__title">{booth.title}</span>
                  </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {academyStep !== null && currentAcademyContent ? (
        <div className="academy-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAcademyStep(null)}>
          <section className="academy-dialog academy-dialog--kit" role="dialog" aria-modal="true" aria-labelledby="academy-dialog-title">
            <header>
              <div>
                <span>{currentAcademyContent.eyebrow} · 냉·난방 4-WAY 밸브</span>
                <h2 id="academy-dialog-title">{currentAcademyContent.title}</h2>
              </div>
              <button type="button" aria-label="키트 교육 자료 닫기" onClick={() => setAcademyStep(null)} autoFocus>×</button>
            </header>

            <div className="academy-dialog__stage academy-dialog__stage--image">
              <figure>
                <img src={currentAcademyContent.image} alt={currentAcademyContent.imageAlt} decoding="async" />
                <figcaption>{currentAcademyContent.description}</figcaption>
              </figure>
            </div>

            <footer>
              <div className="academy-dialog__progress academy-dialog__progress--tabs" aria-label={`전체 4개 자료 중 ${academyStep + 1}번째`}>
                {academyContents.map((content, index) => (
                  <button className={index === academyStep ? 'is-current' : ''} type="button" onClick={() => setAcademyStep(index)} key={content.label}>
                    <i>{index + 1}</i>{content.label}
                  </button>
                ))}
              </div>
              <button className="academy-dialog__done" type="button" onClick={() => setAcademyStep(null)}>확인 <Icon name="check" /></button>
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
