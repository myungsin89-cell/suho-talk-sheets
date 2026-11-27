import React, { useMemo, useState } from 'react';
import { ActivityType, ChatMessage, ClassConfig, MissionLog, Student } from '../types';
import {
  buildLetterRecords,
  exportAllRecordsCsv,
  exportChatsCsv,
  exportLettersCsv,
  exportMissionsCsv,
  formatStudentLabel,
  getActivityTypeLabel,
  getMissionStatusLabel,
  LetterKind,
  maskTextNames,
  TeacherLetterRecord,
} from '../utils/teacherRecords';
import { ActivityLineIcon } from './WorkbookPrintSheet';
import {
  ArrowRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  Mail,
  MailOpen,
  MessageCircle,
  MessageSquareHeart,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

interface TeacherRecordsTabProps {
  students: Student[];
  missions: MissionLog[];
  chats?: ChatMessage[];
  config: ClassConfig;
  anonymize: boolean;
  onToggleAnonymize: () => void;
  onOpenStudentRecord: (student: Student) => void;
  onOpenLetterCapture: (record: TeacherLetterRecord) => void;
  onNotice: (msg: string) => void;
}

type RecordsViewMode = 'letters' | 'missions' | 'chats';
type MissionFilterType = 'all' | ActivityType | 'postmaster';

const LETTER_KIND_BADGE: Record<LetterKind, string> = {
  opening_letter: 'bg-sky-50 text-sky-800 border-sky-200',
  opening_reply: 'bg-[#FFF5D6] text-[#735020] border-[#E9D9AE]',
  thank_letter: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  reveal_letter: 'bg-[#FEE500]/70 text-[#3C1E1E] border-[#E5D200]',
};

const MISSION_STATUS_BADGE: Record<MissionLog['status'], string> = {
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-[#FEE500]/70 text-[#3C1E1E] border-[#E5D200]',
  hold: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const TeacherRecordsTab: React.FC<TeacherRecordsTabProps> = ({
  students,
  missions,
  chats = [],
  config,
  anonymize,
  onToggleAnonymize,
  onOpenStudentRecord,
  onOpenLetterCapture,
  onNotice,
}) => {
  const [viewMode, setViewMode] = useState<RecordsViewMode>('letters');
  const [letterFilter, setLetterFilter] = useState<'all' | LetterKind>('all');
  const [missionTypeFilter, setMissionTypeFilter] =
    useState<MissionFilterType>('all');
  const [onlyWithReply, setOnlyWithReply] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.number - b.number),
    [students]
  );

  const studentById = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );

  const allLetters = useMemo(() => buildLetterRecords(students), [students]);

  const summaryStats = useMemo(() => {
    const stage1Letters = allLetters.filter((l) => l.stage === 1).length;
    const stage3Letters = allLetters.filter((l) => l.stage === 3).length;
    const studentMissions = missions.filter((m) => !m.isPostmasterNote);
    const verifiedMissions = studentMissions.filter(
      (m) => m.status === 'verified'
    ).length;
    const withReplyCount = missions.filter(
      (m) => Boolean(m.reply && m.reply.trim().length > 0)
    ).length;

    const activeStudentIds = new Set<string>();
    for (const l of allLetters) {
      activeStudentIds.add(l.sender.id);
    }
    for (const m of studentMissions) {
      activeStudentIds.add(m.senderId);
    }

    return {
      totalLetters: allLetters.length,
      stage1Letters,
      stage3Letters,
      totalStudentMissions: studentMissions.length,
      verifiedMissions,
      withReplyCount,
      participatingStudents: activeStudentIds.size,
    };
  }, [allLetters, missions]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const matchesStudentSearch = (stu: Student | undefined, q: string) => {
    if (!stu) return false;
    const realLabel = `${stu.number}번 ${stu.name}`.toLowerCase();
    const maskedLabel = formatStudentLabel(stu, true).toLowerCase();
    return realLabel.includes(q) || maskedLabel.includes(q);
  };

  const filteredLetters = useMemo(() => {
    return allLetters.filter((rec) => {
      if (letterFilter !== 'all' && rec.kind !== letterFilter) return false;
      if (
        selectedStudentId !== 'all' &&
        rec.sender.id !== selectedStudentId &&
        rec.receiver?.id !== selectedStudentId
      ) {
        return false;
      }
      if (normalizedSearch) {
        const displayBody = maskTextNames(
          rec.content,
          students,
          anonymize
        ).toLowerCase();
        const hitBody =
          displayBody.includes(normalizedSearch) ||
          rec.content.toLowerCase().includes(normalizedSearch);
        const hitPeople =
          matchesStudentSearch(rec.sender, normalizedSearch) ||
          matchesStudentSearch(rec.receiver, normalizedSearch);
        if (!hitBody && !hitPeople) return false;
      }
      return true;
    });
  }, [
    allLetters,
    letterFilter,
    selectedStudentId,
    normalizedSearch,
    students,
    anonymize,
  ]);

  const filteredMissions = useMemo(() => {
    return [...missions]
      .reverse()
      .filter((m) => {
        if (missionTypeFilter === 'postmaster') {
          if (!m.isPostmasterNote) return false;
        } else if (missionTypeFilter !== 'all') {
          if (m.isPostmasterNote || m.type !== missionTypeFilter) return false;
        }
        if (onlyWithReply && !(m.reply && m.reply.trim().length > 0)) {
          return false;
        }
        if (
          selectedStudentId !== 'all' &&
          m.senderId !== selectedStudentId &&
          m.receiverId !== selectedStudentId
        ) {
          return false;
        }
        if (normalizedSearch) {
          const senderStu = studentById.get(m.senderId);
          const receiverStu = studentById.get(m.receiverId);
          const displayContent = maskTextNames(
            m.content,
            students,
            anonymize
          ).toLowerCase();
          const displayReply = m.reply
            ? maskTextNames(m.reply, students, anonymize).toLowerCase()
            : '';
          const hitText =
            displayContent.includes(normalizedSearch) ||
            m.content.toLowerCase().includes(normalizedSearch) ||
            displayReply.includes(normalizedSearch) ||
            (m.reply || '').toLowerCase().includes(normalizedSearch) ||
            (m.questText || '').toLowerCase().includes(normalizedSearch);
          const hitPeople =
            matchesStudentSearch(senderStu, normalizedSearch) ||
            matchesStudentSearch(receiverStu, normalizedSearch) ||
            (m.isPostmasterNote && '선생님'.includes(normalizedSearch));
          if (!hitText && !hitPeople) return false;
        }
        return true;
      });
  }, [
    missions,
    missionTypeFilter,
    onlyWithReply,
    selectedStudentId,
    normalizedSearch,
    studentById,
    students,
    anonymize,
  ]);

  const filteredChatRooms = useMemo(() => {
    const grouped = new Map<string, ChatMessage[]>();
    for (const msg of chats) {
      const list = grouped.get(msg.roomId) || [];
      list.push(msg);
      grouped.set(msg.roomId, list);
    }

    const rooms: {
      roomId: string;
      angel?: Student;
      target?: Student;
      messages: ChatMessage[];
    }[] = [];

    for (const [roomId, msgs] of grouped.entries()) {
      const [angelId, targetId] = roomId.split('->');
      const angel = studentById.get(angelId);
      const target = studentById.get(targetId);

      if (
        selectedStudentId !== 'all' &&
        angelId !== selectedStudentId &&
        targetId !== selectedStudentId
      ) {
        continue;
      }

      if (normalizedSearch) {
        const hitPeople =
          matchesStudentSearch(angel, normalizedSearch) ||
          matchesStudentSearch(target, normalizedSearch);
        const hitText = msgs.some((m) => {
          const masked = maskTextNames(m.content, students, anonymize).toLowerCase();
          return (
            masked.includes(normalizedSearch) ||
            m.content.toLowerCase().includes(normalizedSearch)
          );
        });
        if (!hitPeople && !hitText) continue;
      }

      rooms.push({ roomId, angel, target, messages: msgs });
    }

    return rooms.sort((a, b) => (a.angel?.number || 999) - (b.angel?.number || 999));
  }, [chats, studentById, selectedStudentId, normalizedSearch, students, anonymize]);

  const handleExport = (kind: 'all' | 'letters' | 'missions' | 'chats') => {
    const count =
      kind === 'all'
        ? exportAllRecordsCsv(config.className, students, missions, anonymize)
        : kind === 'letters'
        ? exportLettersCsv(config.className, students, anonymize)
        : kind === 'missions'
        ? exportMissionsCsv(config.className, students, missions, anonymize)
        : exportChatsCsv(config.className, students, chats, anonymize);

    if (count === 0) {
      onNotice('내보낼 기록이 아직 없습니다.');
      return;
    }
    const modeLabel = anonymize ? '익명' : '실명';
    onNotice(`${count}건의 기록을 ${modeLabel} CSV 파일로 저장했습니다.`);
  };

  const handleCopyChatRoom = async (
    angel: Student | undefined,
    target: Student | undefined,
    messages: ChatMessage[]
  ) => {
    const header = `[수호톡 1:1 대화] 수호천사 ${formatStudentLabel(
      angel,
      anonymize
    )} ↔ 짝꿍 ${formatStudentLabel(target, anonymize)}`;
    const lines = messages.map((m) => {
      const sender = studentById.get(m.senderId);
      const role = angel && m.senderId === angel.id ? '수호천사' : '짝꿍';
      return `[${m.createdAt}] ${formatStudentLabel(sender, anonymize)}(${role}): ${maskTextNames(
        m.content,
        students,
        anonymize
      )}`;
    });
    try {
      await navigator.clipboard.writeText([header, ...lines].join('\n'));
      onNotice('선택한 1:1 대화 내용을 복사했습니다.');
    } catch {
      onNotice('클립보드 복사에 실패했습니다.');
    }
  };

  const handleCopyLetter = async (rec: TeacherLetterRecord) => {
    const senderLabel = formatStudentLabel(rec.sender, anonymize);
    const receiverLabel = formatStudentLabel(rec.receiver, anonymize);
    const body = maskTextNames(rec.content, students, anonymize);
    const text = `[${rec.kindLabel}] ${senderLabel} → ${receiverLabel}\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      onNotice('선택한 편지 내용을 복사했습니다.');
    } catch {
      onNotice('클립보드 복사에 실패했습니다.');
    }
  };

  const handleCopyMission = async (m: MissionLog) => {
    const senderLabel =
      m.isPostmasterNote || m.senderId === 'POSTMASTER'
        ? '선생님'
        : formatStudentLabel(studentById.get(m.senderId), anonymize);
    const receiverLabel = formatStudentLabel(
      studentById.get(m.receiverId),
      anonymize
    );
    const body = maskTextNames(m.content, students, anonymize);
    const replyLine = m.reply?.trim()
      ? `\n짝꿍 한마디: "${maskTextNames(m.reply.trim(), students, anonymize)}"`
      : '';
    const text = `[${m.dateKey} · ${getActivityTypeLabel(
      m.type,
      m.isPostmasterNote
    )}] ${senderLabel} → ${receiverLabel}\n${body}${replyLine}`;
    try {
      await navigator.clipboard.writeText(text);
      onNotice('선택한 활동 기록을 복사했습니다.');
    } catch {
      onNotice('클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5 no-print">
      {/* 상단 수업 사례 안내 & 익명/CSV 내보내기 바 */}
      <section className="rounded-2xl border border-[#e9d9ae] bg-[#fff5d6] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs sm:text-sm font-bold text-[#735020]">
                {config.className} · 수업 사례 · 생활지도 모니터링
              </p>
              <span className="inline-flex items-center rounded-md bg-white/80 border border-[#e9d9ae] px-2 py-0.5 text-[11px] font-extrabold text-[#735020]">
                잠입 확인 · 학생 알림 영향 없음
              </span>
            </div>
            <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl text-[#191919]">
              활동 기록 모아보기
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#685852]">
              학생들이 주고받은 편지와 비밀 활동을 한눈에 읽고, 익명 처리 후 엑셀(CSV)로 내려받을 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={anonymize}
              onClick={onToggleAnonymize}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-black border inline-flex items-center gap-1.5 transition-colors ${
                anonymize
                  ? 'bg-[#3C1E1E] text-[#FEE500] border-[#3C1E1E]'
                  : 'bg-white hover:bg-[#FEE500]/40 text-[#191919] border-[#d7bc64]'
              }`}
            >
              {anonymize ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>익명 보기 (김○○)</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>실명 보기 중</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleExport('all')}
              className="px-3.5 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] border border-[#d7bc64] text-xs sm:text-sm font-black inline-flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>전체 기록 CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('letters')}
              className="px-3 py-2 rounded-lg bg-white hover:bg-gray-50 text-[#191919] border border-[#e9d9ae] text-xs font-extrabold inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>편지만 CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('missions')}
              className="px-3 py-2 rounded-lg bg-white hover:bg-gray-50 text-[#191919] border border-[#e9d9ae] text-xs font-extrabold inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>미션만 CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('chats')}
              className="px-3 py-2 rounded-lg bg-white hover:bg-gray-50 text-[#191919] border border-[#e9d9ae] text-xs font-extrabold inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>수호톡 CSV</span>
            </button>
          </div>
        </div>

        {anonymize && (
          <div className="rounded-xl bg-white/85 border border-[#e9d9ae] px-3.5 py-2.5 flex items-center gap-2 text-xs font-bold text-[#735020]">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#D97706]" />
            <span>
              화면과 CSV 내보내기 모두 학급 학생 이름이 <strong>성○○</strong> 형태로 자동 가려집니다. (본문 속 애칭·성 없는 이름만 캡처 전 확인해 주세요.)
            </span>
          </div>
        )}
      </section>

      {/* 정량 요약 카드 3종 */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#767676]">작성된 편지</div>
            <div className="text-xl font-black text-[#191919] mt-0.5">
              총 {summaryStats.totalLetters}통
            </div>
            <div className="text-[11px] font-semibold text-[#767676] mt-0.5">
              1단계 {summaryStats.stage1Letters}통 · 3단계 {summaryStats.stage3Letters}통
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF5D6] flex items-center justify-center text-[#735020]">
            <Mail className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#767676]">비밀 활동 (미션)</div>
            <div className="text-xl font-black text-[#191919] mt-0.5">
              총 {summaryStats.totalStudentMissions}건
            </div>
            <div className="text-[11px] font-semibold text-[#767676] mt-0.5">
              짝꿍 승인 {summaryStats.verifiedMissions}건 · 한마디 답글 {summaryStats.withReplyCount}건
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF5D6] flex items-center justify-center text-[#735020]">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#767676]">기록 참여 학생</div>
            <div className="text-xl font-black text-[#191919] mt-0.5">
              {summaryStats.participatingStudents} / {students.length}명
            </div>
            <div className="text-[11px] font-semibold text-[#767676] mt-0.5">
              편지 또는 비밀 활동 1건 이상 작성
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FFF5D6] flex items-center justify-center text-[#735020]">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* 메인 기록 피드 카드 */}
      <section className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#E5E7EB] space-y-4">
        {/* 보기 전환 + 학생 필터 + 검색 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F1F4] pb-3.5">
          <div className="inline-flex items-center bg-[#F5F6F8] p-1 rounded-xl border border-[#E5E7EB] gap-1">
            <button
              type="button"
              onClick={() => setViewMode('letters')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition-colors ${
                viewMode === 'letters'
                  ? 'bg-[#FEE500] text-[#3C1E1E] shadow-sm'
                  : 'text-[#767676] hover:text-[#191919]'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>편지 모아보기 ({allLetters.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('missions')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition-colors ${
                viewMode === 'missions'
                  ? 'bg-[#FEE500] text-[#3C1E1E] shadow-sm'
                  : 'text-[#767676] hover:text-[#191919]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>비밀 활동 ({missions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('chats')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition-colors ${
                viewMode === 'chats'
                  ? 'bg-[#FEE500] text-[#3C1E1E] shadow-sm'
                  : 'text-[#767676] hover:text-[#191919]'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>수호톡 대화 ({chats.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="특정 학생 기록만 보기"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] px-3 py-1.5 text-xs font-bold text-[#191919] focus:outline-none focus:border-[#3C1E1E]"
            >
              <option value="all">전체 학생 ({students.length}명)</option>
              {sortedStudents.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {formatStudentLabel(stu, anonymize)}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#767676] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="학생 이름·내용 검색"
                className="rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] pl-8 pr-3 py-1.5 text-xs text-[#191919] w-44 sm:w-56 focus:outline-none focus:border-[#3C1E1E]"
              />
            </div>
          </div>
        </div>

        {/* 세부 유형 필터 바 */}
        {viewMode === 'letters' ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: '전체 편지' },
                { id: 'opening_letter', label: '1단계 첫 편지' },
                { id: 'opening_reply', label: '1단계 첫 답장' },
                { id: 'thank_letter', label: '3단계 감사 편지' },
                { id: 'reveal_letter', label: '3단계 정체 공개 편지' },
              ] as { id: 'all' | LetterKind; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLetterFilter(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors ${
                  letterFilter === opt.id
                    ? 'bg-[#3C1E1E] text-[#FEE500] border-[#3C1E1E]'
                    : 'bg-[#F5F6F8] text-[#767676] border-[#E5E7EB] hover:text-[#191919]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : viewMode === 'missions' ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: '전체 활동' },
                  { id: 'quest', label: '주간 미션' },
                  { id: 'stealth', label: '몰래 챙겨주기' },
                  { id: 'heart', label: '마음 표현하기' },
                  { id: 'power', label: '직접 도와주기' },
                  { id: 'postmaster', label: '선생님 응원' },
                ] as { id: MissionFilterType; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMissionTypeFilter(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors ${
                    missionTypeFilter === opt.id
                      ? 'bg-[#3C1E1E] text-[#FEE500] border-[#3C1E1E]'
                      : 'bg-[#F5F6F8] text-[#767676] border-[#E5E7EB] hover:text-[#191919]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-pressed={onlyWithReply}
              onClick={() => setOnlyWithReply((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-colors ${
                onlyWithReply
                  ? 'bg-[#FEE500] text-[#3C1E1E] border-[#3C1E1E]'
                  : 'bg-white text-[#767676] border-[#E5E7EB] hover:text-[#191919]'
              }`}
            >
              짝꿍 한마디 있는 활동만
            </button>
          </div>
        ) : null}

        {/* 결과 목록 */}
        {viewMode === 'letters' ? (
          filteredLetters.length === 0 ? (
            <div className="py-12 text-center text-sm font-bold text-[#767676] bg-[#F5F6F8] rounded-xl border border-dashed border-[#D1D5DB]">
              조건에 맞는 편지 기록이 아직 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredLetters.map((rec) => (
                <article
                  key={rec.id}
                  className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFB] p-4 flex flex-col justify-between gap-3 hover:border-[#D1D5DB] transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md border text-[11px] font-extrabold ${LETTER_KIND_BADGE[rec.kind]}`}
                      >
                        {rec.kindLabel}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-[#767676]">
                          {rec.charCount}자
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenLetterCapture(rec)}
                          className="px-2.5 py-1 rounded-md bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-[11px] font-black inline-flex items-center gap-1"
                        >
                          <MailOpen className="w-3 h-3" />
                          <span>편지지 보기</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLetter(rec)}
                          className="px-2 py-1 rounded-md bg-white hover:bg-[#FEE500]/40 border border-[#E5E7EB] text-[11px] font-bold text-[#191919] inline-flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>복사</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => onOpenStudentRecord(rec.sender)}
                        className="font-black text-[#191919] hover:underline underline-offset-2"
                        title="학생 전체 기록 열기"
                      >
                        {formatStudentLabel(rec.sender, anonymize)}
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
                      {rec.receiver ? (
                        <button
                          type="button"
                          onClick={() => onOpenStudentRecord(rec.receiver!)}
                          className="font-extrabold text-[#3C1E1E] hover:underline underline-offset-2"
                          title="학생 전체 기록 열기"
                        >
                          {formatStudentLabel(rec.receiver, anonymize)}
                        </button>
                      ) : (
                        <span className="font-bold text-[#767676]">미지정</span>
                      )}
                      <span className="text-[11px] font-semibold text-[#767676]">
                        ({rec.receiverRoleLabel})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenLetterCapture(rec)}
                      className="w-full text-left rounded-lg bg-white border border-[#E5E7EB] hover:border-[#d7bc64] hover:bg-[#FFFDF7] p-3.5 text-sm text-[#191919] leading-relaxed whitespace-pre-wrap transition-colors"
                      title="클릭하여 학생 편지지 형태로 크게 보기"
                    >
                      {maskTextNames(rec.content, students, anonymize)}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : viewMode === 'missions' ? (
          filteredMissions.length === 0 ? (
          <div className="py-12 text-center text-sm font-bold text-[#767676] bg-[#F5F6F8] rounded-xl border border-dashed border-[#D1D5DB]">
            조건에 맞는 비밀 활동 기록이 아직 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMissions.map((m) => {
              const senderStu = studentById.get(m.senderId);
              const receiverStu = studentById.get(m.receiverId);

              return (
                <article
                  key={m.id}
                  className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFB] p-4 space-y-2.5 hover:border-[#D1D5DB] transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[11px] font-extrabold text-[#191919]">
                        <ActivityLineIcon
                          type={m.type}
                          className="w-3.5 h-3.5 text-[#D97706]"
                        />
                        {getActivityTypeLabel(m.type, m.isPostmasterNote)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${MISSION_STATUS_BADGE[m.status]}`}
                      >
                        {getMissionStatusLabel(m.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#767676]">
                        {m.dateKey} · {m.createdAt}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyMission(m)}
                        className="px-2 py-1 rounded-md bg-white hover:bg-[#FEE500]/40 border border-[#E5E7EB] text-[11px] font-bold text-[#191919] inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>복사</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {m.isPostmasterNote || m.senderId === 'POSTMASTER' ? (
                      <span className="px-2 py-0.5 rounded bg-[#3C1E1E] text-[#FEE500] text-[11px] font-black">
                        선생님
                      </span>
                    ) : senderStu ? (
                      <button
                        type="button"
                        onClick={() => onOpenStudentRecord(senderStu)}
                        className="font-black text-[#191919] hover:underline underline-offset-2"
                        title="학생 전체 기록 열기"
                      >
                        {formatStudentLabel(senderStu, anonymize)}
                      </button>
                    ) : (
                      <span className="font-bold text-[#767676]">미지정</span>
                    )}

                    <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />

                    {receiverStu ? (
                      <button
                        type="button"
                        onClick={() => onOpenStudentRecord(receiverStu)}
                        className="font-extrabold text-[#3C1E1E] hover:underline underline-offset-2"
                        title="학생 전체 기록 열기"
                      >
                        {formatStudentLabel(receiverStu, anonymize)}
                      </button>
                    ) : (
                      <span className="font-bold text-[#767676]">미지정</span>
                    )}
                  </div>

                  {m.questText && (
                    <div className="rounded-lg bg-[#FFF5D6] border border-[#e9d9ae] px-3 py-1.5 text-[11px] font-bold text-[#735020]">
                      주간 미션: {m.questText}
                    </div>
                  )}

                  <p className="rounded-lg bg-white border border-[#E5E7EB] p-3.5 text-sm text-[#191919] leading-relaxed whitespace-pre-wrap">
                    {maskTextNames(m.content, students, anonymize)}
                  </p>

                  {m.reply && m.reply.trim() && (
                    <div className="rounded-lg bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2 text-xs font-semibold text-[#3C1E1E]">
                      <span className="font-extrabold text-[#B45309]">
                        짝꿍 한마디:
                      </span>{' '}
                      “{maskTextNames(m.reply, students, anonymize)}”
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )
        ) : filteredChatRooms.length === 0 ? (
          <div className="py-12 text-center text-sm font-bold text-[#767676] bg-[#F5F6F8] rounded-xl border border-dashed border-[#D1D5DB]">
            조건에 맞는 수호톡 1:1 대화 기록이 아직 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredChatRooms.map((room) => (
              <article
                key={room.roomId}
                className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFB] overflow-hidden flex flex-col"
              >
                <div className="px-4 py-3 bg-white border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#FEE500] text-[#3C1E1E] text-[10px] font-black">
                      수호천사
                    </span>
                    {room.angel ? (
                      <button
                        type="button"
                        onClick={() => onOpenStudentRecord(room.angel!)}
                        className="font-black text-[#191919] hover:underline underline-offset-2"
                      >
                        {formatStudentLabel(room.angel, anonymize)}
                      </button>
                    ) : (
                      <span className="font-bold text-[#767676]">미지정</span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-[#D97706]" />
                    <span className="px-2 py-0.5 rounded bg-[#F5F6F8] border border-[#E5E7EB] text-[#767676] text-[10px] font-extrabold">
                      짝꿍
                    </span>
                    {room.target ? (
                      <button
                        type="button"
                        onClick={() => onOpenStudentRecord(room.target!)}
                        className="font-black text-[#3C1E1E] hover:underline underline-offset-2"
                      >
                        {formatStudentLabel(room.target, anonymize)}
                      </button>
                    ) : (
                      <span className="font-bold text-[#767676]">미지정</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#767676]">
                      {room.messages.length}건
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyChatRoom(room.angel, room.target, room.messages)
                      }
                      className="px-2 py-1 rounded-md bg-[#F5F6F8] hover:bg-[#FEE500]/40 border border-[#E5E7EB] text-[11px] font-bold text-[#191919] inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>복사</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-[#BACEE0]/35 max-h-80 overflow-y-auto space-y-2">
                  {room.messages.map((m) => {
                    const isAngelMsg = room.angel && m.senderId === room.angel.id;
                    const senderStu = studentById.get(m.senderId);
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          isAngelMsg ? 'items-start' : 'items-end'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-[#475569] mb-0.5 px-1">
                          {formatStudentLabel(senderStu, anonymize)} (
                          {isAngelMsg ? '수호천사' : '짝꿍'}) · {m.createdAt}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                            isAngelMsg
                              ? 'bg-white text-[#191919] border border-[#E5E7EB]'
                              : 'bg-[#FEE500] text-[#3C1E1E]'
                          }`}
                        >
                          {maskTextNames(m.content, students, anonymize)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};
