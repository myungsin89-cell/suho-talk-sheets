import { BadgeInfo, GameStage, MissionLog, ScoreBreakdown, Student } from '../types';
import { getTodayDateKey, getWeekKey } from '../data/mockData';

/**
 * 특정 학생을 몰래 챙겨주는 '나의 수호천사' 학생 객체를 찾습니다.
 */
export const findGuardianAngelOf = (
  studentId: string,
  students: Student[]
): Student | undefined => {
  return students.find((s) => s.targetId === studentId);
};

/**
 * 특정 학생이 챙겨주어야 하는 '나의 짝꿍(마니또 대상)' 학생 객체를 찾습니다.
 */
export const findTargetPartnerOf = (
  studentId: string,
  students: Student[]
): Student | undefined => {
  const me = students.find((s) => s.id === studentId);
  if (!me || !me.targetId) return undefined;
  return students.find((s) => s.id === me.targetId);
};

/**
 * 해당 학생의 주간/일일 미션 제출 제한 현황을 계산합니다.
 * - 새 주간 미션: 시작한 미션별 1회. 기존 미션은 주 1회 기준 유지.
 * - 상시 활동 3종 (stealth, heart, power): 하루 합산 최대 2회
 */
export const getDailyLimitStatus = (
  studentId: string,
  missions: MissionLog[],
  dateKey: string = getTodayDateKey(),
  questId?: string
) => {
  const currentWeekKey = getWeekKey(dateKey);
  const mySentLogs = missions.filter(
    (m) => m.senderId === studentId && !m.isPostmasterNote
  );

  const weeklyQuestCount = mySentLogs.filter(
    (m) => m.type === 'quest' && (questId
      ? m.questId === questId
      : !m.questId && getWeekKey(m.dateKey) === currentWeekKey)
  ).length;
  const todayRegularCount = mySentLogs.filter(
    (m) => m.type !== 'quest' && m.dateKey === dateKey
  ).length;

  const canSendQuest = weeklyQuestCount < 1;
  const canSendRegular = todayRegularCount < 2;
  const remainingRegularToday = Math.max(0, 2 - todayRegularCount);

  return {
    weeklyQuestCount,
    todayRegularCount,
    remainingRegularToday,
    canSendQuest,
    canSendRegular,
  };
};

/**
 * 명확하고 단순한 4가지 점수 규칙에 따른 실시간 점수 계산기
 * - getScoreStage에서 공개 전에는 1 또는 2를 전달합니다.
 *   정체 공개 후에 추리와 정체 숨기기 보너스를 합산합니다.
 */
