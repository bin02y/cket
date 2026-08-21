import type { RewardProduct } from '../types'
import coolingKeycapImage from '../assets/rewards/cooling-keycap.webp'
import cyclePartsKeyringImage from '../assets/rewards/cycle-parts-keyring.webp'
import ecoPowerBankImage from '../assets/rewards/eco-power-bank.webp'
import ecoTumblerImage from '../assets/rewards/eco-tumbler.webp'
import miniEcoPouchImage from '../assets/rewards/mini-eco-pouch.webp'
import miniFanImage from '../assets/rewards/mini-fan.webp'
import recycledPlasticPenImage from '../assets/rewards/recycled-plastic-pen.webp'
import thermoStickerImage from '../assets/rewards/thermo-sticker.webp'

export const rewardProducts: readonly RewardProduct[] = [
  {
    id: 'cycle-parts-keyring',
    name: '냉동사이클 부품 키링',
    image: cyclePartsKeyringImage,
    imageAlt: '압축기, 응축기, 팽창밸브, 증발기 모양의 냉동사이클 부품 키링 4종',
    cashPrice: 2500,
    theme: 'sky',
  },
  {
    id: 'thermo-sticker',
    name: '변온 스티커',
    image: thermoStickerImage,
    imageAlt: '온도와 환경 메시지를 담은 Green Rail 변온 스티커 모음',
    cashPrice: 1500,
    theme: 'mint',
  },
  {
    id: 'eco-tumbler',
    name: '친환경 텀블러',
    image: ecoTumblerImage,
    imageAlt: '화이트, 하늘색, 베이지, 네이비 색상의 친환경 텀블러',
    cashPrice: 6000,
    theme: 'aqua',
  },
  {
    id: 'recycled-plastic-pen',
    name: '재생 플라스틱 볼펜',
    image: recycledPlasticPenImage,
    imageAlt: '재생 플라스틱 소재로 만든 Green Rail 볼펜 네 종류',
    cashPrice: 1000,
    theme: 'mint',
  },
  {
    id: 'mini-eco-pouch',
    name: '미니 에코백 / 파우치',
    image: miniEcoPouchImage,
    imageAlt: 'Green Rail 캐릭터와 냉동공조 그래픽을 적용한 미니 에코백과 파우치',
    cashPrice: 4000,
    theme: 'navy',
  },
  {
    id: 'cooling-keycap',
    name: '냉동공조 키캡',
    image: coolingKeycapImage,
    imageAlt: '압축기, 응축기, 팽창밸브, 증발기 캐릭터를 담은 키캡 키링',
    cashPrice: 2000,
    theme: 'sky',
  },
  {
    id: 'eco-power-bank',
    name: '친환경 보조배터리',
    image: ecoPowerBankImage,
    imageAlt: 'Green Rail 냉동공조 그래픽을 적용한 흰색 친환경 보조배터리',
    cashPrice: 8000,
    theme: 'aqua',
  },
  {
    id: 'mini-fan',
    name: '미니 선풍기',
    image: miniFanImage,
    imageAlt: 'Green Rail 로고가 적용된 흰색 접이식 미니 선풍기',
    cashPrice: 5000,
    theme: 'navy',
  },
]
