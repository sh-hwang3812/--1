import { CarConfig, CarModelId } from './types';

export const CAR_MODELS: CarConfig[] = [
  {
    id: 'thunderbolt',
    name: '썬더 볼트 (Thunderbolt)',
    subtitle: '균형 잡힌 스트리트 튜닝 스포츠 쿠페',
    description: '민첩한 핸들링과 안정적인 속도 밸런스를 갖춘 전천후 레이싱 카입니다. 초보자부터 숙련자까지 모두에게 적합합니다.',
    maxSpeed: 190,
    acceleration: 1.1,
    handling: 1.15,
    durability: 3,
    width: 46,
    height: 84,
    baseColor: '#e11d48', // Crimson Red
    accentColor: '#ffffff',
    unlockedByDefault: true,
    cost: 0,
  },
  {
    id: 'night_fury',
    name: '나이트 퓨리 (Night Fury)',
    subtitle: '극한의 최고속도를 자랑하는 머슬 카',
    description: '폭발적인 가속력과 초고속 질주력을 자랑하지만 코너링에 주의가 필요합니다. 직선 도로에서 진가를 발휘합니다.',
    maxSpeed: 230,
    acceleration: 1.35,
    handling: 0.95,
    durability: 2,
    width: 48,
    height: 88,
    baseColor: '#1e293b', // Midnight Black
    accentColor: '#38bdf8', // Neon Cyan
    unlockedByDefault: false,
    cost: 200,
  },
  {
    id: 'titan_cruiser',
    name: '타이탄 크루저 (Titan Cruiser)',
    subtitle: '강철 프레임 중형 장갑 SUV',
    description: '압도적인 충돌 내구도로 5회의 충돌까지 버텨냅니다. 트래픽이 빽빽한 고속도로에서 묵직하게 버틸 수 있습니다.',
    maxSpeed: 170,
    acceleration: 0.95,
    handling: 0.95,
    durability: 5,
    width: 52,
    height: 92,
    baseColor: '#059669', // Emerald Green
    accentColor: '#f59e0b', // Amber
    unlockedByDefault: false,
    cost: 150,
  },
  {
    id: 'cyber_phantom',
    name: '사이버 팬텀 (Cyber Phantom)',
    subtitle: '전자기 부스터 탑재 미래형 하이퍼카',
    description: '레이저처럼 정교한 칼치기 핸들링과 최고속 터보 부스트를 탑재한 궁극의 머신입니다.',
    maxSpeed: 245,
    acceleration: 1.45,
    handling: 1.35,
    durability: 3,
    width: 48,
    height: 86,
    baseColor: '#8b5cf6', // Electric Purple
    accentColor: '#22d3ee', // Cyan Laser
    unlockedByDefault: false,
    cost: 350,
  },
];

export const COLOR_PALETTES = [
  { name: '크림슨 레드', value: '#e11d48' },
  { name: '사이버 사이언', value: '#06b6d4' },
  { name: '일렉트릭 옐로우', value: '#eab308' },
  { name: '네온 퍼플', value: '#9333ea' },
  { name: '에메랄드 그린', value: '#10b981' },
  { name: '미드나잇 블랙', value: '#1e293b' },
  { name: '레이싱 오렌지', value: '#f97316' },
  { name: '펄 화이트', value: '#f8fafc' },
];

export function getCarConfig(id: CarModelId): CarConfig {
  return CAR_MODELS.find(c => c.id === id) || CAR_MODELS[0];
}
