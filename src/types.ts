export type HamsterVariant =
  | 'welcome'
  | 'quest'
  | 'stealth'
  | 'heart'
  | 'power'
  | 'stamp';

export type ActivityType = 'quest' | 'stealth' | 'heart' | 'power';

export type MissionStatus = 'pending' | 'verified' | 'hold';

export type GameStage = 1 | 2 | 3; // 1: 첫 편지, 2: 비밀 활동, 3: 추리와 정체 공개

export type MedalIconType = 'medal' | 'crown' | 'shield' | 'star' | 'heart';

export interface MedalAward {
  id: string;
  icon: MedalIconType;
  title: string;
  reason: string;
  points: number; // 훈장 1개당 +30점
  awardedAt: string;
}

export interface MedalTemplate {
  id: string;
  icon: MedalIconType;
  title: string;
  reason: string;
  points: number;
}

export interface Student {
  id: string;
  number: number;
  name: string;
  pin: string; // 영문·숫자 혼합 4자리 개인 비밀 입장 코드
  targetId: string; // 내가 챙겨줄 짝꿍(마니또 대상) ID
  openingLetterToAngel?: string; // 1단계 시작: 나의 수호천사에게 보내는 첫 편지
  openingReplyToTarget?: string; // 1단계 시작: 내 짝꿍의 첫 편지에 쓰는 수호천사의 답장
  guessedAngelId?: string; // 내가 추리한 나의 수호천사 ID
  thankLetterToAngel?: string; // 내 수호천사에게 쓰는 감사 편지
  revealLetterToTarget?: string; // 내 짝꿍에게 정체를 밝히며 쓰는 편지
  medals?: MedalAward[]; // 교사가 직접 수여한 영예의 훈장 (+30점/개)
}

export interface ChatMessage {
  id: string;
  roomId: string; // `${angelId}->${targetId}`
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

export interface ClassRoom {
  id: string; // 반 고유 코드 (예: '4B2K') -> 학생 링크 ?class=4B2K
  teacherPassword: string; // 교사용 비밀번호
  config: ClassConfig;
  students: Student[];
  missions: MissionLog[];
  chats?: ChatMessage[];
  medalTemplates: MedalTemplate[];
  createdAt: string;
}

export interface MissionLog {
  id: string;
  senderId: string; // 수호천사 학생 ID ('POSTMASTER'면 선생님 특별 응원)
  receiverId: string; // 받은 짝꿍 학생 ID
  type: ActivityType;
  content: string; // 구체적으로 한 행동
  points: number; // 25 | 10 | 20 | 30 (선생님 특별 응원은 0)
  status: MissionStatus;
  reply?: string; // 짝꿍이 미션 승인 시 남긴 선택 한마디
  dateKey: string; // YYYY-MM-DD (주간/일일 제한 계산용)
  createdAt: string; // 표시용 시간
  verifiedAt?: string;
  isPostmasterNote?: boolean; // 선생님이 소외 학생에게 보낸 특별 응원 여부
  questId?: string;
  questText?: string; // 제출 당시 학생에게 표시된 미션 내용
}

export interface WeeklyQuestSettings {
  weeklyQuest: string;
  weeklyQuestId?: string;
  weeklyQuestHidden?: boolean;
}

export type WeeklyQuestChange =
  | { type: 'start'; content: string }
  | { type: 'edit'; content: string }
  | { type: 'visibility'; hidden: boolean };

export interface ClassConfig extends WeeklyQuestSettings {
  className: string;
  stage: GameStage;
  revealOpened?: boolean; // 기존 3단계 학급의 공개 상태는 유지
  chatOpen?: boolean; // 교사가 여는 '수호천사와 톡하기' 1:1 대화방 ON/OFF
  gasWebAppUrl: string;
  spreadsheetUrl?: string;
  lastSyncedAt?: string;
}

export interface ScoreBreakdown {
  questPoints: number;
  questCount: number;
  stealthPoints: number;
  stealthCount: number;
  heartPoints: number;
  heartCount: number;
  powerPoints: number;
  powerCount: number;
  activitySubtotal: number;
  verifiedSentCount: number;
  replyVerificationPoints: number; // 승인 보너스 폐지 (0점, 확인 건수 기록만 유지)
  replyVerifiedCount: number;
  openingLetterBonus: number; // 첫 편지(+15) + 첫 답장(+15) = 최대 +30점
  hasOpeningLetter: boolean;
  hasOpeningReply: boolean;
  guessBonus: number; // 추리 성공 +50점 (3단계 공개 시 합산)
  isGuessCorrect: boolean | null;
  stealthMasterBonus: number; // 인증 완료 5회 이상 & 내 짝꿍이 나를 못 맞혔을 때 +50점 (3단계 공개 시 합산)
  isStealthMasterEligible: boolean; // 인증 5회 이상 여부
  wasCaughtByTarget: boolean; // 짝꿍이 나를 맞혔는지 여부
  targetGuessedStudentId: string; // 내 짝꿍이 추리로 지목한 학생 ID
  letterBonus: number; // 정체 공개 편지(+15) + 감사 답장(+15) = 최대 +30점
  hasThankLetter: boolean;
  hasRevealLetter: boolean;
  medalCount: number; // 교사가 수여한 훈장 개수
  medalPoints: number; // 교사 수여 훈장 점수 (개당 +30점)
  totalScore: number;
}

export interface BadgeInfo {
  id: string;
  title: string;
  subtitle: string;
  conditionText: string;
  unlocked: boolean;
  variant: HamsterVariant;
}
