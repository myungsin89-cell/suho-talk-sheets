import React from 'react';
import { ActivityType, ClassConfig, MissionLog, Student } from '../types';
import {
  findGuardianAngelOf,
  findTargetPartnerOf,
} from '../utils/scoring';
import { SuhoHamster, SuhoKakaoLogo } from './SuhoHamster';
import { isIdentityRevealed } from '../utils/classProgress';
import {
  Award,
  CheckCircle2,
  EyeOff,
  HeartHandshake,
  Mail,
  MessageCircleHeart,
  PenLine,
  Send,
  Sparkles,
  Zap,
} from 'lucide-react';

interface WorkbookPrintSheetProps {
  student: Student;
  students: Student[];
  missions: MissionLog[];
  config: ClassConfig;
  isPageBreak?: boolean;
}

export const PAGE1_MISSION_LIMIT = 6;
export const EXTRA_PAGE_MISSION_LIMIT = 8;

/**
 * 학생 1명의 활동 기록장 총 인쇄 쪽수를 계산합니다.
 * - 양면 인쇄·2쪽 모아찍기 시 다음 학생과 섞이지 않도록 항상 짝수(2, 4, 6...)를 반환합니다.
 */
export const getStudentWorkbookPageCount = (
  studentId: string,
  missions: MissionLog[]
): number => {
  const sentCount = missions.filter(
    (m) => m.senderId === studentId && !m.isPostmasterNote
  ).length;
  const receivedCount = missions.filter((m) => m.receiverId === studentId).length;
  const extraMax = Math.max(
    0,
    sentCount - PAGE1_MISSION_LIMIT,
    receivedCount - PAGE1_MISSION_LIMIT
  );
  const extraActivityPages =
    extraMax > 0 ? Math.ceil(extraMax / EXTRA_PAGE_MISSION_LIMIT) : 0;
  const activityPages = 1 + extraActivityPages;
  return activityPages % 2 === 1 ? activityPages + 1 : activityPages + 2;
};

const getActivityLabel = (type: ActivityType, isPostmaster?: boolean) => {
  if (isPostmaster) return '선생님 응원';
  switch (type) {
    case 'quest':
      return '주간 미션';
    case 'stealth':
      return '몰래 챙겨주기';
    case 'heart':
      return '마음 표현하기';
    case 'power':
      return '직접 도와주기';
  }
};

export const ActivityLineIcon: React.FC<{
  type: ActivityType;
  className?: string;
}> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'quest':
      return <Sparkles className={className} strokeWidth={1.8} />;
    case 'stealth':
      return <EyeOff className={className} strokeWidth={1.8} />;
    case 'heart':
      return <HeartHandshake className={className} strokeWidth={1.8} />;
    case 'power':
      return <Zap className={className} strokeWidth={1.8} />;
  }
};

const getMissionBadgeText = (status: MissionLog['status']) => {
  switch (status) {
    case 'verified':
      return '확인 완료';
    case 'hold':
      return '잘 모르겠어요';
    case 'pending':
      return '확인 대기';
  }
};

