import React, { useMemo, useState } from 'react';
import { ClassConfig, MissionLog, Student } from '../types';
import { getScoreStage } from '../utils/classProgress';
import {
  calculateStudentScore,
  findGuardianAngelOf,
  findTargetPartnerOf,
} from '../utils/scoring';
import {
  formatStudentLabel,
  formatStudentRecordSummaryText,
  getActivityTypeLabel,
  getMissionStatusLabel,
  makeLetterRecord,
  maskTextNames,
  TeacherLetterRecord,
} from '../utils/teacherRecords';
import { HonorMedalIcon } from './HonorMedalIcon';
import { ActivityLineIcon } from './WorkbookPrintSheet';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  EyeOff,
  HeartHandshake,
  Mail,
  MailOpen,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

interface StudentRecordModalProps {
  student: Student;
  students: Student[];
  missions: MissionLog[];
  config: ClassConfig;
  anonymize: boolean;
  onToggleAnonymize: () => void;
  onSelectStudent: (studentId: string) => void;
  onOpenLetterCapture: (record: TeacherLetterRecord) => void;
  onClose: () => void;
  onNotice: (msg: string) => void;
}

type RecordSectionFilter = 'all' | 'letters' | 'sent' | 'received';

const STATUS_BADGE_CLASS: Record<MissionLog['status'], string> = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-[#FEE500]/70 text-[#3C1E1E] border-[#E5D200]',
  hold: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const StudentRecordModal: React.FC<StudentRecordModalProps> = ({
  student,
  students,
  missions,
  config,
  anonymize,
  onToggleAnonymize,
  onSelectStudent,
  onOpenLetterCapture,
  onClose,
  onNotice,
}) => {
  const [sectionFilter, setSectionFilter] = useState<RecordSectionFilter>('all');

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.number - b.number),
    [students]
  );

  const currentIdx = sortedStudents.findIndex((s) => s.id === student.id);
  const prevStudent =
    sortedStudents.length > 1 && currentIdx >= 0
      ? sortedStudents[
          (currentIdx - 1 + sortedStudents.length) % sortedStudents.length
        ]
      : null;
  const nextStudent =
    sortedStudents.length > 1 && currentIdx >= 0
      ? sortedStudents[(currentIdx + 1) % sortedStudents.length]
      : null;

  const studentById = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );

  const myTarget = findTargetPartnerOf(student.id, students);
  const myAngel = findGuardianAngelOf(student.id, students);
  const guessedStu = student.guessedAngelId
    ? studentById.get(student.guessedAngelId)
    : undefined;

  const score = calculateStudentScore(
    student.id,
    students,
    missions,
    getScoreStage(config)
  );

  const sentMissions = useMemo(
    () =>
      missions
        .filter((m) => m.senderId === student.id && !m.isPostmasterNote)
        .reverse(),
    [missions, student.id]
  );

  const receivedMissions = useMemo(
    () => missions.filter((m) => m.receiverId === student.id).reverse(),
    [missions, student.id]
  );

  const writtenLettersCount = [
    student.openingLetterToAngel,
    student.openingReplyToTarget,
    student.thankLetterToAngel,
    student.revealLetterToTarget,
  ].filter((txt) => Boolean(txt && txt.trim().length > 0)).length;

  const maskBody = (raw?: string) =>
    maskTextNames((raw || '').trim(), students, anonymize);

  const handleCopyStudentSummary = async () => {
    const text = formatStudentRecordSummaryText(
      student,
      students,
      missions,
      config,
      anonymize
    );
    try {
      await navigator.clipboard.writeText(text);
      onNotice(
        `${formatStudentLabel(student, anonymize)}의 활동 기록을 복사했습니다.`
      );
    } catch {
      onNotice('클립보드 복사에 실패했습니다.');
    }
  };

  const renderLetterBox = (
    title: string,
    subLabel: string,
    rawContent: string | undefined,
    tone: 'warm' | 'cool',
    letterRecord: TeacherLetterRecord | null
  ) => {
    const body = maskBody(rawContent);
    const bgClass =
      tone === 'warm'
        ? 'bg-[#FFFBEB] border-[#FDE68A]'
        : 'bg-[#F5F6F8] border-[#E5E7EB]';

    return (
      <div className={`rounded-xl border p-3.5 space-y-2 ${bgClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div>
            <div className="text-xs font-extrabold text-[#191919]">{title}</div>
            <div className="text-[11px] font-bold text-[#767676]">{subLabel}</div>
          </div>
          {letterRecord && (
            <button
              type="button"
              onClick={() => onOpenLetterCapture(letterRecord)}
              className="px-2.5 py-1 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-[11px] font-black inline-flex items-center gap-1 shrink-0"
            >
              <MailOpen className="w-3 h-3" />
              <span>편지지 보기</span>
            </button>
          )}
        </div>
        {body && letterRecord ? (
          <button
            type="button"
            onClick={() => onOpenLetterCapture(letterRecord)}
            className="w-full text-left text-sm text-[#191919] leading-relaxed whitespace-pre-wrap rounded-lg hover:bg-white/70 p-1.5 -m-1.5 transition-colors"
            title="클릭하여 학생 편지지 형태로 보기"
          >
            {body}
          </button>
        ) : (
          <p className="text-xs text-[#767676] italic">아직 작성되지 않았습니다.</p>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 no-print"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${formatStudentLabel(student, anonymize)} 활동 기록 상세`}
        className="bg-white border border-[#E5E7EB] rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="bg-white border-b border-[#E5E7EB] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {prevStudent && (
              <button
                type="button"
                onClick={() => onSelectStudent(prevStudent.id)}
                className="p-1.5 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 border border-[#E5E7EB] text-[#191919]"
                title={`이전 학생: ${formatStudentLabel(prevStudent, anonymize)}`}
                aria-label="이전 학생 기록 보기"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#767676]">
                {config.className} · 학생 상세 활동 기록 ·{' '}
                <span className="text-[#735020]">잠입 확인 (학생 알림 영향 없음)</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#191919] truncate">
                {formatStudentLabel(student, anonymize)}
              </h3>
            </div>
            {nextStudent && (
              <button
                type="button"
                onClick={() => onSelectStudent(nextStudent.id)}
                className="p-1.5 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 border border-[#E5E7EB] text-[#191919]"
                title={`다음 학생: ${formatStudentLabel(nextStudent, anonymize)}`}
                aria-label="다음 학생 기록 보기"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
                  <span>익명 보기 중</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>실명 보기 중</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyStudentSummary}
              className="px-3 py-1.5 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black inline-flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>기록 복사</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#F5F6F8] text-[#191919]"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 익명 안내 배너 */}
        {anonymize && (
          <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 sm:px-6 py-2 flex items-center gap-2 text-xs font-bold text-[#735020] shrink-0">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#D97706]" />
            <span>
              익명 모드가 켜져 있어 학급 학생 이름이 가려집니다. 본문 속 별명이나 성 없이 쓴 이름만 캡처 전 한 번 더 확인해 주세요.
            </span>
          </div>
        )}

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto bg-[#F5F6F8] p-4 sm:p-6 space-y-5">
          {/* 수호천사 연결 & 요약 지표 카드 */}
          <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-[#FFFBEB] border border-[#FDE68A] px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-[#735020]">
                    내가 챙겨줄 친구
                  </div>
                  <div className="text-sm font-black text-[#191919]">
                    {formatStudentLabel(myTarget, anonymize)}
                  </div>
                </div>
                {myTarget && (
                  <button
                    type="button"
                    onClick={() => onSelectStudent(myTarget.id)}
                    className="px-2.5 py-1 rounded-md bg-white border border-[#E9D9AE] text-[11px] font-extrabold text-[#3C1E1E] hover:bg-[#FEE500]"
                  >
                    친구 기록 보기
                  </button>
                )}
              </div>

              <div className="rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-[#767676]">
                    나를 챙기는 수호천사
                  </div>
                  <div className="text-sm font-black text-[#191919]">
                    {formatStudentLabel(myAngel, anonymize)}
                  </div>
                </div>
                {myAngel && (
                  <button
                    type="button"
                    onClick={() => onSelectStudent(myAngel.id)}
                    className="px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] text-[11px] font-extrabold text-[#191919] hover:bg-[#FEE500]"
                  >
                    천사 기록 보기
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center pt-1">
              <div className="rounded-lg bg-[#F5F6F8] px-2.5 py-2">
                <div className="text-[11px] font-bold text-[#767676]">작성한 편지</div>
                <div className="text-sm font-black text-[#191919]">
                  {writtenLettersCount}/4통
                </div>
              </div>
              <div className="rounded-lg bg-[#F5F6F8] px-2.5 py-2">
                <div className="text-[11px] font-bold text-[#767676]">보낸 미션</div>
                <div className="text-sm font-black text-[#191919]">
                  {sentMissions.length}건{' '}
                  <span className="text-xs font-bold text-emerald-700">
                    (인증 {score.verifiedSentCount})
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-[#F5F6F8] px-2.5 py-2">
                <div className="text-[11px] font-bold text-[#767676]">받은 미션</div>
                <div className="text-sm font-black text-[#191919]">
                  {receivedMissions.length}건
                </div>
              </div>
              <div className="rounded-lg bg-[#F5F6F8] px-2.5 py-2">
                <div className="text-[11px] font-bold text-[#767676]">받은 훈장</div>
                <div className="text-sm font-black text-[#B45309]">
                  {(student.medals || []).length}개
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 rounded-lg bg-[#FFF5D6] border border-[#E9D9AE] px-2.5 py-2">
                <div className="text-[11px] font-bold text-[#735020]">총점</div>
                <div className="text-sm font-black text-[#3C1E1E]">
                  {score.totalScore}점
                </div>
              </div>
            </div>
          </section>

          {/* 영역 필터 탭 */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: '전체 보기' },
                { id: 'letters', label: '주고받은 편지' },
                { id: 'sent', label: `보낸 활동 (${sentMissions.length})` },
                { id: 'received', label: `받은 활동 (${receivedMissions.length})` },
              ] as { id: RecordSectionFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSectionFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold border transition-colors ${
                  sectionFilter === tab.id
                    ? 'bg-[#FEE500] text-[#3C1E1E] border-[#3C1E1E]'
                    : 'bg-white text-[#767676] border-[#E5E7EB] hover:text-[#191919]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 1단계 첫 편지·답장 */}
          {(sectionFilter === 'all' || sectionFilter === 'letters') && (
            <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#F0F1F4] pb-2.5">
                <Mail className="w-4 h-4 text-[#D97706]" />
                <h4 className="text-sm font-black text-[#191919]">
                  1단계 · 첫 편지와 답장
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  {renderLetterBox(
                    '내가 수호천사에게 보낸 첫 편지',
                    `받는 친구: ${formatStudentLabel(myAngel, anonymize)}`,
                    student.openingLetterToAngel,
                    'cool',
                    makeLetterRecord(student, 'opening_letter', students)
                  )}
                  {renderLetterBox(
                    '수호천사가 보내온 첫 답장',
                    `보낸 천사: ${formatStudentLabel(myAngel, anonymize)}`,
                    myAngel?.openingReplyToTarget,
                    'warm',
                    makeLetterRecord(myAngel, 'opening_reply', students)
                  )}
                </div>

                <div className="space-y-2.5">
                  {renderLetterBox(
                    '내가 챙겨줄 친구가 보낸 첫 편지',
                    `보낸 친구: ${formatStudentLabel(myTarget, anonymize)}`,
                    myTarget?.openingLetterToAngel,
                    'cool',
                    makeLetterRecord(myTarget, 'opening_letter', students)
                  )}
                  {renderLetterBox(
                    '내가 챙겨줄 친구에게 쓴 첫 답장',
                    `받는 친구: ${formatStudentLabel(myTarget, anonymize)}`,
                    student.openingReplyToTarget,
                    'warm',
                    makeLetterRecord(student, 'opening_reply', students)
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 2단계 보낸 비밀 활동 */}
          {(sectionFilter === 'all' || sectionFilter === 'sent') && (
            <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-[#F0F1F4] pb-2.5">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#3C1E1E]" />
                  <h4 className="text-sm font-black text-[#191919]">
                    2단계 · 내가 챙겨준 친구({formatStudentLabel(myTarget, anonymize)})에게 한 비밀 활동 ({sentMissions.length}건)
                  </h4>
                </div>
              </div>

              {sentMissions.length === 0 ? (
                <p className="text-xs text-[#767676] py-4 text-center">
                  아직 보낸 비밀 활동 기록이 없습니다.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {sentMissions.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB]/60 p-3.5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E9D9AE] text-xs font-extrabold text-[#3C1E1E]">
                            <ActivityLineIcon type={m.type} className="w-3.5 h-3.5" />
                            {getActivityTypeLabel(m.type)} (+{m.points}점)
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${STATUS_BADGE_CLASS[m.status]}`}
                          >
                            {m.status === 'verified' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {getMissionStatusLabel(m.status)}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#767676]">
                          {m.dateKey} · {m.createdAt}
                        </span>
                      </div>

                      {m.questText && (
                        <div className="text-[11px] font-bold text-[#735020] bg-white/80 border border-[#FDE68A] rounded-lg px-2.5 py-1.5">
                          주간 미션: {m.questText}
                        </div>
                      )}

                      <p className="text-sm text-[#191919] leading-relaxed whitespace-pre-wrap">
                        {maskTextNames(m.content, students, anonymize)}
                      </p>

                      {m.reply && m.reply.trim() && (
                        <div className="rounded-lg bg-white border border-[#E5E7EB] px-3 py-2 text-xs font-semibold text-[#191919]">
                          <span className="font-extrabold text-[#D97706]">
                            친구 한마디:
                          </span>{' '}
                          “{maskTextNames(m.reply, students, anonymize)}”
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 2단계 받은 비밀 활동 */}
          {(sectionFilter === 'all' || sectionFilter === 'received') && (
            <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#F0F1F4] pb-2.5">
                <HeartHandshake className="w-4 h-4 text-[#D97706]" />
                <h4 className="text-sm font-black text-[#191919]">
                  2단계 · 수호천사({formatStudentLabel(myAngel, anonymize)})와 선생님에게 받은 활동 ({receivedMissions.length}건)
                </h4>
              </div>

              {receivedMissions.length === 0 ? (
                <p className="text-xs text-[#767676] py-4 text-center">
                  아직 받은 비밀 활동 기록이 없습니다.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {receivedMissions.map((m) => {
                    const senderLabel =
                      m.isPostmasterNote || m.senderId === 'POSTMASTER'
                        ? '선생님'
                        : formatStudentLabel(
                            studentById.get(m.senderId),
                            anonymize
                          );

                    return (
                      <div
                        key={m.id}
                        className="rounded-xl border border-[#E5E7EB] bg-[#F5F6F8]/80 p-3.5 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-xs font-extrabold text-[#191919]">
                              <ActivityLineIcon
                                type={m.type}
                                className="w-3.5 h-3.5 text-[#D97706]"
                              />
                              {getActivityTypeLabel(m.type, m.isPostmasterNote)}
                            </span>
                            <span className="text-xs font-bold text-[#767676]">
                              보낸 이: {senderLabel}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${STATUS_BADGE_CLASS[m.status]}`}
                            >
                              {getMissionStatusLabel(m.status)}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-[#767676]">
                            {m.dateKey} · {m.createdAt}
                          </span>
                        </div>

                        {m.questText && (
                          <div className="text-[11px] font-bold text-[#735020] bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5">
                            주간 미션: {m.questText}
                          </div>
                        )}

                        <p className="text-sm text-[#191919] leading-relaxed whitespace-pre-wrap">
                          {maskTextNames(m.content, students, anonymize)}
                        </p>

                        {m.reply && m.reply.trim() && (
                          <div className="rounded-lg bg-[#FEE500]/50 border border-[#E9D9AE] px-3 py-2 text-xs font-semibold text-[#3C1E1E]">
                            <span className="font-extrabold">내가 남긴 한마디:</span>{' '}
                            “{maskTextNames(m.reply, students, anonymize)}”
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 3단계 추리 투표 & 마지막 편지 */}
          {(sectionFilter === 'all' || sectionFilter === 'letters') && (
            <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0F1F4] pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  <h4 className="text-sm font-black text-[#191919]">
                    3단계 · 추리 투표와 마지막 편지
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-[#767676]">추리 지목:</span>
                  <span className="font-extrabold text-[#191919]">
                    {formatStudentLabel(guessedStu, anonymize, '미제출')}
                  </span>
                  {student.guessedAngelId && (
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${
                        myAngel && student.guessedAngelId === myAngel.id
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-[#767676] border-[#E5E7EB]'
                      }`}
                    >
                      {myAngel && student.guessedAngelId === myAngel.id
                        ? '정답 (+50점)'
                        : '오답'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  {renderLetterBox(
                    '내가 수호천사에게 쓴 감사 편지',
                    `받는 천사: ${formatStudentLabel(myAngel, anonymize)}`,
                    student.thankLetterToAngel,
                    'cool',
                    makeLetterRecord(student, 'thank_letter', students)
                  )}
                  {renderLetterBox(
                    '수호천사가 나에게 쓴 정체 공개 편지',
                    `보낸 천사: ${formatStudentLabel(myAngel, anonymize)}`,
                    myAngel?.revealLetterToTarget,
                    'warm',
                    makeLetterRecord(myAngel, 'reveal_letter', students)
                  )}
                </div>

                <div className="space-y-2.5">
                  {renderLetterBox(
                    '내가 챙겨준 친구에게 쓴 정체 공개 편지',
                    `받는 친구: ${formatStudentLabel(myTarget, anonymize)}`,
                    student.revealLetterToTarget,
                    'warm',
                    makeLetterRecord(student, 'reveal_letter', students)
                  )}
                  {renderLetterBox(
                    '내가 챙겨준 친구가 나에게 쓴 감사 편지',
                    `보낸 친구: ${formatStudentLabel(myTarget, anonymize)}`,
                    myTarget?.thankLetterToAngel,
                    'cool',
                    makeLetterRecord(myTarget, 'thank_letter', students)
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 선생님 수여 훈장 */}
          {sectionFilter === 'all' && (student.medals || []).length > 0 && (
            <section className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#F0F1F4] pb-2.5">
                <Award className="w-4 h-4 text-[#D97706]" />
                <h4 className="text-sm font-black text-[#191919]">
                  선생님 수여 훈장 ({student.medals!.length}개)
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {student.medals!.map((medal) => (
                  <div
                    key={medal.id}
                    className="rounded-xl bg-[#F5F6F8] border border-[#E5E7EB] p-3 flex items-center gap-3"
                  >
                    <HonorMedalIcon type={medal.icon} size={38} />
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[#191919]">
                        {medal.title} (+{medal.points}점)
                      </div>
                      <p className="text-xs text-[#767676] truncate">
                        {maskTextNames(medal.reason, students, anonymize)}
                      </p>
                      <div className="text-[10px] font-semibold text-[#767676] mt-0.5">
                        {medal.awardedAt}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
