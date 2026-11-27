import { ActivityType, ClassConfig, ClassRoom, HamsterVariant, MedalIconType, MedalTemplate, MissionLog, Student } from '../types';

export interface MedalPreset {
  icon: MedalIconType;
  title: string;
  reason: string;
}

export const MEDAL_PRESETS: MedalPreset[] = [
  {
    icon: 'medal',
    title: '성실 수호천사 훈장',
    reason: '매일 꾸준히 따뜻한 마음으로 내가 챙겨줄 친구를 챙겨준 성실함이 빛났어요!',
  },
  {
    icon: 'crown',
    title: '친절 왕관 훈장',
    reason: '내가 챙겨줄 친구뿐만 아니라 우리 반 친구 모두에게 먼저 다가가 배려했어요!',
  },
  {
    icon: 'shield',
    title: '든든한 비밀 지킴이 훈장',
    reason: '들키지 않고 조용히 챙겨줄 친구의 자리와 물건을 챙겨주는 모습이 멋졌어요!',
  },
  {
    icon: 'star',
    title: '반짝이는 미션 훈장',
    reason: '선생님의 주간 미션을 누구보다 정성스럽게 실천했어요!',
  },
  {
    icon: 'heart',
    title: '따뜻한 감동 편지 훈장',
    reason: '진심이 담긴 칭찬과 따뜻한 응원으로 교실을 훈훈하게 만들었어요!',
  },
];

export const INITIAL_MEDAL_TEMPLATES: MedalTemplate[] = MEDAL_PRESETS.map(
  (p, idx) => ({
    id: `tpl_${idx + 1}`,
    icon: p.icon,
    title: p.title,
    reason: p.reason,
    points: 30,
  })
);

export interface ActivityMeta {
  type: ActivityType;
  title: string;
  points: number;
  variant: HamsterVariant;
  badgeText: string;
  description: string;
  examples: string[];
}

export const ACTIVITY_META_LIST: ActivityMeta[] = [
  {
    type: 'quest',
    title: '주간 미션',
    points: 25,
    variant: 'quest',
    badgeText: '+25점 · 주 1회',
    description: '선생님이 이번 주 우리 반에 내주신 특별 미션을 수행해요.',
    examples: [
      '이번 주에 챙겨줄 친구의 옷차림이나 멋진 점 1가지를 찾아 자연스럽게 칭찬해 주었어요.',
      '이번 주 급식 시간에 챙겨줄 친구가 좋아하는 반찬이 무엇인지 몰래 관찰해 기록했어요.',
    ],
  },
  {
    type: 'stealth',
    title: '몰래 챙겨주기',
    points: 10,
    variant: 'stealth',
    badgeText: '+10점 · 비밀 요원',
    description: '내가 챙겨줄 친구가 눈치채지 못하게 소리 없이 자리나 물건을 챙겨 주어요.',
    examples: [
      '체육 시간 이동할 때 챙겨줄 친구의 비뚤어진 의자를 반듯하게 넣어 주었어요.',
      '바닥에 떨어진 챙겨줄 친구의 지우개와 연필을 몰래 책상 위에 올려두었어요.',
    ],
  },
  {
    type: 'heart',
    title: '마음 표현하기',
    points: 20,
    variant: 'heart',
    badgeText: '+20점 · 따뜻함 전달',
    description: '칭찬 쪽지, 응원 메시지, 발표할 때 큰 박수로 따뜻한 마음을 전해요.',
    examples: [
      '사물함 안에 작은 응원 그림과 함께 힘내라는 쪽지를 몰래 넣어 두었어요.',
      '국어 시간에 챙겨줄 친구가 발표할 때 누구보다 크게 박수를 쳐 주었어요.',
    ],
  },
  {
    type: 'power',
    title: '직접 도와주기',
    points: 30,
    variant: 'power',
    badgeText: '+30점 · 용기 백배',
    description: '들킬 위험을 감수하고 직접 다가가 1인 1역, 청소, 학습을 도와주어요.',
    examples: [
      '우유 당번인 챙겨줄 친구가 무거워 보여서 같이 우유 상자를 들어 주었어요.',
      '미술 시간 뒷정리할 때 물통 씻는 것을 먼저 다가가 함께 도와주었어요.',
    ],
  },
];