const SentMissionCard: React.FC<{ mission: MissionLog }> = ({ mission: m }) => (
  <div className="rounded-xl bg-[#FFFDF4] border border-[#F3DF9C] px-2.5 py-1.5 space-y-0.5">
    <div className="flex items-center justify-between gap-1 text-[10px]">
      <span className="font-black text-[#3C1E1E] inline-flex items-center gap-1 min-w-0">
        <ActivityLineIcon type={m.type} className="w-3 h-3 text-[#B45309] shrink-0" />
        <span className="truncate">{getActivityLabel(m.type)}</span>
        <span className="font-semibold text-[#75675d] shrink-0">· {m.createdAt}</span>
      </span>
      <span
        className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold shrink-0 ${
          m.status === 'verified'
            ? 'bg-emerald-50 text-emerald-700'
            : m.status === 'hold'
            ? 'bg-rose-50 text-rose-700'
            : 'bg-gray-100 text-[#767676]'
        }`}
      >
        {getMissionBadgeText(m.status)}
      </span>
    </div>
    <p className="text-[11px] font-medium text-[#2D201A] leading-snug line-clamp-2">
      {m.content}
    </p>
    {m.reply && (
      <div className="rounded-lg bg-white border border-[#E9D9AE] px-2 py-0.5 text-[10px] font-bold text-[#735020] truncate">
        친구 답장: “{m.reply}”
      </div>
    )}
  </div>
);

const ReceivedMissionCard: React.FC<{ mission: MissionLog }> = ({ mission: m }) => (
  <div className="rounded-xl bg-[#F5FAF7] border border-[#C6E2D1] px-2.5 py-1.5 space-y-0.5">
    <div className="flex items-center justify-between gap-1 text-[10px]">
      <span className="font-black text-[#1B4D3E] inline-flex items-center gap-1 min-w-0">
        <ActivityLineIcon type={m.type} className="w-3 h-3 text-[#1B4D3E] shrink-0" />
        <span className="truncate">{getActivityLabel(m.type, m.isPostmasterNote)}</span>
      </span>
      <span className="font-semibold text-[#5E7467] shrink-0">{m.createdAt}</span>
    </div>
    <p className="text-[11px] font-medium text-[#2D201A] leading-snug line-clamp-2">
      {m.content}
    </p>
    {m.reply && (
      <div className="rounded-lg bg-[#FFF5D6] border border-[#E9D9AE] px-2 py-0.5 text-[10px] font-bold text-[#3C1E1E] truncate">
        내가 남긴 한마디: “{m.reply}”
      </div>
    )}
  </div>
);

/**
 * A4 자동 짝수 확장(2쪽 / 4쪽 / 6쪽...) 점수 없는 추억 활동 기록장
 * - 양면 인쇄 및 2쪽 모아찍기 시 학생별 경계가 어긋나지 않도록 항상 짝수 페이지를 유지합니다.
 */
export const WorkbookPrintSheet: React.FC<WorkbookPrintSheetProps> = ({
  student,
  students,
  missions,
  config,
  isPageBreak = false,
}) => {
  const myAngel = findGuardianAngelOf(student.id, students);
  const myTarget = findTargetPartnerOf(student.id, students);
  const showAngelIdentity = isIdentityRevealed(config) || config.stage === 3;

  const allSentMissions = missions.filter(
    (m) => m.senderId === student.id && !m.isPostmasterNote
  );
  const allReceivedMissions = missions.filter((m) => m.receiverId === student.id);

  const page1Sent = allSentMissions.slice(0, PAGE1_MISSION_LIMIT);
  const page1Received = allReceivedMissions.slice(0, PAGE1_MISSION_LIMIT);

  const extraMax = Math.max(
    0,
    allSentMissions.length - PAGE1_MISSION_LIMIT,
    allReceivedMissions.length - PAGE1_MISSION_LIMIT
  );
  const extraActivityPagesCount =
    extraMax > 0 ? Math.ceil(extraMax / EXTRA_PAGE_MISSION_LIMIT) : 0;
  const activityPages = 1 + extraActivityPagesCount;
  const splitEndingPages = activityPages % 2 === 0;
  const totalPages = splitEndingPages ? activityPages + 2 : activityPages + 1;

  const extraActivityChunks = Array.from(
    { length: extraActivityPagesCount },
    (_, idx) => {
      const start = PAGE1_MISSION_LIMIT + idx * EXTRA_PAGE_MISSION_LIMIT;
      const end = start + EXTRA_PAGE_MISSION_LIMIT;
      return {
        pageNumber: idx + 2,
        sent: allSentMissions.slice(start, end),
        received: allReceivedMissions.slice(start, end),
      };
    }
  );

  const isGuessCorrect =
    showAngelIdentity && Boolean(student.guessedAngelId) && Boolean(myAngel)
      ? myAngel?.id === student.guessedAngelId
      : null;

  const targetDisplayName = myTarget ? `${myTarget.number}번 ${myTarget.name}` : '미지정';
  const angelDisplayName =
    showAngelIdentity && myAngel
      ? `${myAngel.number}번 ${myAngel.name}`
      : myAngel
      ? `비밀 수호천사 (${myAngel.name})`
      : '미지정';

  const medals = student.medals || [];

  const renderStage1Letters = (compact: boolean) => (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-black text-[#3C1E1E] flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded-md bg-[#D97706] text-white text-[10px] font-black">
            01
          </span>
          <span>1단계 · 설레는 첫 편지와 답장</span>
        </h3>
        <span className="text-[10px] font-bold text-[#75675d]">
          활동의 시작을 열었던 첫인사 모음
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div
          className={`rounded-xl bg-white border border-[#E9D9AE] px-3 py-2 flex flex-col justify-between ${
            compact ? 'min-h-[78px]' : 'min-h-[98px]'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-[#735020] mb-1">
            <span>내가 수호천사에게 보낸 첫 편지</span>
            <span className="text-[#75675d] shrink-0">To. {angelDisplayName}</span>
          </div>
          <p
            className={`text-[#2D201A] leading-snug whitespace-pre-wrap flex-1 ${
              compact ? 'text-[10.5px] line-clamp-4' : 'text-[11px] line-clamp-5'
            }`}
          >
            {student.openingLetterToAngel?.trim() || '작성된 편지가 없어요.'}
          </p>
        </div>

        <div
          className={`rounded-xl bg-[#FFFDF4] border border-[#F3DF9C] px-3 py-2 flex flex-col justify-between ${
            compact ? 'min-h-[78px]' : 'min-h-[98px]'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-[#B45309] mb-1">
            <span>수호천사가 보내준 첫 답장</span>
            <span className="text-[#735020] shrink-0">From. {angelDisplayName}</span>
          </div>
          <p
            className={`text-[#2D201A] leading-snug whitespace-pre-wrap flex-1 ${
              compact ? 'text-[10.5px] line-clamp-4' : 'text-[11px] line-clamp-5'
            }`}
          >
            {myAngel?.openingReplyToTarget?.trim() || '도착한 답장이 없어요.'}
          </p>
        </div>

        <div
          className={`rounded-xl bg-[#F5FAF7] border border-[#C6E2D1] px-3 py-2 flex flex-col justify-between ${
            compact ? 'min-h-[78px]' : 'min-h-[98px]'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-[#1B4D3E] mb-1">
            <span>내가 챙겨준 친구가 보낸 첫 편지</span>
            <span className="text-[#4A6B57] shrink-0">From. {targetDisplayName}</span>
          </div>
          <p
            className={`text-[#2D201A] leading-snug whitespace-pre-wrap flex-1 ${
              compact ? 'text-[10.5px] line-clamp-4' : 'text-[11px] line-clamp-5'
            }`}
          >
            {myTarget?.openingLetterToAngel?.trim() || '작성된 편지가 없어요.'}
          </p>
        </div>

        <div
          className={`rounded-xl bg-white border border-[#E2D6C5] px-3 py-2 flex flex-col justify-between ${
            compact ? 'min-h-[78px]' : 'min-h-[98px]'
          }`}
        >
          <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-[#3C1E1E] mb-1">
            <span>내가 챙겨준 친구에게 보낸 첫 답장</span>
            <span className="text-[#75675d] shrink-0">To. {targetDisplayName}</span>
          </div>
          <p
            className={`text-[#2D201A] leading-snug whitespace-pre-wrap flex-1 ${
              compact ? 'text-[10.5px] line-clamp-4' : 'text-[11px] line-clamp-5'
            }`}
          >
            {student.openingReplyToTarget?.trim() || '작성된 답장이 없어요.'}
          </p>
        </div>
      </div>
    </section>
  );

  const renderStage3Letters = (expanded: boolean) => {
    const clampClass = expanded ? 'text-[11.5px] leading-relaxed line-clamp-[11]' : 'text-[11px] leading-relaxed line-clamp-[7]';
    return (
      <section className="space-y-1.5 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-2 shrink-0">
          <h3 className="text-[13px] font-black text-[#3C1E1E] flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded-md bg-[#1B4D3E] text-white text-[10px] font-black">
              02
            </span>
            <MessageCircleHeart className="w-3.5 h-3.5 text-[#9F1239]" strokeWidth={2.2} />
            <span>3단계 · 정체 공개와 감사의 마지막 편지</span>
          </h3>
          <span className="text-[10px] font-bold text-[#75675d]">
            받은 편지와 내가 보낸 편지를 모두 담았어요
          </span>
        </div>

        <div className="grid grid-cols-2 grid-rows-2 gap-2.5 flex-1 min-h-0">
          <div className="rounded-2xl bg-[#FFFDF6] border-2 border-[#F3DF9C] p-3 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-1 border-b border-dashed border-[#E9D9AE] pb-1.5 mb-1.5 shrink-0">
              <span className="text-[11px] font-black text-[#3C1E1E]">
                수호천사의 정체 공개 편지
              </span>
              <span className="text-[10px] font-bold text-[#B45309] shrink-0">
                From. {angelDisplayName}
              </span>
            </div>
            <p className={`text-[#2D201A] whitespace-pre-wrap ${clampClass}`}>
              {(showAngelIdentity ? myAngel?.revealLetterToTarget?.trim() : '') ||
                '아직 도착한 정체 공개 편지가 없어요.'}
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFF9F8] border-2 border-[#F3D2CA] p-3 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-1 border-b border-dashed border-[#F3D2CA] pb-1.5 mb-1.5 shrink-0">
              <span className="text-[11px] font-black text-[#9F1239]">
                내가 챙겨준 친구의 감사 편지
              </span>
              <span className="text-[10px] font-bold text-[#9F1239] shrink-0">
                From. {targetDisplayName}
              </span>
            </div>
            <p className={`text-[#2D201A] whitespace-pre-wrap ${clampClass}`}>
              {(showAngelIdentity ? myTarget?.thankLetterToAngel?.trim() : '') ||
                '아직 도착한 감사 편지가 없어요.'}
            </p>
          </div>

          <div className="rounded-2xl bg-white border-2 border-[#C6E2D1] p-3 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-1 border-b border-dashed border-[#C6E2D1] pb-1.5 mb-1.5 shrink-0">
              <span className="text-[11px] font-black text-[#1B4D3E]">
                내가 수호천사에게 쓴 감사 편지
              </span>
              <span className="text-[10px] font-bold text-[#1B4D3E] shrink-0">
                To. {angelDisplayName}
              </span>
            </div>
            <p className={`text-[#2D201A] whitespace-pre-wrap ${clampClass}`}>
              {student.thankLetterToAngel?.trim() ||
                '수호천사에게 남긴 감사 편지가 없어요.'}
            </p>
          </div>

          <div className="rounded-2xl bg-white border-2 border-[#E2D6C5] p-3 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-1 border-b border-dashed border-[#E2D6C5] pb-1.5 mb-1.5 shrink-0">
              <span className="text-[11px] font-black text-[#3C1E1E]">
                내가 챙겨준 친구에게 쓴 정체 공개 편지
              </span>
              <span className="text-[10px] font-bold text-[#735020] shrink-0">
                To. {targetDisplayName}
              </span>
            </div>
            <p className={`text-[#2D201A] whitespace-pre-wrap ${clampClass}`}>
              {student.revealLetterToTarget?.trim() ||
                '내가 챙겨준 친구에게 남긴 정체 공개 편지가 없어요.'}
            </p>
          </div>
        </div>
      </section>
    );
  };

  return (
    <>
      {/* ================================================================= */}
      {/* 1쪽: 매칭 정체 공개 & 나의 활동 / 수호천사의 활동 (최대 6건씩)     */}
      {/* ================================================================= */}
      <div className="a4-page a4-workbook-page a4-page-break break-keep w-full max-w-[760px] mx-auto min-h-[1030px] bg-[#FCF9F2] border-2 border-[#3C1E1E] rounded-3xl p-5 text-[#2D201A] flex flex-col justify-between gap-2.5 shadow-sm">
        <header className="rounded-2xl bg-[#FEE500] border-2 border-[#3C1E1E] px-4 py-3 flex items-center justify-between gap-3">
          <div className="shrink-0 bg-white rounded-2xl border-2 border-[#3C1E1E] p-1">
            <SuhoHamster variant="welcome" angelStyle="boy" size={56} />
          </div>

          <div className="flex-1 min-w-0 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-white border border-[#3C1E1E]/35 rounded-full px-2.5 py-0.5 text-[10.5px] font-black text-[#3C1E1E]">
              <SuhoKakaoLogo size={14} />
              <span>
                {config.className} · 수호천사 활동 기록장 (1 / {totalPages}쪽)
              </span>
            </div>
            <h1 className="text-[20px] font-black tracking-tight text-[#3C1E1E] leading-tight">
              우리의 수호천사 활동 기록
            </h1>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#3C1E1E] text-[#FEE500] px-3 py-0.5 text-[12px] font-black">
              <span>{student.number}번</span>
              <span>{student.name}</span>
            </div>
          </div>

          <div className="shrink-0 bg-white rounded-full border-2 border-[#3C1E1E] p-1">
            <SuhoHamster variant="stamp" size={56} />
          </div>
        </header>

        <section className="space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-white border-2 border-[#E9D9AE] px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="shrink-0 rounded-xl bg-[#FFFBEB] border border-[#F3DF9C] p-1">
                <SuhoHamster variant="stealth" angelStyle="boy" size={44} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-extrabold text-[#735020]">
                  내가 몰래 챙겨준 소중한 친구
                </div>
                <div className="text-[15px] font-black text-[#2D201A] truncate mt-0.5">
                  {targetDisplayName}
                </div>
                <div className="inline-block mt-1 rounded-full bg-[#FFF5D6] border border-[#E9D9AE] px-2 py-0.5 text-[10px] font-black text-[#735020]">
                  함께한 활동 {allSentMissions.length}건
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border-2 border-[#B7DBC5] px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="shrink-0 rounded-xl bg-[#EEF7F1] border border-[#C6E2D1] p-1">
                <SuhoHamster variant="heart" angelStyle="girl" size={44} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-extrabold text-[#1B4D3E]">
                  나를 몰래 챙겨준 나의 수호천사
                </div>
                <div className="text-[15px] font-black text-[#2D201A] truncate mt-0.5">
                  {angelDisplayName}
                </div>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className="inline-block rounded-full bg-[#EEF7F1] border border-[#B7DBC5] px-2 py-0.5 text-[10px] font-black text-[#1B4D3E]">
                    받은 활동 {allReceivedMissions.length}건
                  </span>
                  {isGuessCorrect !== null && (
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black border ${
                        isGuessCorrect
                          ? 'bg-[#FEE500] border-[#D97706]/40 text-[#3C1E1E]'
                          : 'bg-[#FFF4F1] border-[#F3D2CA] text-[#9F1239]'
                      }`}
                    >
                      {isGuessCorrect ? '추리 성공!' : '깜짝 반전!'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {medals.length > 0 && (
            <div className="rounded-xl bg-white border border-[#E9D9AE] px-3 py-1.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-[#735020] shrink-0">
                <Award className="w-3.5 h-3.5 text-[#D97706]" strokeWidth={2.2} />
                <span>선생님 칭찬 훈장 ({medals.length}개)</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {medals.map((medal) => (
                  <span
                    key={medal.id}
                    className="inline-flex items-center gap-1 rounded-full bg-[#FFF5D6] border border-[#E9D9AE] px-2 py-0.5 text-[10px] font-extrabold text-[#3C1E1E]"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#D97706]" strokeWidth={2.2} />
                    <span>{medal.title}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          <div className="rounded-2xl bg-white border-2 border-[#E9D9AE] p-3 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-dashed border-[#E9D9AE] pb-2 mb-2 shrink-0">
              <div className="flex items-center gap-1.5 text-[12.5px] font-black text-[#3C1E1E]">
                <Send className="w-3.5 h-3.5 text-[#B45309]" strokeWidth={2.3} />
                <span>나의 활동 (내가 베푼 마음)</span>
              </div>
              <span className="rounded-full bg-[#FFF5D6] border border-[#E9D9AE] px-2 py-0.5 text-[10px] font-black text-[#735020]">
                총 {allSentMissions.length}건
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-hidden">
              {page1Sent.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs font-bold text-[#75675d] text-center py-8">
                  기록된 수호천사 활동이 없어요.
                </div>
              ) : (
                page1Sent.map((m) => <SentMissionCard key={m.id} mission={m} />)
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white border-2 border-[#B7DBC5] p-3 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-dashed border-[#B7DBC5] pb-2 mb-2 shrink-0">
              <div className="flex items-center gap-1.5 text-[12.5px] font-black text-[#1B4D3E]">
                <Mail className="w-3.5 h-3.5 text-[#1B4D3E]" strokeWidth={2.3} />
                <span>수호천사의 활동 (내가 받은 마음)</span>
              </div>
              <span className="rounded-full bg-[#EEF7F1] border border-[#B7DBC5] px-2 py-0.5 text-[10px] font-black text-[#1B4D3E]">
                총 {allReceivedMissions.length}건
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-hidden">
              {page1Received.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs font-bold text-[#75675d] text-center py-8">
                  수호천사에게 받은 활동 기록이 아직 없어요.
                </div>
              ) : (
                page1Received.map((m) => <ReceivedMissionCard key={m.id} mission={m} />)
              )}
            </div>
          </div>
        </section>

        <footer className="rounded-xl bg-[#3C1E1E] text-[#FCF9F2] px-4 py-2 flex items-center justify-between gap-2 text-[11px] font-bold">
          <span className="text-[#FEE500]">
            “작은 친절과 배려가 모여 따뜻한 우리 반을 만들었어요.”
          </span>
          <span className="text-[#E7DED0] shrink-0">
            {extraActivityPagesCount > 0
              ? '2쪽에서 이어지는 활동 기록을 확인해 보세요 →'
              : '2쪽에서 주고받은 비밀 편지를 읽어 보세요 →'}
          </span>
        </footer>
      </div>

      {/* ================================================================= */}
      {/* 추가 활동 페이지 (활동 7건 이상인 학생만 자동 추가)               */}
      {/* ================================================================= */}
      {extraActivityChunks.map((chunk) => (
        <div
          key={`extra-activity-${chunk.pageNumber}`}
          className="a4-page a4-workbook-page a4-page-break break-keep w-full max-w-[760px] mx-auto min-h-[1030px] bg-[#FCF9F2] border-2 border-[#3C1E1E] rounded-3xl p-5 text-[#2D201A] flex flex-col justify-between gap-2.5 shadow-sm"
        >
          <header className="rounded-2xl bg-[#FFF5D6] border-2 border-[#3C1E1E] px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <SuhoKakaoLogo size={28} />
              <div className="min-w-0">
                <div className="text-[10.5px] font-extrabold text-[#735020]">
                  {config.className} · {student.number}번 {student.name}
                </div>
                <h2 className="text-[17px] font-black text-[#3C1E1E] leading-tight">
                  이어지는 수호천사 활동 기록
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="rounded-full bg-[#3C1E1E] text-[#FEE500] px-2.5 py-0.5 text-[10.5px] font-black">
                {chunk.pageNumber} / {totalPages}쪽
              </span>
              <SuhoHamster variant="power" angelStyle="boy" size={38} />
            </div>
          </header>

          <section className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            <div className="rounded-2xl bg-white border-2 border-[#E9D9AE] p-3 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-dashed border-[#E9D9AE] pb-2 mb-2 shrink-0">
                <div className="flex items-center gap-1.5 text-[12.5px] font-black text-[#3C1E1E]">
                  <Send className="w-3.5 h-3.5 text-[#B45309]" strokeWidth={2.3} />
                  <span>나의 활동 (이어서)</span>
                </div>
                <span className="rounded-full bg-[#FFF5D6] border border-[#E9D9AE] px-2 py-0.5 text-[10px] font-black text-[#735020]">
                  {chunk.sent.length > 0 ? `+${chunk.sent.length}건` : '기록 완료'}
                </span>
              </div>

              <div className="space-y-1.5 flex-1 overflow-hidden">
                {chunk.sent.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8 space-y-2">
                    <SuhoHamster variant="stealth" angelStyle="boy" size={56} />
                    <p className="text-xs font-extrabold text-[#735020]">
                      내가 보낸 활동 기록을 모두 담았어요!
                    </p>
                    <p className="text-[11px] text-[#75675d]">
                      총 {allSentMissions.length}건의 따뜻한 마음 실천 완료
                    </p>
                  </div>
                ) : (
                  chunk.sent.map((m) => <SentMissionCard key={m.id} mission={m} />)
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white border-2 border-[#B7DBC5] p-3 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-dashed border-[#B7DBC5] pb-2 mb-2 shrink-0">
                <div className="flex items-center gap-1.5 text-[12.5px] font-black text-[#1B4D3E]">
                  <Mail className="w-3.5 h-3.5 text-[#1B4D3E]" strokeWidth={2.3} />
                  <span>수호천사의 활동 (이어서)</span>
                </div>
                <span className="rounded-full bg-[#EEF7F1] border border-[#B7DBC5] px-2 py-0.5 text-[10px] font-black text-[#1B4D3E]">
                  {chunk.received.length > 0 ? `+${chunk.received.length}건` : '기록 완료'}
                </span>
              </div>

              <div className="space-y-1.5 flex-1 overflow-hidden">
                {chunk.received.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8 space-y-2">
                    <SuhoHamster variant="heart" angelStyle="girl" size={56} />
                    <p className="text-xs font-extrabold text-[#1B4D3E]">
                      수호천사가 보낸 활동을 모두 담았어요!
                    </p>
                    <p className="text-[11px] text-[#5E7467]">
                      총 {allReceivedMissions.length}건의 고마운 마음 도착
                    </p>
                  </div>
                ) : (
                  chunk.received.map((m) => <ReceivedMissionCard key={m.id} mission={m} />)
                )}
              </div>
            </div>
          </section>

          <footer className="rounded-xl bg-[#3C1E1E] text-[#FCF9F2] px-4 py-2 flex items-center justify-between gap-2 text-[11px] font-bold">
            <span className="text-[#FEE500]">
              “매일 주고받은 작은 친절들이 쌓여 멋진 추억이 되었어요.”
            </span>
            <span className="text-[#E7DED0] shrink-0">
              {chunk.pageNumber + 1}쪽에서 계속 확인해 보세요 →
            </span>
          </footer>
        </div>
      ))}

      {/* ================================================================= */}
      {/* 마무리 페이지: 짝수 페이지 맞춤 (1장 통합형 vs 2장 분리형)          */}
      {/* ================================================================= */}
      {!splitEndingPages ? (
        <div
          className={`a4-page a4-workbook-page break-keep w-full max-w-[760px] mx-auto min-h-[1030px] bg-[#FCF9F2] border-2 border-[#3C1E1E] rounded-3xl p-5 text-[#2D201A] flex flex-col justify-between gap-2.5 shadow-sm ${
            isPageBreak ? 'a4-page-break' : ''
          }`}
        >
          <header className="rounded-2xl bg-[#FFF5D6] border-2 border-[#3C1E1E] px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <SuhoKakaoLogo size={28} />
              <div className="min-w-0">
                <div className="text-[10.5px] font-extrabold text-[#735020]">
                  {config.className} · {student.number}번 {student.name}
                </div>
                <h2 className="text-[17px] font-black text-[#3C1E1E] leading-tight">
                  우리의 비밀 편지함 &amp; 활동 소감
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="rounded-full bg-[#3C1E1E] text-[#FEE500] px-2.5 py-0.5 text-[10.5px] font-black">
                {totalPages} / {totalPages}쪽
              </span>
              <SuhoHamster variant="heart" angelStyle="girl" size={38} />
            </div>
          </header>

          {renderStage1Letters(true)}
          {renderStage3Letters(false)}

          <section className="space-y-2 shrink-0">
            <div className="rounded-2xl bg-white border-2 border-[#E2D6C5] px-4 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[12px] font-black text-[#3C1E1E]">
                  <PenLine className="w-3.5 h-3.5 text-[#B45309]" strokeWidth={2.2} />
                  <span>수호천사 활동을 마친 나의 소감 (직접 적어 봐요)</span>
                </div>
                <span className="text-[10px] font-semibold text-[#75675d]">
                  가장 기억에 남았던 순간이나 고마웠던 점
                </span>
              </div>
              <div className="space-y-1 pt-0.5">
                <div className="h-5 border-b border-dashed border-[#D1C3AF]" />
                <div className="h-5 border-b border-dashed border-[#D1C3AF]" />
                <div className="h-5 border-b border-dashed border-[#D1C3AF]" />
              </div>
            </div>

            <footer className="rounded-xl bg-[#3C1E1E] text-[#FCF9F2] px-4 py-2 flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold space-y-0.5">
                <div className="text-[#FEE500] font-black">
                  {config.className} · 수호천사 프로젝트 수료 기념 기록장
                </div>
                <div className="text-[#E7DED0] text-[10.5px]">
                  완료일: 202__년 __월 __일 &nbsp;·&nbsp; 학생 이름: {student.name}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="rounded-lg border border-dashed border-[#E7DED0]/60 px-3 py-1 text-[10.5px] font-bold text-[#E7DED0]">
                  담임선생님 확인 (인)
                </div>
                <div className="bg-white rounded-full p-0.5 border border-[#FEE500]">
                  <SuhoHamster variant="stamp" size={34} />
                </div>
              </div>
            </footer>
          </section>
        </div>
      ) : (
        <>
          {/* 편지 전용 페이지 (짝수 페이지 균형을 위한 편지함 단독 페이지) */}
          <div className="a4-page a4-workbook-page a4-page-break break-keep w-full max-w-[760px] mx-auto min-h-[1030px] bg-[#FCF9F2] border-2 border-[#3C1E1E] rounded-3xl p-5 text-[#2D201A] flex flex-col justify-between gap-3 shadow-sm">
            <header className="rounded-2xl bg-[#FFF5D6] border-2 border-[#3C1E1E] px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <SuhoKakaoLogo size={28} />
                <div className="min-w-0">
                  <div className="text-[10.5px] font-extrabold text-[#735020]">
                    {config.className} · {student.number}번 {student.name}
                  </div>
                  <h2 className="text-[17px] font-black text-[#3C1E1E] leading-tight">
                    우리의 비밀 편지함 (1단계 · 3단계 전체 편지)
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-[#3C1E1E] text-[#FEE500] px-2.5 py-0.5 text-[10.5px] font-black">
                  {totalPages - 1} / {totalPages}쪽
                </span>
                <SuhoHamster variant="heart" angelStyle="girl" size={38} />
              </div>
            </header>

            {renderStage1Letters(false)}
            {renderStage3Letters(true)}

            <footer className="rounded-xl bg-[#3C1E1E] text-[#FCF9F2] px-4 py-2 flex items-center justify-between gap-2 text-[11px] font-bold">
              <span className="text-[#FEE500]">
                “글자마다 담긴 따뜻한 마음이 오래오래 기억될 거예요.”
              </span>
              <span className="text-[#E7DED0] shrink-0">
                마지막 {totalPages}쪽에 활동 소감을 적어 보세요 →
              </span>
            </footer>
          </div>

          {/* 마지막 수료 & 손글씨 소감 페이지 */}
          <div
            className={`a4-page a4-workbook-page break-keep w-full max-w-[760px] mx-auto min-h-[1030px] bg-[#FCF9F2] border-2 border-[#3C1E1E] rounded-3xl p-5 text-[#2D201A] flex flex-col justify-between gap-3 shadow-sm ${
              isPageBreak ? 'a4-page-break' : ''
            }`}
          >
            <header className="rounded-2xl bg-[#FEE500] border-2 border-[#3C1E1E] px-4 py-3 flex items-center justify-between gap-3">
              <div className="shrink-0 bg-white rounded-2xl border-2 border-[#3C1E1E] p-1">
                <SuhoHamster variant="welcome" angelStyle="boy" size={54} />
              </div>

              <div className="flex-1 min-w-0 text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-white border border-[#3C1E1E]/35 rounded-full px-2.5 py-0.5 text-[10.5px] font-black text-[#3C1E1E]">
                  <SuhoKakaoLogo size={14} />
                  <span>
                    {config.className} · 수료 기념 ({totalPages} / {totalPages}쪽)
                  </span>
                </div>
                <h2 className="text-[20px] font-black text-[#3C1E1E] leading-tight">
                  수호천사 활동 마무리 &amp; 소감
                </h2>
                <p className="text-[11.5px] font-extrabold text-[#3C1E1E]/85">
                  {student.number}번 {student.name} 학생의 따뜻한 활동을 응원합니다!
                </p>
              </div>

              <div className="shrink-0 bg-white rounded-2xl border-2 border-[#3C1E1E] p-1">
                <SuhoHamster variant="welcome" angelStyle="girl" size={54} />
              </div>
            </header>

            {/* 활동 요약 (점수 미표시) */}
            <section className="rounded-2xl bg-white border-2 border-[#E2D6C5] p-3.5 space-y-2.5">
              <div className="text-[13px] font-black text-[#3C1E1E] flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-[#D97706] text-white text-[10px] font-black">
                  01
                </span>
                <span>우리의 수호천사 활동 한눈에 돌아보기</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-[#FFFDF4] border border-[#F3DF9C] px-2 py-2">
                  <div className="text-[10px] font-bold text-[#735020]">내가 챙겨준 친구</div>
                  <div className="text-[13px] font-black text-[#2D201A] mt-0.5 truncate">
                    {targetDisplayName}
                  </div>
                </div>
                <div className="rounded-xl bg-[#F5FAF7] border border-[#C6E2D1] px-2 py-2">
                  <div className="text-[10px] font-bold text-[#1B4D3E]">나의 수호천사</div>
                  <div className="text-[13px] font-black text-[#2D201A] mt-0.5 truncate">
                    {angelDisplayName}
                  </div>
                </div>
                <div className="rounded-xl bg-[#FFFDF4] border border-[#F3DF9C] px-2 py-2">
                  <div className="text-[10px] font-bold text-[#735020]">내가 베푼 마음</div>
                  <div className="text-[13px] font-black text-[#B45309] mt-0.5">
                    {allSentMissions.length}건
                  </div>
                </div>
                <div className="rounded-xl bg-[#F5FAF7] border border-[#C6E2D1] px-2 py-2">
                  <div className="text-[10px] font-bold text-[#1B4D3E]">내가 받은 마음</div>
                  <div className="text-[13px] font-black text-[#1B4D3E] mt-0.5">
                    {allReceivedMissions.length}건
                  </div>
                </div>
              </div>
            </section>

            {/* 넉넉한 손글씨 소감 영역 */}
            <section className="rounded-2xl bg-white border-2 border-[#E2D6C5] p-4 flex-1 flex flex-col justify-between gap-2 min-h-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[13px] font-black text-[#3C1E1E] flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded-md bg-[#1B4D3E] text-white text-[10px] font-black">
                    02
                  </span>
                  <PenLine className="w-3.5 h-3.5 text-[#B45309]" strokeWidth={2.2} />
                  <span>수호천사 활동을 마친 나의 소감</span>
                </h3>
                <span className="text-[10px] font-bold text-[#75675d]">
                  가장 기억에 남았던 순간과 느낀 점을 자유롭게 적어 봐요
                </span>
              </div>

              <div className="flex-1 flex flex-col justify-between py-1">
                {Array.from({ length: 7 }).map((_, lineIdx) => (
                  <div
                    key={lineIdx}
                    className="h-7 border-b border-dashed border-[#D1C3AF]"
                  />
                ))}
              </div>
            </section>

            {/* 친구에게 남기는 손글씨 한마디 2열 */}
            <section className="grid grid-cols-2 gap-3 shrink-0">
              <div className="rounded-2xl bg-[#FFFDF6] border-2 border-[#F3DF9C] p-3 space-y-1.5">
                <div className="text-[11px] font-black text-[#B45309]">
                  To. {angelDisplayName}에게 전하는 마지막 한마디
                </div>
                <div className="h-6 border-b border-dashed border-[#E2C77A]" />
                <div className="h-6 border-b border-dashed border-[#E2C77A]" />
                <div className="h-6 border-b border-dashed border-[#E2C77A]" />
              </div>

              <div className="rounded-2xl bg-[#F5FAF7] border-2 border-[#C6E2D1] p-3 space-y-1.5">
                <div className="text-[11px] font-black text-[#1B4D3E]">
                  To. {targetDisplayName}에게 전하는 마지막 한마디
                </div>
                <div className="h-6 border-b border-dashed border-[#A8D5BA]" />
                <div className="h-6 border-b border-dashed border-[#A8D5BA]" />
                <div className="h-6 border-b border-dashed border-[#A8D5BA]" />
              </div>
            </section>

            <footer className="rounded-xl bg-[#3C1E1E] text-[#FCF9F2] px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] font-bold space-y-0.5">
                <div className="text-[#FEE500] font-black">
                  {config.className} · 수호천사 프로젝트 수료 기념 기록장
                </div>
                <div className="text-[#E7DED0] text-[10.5px]">
                  완료일: 202__년 __월 __일 &nbsp;·&nbsp; 학생 이름: {student.name}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="rounded-lg border border-dashed border-[#E7DED0]/60 px-3 py-1.5 text-[10.5px] font-bold text-[#E7DED0]">
                  담임선생님 확인 (인)
                </div>
                <div className="bg-white rounded-full p-0.5 border-2 border-[#FEE500]">
                  <SuhoHamster variant="stamp" size={40} />
                </div>
              </div>
            </footer>
          </div>
        </>
      )}
    </>
  );
};
