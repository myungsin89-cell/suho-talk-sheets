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

const MAX_TIMELINE_ITEMS = 8;

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

/**
 * A4 2쪽(앞·뒤 양면 / 2쪽 모아찍기 겸용) 점수 없는 추억 활동 기록장
 * - 1쪽: 매칭 정체 공개 & 나의 활동 / 수호천사의 활동 타임라인
 * - 2쪽: 1단계·3단계 모든 편지(주고받은 편지 8통) & 손글씨 소감칸 & 수료 확인
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
  const showAngelIdentity = isIdentityRevealed(config);

  const allSentMissions = missions.filter(
    (m) => m.senderId === student.id && !m.isPostmasterNote
  );
  const allReceivedMissions = missions.filter((m) => m.receiverId === student.id);

  const sentMissions = allSentMissions.slice(0, MAX_TIMELINE_ITEMS);
  const receivedMissions = allReceivedMissions.slice(0, MAX_TIMELINE_ITEMS);

  const sentOverflowCount = Math.max(0, allSentMissions.length - sentMissions.length);
  const receivedOverflowCount = Math.max(
    0,
    allReceivedMissions.length - receivedMissions.length
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

  return (
    <>
      {/* ================================================================= */}
      {/* 1쪽: 우리의 수호천사 활동 기록 (나의 활동 + 수호천사의 활동)      */}
      {/* ================================================================= */}
      <div className="a4-page a4-workbook-page a4-page-break break-keep w-full max-w-[760px] mx-auto min-h-[1030px] bg-[#FCF9F2] border-2 border-[#3C1E1E] rounded-3xl p-5 text-[#2D201A] flex flex-col justify-between gap-2.5 shadow-sm">
        {/* 상단 히어로 배너 */}
        <header className="rounded-2xl bg-[#FEE500] border-2 border-[#3C1E1E] px-4 py-3 flex items-center justify-between gap-3">
          <div className="shrink-0 bg-white rounded-2xl border-2 border-[#3C1E1E] p-1">
            <SuhoHamster variant="welcome" angelStyle="boy" size={58} />
          </div>

          <div className="flex-1 min-w-0 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-white border border-[#3C1E1E]/35 rounded-full px-2.5 py-0.5 text-[10.5px] font-black text-[#3C1E1E]">
              <SuhoKakaoLogo size={14} />
              <span>{config.className} · 수호천사 활동 기록장 (1 / 2쪽)</span>
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
            <SuhoHamster variant="stamp" size={58} />
          </div>
        </header>

        {/* 매칭 정체 공개 + 선생님 칭찬 훈장(점수 미표시) */}
        <section className="space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-white border-2 border-[#E9D9AE] px-3.5 py-2.5 flex items-center gap-2.5">
              <div className="shrink-0 rounded-xl bg-[#FFFBEB] border border-[#F3DF9C] p-1">
                <SuhoHamster variant="stealth" angelStyle="boy" size={44} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10.5px] font-extrabold text-[#735020]">
                  내가 몰래 챙겨준 소중한 짝꿍
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

        {/* 중단 2열 타임라인: 나의 활동 vs 수호천사의 활동 */}
        <section className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          {/* 왼쪽: 내가 베푼 마음 (나의 활동) */}
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
              {sentMissions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs font-bold text-[#75675d] text-center py-8">
                  기록된 수호천사 활동이 없어요.
                </div>
              ) : (
                <>
                  {sentMissions.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl bg-[#FFFDF4] border border-[#F3DF9C] px-2.5 py-1.5 space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-black text-[#3C1E1E] inline-flex items-center gap-1">
                          <ActivityLineIcon type={m.type} className="w-3 h-3 text-[#B45309]" />
                          <span>{getActivityLabel(m.type)}</span>
                          <span className="font-semibold text-[#75675d]">· {m.createdAt}</span>
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold ${
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
                          짝꿍 답장: “{m.reply}”
                        </div>
                      )}
                    </div>
                  ))}
                  {sentOverflowCount > 0 && (
                    <div className="text-center text-[10px] font-bold text-[#735020] pt-0.5">
                      + 외 {sentOverflowCount}건의 따뜻한 활동이 더 있어요
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 오른쪽: 내가 받은 마음 (수호천사의 활동) */}
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
              {receivedMissions.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs font-bold text-[#75675d] text-center py-8">
                  수호천사에게 받은 활동 기록이 아직 없어요.
                </div>
              ) : (
                <>
                  {receivedMissions.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl bg-[#F5FAF7] border border-[#C6E2D1] px-2.5 py-1.5 space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-black text-[#1B4D3E] inline-flex items-center gap-1">
                          <ActivityLineIcon
                            type={m.type}
                            className="w-3 h-3 text-[#1B4D3E]"
                          />
                          <span>{getActivityLabel(m.type, m.isPostmasterNote)}</span>
                        </span>
                        <span className="font-semibold text-[#5E7467]">{m.createdAt}</span>
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
                  ))}
                  {receivedOverflowCount > 0 && (
                    <div className="text-center text-[10px] font-bold text-[#1B4D3E] pt-0.5">
                      + 외 {receivedOverflowCount}건의 활동이 더 있어요
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* 하단 1쪽 안내 바 */}
        <footer className="rounded-xl bg-[#3C1E1E] text-[#FCF9F2] px-4 py-2 flex items-center justify-between gap-2 text-[11px] font-bold">
          <span className="text-[#FEE500]">
            “작은 친절과 배려가 모여 따뜻한 우리 반을 만들었어요.”
          </span>
          <span className="text-[#E7DED0] shrink-0">
            2쪽에서 주고받은 비밀 편지를 읽어 보세요 →
          </span>
        </footer>
      </div>

      {/* ================================================================= */}
      {/* 2쪽: 주고받은 모든 비밀 편지함 + 손글씨 소감 + 수료 확인          */}
      {/* ================================================================= */}
      <div
        className={`a4-page a4-workbook-page break-keep w-full max-w-[760px] mx-auto min-h-[1030px] bg-[#FCF9F2] border-2 border-[#3C1E1E] rounded-3xl p-5 text-[#2D201A] flex flex-col justify-between gap-2.5 shadow-sm ${
          isPageBreak ? 'a4-page-break' : ''
        }`}
      >
        {/* 2쪽 상단 미니 헤더 */}
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
              2 / 2쪽
            </span>
            <SuhoHamster variant="heart" angelStyle="girl" size={38} />
          </div>
        </header>

        {/* 섹션 01: 1단계 첫 편지 & 첫 답장 (주고받은 4통 모두) */}
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
            {/* 1-1 내가 수호천사에게 보낸 첫 편지 */}
            <div className="rounded-xl bg-white border border-[#E9D9AE] px-3 py-2 min-h-[78px] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-[#735020] mb-1">
                <span>내가 수호천사에게 보낸 첫 편지</span>
                <span className="text-[#75675d] shrink-0">To. {angelDisplayName}</span>
              </div>
              <p className="text-[10.5px] text-[#2D201A] leading-snug whitespace-pre-wrap line-clamp-4 flex-1">
                {student.openingLetterToAngel?.trim() || '작성된 편지가 없어요.'}
              </p>
            </div>

            {/* 1-2 나의 수호천사가 나에게 보낸 첫 답장 */}
            <div className="rounded-xl bg-[#FFFDF4] border border-[#F3DF9C] px-3 py-2 min-h-[78px] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-[#B45309] mb-1">
                <span>수호천사가 보내준 첫 답장</span>
                <span className="text-[#735020] shrink-0">From. {angelDisplayName}</span>
              </div>
              <p className="text-[10.5px] text-[#2D201A] leading-snug whitespace-pre-wrap line-clamp-4 flex-1">
                {myAngel?.openingReplyToTarget?.trim() || '도착한 답장이 없어요.'}
              </p>
            </div>

            {/* 1-3 내 짝꿍이 나에게 보낸 첫 편지 */}
            <div className="rounded-xl bg-[#F5FAF7] border border-[#C6E2D1] px-3 py-2 min-h-[78px] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-[#1B4D3E] mb-1">
                <span>내 짝꿍이 보낸 첫 편지</span>
                <span className="text-[#4A6B57] shrink-0">From. {targetDisplayName}</span>
              </div>
              <p className="text-[10.5px] text-[#2D201A] leading-snug whitespace-pre-wrap line-clamp-4 flex-1">
                {myTarget?.openingLetterToAngel?.trim() || '작성된 편지가 없어요.'}
              </p>
            </div>

            {/* 1-4 내가 짝꿍에게 보낸 첫 답장 */}
            <div className="rounded-xl bg-white border border-[#E2D6C5] px-3 py-2 min-h-[78px] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-[#3C1E1E] mb-1">
                <span>내가 짝꿍에게 보낸 첫 답장</span>
                <span className="text-[#75675d] shrink-0">To. {targetDisplayName}</span>
              </div>
              <p className="text-[10.5px] text-[#2D201A] leading-snug whitespace-pre-wrap line-clamp-4 flex-1">
                {student.openingReplyToTarget?.trim() || '작성된 답장이 없어요.'}
              </p>
            </div>
          </div>
        </section>

        {/* 섹션 02: 3단계 정체 공개 & 감사 편지 (주고받은 4통 모두) */}
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
            {/* 3-1 수호천사가 나에게 보낸 정체 공개 편지 (받은 편지) */}
            <div className="rounded-2xl bg-[#FFFDF6] border-2 border-[#F3DF9C] p-3 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-1 border-b border-dashed border-[#E9D9AE] pb-1.5 mb-1.5 shrink-0">
                <span className="text-[11px] font-black text-[#3C1E1E]">
                  수호천사의 정체 공개 편지
                </span>
                <span className="text-[10px] font-bold text-[#B45309] shrink-0">
                  From. {angelDisplayName}
                </span>
              </div>
              <p className="text-[11px] text-[#2D201A] leading-relaxed whitespace-pre-wrap line-clamp-[7]">
                {(showAngelIdentity ? myAngel?.revealLetterToTarget?.trim() : '') ||
                  '아직 도착한 정체 공개 편지가 없어요.'}
              </p>
            </div>

            {/* 3-2 내 짝꿍이 나에게 보낸 감사 편지 (받은 편지) */}
            <div className="rounded-2xl bg-[#FFF9F8] border-2 border-[#F3D2CA] p-3 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-1 border-b border-dashed border-[#F3D2CA] pb-1.5 mb-1.5 shrink-0">
                <span className="text-[11px] font-black text-[#9F1239]">
                  내 짝꿍의 감사 편지
                </span>
                <span className="text-[10px] font-bold text-[#9F1239] shrink-0">
                  From. {targetDisplayName}
                </span>
              </div>
              <p className="text-[11px] text-[#2D201A] leading-relaxed whitespace-pre-wrap line-clamp-[7]">
                {(showAngelIdentity ? myTarget?.thankLetterToAngel?.trim() : '') ||
                  '아직 도착한 감사 편지가 없어요.'}
              </p>
            </div>

            {/* 3-3 내가 수호천사에게 보낸 감사 편지 (보낸 편지) */}
            <div className="rounded-2xl bg-white border-2 border-[#C6E2D1] p-3 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-1 border-b border-dashed border-[#C6E2D1] pb-1.5 mb-1.5 shrink-0">
                <span className="text-[11px] font-black text-[#1B4D3E]">
                  내가 수호천사에게 쓴 감사 편지
                </span>
                <span className="text-[10px] font-bold text-[#1B4D3E] shrink-0">
                  To. {angelDisplayName}
                </span>
              </div>
              <p className="text-[11px] text-[#2D201A] leading-relaxed whitespace-pre-wrap line-clamp-[7]">
                {student.thankLetterToAngel?.trim() ||
                  '수호천사에게 남긴 감사 편지가 없어요.'}
              </p>
            </div>

            {/* 3-4 내가 짝꿍에게 보낸 정체 공개 편지 (보낸 편지) */}
            <div className="rounded-2xl bg-white border-2 border-[#E2D6C5] p-3 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between gap-1 border-b border-dashed border-[#E2D6C5] pb-1.5 mb-1.5 shrink-0">
                <span className="text-[11px] font-black text-[#3C1E1E]">
                  내가 짝꿍에게 쓴 정체 공개 편지
                </span>
                <span className="text-[10px] font-bold text-[#735020] shrink-0">
                  To. {targetDisplayName}
                </span>
              </div>
              <p className="text-[11px] text-[#2D201A] leading-relaxed whitespace-pre-wrap line-clamp-[7]">
                {student.revealLetterToTarget?.trim() ||
                  '짝꿍에게 남긴 정체 공개 편지가 없어요.'}
              </p>
            </div>
          </div>
        </section>

        {/* 섹션 03: 손글씨 활동 소감 + 수료 확인 바 */}
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
    </>
  );
};
