import React, { useEffect, useState } from 'react';
import { SuhoHamster } from './SuhoHamster';
import { MailOpen, Sparkles, X } from 'lucide-react';

export interface ArrivedLetterData {
  id: string;
  theme: 'warm' | 'rose';
  arrivalTitle: string;
  badgeLabel: string;
  toLabel: string;
  fromLabel: string;
  content: string;
  hamsterVariant: 'welcome' | 'heart';
  startOpened?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface LetterArrivalModalProps {
  letter: ArrivedLetterData;
  onClose: () => void;
  onRead: () => void;
}

export const LetterArrivalModal: React.FC<LetterArrivalModalProps> = ({
  letter,
  onClose,
  onRead,
}) => {
  const [phase, setPhase] = useState<'sealed' | 'opening' | 'unfolded'>(() =>
    letter.startOpened ? 'unfolded' : 'sealed'
  );
  const dialog = React.useRef<HTMLDivElement>(null);
  const openTimer = React.useRef<number>();

  useEffect(() => {
    setPhase(letter.startOpened ? 'unfolded' : 'sealed');
    if (letter.startOpened) onRead();
    return () => window.clearTimeout(openTimer.current);
    // onRead belongs to the current letter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter]);

  useEffect(() => {
    const opener = document.activeElement;
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'opening') dialog.current?.focus({ preventScroll: true });
  }, [phase]);

  const handleOpenEnvelope = () => {
    if (phase !== 'sealed') return;
    const unfold = () => {
      setPhase('unfolded');
      onRead();
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      unfold();
      return;
    }
    setPhase('opening');
    openTimer.current = window.setTimeout(unfold, 340);
  };

  const isWarm = letter.theme === 'warm';

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={letter.arrivalTitle}
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        {phase !== 'unfolded' ? (
          /* 봉인된 편지 봉투 도착 화면 */
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-suho-reveal">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEE500] text-[#3C1E1E] text-xs font-black">
                <Sparkles className="w-3.5 h-3.5" />
                <span>편지가 도착했습니다!</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#F5F6F8] text-[#767676]"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-[#191919] leading-snug">
                {letter.arrivalTitle}
              </h2>
              <p className="text-xs font-bold text-[#767676]">
                봉투를 눌러 편지지를 펼쳐 보세요
              </p>
            </div>

            {/* 3D 느낌 봉투 일러스트 카드 */}
            <div className="py-2 flex justify-center">
              <button
                type="button"
                onClick={handleOpenEnvelope}
                className="group relative w-full max-w-[300px] h-[190px] rounded-2xl border-2 border-[#E5D200] bg-[#FFFBEB] shadow-lg overflow-hidden animate-envelope-float cursor-pointer focus:outline-none"
              >
                {/* 봉투 내부 크림 배경 */}
                <div className="absolute inset-x-4 top-3 bottom-3 rounded-xl bg-white border border-[#E7D8B9]" />

                {/* 삼각 봉투 덮개 (열릴 때 3D 회전) */}
                <div
                  style={{ perspective: '800px' }}
                  className="absolute inset-x-0 top-0 h-[106px] z-20"
                >
                  <div
                    className={`w-full h-full ${
                      phase === 'opening' ? 'animate-flap-open' : ''
                    }`}
                  >
                    <svg
                      viewBox="0 0 300 106"
                      className="w-full h-full drop-shadow-sm"
                      preserveAspectRatio="none"
                    >
                      <polygon
                        points="0,0 300,0 150,104"
                        fill={isWarm ? '#FEE500' : '#FFE4E6'}
                        stroke={isWarm ? '#E5C800' : '#FDA4AF'}
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>

                {/* 중앙 수호햄찌 실링 스탬프 */}
                <div className="relative z-30 flex flex-col items-center justify-center h-full pt-5 gap-1.5">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-[#E5D200] shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
                    <SuhoHamster variant={letter.hamsterVariant} size={52} />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/95 border border-[#E7D8B9] text-xs font-black text-[#3C1E1E] shadow-xs">
                    From. {letter.fromLabel}
                  </div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenEnvelope}
              className="w-full py-3.5 rounded-xl bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-sm font-black inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MailOpen className="w-4 h-4" strokeWidth={2.4} />
              <span>봉투 열어서 편지 읽기</span>
            </button>
          </div>
        ) : (
          /* 펼쳐진 줄무늬 편지지 모달 */
          <div
            className={`rounded-3xl border shadow-2xl overflow-hidden max-h-[88vh] flex flex-col animate-letter-unfold ${
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
                  <SuhoHamster variant={letter.hamsterVariant} size={40} />
                </div>
                <div className="min-w-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-black ${
                      isWarm
                        ? 'bg-[#FEE500] text-[#3C1E1E]'
                        : 'bg-[#FFE4E6] text-[#9F1239]'
                    }`}
                  >
                    {letter.badgeLabel}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-[#2B2118] truncate mt-0.5">
                    To. {letter.toLabel}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-black/5 text-[#767676] shrink-0"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 펼쳐진 편지지 본문 */}
            <div
              className={`flex-1 overflow-y-auto px-5 sm:px-7 py-4 min-h-[210px] ${
                isWarm ? 'letter-paper-warm' : 'letter-paper-rose'
              }`}
            >
              <p className="text-sm sm:text-[15px] font-medium text-[#2B2118] whitespace-pre-wrap leading-[32px]">
                {letter.content}
              </p>
            </div>

            {/* 편지지 서명 & 하단 버튼 */}
            <div
              className={`px-5 sm:px-6 py-4 border-t border-dashed space-y-3 shrink-0 ${
                isWarm
                  ? 'border-[#E7D8B9] bg-[#FFF9EB]'
                  : 'border-[#F3D2CA] bg-[#FFF4F1]'
              }`}
            >
              <div className="flex items-center justify-between text-xs sm:text-sm font-black text-[#3C1E1E]">
                <span className="text-xs font-medium text-[#8C7A65]">
                  수호톡 비밀 우체통
                </span>
                <div className="flex items-center gap-1.5">
                  <span>From. {letter.fromLabel}</span>
                  <span className="w-6 h-6 rounded-full bg-[#FEE500] border border-[#D97706]/50 inline-flex items-center justify-center text-xs">
                    ✦
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {letter.actionLabel && letter.onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      letter.onAction?.();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#3C1E1E] hover:bg-black text-[#FEE500] text-xs font-black"
                  >
                    {letter.actionLabel}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs sm:text-sm font-black"
                >
                  소중히 간직하기 (닫기)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