export const QUEST_PRESETS: string[] = [
  '이번 주 챙겨줄 친구의 옷차림이나 멋진 점 1가지를 찾아 칭찬해 주기',
  '이번 주 급식 시간에 챙겨줄 친구가 가장 맛있게 먹는 반찬 몰래 관찰해 적어주기',
  '이번 주 체육·놀이 시간에 챙겨줄 친구에게 힘나는 응원 한마디 건네거나 하이파이브하기',
  '이번 주 챙겨줄 친구 책상 주변이나 사물함 정리를 소리 없이 도와주기',
  '이번 주 동안 챙겨줄 친구가 친구들에게 친절했던 순간 1가지 발견해 적어주기',
];

export const getTodayDateKey = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getWeekKey = (dateKey: string = getTodayDateKey()): string => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const diff = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - diff);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(dt.getDate()).padStart(2, '0')}`;
};

export const INITIAL_CONFIG: ClassConfig = {
  className: '4학년 2반 수호톡',
  weeklyQuest: QUEST_PRESETS[0],
  stage: 1, // 평상시 활동 화면(내 미션 기록 / 받은 미션 승인)으로 시작
  gasWebAppUrl: '',
};

const PIN_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ'; // 혼동 쉬운 O, I, L 제외
const PIN_DIGITS = '23456789'; // 혼동 쉬운 0, 1 제외

export const DEFAULT_CLASS_ID = '4B2K';
export const DEFAULT_TEACHER_PASSWORD = '1234';

const PRESET_SAMPLE_PINS = [
  'K7M4',
  'R9T2',
  'H3N8',
  'B6V5',
  'D8F3',
  'P4W9',
];

const createMixed4CharCode = (existingCodes?: Set<string>, fallback = 'Q5Z7'): string => {
  for (let attempt = 0; attempt < 250; attempt++) {
    const chars: string[] = [
      PIN_LETTERS[Math.floor(Math.random() * PIN_LETTERS.length)],
      PIN_LETTERS[Math.floor(Math.random() * PIN_LETTERS.length)],
      PIN_DIGITS[Math.floor(Math.random() * PIN_DIGITS.length)],
      PIN_DIGITS[Math.floor(Math.random() * PIN_DIGITS.length)],
    ];

    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    const code = chars.join('');
    if (!existingCodes || !existingCodes.has(code)) {
      return code;
    }
  }
  return fallback;
};

/**
 * 영문·숫자 혼합 4자리 무작위 개인 입장 코드를 생성합니다.
 * 기존 코드 집합(`existingPins`)과 중복되지 않도록 보장합니다.
 */
export const generateStudentPin = (existingPins?: Set<string>): string =>
  createMixed4CharCode(existingPins, 'Q5Z7');

/**
 * 반 고유 접속 코드를 생성합니다. (영문·숫자 혼합 4자리)
 */
export const generateClassCode = (existingIds?: Set<string>): string =>
  createMixed4CharCode(existingIds, '7M9P');

/**
 * 반별 고유 학생 스마트폰/태블릿 QR 접속 URL을 반환합니다.
 * Google Apps Script 웹앱 URL이 연결된 경우 짧은 배포 ID(?gas=...)를 함께 포함합니다.
 */
export const getStudentLoginUrl = (
  classId: string = DEFAULT_CLASS_ID,
  gasWebAppUrl?: string
): string => {
  if (typeof window === 'undefined') return '';
  const base = `${window.location.origin}${window.location.pathname}`;
  const cleanGas = (gasWebAppUrl || '').trim();
  if (cleanGas) {
    const match = cleanGas.match(/\/macros\/s\/([^/]+)\/exec/i);
    const gasParam = match ? match[1] : cleanGas;
    return `${base}?gas=${encodeURIComponent(gasParam)}&class=${encodeURIComponent(classId)}`;
  }
  return `${base}?class=${encodeURIComponent(classId)}`;
};

/**
 * 30명 학급 시연용 샘플 학생 생성 함수 (1~30번 순환 매칭 자동 연결)
 */
export const createSample30Students = (): Student[] => {
  const sampleNames = [
    '김초록', '이단풍', '박솔잎', '최열매', '정은하',
    '강구름', '한바다', '송하늘', '오별빛', '윤태양',
    '서지우', '조민준', '신서연', '장도윤', '임하은',
    '권시우', '황지민', '유서준', '안예은', '문건우',
    '양수빈', '손지후', '배채원', '백우진', '허다은',
    '노현우', '하유나', '전준서', '유아린', '고은우',
  ];
  const usedPins = new Set<string>();
  return sampleNames.map((name, idx) => {
    const num = idx + 1;
    const nextNum = (idx + 1) % sampleNames.length + 1;
    const pin =
      idx < PRESET_SAMPLE_PINS.length && !usedPins.has(PRESET_SAMPLE_PINS[idx])
        ? PRESET_SAMPLE_PINS[idx]
        : generateStudentPin(usedPins);
    usedPins.add(pin);
    return {
      id: `s${num}`,
      number: num,
      name,
      pin,
      targetId: `s${nextNum}`,
      medals: [],
    };
  });
};

/**
 * 6명의 가상 학생 데이터 (순환 매칭: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 1)
 * - s1(김초록) -> s2(이단풍) -> s3(박솔잎) -> s4(최열매) -> s5(정은하) -> s6(강구름) -> s1(김초록)
 */
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    number: 1,
    name: '김초록',
    pin: 'K7M4',
    targetId: 's2', // 김초록은 이단풍의 수호천사
    guessedAngelId: 's6', // 나를 챙겨준 강구름(s6)을 정확히 추리 (+50점)
    thankLetterToAngel:
      '나의 수호천사님! 매일 아침 내 책상 위에 따뜻한 응원 쪽지랑 칭찬 스티커를 붙여줘서 정말 고마웠어. 덕분에 일주일 내내 학교 오는 길이 설렜어!',
    revealLetterToTarget:
      '단풍아 안녕! 너의 비밀 수호천사는 바로 나, 김초록이었어! 네가 발표할 때마다 제일 크게 박수 치고 물통도 같이 날랐는데 눈치챘니? 앞으로도 친하게 지내자!',
    medals: [
      {
        id: 'med_1',
        icon: 'medal',
        title: '성실 수호천사 훈장',
        reason: '매일 내가 챙겨줄 친구를 위해 정성껏 활동하고 기록한 성실함이 돋보였어요!',
        points: 30,
        awardedAt: '11월 16일',
      },
      {
        id: 'med_2',
        icon: 'heart',
        title: '따뜻한 감동 편지 훈장',
        reason: '친구의 발표를 진심으로 응원해 주어 교실 분위기가 따뜻해졌어요!',
        points: 30,
        awardedAt: '11월 17일',
      },
    ],
  },
  {
    id: 's2',
    number: 2,
    name: '이단풍',
    pin: 'R9T2',
    targetId: 's3', // 이단풍은 박솔잎의 수호천사
    guessedAngelId: 's4', // 김초록(s1)을 못 맞히고 최열매(s4)로 오답 추리 -> 김초록(s1)이 정체 숨기기 성공 보너스 조건 충족!
    thankLetterToAngel:
      '수호천사야, 내가 우유 상자 들 때랑 미술 시간에 도와줘서 진짜 고마웠어. 네 덕분에 나도 다른 친구를 더 열심히 도울 수 있었어!',
    revealLetterToTarget:
      '솔잎아! 일주일 동안 너의 사물함에 비타민이랑 응원 편지를 넣은 수호천사가 바로 나야! 항상 밝게 웃어줘서 고마워.',
    medals: [
      {
        id: 'med_3',
        icon: 'star',
        title: '반짝이는 퀘스트 훈장',
        reason: '주간 퀘스트를 정성껏 수행하고 친구에게 힘이 되어주었어요!',
        points: 30,
        awardedAt: '11월 17일',
      },
    ],
  },
  {
    id: 's3',
    number: 3,
    name: '박솔잎',
    pin: 'H3N8',
    targetId: 's4', // 박솔잎은 최열매의 수호천사
    guessedAngelId: 's2', // 이단풍(s2)을 정확히 추리 (+50점)
    thankLetterToAngel:
      '내 수호천사님! 사물함에 넣어준 편지 다 보물상자에 모아뒀어. 정말 고마워!',
    revealLetterToTarget: '',
  },
  {
    id: 's4',
    number: 4,
    name: '최열매',
    pin: 'B6V5',
    targetId: 's5', // 최열매는 정은하의 수호천사
    guessedAngelId: '',
    thankLetterToAngel: '',
    revealLetterToTarget: '',
  },
  {
    id: 's5',
    number: 5,
    name: '정은하',
    pin: 'D8F3',
    targetId: 's6', // 정은하는 강구름의 수호천사 (아직 받은 수호톡이 0건인 소외 학생 시연용)
    guessedAngelId: '',
    thankLetterToAngel: '',
    revealLetterToTarget: '',
  },
  {
    id: 's6',
    number: 6,
    name: '강구름',
    pin: 'P4W9',
    targetId: 's1', // 강구름은 김초록의 수호천사
    guessedAngelId: 's5',
    thankLetterToAngel:
      '수호천사 친구야! 체육 시간에 넘어졌을 때 먼저 달려와 손 잡아줘서 고마웠어.',
    revealLetterToTarget:
      '초록아! 네 책상 줄 맞춰주고 아침마다 칠판 이름표 정리해 준 수호천사는 나 강구름이었어!',
  },
];

const today = getTodayDateKey();

export const INITIAL_MISSIONS: MissionLog[] = [
  // 김초록(s1) -> 이단풍(s2) 보낸 활동 5건 인증 완료 (정체 숨기기 5회 이상 조건 달성 시연!)
  {
    id: 'm1',
    senderId: 's1',
    receiverId: 's2',
    type: 'quest',
    content: '단풍이가 오늘 입고 온 노란 가디건이 봄꽃처럼 정말 잘 어울린다고 칭찬해 주었어요.',
    points: 25,
    status: 'verified',
    reply: '아침에 칭찬해 줘서 하루 종일 기분이 날아갈 것 같았어! 고마워!',
    dateKey: '2026-11-14',
    createdAt: '11월 14일 09:15',
    verifiedAt: '11월 14일 13:20',
  },
  {
    id: 'm2',
    senderId: 's1',
    receiverId: 's2',
    type: 'stealth',
    content: '체육 시간 운동장에 나간 사이 단풍이 책상 위 흐트러진 교과서와 필통을 반듯하게 정리해 두었어요.',
    points: 10,
    status: 'verified',
    reply: '교실 들어왔는데 책상이 호텔처럼 깨끗해서 깜짝 놀랐어!',
    dateKey: '2026-11-15',
    createdAt: '11월 15일 11:05',
    verifiedAt: '11월 15일 14:10',
  },
  {
    id: 'm3',
    senderId: 's1',
    receiverId: 's2',
    type: 'heart',
    content: '국어 시간에 단풍이가 독서 감상문을 발표할 때 제일 큰 소리로 박수를 치며 응원했어요.',
    points: 20,
    status: 'verified',
    reply: '떨렸는데 큰 박수 소리 덕분에 끝까지 자신 있게 읽었어!',
    dateKey: '2026-11-16',
    createdAt: '11월 16일 10:30',
    verifiedAt: '11월 16일 12:40',
  },
  {
    id: 'm4',
    senderId: 's1',
    receiverId: 's2',
    type: 'power',
    content: '우유 급식 당번인 단풍이가 상자를 혼자 들고 오길래 먼저 달려가서 교실까지 같이 들어 주었어요.',
    points: 30,
    status: 'verified',
    reply: '우와 그때 도와준 게 내 수호천사였구나! 팔 아팠는데 진짜 고마워!',
    dateKey: '2026-11-17',
    createdAt: '11월 17일 09:40',
    verifiedAt: '11월 17일 11:15',
  },
  {
    id: 'm5',
    senderId: 's1',
    receiverId: 's2',
    type: 'heart',
    content: '사물함 안에 직접 그린 칭찬 스티커와 "오늘도 파이팅!" 비밀 쪽지를 몰래 넣어 두었어요.',
    points: 20,
    status: 'verified',
    reply: '귀여운 응원 그림 너무 고마워서 필통에 넣어 다녔어!',
    dateKey: today,
    createdAt: '오늘 08:50',
    verifiedAt: '오늘 09:30',
  },

  // 강구름(s6) -> 김초록(s1) 보낸 활동 (인증 완료 2건 + 확인 대기 1건 -> 탭2에서 즉시 승인 테스트 가능!)
  {
    id: 'm6',
    senderId: 's6',
    receiverId: 's1',
    type: 'stealth',
    content: '초록이가 화장실 간 사이에 바닥에 떨어진 알림장과 색연필을 주워 책상 서랍에 잘 챙겨 넣었어요.',
    points: 10,
    status: 'verified',
    reply: '색연필 잃어버린 줄 알고 걱정했는데 챙겨줘서 정말 고마워!',
    dateKey: '2026-11-16',
    createdAt: '11월 16일 11:20',
    verifiedAt: '11월 16일 13:05',
  },
  {
    id: 'm7',
    senderId: 's6',
    receiverId: 's1',
    type: 'power',
    content: '청소 시간에 초록이 구역인 창틀 먼지 닦기가 많아 보여서 물티슈를 가져와 함께 닦아 주었어요.',
    points: 30,
    status: 'verified',
    reply: '덕분에 일찍 끝나서 기분 좋게 하교했어, 최고야!',
    dateKey: '2026-11-17',
    createdAt: '11월 17일 14:30',
    verifiedAt: '11월 17일 15:00',
  },
  {
    id: 'm8',
    senderId: 's6',
    receiverId: 's1',
    type: 'quest',
    content: '초록이가 오늘 아침 친구들에게 밝게 인사하는 모습이 정말 멋지다고 칠판 칭찬 자석 옆에 쪽지를 붙였어요.',
    points: 25,
    status: 'pending',
    dateKey: today,
    createdAt: '오늘 09:10',
  },

  // 이단풍(s2) -> 박솔잎(s3) 보낸 활동
  {
    id: 'm9',
    senderId: 's2',
    receiverId: 's3',
    type: 'heart',
    content: '솔잎이 사물함에 달콤한 비타민 사탕 2개와 응원 메모를 넣어 두었어요.',
    points: 20,
    status: 'verified',
    reply: '비타민 먹고 5교시 체육 시간까지 힘났어 고마워!',
    dateKey: '2026-11-17',
    createdAt: '11월 17일 10:15',
    verifiedAt: '11월 17일 13:00',
  },
  {
    id: 'm10',
    senderId: 's2',
    receiverId: 's3',
    type: 'quest',
    content: '솔잎이가 급식 시간에 시금치 나물까지 남김없이 골고루 먹는 멋진 모습을 관찰해 칭찬톡을 보내요!',
    points: 25,
    status: 'pending',
    dateKey: today,
    createdAt: '오늘 12:45',
  },

  // 박솔잎(s3) -> 최열매(s4) 보낸 활동
  {
    id: 'm11',
    senderId: 's3',
    receiverId: 's4',
    type: 'stealth',
    content: '열매의 의자가 나와 있길래 쉬는 시간에 소리 없이 쏙 넣어 주었어요.',
    points: 10,
    status: 'pending',
    dateKey: today,
    createdAt: '오늘 10:50',
  },

  // 정은하(s5) -> 강구름(s6) 보낸 활동
  {
    id: 'm12',
    senderId: 's5',
    receiverId: 's6',
    type: 'power',
    content: '체육 시간에 구름이가 공을 주우러 멀리 갔을 때 같이 뛰어가서 공 바구니를 옮겨 주었어요.',
    points: 30,
    status: 'verified',
    reply: '같이 들어줘서 진짜 든든했어 고마워!',
    dateKey: '2026-11-17',
    createdAt: '11월 17일 11:40',
    verifiedAt: '11월 17일 14:00',
  },
];

/**
 * 기본 체험용 학급 (4학년 2반 수호톡 / 반 코드 4B2K / 교사 비번 1234)
 */
export const createDefaultClassRoom = (): ClassRoom => ({
  id: DEFAULT_CLASS_ID,
  teacherPassword: DEFAULT_TEACHER_PASSWORD,
  config: INITIAL_CONFIG,
  students: INITIAL_STUDENTS,
  missions: INITIAL_MISSIONS,
  medalTemplates: INITIAL_MEDAL_TEMPLATES,
  createdAt: '2026-11-14',
});
