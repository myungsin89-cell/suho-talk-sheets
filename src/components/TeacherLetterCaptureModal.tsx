import React, { useEffect, useMemo, useState } from 'react';
import { Student } from '../types';
import {
  findPairedLetterRecord,
  formatStudentLabel,
  maskTextNames,
  TeacherLetterRecord,
} from '../utils/teacherRecords';
import { SuhoHamster } from './SuhoHamster';
import {
  ArrowLeftRight,
  Copy,
  Eye,
  EyeOff,
  MailOpen,
  Users,
  X,
} from 'lucide-react';

interface TeacherLetterCaptureModalProps {
  letter: TeacherLetterRecord;
  students: Student[];
  anonymize: boolean;
  onToggleAnonymize: () => void;
  onClose: () => void;
  onNotice: (msg: string) => void;
}

export const TeacherLetterCaptureModal: React.FC<TeacherLetterCaptureModalProps> = ({
  letter,
  students,
  anonymize,
  onToggleAnonymize,
  onClose,
  onNotice,
}) => {
  const [showPair, setShowPair] = useState(false);
  const [studentScreenStyle, setStudentScreenStyle] = useState(true);

  useEffect(() => {
    setShowPair(false);
  }, [letter.id]);

  const pairedLetter = useMemo(
    () => findPairedLetterRecord(letter, students),
    [letter, students]
  );

  const displayedLetters = useMemo(() => {
    if (!showPair || !pairedLetter) return [letter];

    if (letter.stage === 1) {
      return letter.kind === 'opening_letter'
        ? [letter, pairedLetter]
        : [pairedLetter, letter];
    }

    return letter.kind === 'reveal_letter'
      ? [letter, pairedLetter]
      : [pairedLetter, letter];
  }, [letter, pairedLetter, showPair]);

  const resolveCardMeta = (rec: TeacherLetterRecord) => {
    const senderLabel = formatStudentLabel(rec.sender, anonymize);
    const receiverLabel = formatStudentLabel(rec.receiver, anonymize);

    if (rec.kind === 'opening_letter') {
      return {
        theme: 'warm' as const,
        hamsterVariant: 'welcome' as const,
        badgeLabel: '친구의 첫 편지',
        toLabel: studentScreenStyle
          ? '나의 수호천사'
          : `${receiverLabel} (수호천사)`,
        fromLabel: studentScreenStyle ? '내가 챙겨줄 친구' : senderLabel,
      };
    }

    if (rec.kind === 'opening_reply') {
      return {
        theme: 'rose' as const,
        hamsterVariant: 'heart' as const,
        badgeLabel: '수호천사의 첫 답장',
        toLabel: receiverLabel,
        fromLabel: studentScreenStyle
          ? '나의 비밀 수호천사'
          : `${senderLabel} (수호천사)`,
      };
    }

    if (rec.kind === 'reveal_letter') {
      return {
        theme: 'warm' as const,
        hamsterVariant: 'heart' as const,
        badgeLabel: '정체 공개 마지막 편지',
        toLabel: receiverLabel,
        fromLabel: `${senderLabel} (나의 수호천사)`,
      };
    }

    return {
      theme: 'rose' as const,
      hamsterVariant: 'welcome' as const,
      badgeLabel: '마지막 감사 답장',
      toLabel: `${receiverLabel} (수호천사)`,
      fromLabel: `${senderLabel} (내가 챙겨준 친구)`,
    };
  };

  const handleCopyText = async () => {
    const blocks = displayedLetters.map((rec) => {
      const meta = resolveCardMeta(rec);
      const body = maskTextNames(rec.content, students, anonymize);
      return `[${rec.kindLabel} · ${meta.badgeLabel}]\nTo. ${meta.toLabel}\n${body}\nFrom. ${meta.fromLabel}`;
    });

    try {
      await navigator.clipboard.writeText(blocks.join('\n\n---\n\n'));
      onNotice(
        displayedLetters.length > 1
          ? '보낸 편지와 답장 내용을 복사했습니다.'
          : '편지 내용을 복사했습니다.'
      );
    } catch {
      onNotice('클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 no-print"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="학생 편지지 보기"
        className={`w-full max-h-[94vh] flex flex-col gap-3 ${
          displayedLetters.length > 1 ? 'max-w-5xl' : 'max-w-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 캡처 편지 바깥 상단 컨트롤 바 (편지지 캡처 시 깔끔하게 분리) */}
        <div className="bg-white/95 backdrop-blur rounded-2xl border border-[#E5E7EB] px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#191919]">
            <MailOpen className="w-4 h-4 text-[#D97706]" />
            <span>학생 편지지 보기 · 잠입 확인 (학생 알림 영향 없음)</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {pairedLetter && (
              <button
                type="button"
                aria-pressed={showPair}
                onClick={() => setShowPair((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border inline-flex items-center gap-1.5 transition-colors ${
                  showPair
                    ? 'bg-[#FEE500] text-[#3C1E1E] border-[#3C1E1E]'
                    : 'bg-[#F5F6F8] hover:bg-gray-200 text-[#191919] border-[#E5E7EB]'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{showPair ? '이 편지만 보기' : '답장과 나란히 보기'}</span>
              </button>
            )}

            {letter.stage === 1 && (
              <button
                type="button"
                aria-pressed={!studentScreenStyle}
                onClick={() => setStudentScreenStyle((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border inline-flex items-center gap-1.5 transition-colors ${
                  !studentScreenStyle
                    ? 'bg-[#FFF5D6] text-[#735020] border-[#d7bc64]'
                    : 'bg-[#F5F6F8] hover:bg-gray-200 text-[#191919] border-[#E5E7EB]'
                }`}
                title="학생 화면 그대로의 비밀 호칭과 실제 친구 이름 표기를 전환합니다"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{studentScreenStyle ? '학생 화면 표기' : '친구 이름 함께 표기'}</span>
              </button>
            )}

            <button
              type="button"
              aria-pressed={anonymize}
              onClick={onToggleAnonymize}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border inline-flex items-center gap-1.5 transition-colors ${
                anonymize
                  ? 'bg-[#3C1E1E] text-[#FEE500] border-[#3C1E1E]'
                  : 'bg-[#F5F6F8] hover:bg-gray-200 text-[#191919] border-[#E5E7EB]'
              }`}
            >
              {anonymize ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>익명 보기</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>실명 보기</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 border border-[#E5E7EB] text-xs font-extrabold text-[#191919] inline-flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>복사</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#F5F6F8] text-[#191919]"
              aria-label="편지지 보기 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 학생 화면과 동일한 줄무늬 편지지 카드 영역 */}
        <div className="overflow-y-auto pr-1">
          <div
            className={`grid gap-4 items-stretch ${
              displayedLetters.length > 1
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {displayedLetters.map((rec, idx) => {
              const meta = resolveCardMeta(rec);
              const isWarm = meta.theme === 'warm';
              const bodyText = maskTextNames(rec.content, students, anonymize);

              return (
                <div key={rec.id} className="flex flex-col gap-1.5">
                  {displayedLetters.length > 1 && (
                    <div className="px-1 text-xs font-black text-[#FEE500]">
                      {idx === 0 ? '1. 보낸 편지' : '2. 돌아온 답장'} · {rec.kindLabel}
                    </div>
                  )}

                  <div
                    className={`rounded-3xl border shadow-2xl overflow-hidden flex-1 flex flex-col ${
                      isWarm
                        ? 'border-[#E7D8B9] bg-[#FFFDF7]'
                        : 'border-[#F3D2CA] bg-[#FFFBF9]'
                    }`}
                  >
                    {/* 상단 장식 리본 */}
                    <div
                      className={`h-2 w-full shrink-0 ${
                        isWarm
                          ? 'bg-gradient-to-r from-[#FEE500] via-[#FDE68A] to-[#F59E0B]'
                          : 'bg-gradient-to-r from-[#FDE68A] via-[#FDA4AF] to-[#FEE500]'
                      }`}
                    />

                    {/* 편지지 상단 헤더 */}
                    <div
                      className={`px-5 sm:px-6 py-4 border-b border-dashed flex items-center justify-between gap-3 shrink-0 ${
                        isWarm
                          ? 'border-[#E7D8B9] bg-[#FFF9EB]'
                          : 'border-[#F3D2CA] bg-[#FFF4F1]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl border bg-white flex items-center justify-center shrink-0 ${
                            isWarm ? 'border-[#E7D8B9]' : 'border-[#F3D2CA]'
                          }`}
                        >
                          <SuhoHamster variant={meta.hamsterVariant} size={40} />
                        </div>
                        <div className="min-w-0">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-black ${
                              isWarm
                                ? 'bg-[#FEE500] text-[#3C1E1E]'
                                : 'bg-[#FFE4E6] text-[#9F1239]'
                            }`}
                          >
                            {meta.badgeLabel}
                          </span>
                          <h3 className="text-sm sm:text-base font-black text-[#2B2118] truncate mt-0.5">
                            To. {meta.toLabel}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* 편지지 줄무늬 본문 */}
                    <div
                      className={`flex-1 px-5 sm:px-7 py-4 min-h-[220px] ${
                        isWarm ? 'letter-paper-warm' : 'letter-paper-rose'
                      }`}
                    >
                      <p className="text-sm sm:text-[15px] font-medium text-[#2B2118] whitespace-pre-wrap leading-[32px]">
                        {bodyText}
                      </p>
                    </div>

                    {/* 편지지 서명 푸터 */}
                    <div
                      className={`px-5 sm:px-6 py-3.5 border-t border-dashed shrink-0 flex items-center justify-between text-xs sm:text-sm font-black text-[#3C1E1E] ${
                        isWarm
                          ? 'border-[#E7D8B9] bg-[#FFF9EB]'
                          : 'border-[#F3D2CA] bg-[#FFF4F1]'
                      }`}
                    >
                      <span className="text-xs font-medium text-[#8C7A65]">
                        수호톡 비밀 우체통
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span>From. {meta.fromLabel}</span>
                        <span className="w-6 h-6 rounded-full bg-[#FEE500] border border-[#D97706]/50 inline-flex items-center justify-center text-xs">
                          ✦
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