export const calculateStudentScore = (
  studentId: string,
  students: Student[],
  missions: MissionLog[],
  stage: GameStage = 3
): ScoreBreakdown => {
  const me = students.find((s) => s.id === studentId);
  const myAngel = findGuardianAngelOf(studentId, students);
  const myTarget = findTargetPartnerOf(studentId, students);

  // 1. 수호천사 활동 점수 (내가 보낸 수호톡 중 대상자가 '진짜예요(verified)' 확인한 건만 지급)
  const myVerifiedSent = missions.filter(
    (m) => m.senderId === studentId && m.status === 'verified' && !m.isPostmasterNote
  );

  const questLogs = myVerifiedSent.filter((m) => m.type === 'quest');
  const stealthLogs = myVerifiedSent.filter((m) => m.type === 'stealth');
  const heartLogs = myVerifiedSent.filter((m) => m.type === 'heart');
  const powerLogs = myVerifiedSent.filter((m) => m.type === 'power');

  const questPoints = questLogs.length * 25;
  const stealthPoints = stealthLogs.length * 10;
  const heartPoints = heartLogs.length * 20;
  const powerPoints = powerLogs.length * 30;

  const activitySubtotal = questPoints + stealthPoints + heartPoints + powerPoints;
  const verifiedSentCount = myVerifiedSent.length;

  // 2. 수호톡 확인 및 승인 기록 (거짓 승인 방지를 위해 승인 보너스 점수는 0점)
  const myVerifiedReceived = missions.filter(
    (m) => m.receiverId === studentId && m.status === 'verified'
  );
  const replyVerifiedCount = myVerifiedReceived.length;
  const replyVerificationPoints = 0;

  // 2-1. 1단계 첫 편지(+15점) & 첫 답장(+15점)
  const hasOpeningLetter = Boolean(
    me?.openingLetterToAngel && me.openingLetterToAngel.trim().length >= 5
  );
  const hasOpeningReply = Boolean(
    me?.openingReplyToTarget && me.openingReplyToTarget.trim().length >= 5
  );
  const openingLetterBonus =
    (hasOpeningLetter ? 15 : 0) + (hasOpeningReply ? 15 : 0);

  // 3-1. 추리 성공 보너스 (+50점): 정체 공개 후 합산
  let isGuessCorrect: boolean | null = null;
  let rawGuessBonus = 0;
  if (me?.guessedAngelId) {
    isGuessCorrect = students.some(
      (s) => s.targetId === studentId && s.id === me.guessedAngelId
    );
    if (isGuessCorrect) {
      rawGuessBonus = 50;
    }
  }
  const guessBonus = stage === 3 ? rawGuessBonus : 0;

  // 3-2. 정체 숨기기 성공 보너스 (+50점):
  // 인증된 활동이 5회 이상이고 짝꿍이 나를 맞히지 못하면 정체 공개 후 +50점
  const isStealthMasterEligible = verifiedSentCount >= 5;
  const targetGuessedStudentId = myTarget?.guessedAngelId || '';
  const wasCaughtByTarget = Boolean(
    targetGuessedStudentId && targetGuessedStudentId === studentId
  );
  const rawStealthMasterBonus =
    isStealthMasterEligible && !wasCaughtByTarget ? 50 : 0;
  const stealthMasterBonus = stage === 3 ? rawStealthMasterBonus : 0;

  // 4. 마지막 편지 작성 보너스 (각 5자 이상 작성 시 +15점씩, 최대 +30점)
  const hasThankLetter = Boolean(
    me?.thankLetterToAngel && me.thankLetterToAngel.trim().length >= 5
  );
  const hasRevealLetter = Boolean(
    me?.revealLetterToTarget && me.revealLetterToTarget.trim().length >= 5
  );
  const letterBonus = (hasThankLetter ? 15 : 0) + (hasRevealLetter ? 15 : 0);

  // 5. 교사 수여 훈장 점수 (훈장 1개당 +30점)
  const medals = me?.medals || [];
  const medalCount = medals.length;
  const medalPoints = medals.reduce((sum, m) => sum + (m.points || 30), 0);

  const totalScore =
    activitySubtotal +
    openingLetterBonus +
    guessBonus +
    stealthMasterBonus +
    letterBonus +
    medalPoints;

  return {
    questPoints,
    questCount: questLogs.length,
    stealthPoints,
    stealthCount: stealthLogs.length,
    heartPoints,
    heartCount: heartLogs.length,
    powerPoints,
    powerCount: powerLogs.length,
    activitySubtotal,
    verifiedSentCount,
    replyVerificationPoints,
    replyVerifiedCount,
    openingLetterBonus,
    hasOpeningLetter,
    hasOpeningReply,
    guessBonus,
    isGuessCorrect,
    stealthMasterBonus,
    isStealthMasterEligible,
    wasCaughtByTarget,
    targetGuessedStudentId,
    letterBonus,
    hasThankLetter,
    hasRevealLetter,
    medalCount,
    medalPoints,
    totalScore,
  };
};

/**
 * 활동 배지 6종 도감 달성 여부 계산
 */
export const getStudentBadges = (
  studentId: string,
  students: Student[],
  missions: MissionLog[]
): BadgeInfo[] => {
  const score = calculateStudentScore(studentId, students, missions);
  const mySentAll = missions.filter(
    (m) => m.senderId === studentId && !m.isPostmasterNote
  );

  return [
    {
      id: 'badge-first-post',
      title: '설레는 첫 수호톡',
      subtitle: '첫 수호톡 발송 완료',
      conditionText: '짝꿍을 위한 첫 수호톡 활동 보고하기',
      unlocked: mySentAll.length >= 1,
      variant: 'welcome',
    },
    {
      id: 'badge-quest-star',
      title: '황금 별 미션 해결사',
      subtitle: '선생님의 주간 미션 인증',
      conditionText: '주간 미션 달성 후 짝꿍에게 인증받기',
      unlocked: score.questCount >= 1,
      variant: 'quest',
    },
    {
      id: 'badge-stealth-leaf',
      title: '든든한 비밀 수호천사',
      subtitle: '몰래 챙겨주기 & 5회 인증',
      conditionText: '인증 완료된 수호천사 활동 5회 이상 달성하기',
      unlocked: score.verifiedSentCount >= 5,
      variant: 'stealth',
    },
    {
      id: 'badge-warm-heart',
      title: '따뜻한 미션 확인 메아리',
      subtitle: '미션 확인 & 승인',
      conditionText: '내 수호천사의 미션을 확인하고 2회 이상 승인하기',
      unlocked: score.replyVerifiedCount >= 2,
      variant: 'heart',
    },
    {
      id: 'badge-brave-cape',
      title: '용감한 도움 천사',
      subtitle: '직접 도와주기 인증',
      conditionText: '들킬 위험을 감수하고 직접 도와주기(+30점) 인증받기',
      unlocked: score.powerCount >= 1,
      variant: 'power',
    },
    {
      id: 'badge-forest-master',
      title: '수호톡 명예 스탬프',
      subtitle: '마지막 편지 2통 완주',
      conditionText: '수호천사 감사 편지 & 짝꿍 정체 공개 편지 2통 모두 작성하기',
      unlocked: score.letterBonus === 30,
      variant: 'stamp',
    },
  ];
};
