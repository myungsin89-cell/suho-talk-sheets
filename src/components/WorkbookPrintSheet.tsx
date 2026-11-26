import React from 'react';
import { ActivityType, ClassConfig, MissionLog, Student } from '../types';
import {
  calculateStudentScore,
  findGuardianAngelOf,
  findTargetPartnerOf,
} from '../utils/scoring';
import { SuhoHamster, SuhoKakaoLogo } from './SuhoHamster';
import { getScoreStage, isIdentityRevealed } from '../utils/classProgress';
import {
  Award,
  CheckCircle2,
  EyeOff,
  HeartHandshake,
  Mail,
  MessageCircle,
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

/**
 * A4 1장 활동 기록장 (화면 미리보기 및 @media print 인쇄 겸용)
 */
export const WorkbookPrintSheet: React.FC<WorkbookPrintSheetProps> = ({
  student,
  students,
  missions,
  config,
  isPageBreak = false,
}) => {
  const score = calculateStudentScore(student.id, students, missions, getScoreStage(config));
  const myAngel = findGuardianAngelOf(student.id, students);
  const myTarget = findTargetPartnerOf(student.id, students);

  const sentMissions = missions
    .filter((m) => m.senderId === student.id && !m.isPostmasterNote)
    .slice(0, 5);

  const receivedMissions = missions
    .filter((m) => m.receiverId === student.id)
    .slice(0, 5);

  const showAngelIdentity = isIdentityRevealed(config);
  const letterFromMyAngel = showAngelIdentity ? myAngel?.revealLetterToTarget || '' : '';

  return (
    <div
      className={`a4-page bg-white border-2 border-[#191919] rounded-3xl p-6 text-[#191919] ${
        isPageBreak ? 'a4-page-break' : ''
      }`}
    >
      {/* 1. 상단: 타이틀 & 스탬프 & 학생 요약 & 점수표 & 받은 훈장 */}
      <div className="border-b-2 border-dashed border-[#D1D5DB] pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SuhoKakaoLogo size={42} />
            <div>
              <div className="text-[11px] font-bold tracking-wider text-[#767676]">
                {config.className} · 수호천사 활동 기록
              </div>
              <h1 className="text-xl font-black text-[#191919] tracking-tight">
                수호톡 나의 수호천사 활동 기록장
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEE500] text-[#3C1E1E]">
                {student.number}번 학생
              </span>
              <div className="text-lg font-black text-[#191919] mt-0.5">
                {student.name}{' '}
                <span className="text-sm font-extrabold text-[#D97706]">
                  (총 {score.totalScore}점)
                </span>
              </div>
            </div>
            <SuhoHamster variant="stamp" size={62} className="shrink-0" />
          </div>
        </div>

        {/* 학생 매칭 정보 + 점수 요약 바 */}
        <div className="grid grid-cols-12 gap-2.5 mt-2.5 text-xs">
          <div className="col-span-5 bg-[#F5F6F8] border border-[#E5E7EB] rounded-2xl px-3.5 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-[#767676]">
                내가 몰래 챙겨준 짝꿍
              </div>
              <div className="font-bold text-sm text-[#191919]">
                {myTarget ? `${myTarget.number}번 ${myTarget.name}` : '미지정'}
              </div>
            </div>
            <div className="h-6 w-[1px] bg-[#D1D5DB] mx-2" />
            <div className="text-right">
              <div className="text-[10px] font-semibold text-[#767676]">
                나를 챙겨준 수호천사
              </div>
              <div className="font-bold text-sm text-[#191919]">
                {showAngelIdentity && myAngel
                  ? `${myAngel.number}번 ${myAngel.name}`
                  : myAngel
                  ? `비밀 수호천사 (${myAngel.name})`
                  : '미지정'}
              </div>
            </div>
          </div>

          <div className="col-span-7 bg-white border border-[#E5E7EB] rounded-2xl px-3 py-2 grid grid-cols-5 gap-1 text-center">
            <div>
              <div className="text-[10px] text-[#767676] font-medium">
                활동 인증({score.verifiedSentCount})
              </div>
              <div className="font-extrabold text-[#191919]">
                +{score.activitySubtotal}점
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#767676] font-medium">
                첫 편지·답장
              </div>
              <div className="font-extrabold text-[#191919]">
                +{score.openingLetterBonus}점
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#767676] font-medium">
                선생님 훈장({score.medalCount})
              </div>
              <div className="font-extrabold text-[#D97706]">
                +{score.medalPoints}점
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#767676] font-medium">
                추리/은신
              </div>
              <div className="font-extrabold text-[#191919]">
                +{score.guessBonus + score.stealthMasterBonus}점
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#767676] font-medium">
                마지막 편지
              </div>
              <div className="font-extrabold text-[#D97706]">
                +{score.letterBonus}점
              </div>
            </div>
          </div>
        </div>

        {/* 선생님 수여 영예의 훈장 라인 */}
        <div className="mt-2 flex items-center justify-between bg-[#F5F6F8] border border-[#E5E7EB] rounded-2xl px-3 py-1.5 gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#191919] shrink-0">
            <Award className="w-3.5 h-3.5 text-[#D97706]" strokeWidth={2} />
            <span>선생님 수여 영예의 훈장 ({(student.medals || []).length}개)</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {(student.medals || []).length === 0 ? (
              <span className="text-[10px] text-[#767676]">수여된 훈장 없음</span>
            ) : (
              (student.medals || []).map((medal) => (
                <span
                  key={medal.id}
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-[#FEE500] text-[#3C1E1E] border-[#E5D200] flex items-center gap-1"
                >
                  <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.2} />
                  {medal.title} (+{medal.points}점)
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. 중단: 좌측 [내가 수행한 미션] / 우측 [수호천사에게 받은 미션] */}
      <div className="grid grid-cols-2 gap-3 my-2.5 flex-1 min-h-0">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 font-extrabold text-xs text-[#191919]">
              <Send className="w-3.5 h-3.5 text-[#3C1E1E]" strokeWidth={2} />
              <span>내가 수행한 미션 (베푼 마음)</span>
            </div>
            <span className="text-[10px] font-semibold text-[#767676]">
              총 {missions.filter((m) => m.senderId === student.id).length}건
            </span>
          </div>

          <div className="space-y-1.5 flex-1 overflow-hidden">
            {sentMissions.length === 0 ? (
              <div className="text-xs text-gray-400 py-8 text-center">
                기록된 수호천사 미션이 없습니다.
              </div>
            ) : (
              sentMissions.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-2 text-[11px]"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[#3C1E1E] flex items-center gap-1">
                      <ActivityLineIcon type={m.type} className="w-3 h-3" />
                      {getActivityLabel(m.type)} (+{m.points}점)
                    </span>
                    <span className="text-[10px] font-semibold text-[#767676]">
                      {m.status === 'verified' ? '승인 완료' : '승인 대기'}
                    </span>
                  </div>
                  <p className="text-[#191919] leading-snug line-clamp-2">{m.content}</p>
                  {m.reply && (
                    <div className="mt-1 bg-white rounded-lg px-2 py-1 text-[10px] text-[#191919] font-medium border border-[#E5E7EB]">
                      짝꿍 한마디: “{m.reply}”
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1.5 mb-2">
            <div className="flex items-center gap-1.5 font-extrabold text-xs text-[#191919]">
              <Mail className="w-3.5 h-3.5 text-[#D97706]" strokeWidth={2} />
              <span>수호천사에게 받은 미션 (받은 마음)</span>
            </div>
            <span className="text-[10px] font-semibold text-[#767676]">
              총 {missions.filter((m) => m.receiverId === student.id).length}건
            </span>
          </div>

          <div className="space-y-1.5 flex-1 overflow-hidden">
            {receivedMissions.length === 0 ? (
              <div className="text-xs text-gray-400 py-8 text-center">
                아직 받은 미션이 없습니다.
              </div>
            ) : (
              receivedMissions.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl p-2 text-[11px]"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[#191919] flex items-center gap-1">
                      <ActivityLineIcon type={m.type} className="w-3 h-3 text-[#D97706]" />
                      {getActivityLabel(m.type, m.isPostmasterNote)}
                    </span>
                    <span className="text-[10px] font-semibold text-[#767676]">
                      {m.createdAt}
                    </span>
                  </div>
                  <p className="text-[#191919] leading-snug line-clamp-2">{m.content}</p>
                  {m.reply && (
                    <div className="mt-1 bg-[#FEE500]/60 rounded-lg px-2 py-1 text-[10px] text-[#3C1E1E] font-medium">
                      내가 남긴 한마디: “{m.reply}”
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. 하단: 마지막 날 주고받은 마음의 편지함 */}
      <div className="border-t-2 border-dashed border-[#D1D5DB] pt-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#191919]">
            <MessageCircle className="w-3.5 h-3.5 text-[#3C1E1E]" strokeWidth={2} />
            <span>마지막 날 주고받은 마음의 편지함</span>
          </div>
          <span className="text-[10px] text-[#767676] font-semibold">
            수호톡 활동 기록장
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-2xl p-3 relative min-h-[96px] flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-extrabold text-[#191919] mb-1 flex items-center justify-between">
                <span>To. 나를 몰래 챙겨준 수호천사에게 (감사 편지)</span>
                <span className="text-[10px] text-[#767676]">From. {student.name}</span>
              </div>
              <p className="text-[11px] text-[#191919] leading-relaxed whitespace-pre-wrap">
                {student.thankLetterToAngel ||
                  '아직 작성된 감사 편지가 없습니다. 그동안 나를 챙겨준 수호천사에게 따뜻한 마음을 전해보세요.'}
              </p>
            </div>
          </div>

          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-3 relative min-h-[96px] flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-extrabold text-[#3C1E1E] mb-1 flex items-center justify-between">
                <span>
                  To. 나의 소중한 짝꿍 {myTarget ? myTarget.name : ''}에게 (정체 공개 편지)
                </span>
                <span className="text-[10px] text-[#767676]">
                  수호천사 {student.name}
                </span>
              </div>
              <p className="text-[11px] text-[#191919] leading-relaxed whitespace-pre-wrap">
                {student.revealLetterToTarget ||
                  letterFromMyAngel ||
                  '아직 작성된 정체 공개 편지가 없습니다. 짝꿍에게 정체를 밝히며 따뜻한 인사를 남겨보세요.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
