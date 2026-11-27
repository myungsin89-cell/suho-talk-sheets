import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClassConfig, MissionLog, Student } from '../types';
import { getScoreStage } from '../utils/classProgress';
import { calculateStudentScore } from '../utils/scoring';
import { formatStudentLabel } from '../utils/teacherRecords';
import { SuhoHamster } from './SuhoHamster';
import {
  Award,
  Crown,
  Eye,
  EyeOff,
  Maximize2,
  Medal,
  Minimize2,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

interface LeaderboardModalProps {
  students: Student[];
  missions: MissionLog[];
  config: ClassConfig;
  anonymize: boolean;
  onToggleAnonymize: () => void;
  onClose: () => void;
}

type TopLimit = 5 | 10 | 'all';

interface RankedEntry {
  student: Student;
  rank: number;
  totalScore: number;
  verifiedCount: number;
  medalCount: number;
  activitySubtotal: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  students,
  missions,
  config,
  anonymize,
  onToggleAnonymize,
  onClose,
}) => {
  const [topLimit, setTopLimit] = useState<TopLimit>(5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } catch {
        // Fallback to full-viewport CSS mode if browser blocks native fullscreen.
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch {
        // ignore exitFullscreen errors
      }
    }
  };

  const scoreStage = getScoreStage(config);

  const { ranked, totalVerifiedMissions, totalMedals, totalClassScore } =
    useMemo(() => {
      const items = students.map((stu) => {
        const s = calculateStudentScore(stu.id, students, missions, scoreStage);
        return {
          student: stu,
          totalScore: s.totalScore,
          verifiedCount: s.verifiedSentCount,
          medalCount: s.medalCount,
          activitySubtotal: s.activitySubtotal,
        };
      });

      items.sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.verifiedCount !== a.verifiedCount)
          return b.verifiedCount - a.verifiedCount;
        return a.student.number - b.student.number;
      });

      const withRank: RankedEntry[] = [];
      let currentRank = 1;
      for (let i = 0; i < items.length; i++) {
        if (i > 0 && items[i].totalScore < items[i - 1].totalScore) {
          currentRank = i + 1;
        }
        withRank.push({
          ...items[i],
          rank: currentRank,
        });
      }

      return {
        ranked: withRank,
        totalVerifiedMissions: items.reduce((sum, x) => sum + x.verifiedCount, 0),
        totalMedals: items.reduce((sum, x) => sum + x.medalCount, 0),
        totalClassScore: items.reduce((sum, x) => sum + x.totalScore, 0),
      };
    }, [students, missions, scoreStage]);

  const visibleList =
    topLimit === 'all' ? ranked : ranked.slice(0, topLimit);

  const topThree = ranked.slice(0, 3);
  const maxScore = Math.max(1, ranked[0]?.totalScore || 1);

  return (
    <div
      className={`fixed inset-0 z-[65] bg-black/55 backdrop-blur-[2px] flex items-center justify-center no-print ${
        isFullscreen ? 'p-0' : 'p-3 sm:p-5'
      }`}
      onClick={isFullscreen ? undefined : onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="우리 반 수호천사 명예의 전당"
        className={`bg-[#FCF9F2] flex flex-col overflow-hidden ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none border-0'
            : 'border-2 border-[#3C1E1E] rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="bg-[#FEE500] border-b-2 border-[#3C1E1E] px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white border-2 border-[#3C1E1E] flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-[#D97706]" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black text-[#3C1E1E]/80">
                {config.className} · 실시간 활동 독려판 (비밀 정체 비공개)
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#3C1E1E] truncate">
                우리 반 수호천사 명예의 전당
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center bg-white/90 border border-[#3C1E1E]/25 rounded-lg p-0.5 gap-0.5">
              {(
                [
                  { id: 5, label: 'TOP 5' },
                  { id: 10, label: 'TOP 10' },
                  { id: 'all', label: `전체 (${students.length})` },
                ] as { id: TopLimit; label: string }[]
              ).map((opt) => (
                <button
                  key={String(opt.id)}
                  type="button"
                  onClick={() => setTopLimit(opt.id)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-black transition-colors ${
                    topLimit === opt.id
                      ? 'bg-[#3C1E1E] text-[#FEE500]'
                      : 'text-[#3C1E1E] hover:bg-[#FFF5D6]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-pressed={anonymize}
              onClick={onToggleAnonymize}
              className={`px-3 py-1.5 rounded-lg text-xs font-black border inline-flex items-center gap-1 transition-colors ${
                anonymize
                  ? 'bg-[#3C1E1E] text-[#FEE500] border-[#3C1E1E]'
                  : 'bg-white text-[#3C1E1E] border-[#3C1E1E]/25 hover:bg-[#FFF5D6]'
              }`}
              title="발표 자료 캡처 시 학생 이름을 익명으로 가립니다"
            >
              {anonymize ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>익명</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>실명</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="px-3 py-1.5 rounded-lg bg-white text-[#3C1E1E] border border-[#3C1E1E]/25 hover:bg-[#FFF5D6] text-xs font-black inline-flex items-center gap-1"
              title={isFullscreen ? '원래 크기로 돌아가기' : '전자칠판·TV용 전체화면으로 보기'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>창 축소</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>전체화면</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[#3C1E1E]"
              aria-label="명예의 전당 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 ${
            isFullscreen ? 'max-w-6xl w-full mx-auto' : ''
          }`}
        >
          {/* 학급 전체 공동 응원 지표 */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-white rounded-xl border border-[#E7DED0] p-3">
              <div className="text-[11px] font-bold text-[#75675D]">
                우리 반 누적 점수
              </div>
              <div className="text-lg sm:text-xl font-black text-[#3C1E1E] mt-0.5">
                {totalClassScore.toLocaleString()}점
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E7DED0] p-3">
              <div className="text-[11px] font-bold text-[#75675D]">
                인증된 비밀 선행
              </div>
              <div className="text-lg sm:text-xl font-black text-[#1B4D3E] mt-0.5">
                총 {totalVerifiedMissions}건
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E7DED0] p-3">
              <div className="text-[11px] font-bold text-[#75675D]">
                선생님 수여 훈장
              </div>
              <div className="text-lg sm:text-xl font-black text-[#B45309] mt-0.5">
                총 {totalMedals}개
              </div>
            </div>
          </div>

          {ranked.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E7DED0] p-10 text-center text-sm font-bold text-[#767676]">
              아직 등록된 학생이 없습니다.
            </div>
          ) : (
            <>
              {/* TOP 3 시상대 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topThree.map((entry, idx) => {
                  const isFirst = idx === 0;
                  const isSecond = idx === 1;
                  const cardTone = isFirst
                    ? 'bg-gradient-to-b from-[#FFF5D6] to-white border-2 border-[#D97706]'
                    : isSecond
                    ? 'bg-white border-2 border-[#9CA3AF]'
                    : 'bg-white border-2 border-[#D97706]/40';

                  return (
                    <div
                      key={entry.student.id}
                      className={`rounded-2xl p-4 text-center flex flex-col items-center gap-2 shadow-xs ${cardTone}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isFirst ? (
                          <Crown className="w-5 h-5 text-[#D97706]" />
                        ) : (
                          <Medal
                            className={`w-5 h-5 ${
                              isSecond ? 'text-[#6B7280]' : 'text-[#B45309]'
                            }`}
                          />
                        )}
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FEE500] text-[#3C1E1E]">
                          {entry.rank}위
                        </span>
                      </div>

                      <SuhoHamster
                        variant={isFirst ? 'power' : isSecond ? 'quest' : 'heart'}
                        angelStyle={idx % 2 === 0 ? 'girl' : 'boy'}
                        size={64}
                      />

                      <div>
                        <div className="text-base font-black text-[#191919]">
                          {formatStudentLabel(entry.student, anonymize)}
                        </div>
                        <div className="text-xl font-black text-[#B45309] mt-0.5">
                          {entry.totalScore}점
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-bold text-[#685852]">
                        <span className="px-2 py-0.5 rounded-md bg-[#F5F6F8]">
                          활동 {entry.verifiedCount}회
                        </span>
                        {entry.medalCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FFF5D6] text-[#735020]">
                            훈장 {entry.medalCount}개
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 순위 리스트 */}
              <div className="bg-white rounded-2xl border border-[#E7DED0] divide-y divide-[#F0F1F4] overflow-hidden">
                {visibleList.map((entry) => {
                  const pct = Math.max(
                    6,
                    Math.round((entry.totalScore / maxScore) * 100)
                  );
                  return (
                    <div
                      key={entry.student.id}
                      className="px-4 py-3 flex items-center gap-3 sm:gap-4"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                          entry.rank === 1
                            ? 'bg-[#FEE500] text-[#3C1E1E] border border-[#3C1E1E]'
                            : entry.rank <= 3
                            ? 'bg-[#FFF5D6] text-[#735020] border border-[#E9D9AE]'
                            : 'bg-[#F5F6F8] text-[#767676]'
                        }`}
                      >
                        {entry.rank}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm sm:text-base font-black text-[#191919] truncate">
                            {formatStudentLabel(entry.student, anonymize)}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#767676]">
                              <Sparkles className="w-3 h-3 text-[#D97706]" />
                              활동 {entry.verifiedCount}회
                            </span>
                            {entry.medalCount > 0 && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#B45309]">
                                <Award className="w-3 h-3" />
                                {entry.medalCount}
                              </span>
                            )}
                            <span className="text-sm sm:text-base font-black text-[#3C1E1E]">
                              {entry.totalScore}점
                            </span>
                          </div>
                        </div>

                        <div className="h-2 w-full rounded-full bg-[#F5F6F8] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              entry.rank === 1
                                ? 'bg-[#FEE500]'
                                : entry.rank <= 3
                                ? 'bg-[#F59E0B]'
                                : 'bg-[#1B4D3E]/70'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
