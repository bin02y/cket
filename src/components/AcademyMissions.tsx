import { useState } from 'react'
import { Icon } from './Icon'
import { MissionExperience } from './MissionExperience'
import { PopupMissionExperience } from './PopupMissionExperience'
import type { MissionId } from '../types'

type AcademyMissionsProps = {
  completedMissions: ReadonlySet<MissionId>
  onMissionComplete: (mission: MissionId, bonusPoints?: number) => Promise<string | null>
}

const academyMissions = [
  {
    id: 1 as const,
    label: 'MISSION 01',
    title: '냉동 사이클을 조립하라',
    description: '차가운 바람이 만들어지는 네 가지 핵심 단계를 영상처럼 따라가요.',
    duration: '약 3분',
    tag: '공조 원리',
    icon: 'snowflake' as const,
  },
  {
    id: 2 as const,
    label: 'MISSION 02',
    title: '초고속 냉방을 제어하라',
    description: '시속 350km 환경에서 센서 제어가 온도와 에너지를 지키는 과정을 실험해요.',
    duration: '약 4분',
    tag: '제어 실험',
    icon: 'wind' as const,
  },
]

const popupMissions = [
  {
    id: 3 as const,
    label: 'MISSION 03',
    title: '기후 위기에서 동물들을 구하라',
    description: '세 번의 ESG 선택으로 빙하를 회복하고 동물들의 안전한 서식지를 지켜주세요.',
    steps: '3가지 선택',
    bonus: '최대 +90 P',
    icon: 'paw' as const,
  },
  {
    id: 4 as const,
    label: 'MISSION 04',
    title: '나비효과로부터 지구를 지켜라',
    description: '두 개의 방을 지나며 작은 실천이 만드는 커다란 변화를 직접 확인하세요.',
    steps: '2개 방 분기',
    bonus: '최대 +90 P',
    icon: 'butterfly' as const,
  },
]

export function AcademyMissions({ completedMissions, onMissionComplete }: AcademyMissionsProps) {
  const [selectedMission, setSelectedMission] = useState<MissionId | null>(null)

  if (selectedMission === 1 || selectedMission === 2) {
    return <MissionExperience mission={selectedMission} isCompleted={completedMissions.has(selectedMission)} onComplete={() => onMissionComplete(selectedMission)} onBack={() => setSelectedMission(null)} />
  }

  if (selectedMission === 3 || selectedMission === 4) {
    return <PopupMissionExperience mission={selectedMission} isCompleted={completedMissions.has(selectedMission)} onComplete={(bonusPoints) => onMissionComplete(selectedMission, bonusPoints)} onBack={() => setSelectedMission(null)} />
  }

  return (
    <main id="main-content" className="page academy-page">
      <section className="academy-hero" aria-labelledby="academy-title">
        <div>
          <span className="eyebrow"><span className="status-dot" /> ACADEMY CAR · OPEN</span>
          <p className="academy-hero__route">SEOUL  →  ECO TECH LAB</p>
          <h1 id="academy-title">달리는 교실에서 만나는<br /><em>초고속 공조 기술</em></h1>
          <p>복잡한 수식은 잠시 내려두고, 냉기가 만들어지고 제어되는 순간을 인터랙티브 영상과 데이터로 경험하세요.</p>
        </div>
        <div className="academy-hero__badge" aria-label="KTX 시속 350킬로미터 가상 실험">
          <Icon name="train" />
          <span><strong>350</strong> km/h</span>
          <small>VIRTUAL LAB</small>
        </div>
      </section>

      <section className="academy-section" aria-labelledby="academy-mission-title">
        <div className="section-heading section-heading--wide">
          <div>
            <span className="section-label">ACADEMY MISSIONS</span>
            <h2 id="academy-mission-title">오늘의 공조 기술 클래스</h2>
          </div>
          <span className="academy-open-count"><strong>2</strong>개 미션 오픈</span>
        </div>

        <div className="academy-card-grid">
          {academyMissions.map((mission) => (
            <article className={`academy-card academy-card--${mission.id}`} key={mission.id}>
              <div className="academy-card__visual">
                <span className="academy-card__label">{mission.label}</span>
                <div className="academy-card__icon"><Icon name={mission.icon} /></div>
                <div className="academy-card__rings"><i /><i /><i /></div>
                <span className="academy-card__format"><Icon name="play" /> INTERACTIVE FILM</span>
              </div>
              <div className="academy-card__content">
                <div className="academy-card__meta"><span>{mission.tag}</span><span>{mission.duration}</span></div>
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>
                {completedMissions.has(mission.id) ? <span className="mission-complete-badge"><Icon name="check" /> 완료 · 포인트 적립됨</span> : null}
                <button className="academy-start-button" type="button" onClick={() => setSelectedMission(mission.id)}>
                  {completedMissions.has(mission.id) ? '다시 보기' : '미션 시작하기'} <Icon name="arrow" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="popup-section" aria-labelledby="popup-mission-title">
        <div className="section-heading section-heading--wide">
          <div>
            <span className="section-label">POP-UP BOOTH MISSIONS</span>
            <h2 id="popup-mission-title">나의 선택으로 지구를 바꾸는 곳</h2>
          </div>
          <span className="academy-open-count"><strong>2</strong>개 체험 오픈</span>
        </div>
        <div className="popup-card-grid">
          {popupMissions.map((mission) => (
            <article className={`popup-mission-card popup-mission-card--${mission.id}`} key={mission.id}>
              <div className="popup-mission-card__scene">
                <span className="popup-mission-card__label">{mission.label}</span>
                <div className="popup-mission-card__orb"><Icon name={mission.icon} /></div>
                <i className="popup-mission-card__land" />
                <span className="popup-mission-card__live"><i /> CHOICE SIMULATION</span>
              </div>
              <div className="popup-mission-card__content">
                <div className="academy-card__meta"><span>{mission.steps}</span><span>{mission.bonus}</span></div>
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>
                {completedMissions.has(mission.id) ? <span className="mission-complete-badge"><Icon name="check" /> 완료 · 포인트 적립됨</span> : null}
                <button className="popup-start-button" type="button" onClick={() => setSelectedMission(mission.id)}>
                  {completedMissions.has(mission.id) ? '다시 도전' : '팝업 미션 시작'} <Icon name="arrow" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="next-stop-card" aria-label="다음 기능 안내">
        <div className="next-stop-card__line"><span /><i /><i /></div>
        <div className="next-stop-card__copy">
          <span className="section-label">ECO WALLET · NOW OPEN</span>
          <h2>적립한 포인트를 한눈에 확인해요</h2>
          <p>하단 포인트 탭에서 미션별 적립 내역과 현재 잔액을 확인할 수 있습니다.</p>
        </div>
        <span className="locked-chip"><Icon name="check" /> 이용 가능</span>
      </section>
    </main>
  )
}
