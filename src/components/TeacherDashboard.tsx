import React, { useState } from 'react';
import {
  ChatMessage,
  ClassConfig,
  ClassRoom,
  GameStage,
  MedalIconType,
  MedalTemplate,
  MissionLog,
  Student,
} from '../types';
import { getStudentLoginUrl } from '../data/mockData';
import {
  calculateStudentScore,
  findGuardianAngelOf,
} from '../utils/scoring';
import { SuhoHamster, SuhoKakaoLogo } from './SuhoHamster';
import { HonorMedalIcon } from './HonorMedalIcon';
import { WorkbookPrintSheet } from './WorkbookPrintSheet';
import { LoginSlipPrintSheet } from './LoginSlipPrintSheet';
import { MatchingBoardModal } from './MatchingBoardModal';
import { WeeklyQuestPanel, SaveWeeklyQuest } from './WeeklyQuestPanel';
import { TeacherRecordsTab } from './TeacherRecordsTab';
import { StudentRecordModal } from './StudentRecordModal';
import { TeacherLetterCaptureModal } from './TeacherLetterCaptureModal';
import { SuhoGuidePoster } from './SuhoGuidePoster';
import { LeaderboardModal } from './LeaderboardModal';
import { TeacherLetterRecord } from '../utils/teacherRecords';
import { getScoreStage, isIdentityRevealed } from '../utils/classProgress';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  HeartHandshake,
  KeyRound,
  LayoutGrid,
  Layers,
  Lock,
  MailPlus,
  MessageCircle,
  Play,
  Plus,
  PlusCircle,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Shuffle,
  Sparkles,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

export type TeacherTab = 'setup' | 'status' | 'records' | 'medals';

interface TeacherDashboardProps {
  classId: string;
  classes: ClassRoom[];
  isCloudConnected?: boolean;
  students: Student[];
  missions: MissionLog[];
  chats?: ChatMessage[];
  config: ClassConfig;
  medalTemplates: MedalTemplate[];
  initialTab?: TeacherTab;
  onSwitchClass: (classId: string) => void;
  onCreateClass: (className: string, teacherPassword: string) => void;
  onLockTeacher: () => void;
  onUpdateClassName: (className: string) => void;
  onChangeWeeklyQuest: SaveWeeklyQuest;
  onChangeProgress: (action: GameStage | 'reveal') => Promise<boolean>;
  onToggleChatOpen?: (open: boolean) => Promise<boolean>;
  onAddStudent: (name: string, number?: number) => void;
  onBulkAddStudents: (items: { name: string; number?: number }[]) => void;
  onRemoveStudent: (studentId: string) => void;
  onClearAllStudents: () => void;
  onUpdateStudentTarget: (studentId: string, targetId: string) => void;
  onBatchUpdateTargets: (updates: Record<string, string>) => void;
  onRunRandomMatching: () => void;
  onClearMatching: () => void;
  onRegenerateAllPins: () => void;
  onApproveAllPending: () => void;
  onSendPostmasterNote: (receiverId: string, content: string) => void;
  onAwardMedal: (
    studentId: string,
    icon: MedalIconType,
    title: string,
    reason: string
  ) => void;
  onRemoveMedal: (studentId: string, medalId: string) => void;
  onAddMedalTemplate: (
    icon: MedalIconType,
    title: string,
    reason: string
  ) => void;
  onDeleteMedalTemplate: (templateId: string) => void;
  onSelectStudentPreview: (studentId: string) => void;
}

const MEDAL_ICON_CHOICES: { icon: MedalIconType; label: string }[] = [
  { icon: 'medal', label: '월계수' },
  { icon: 'crown', label: '왕관' },
  { icon: 'shield', label: '방패' },
  { icon: 'star', label: '별' },
  { icon: 'heart', label: '하트' },
];

const STAGE_INFO: Record<GameStage, { label: string; desc: string }> = {
  1: {
    label: '1단계 · 첫 편지',
    desc: '나의 수호천사에게 첫인사를 보내고, 내가 챙겨줄 친구에게 답장합니다.',
  },
  2: {
    label: '2단계 · 비밀 활동',
    desc: '친구를 몰래 도운 일을 기록하고 주간 미션에 참여합니다.',
  },
  3: {
    label: '3단계 · 추리 투표와 마지막 편지',
    desc: '추리 투표와 마지막 편지를 받은 뒤, 선생님이 정체를 공개합니다.',
  },
};

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  classId,
  classes,
  isCloudConnected = false,
  students,
  missions,
  chats = [],
  config,
  medalTemplates,
  initialTab = 'status',
  onSwitchClass,
  onCreateClass,
  onLockTeacher,
  onUpdateClassName,
  onChangeWeeklyQuest,
  onChangeProgress,
  onToggleChatOpen,
  onAddStudent,
  onBulkAddStudents,
  onRemoveStudent,
  onClearAllStudents,
  onUpdateStudentTarget,
  onBatchUpdateTargets,
  onRunRandomMatching,
  onClearMatching,
  onRegenerateAllPins,
  onApproveAllPending,
  onSendPostmasterNote,
  onAwardMedal,
  onRemoveMedal,
  onAddMedalTemplate,
  onDeleteMedalTemplate,
  onSelectStudentPreview,
}) => {
  const [activeTab, setActiveTab] = useState<TeacherTab>(initialTab);

  // ① 학급·매칭 상태
  const [classNameInput, setClassNameInput] = useState(config.className);
  const [newStudentName, setNewStudentName] = useState('');
  const [bulkNamesInput, setBulkNamesInput] = useState('');
  const [showMatchingTable, setShowMatchingTable] = useState(false);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [matchingSearch, setMatchingSearch] = useState('');

  // ② 학급 현황 상태
  const identityRevealed = isIdentityRevealed(config);
  const collectingFinale = config.stage === 3 && !identityRevealed;
  const canCheckMissions = config.stage >= 2 && !identityRevealed;
  const [studentSearch, setStudentSearch] = useState('');
  const [onlyIncompleteFinale, setOnlyIncompleteFinale] = useState(false);
  const [overviewFilter, setOverviewFilter] = useState<{ classId: string; stage: GameStage; kind: 'letter' | 'mission' } | null>(null);
  const activeOverviewFilter = !identityRevealed && overviewFilter?.classId === classId && overviewFilter.stage === config.stage
    ? overviewFilter.kind
    : null;
  const [hideGuessNames, setHideGuessNames] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ③ 훈장 관리 상태
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    medalTemplates[0]?.id || ''
  );
  const [quickAwardStudentId, setQuickAwardStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [customIcon, setCustomIcon] = useState<MedalIconType>('crown');
  const [customTitle, setCustomTitle] = useState('');
  const [customReason, setCustomReason] = useState('');

  // 모달 상태
  const [postmasterTarget, setPostmasterTarget] = useState<Student | null>(null);
  const [postmasterMessage, setPostmasterMessage] = useState('');
  const [previewWorkbookStudent, setPreviewWorkbookStudent] =
    useState<Student | null>(null);
  const [awardMedalTarget, setAwardMedalTarget] = useState<Student | null>(null);
  const [modalIcon, setModalIcon] = useState<MedalIconType>('medal');
  const [modalTitle, setModalTitle] = useState(
    medalTemplates[0]?.title || '성실 수호천사 훈장'
  );
  const [modalReason, setModalReason] = useState(
    medalTemplates[0]?.reason || '성실하게 활동했어요!'
  );

  // 3단계 전체화면 정체 공개 쇼 상태
  const [showRevealShow, setShowRevealShow] = useState(false);
  const [revealIndex, setRevealIndex] = useState(0);
  const [isCurrentRevealed, setIsCurrentRevealed] = useState(false);

  // 비밀번호 배포 & 접속 QR & 새 학급 모달 상태
  const [showStudentPins, setShowStudentPins] = useState(false);
  const [showLoginSlipsModal, setShowLoginSlipsModal] = useState(false);
  const [showGuidePosterModal, setShowGuidePosterModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showQrBoardModal, setShowQrBoardModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [anonymizeRecords, setAnonymizeRecords] = useState(false);
  const [detailRecordStudentId, setDetailRecordStudentId] = useState<string | null>(null);
  const [activeLetterCapture, setActiveLetterCapture] = useState<TeacherLetterRecord | null>(null);
  const [pendingStageChange, setPendingStageChange] = useState<GameStage | 'reveal' | null>(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [togglingChat, setTogglingChat] = useState(false);
  const progressSavePending = React.useRef(false);
  const [newClassTitle, setNewClassTitle] = useState('');
  const [newClassPw, setNewClassPw] = useState('');
  const [createClassErr, setCreateClassErr] = useState('');

  const loginUrl = getStudentLoginUrl(classId, config.gasWebAppUrl);
  const detailRecordStudent = detailRecordStudentId
    ? students.find((s) => s.id === detailRecordStudentId) || null
    : null;

  React.useEffect(() => {
    setActiveTab(initialTab);
    setDetailRecordStudentId(null);
    setActiveLetterCapture(null);
  }, [initialTab, classId]);

  React.useEffect(() => {
    if (!pendingStageChange) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !progressSavePending.current) setPendingStageChange(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingStageChange]);

  React.useEffect(() => {
    if (!collectingFinale && onlyIncompleteFinale) {
      setOnlyIncompleteFinale(false);
    }
  }, [collectingFinale, onlyIncompleteFinale]);

  React.useEffect(() => {
    setClassNameInput(config.className);
  }, [config.className]);

  React.useEffect(() => {
    if (
      medalTemplates.length > 0 &&
      !medalTemplates.some((t) => t.id === selectedTemplateId)
    ) {
      setSelectedTemplateId(medalTemplates[0].id);
    }
  }, [medalTemplates, selectedTemplateId]);

  React.useEffect(() => {
    if (
      students.length > 0 &&
      !students.some((s) => s.id === quickAwardStudentId)
    ) {
      setQuickAwardStudentId(students[0].id);
    }
  }, [students, quickAwardStudentId]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeLetterCapture) {
          setActiveLetterCapture(null);
          return;
        }
        if (showRevealShow) setShowRevealShow(false);
        if (postmasterTarget) setPostmasterTarget(null);
        if (previewWorkbookStudent) setPreviewWorkbookStudent(null);
        if (awardMedalTarget) setAwardMedalTarget(null);
        if (showLoginSlipsModal) setShowLoginSlipsModal(false);
        if (showGuidePosterModal) setShowGuidePosterModal(false);
        if (showLeaderboardModal) setShowLeaderboardModal(false);
        if (showQrBoardModal) setShowQrBoardModal(false);
        if (showCreateClassModal) setShowCreateClassModal(false);
        if (detailRecordStudentId) setDetailRecordStudentId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeLetterCapture,
    showRevealShow,
    postmasterTarget,
    previewWorkbookStudent,
    awardMedalTarget,
    showLoginSlipsModal,
    showGuidePosterModal,
    showLeaderboardModal,
    showQrBoardModal,
    showCreateClassModal,
    detailRecordStudentId,
  ]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const handleCopyAllPins = async () => {
    const lines = [
      `[${config.className}] 수호톡 입장 안내`,
      `접속 주소: ${loginUrl}`,
      ...students.map((s) => `${s.number}번 ${s.name} : ${s.pin}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast(
        `${students.length}명 비밀 코드 명단이 클립보드에 복사되었습니다.`
      );
    } catch {
      showToast('클립보드 복사에 실패했습니다. [입장 카드 인쇄]를 이용해 주세요.');
    }
  };

  const pendingMissions = missions.filter((mission) => mission.status === 'pending');
  const pendingMissionsCount = pendingMissions.length;
  const pendingReceiverIds = new Set(pendingMissions.map((mission) => mission.receiverId));

  const selectedTemplate =
    medalTemplates.find((t) => t.id === selectedTemplateId) || medalTemplates[0];

  const isFinaleComplete = (stu: Student) => {
    const hasVote = Boolean(stu.guessedAngelId);
    const hasThank = Boolean(
      stu.thankLetterToAngel && stu.thankLetterToAngel.trim().length >= 5
    );
    const hasReveal = Boolean(
      stu.revealLetterToTarget && stu.revealLetterToTarget.trim().length >= 5
    );
    return hasVote && hasThank && hasReveal;
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch = `${s.number}번 ${s.name}`.includes(
      studentSearch.trim()
    );
    if (!matchesSearch) return false;
    if (activeOverviewFilter === 'letter') return !(s.openingLetterToAngel || '').trim();
    if (activeOverviewFilter === 'mission') return pendingReceiverIds.has(s.id);
    if (collectingFinale && onlyIncompleteFinale) {
      return !isFinaleComplete(s);
    }
    return true;
  });

  const stageSummary = React.useMemo(() => {
    let openingLetterDoneCount = 0;
    let openingReplyDoneCount = 0;
    let votedCount = 0;
    let lettersDoneCount = 0;
    let incompleteFinaleCount = 0;
    let guessSuccessCount = 0;
    let stealthSuccessCount = 0;

    for (const s of students) {
      if ((s.openingLetterToAngel || '').trim().length > 0) {
        openingLetterDoneCount++;
      }
      if ((s.openingReplyToTarget || '').trim().length > 0) {
        openingReplyDoneCount++;
      }
      const hasVote = Boolean(s.guessedAngelId);
      const hasThank = Boolean(
        s.thankLetterToAngel && s.thankLetterToAngel.trim().length >= 5
      );
      const hasReveal = Boolean(
        s.revealLetterToTarget && s.revealLetterToTarget.trim().length >= 5
      );
      if (hasVote) votedCount++;
      if (hasThank && hasReveal) lettersDoneCount++;
      if (!hasVote || !hasThank || !hasReveal) incompleteFinaleCount++;

      if (identityRevealed) {
        const sScore = calculateStudentScore(s.id, students, missions, 3);
        if (sScore.guessBonus === 50) guessSuccessCount++;
        if (sScore.stealthMasterBonus === 50) stealthSuccessCount++;
      }
    }

    return {
      openingLetterDoneCount,
      openingReplyDoneCount,
      votedCount,
      lettersDoneCount,
      incompleteFinaleCount,
      guessSuccessCount,
      stealthSuccessCount,
    };
  }, [students, missions, identityRevealed]);

  const confirmProgress = async () => {
    if (pendingStageChange === null || progressSavePending.current) return;
    progressSavePending.current = true;
    setSavingProgress(true);
    try {
      if (await onChangeProgress(pendingStageChange)) {
        setPendingStageChange(null);
        showToast(pendingStageChange === 'reveal' ? '학생에게 수호천사의 정체를 공개했습니다.'
          : `${STAGE_INFO[pendingStageChange].label} 활동을 열었습니다.`);
        return;
      }
    } catch {
      // Keep the dialog available so the teacher can retry.
    } finally {
      progressSavePending.current = false;
      setSavingProgress(false);
    }
    showToast('진행 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  };

  const parseStudentToken = (
    raw: string
  ): { name: string; number?: number } | null => {
    const trimmed = raw.trim();
    if (!trimmed || /^\d+번?$/.test(trimmed)) return null;
    const match = trimmed.match(/^(\d+)\s*(?:번|[.)])?\s+(.+)$/);
    if (match) {
      const parsedNum = parseInt(match[1], 10);
      const parsedName = match[2].replace(/\t+/g, ' ').trim();
      if (parsedName && !/^\d+번?$/.test(parsedName)) {
        return {
          number: parsedNum > 0 ? parsedNum : undefined,
          name: parsedName,
        };
      }
      return null;
    }
    return { name: trimmed };
  };

  const parseBulkStudentEntries = (
    raw: string
  ): { name: string; number?: number }[] => {
    const results: { name: string; number?: number }[] = [];
    for (const chunk of raw.split(/[\r\n,;]+/)) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;
      // "1\t김누리" 형태(엑셀 2열 복사)는 번호+이름 1명으로 처리
      if (/^\d+\s*(?:번|[.)])?\s*\t+\s*\S/.test(trimmed)) {
        const entry = parseStudentToken(trimmed.replace(/\t+/g, ' '));
        if (entry) results.push(entry);
      } else if (trimmed.includes('\t')) {
        // "김누리\t송명신" 형태(엑셀 가로 복사)는 탭마다 각각 학생으로 분리
        for (const cell of trimmed.split(/\t+/)) {
          const entry = parseStudentToken(cell);
          if (entry) results.push(entry);
        }
      } else {
        const entry = parseStudentToken(trimmed);
        if (entry) results.push(entry);
      }
    }
    return results;
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseStudentToken(newStudentName);
    if (!parsed) return;
    onAddStudent(parsed.name, parsed.number);
    setNewStudentName('');
    showToast(
      `${parsed.number ? `${parsed.number}번 ` : ''}${
        parsed.name
      } 학생이 추가되었습니다.`
    );
  };

  const parsedBulkStudents = parseBulkStudentEntries(bulkNamesInput);

  const handleBulkAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBulkStudents.length === 0) return;
    onBulkAddStudents(parsedBulkStudents);
    setBulkNamesInput('');
    showToast(`${parsedBulkStudents.length}명의 학생이 일괄 추가되었습니다.`);
  };

  const handleCreateCustomMedal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customReason.trim()) {
      showToast('훈장 이름과 칭찬 문구를 모두 입력해 주세요.');
      return;
    }
    onAddMedalTemplate(customIcon, customTitle.trim(), customReason.trim());
    setCustomTitle('');
    setCustomReason('');
    showToast(`[${customTitle.trim()}] 커스텀 훈장이 추가되었습니다.`);
  };

  const handleQuickAwardMedal = () => {
    if (!selectedTemplate || !quickAwardStudentId) return;
    const targetStu = students.find((s) => s.id === quickAwardStudentId);
    if (!targetStu) return;
    onAwardMedal(
      targetStu.id,
      selectedTemplate.icon,
      selectedTemplate.title,
      selectedTemplate.reason
    );
    showToast(
      `${targetStu.number}번 ${targetStu.name} 학생에게 [${selectedTemplate.title}] (+30점)을 수여했습니다.`
    );
  };

  const handleSendPostmasterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postmasterTarget || !postmasterMessage.trim()) return;
    onSendPostmasterNote(postmasterTarget.id, postmasterMessage.trim());
    showToast(
      `${postmasterTarget.name} 학생에게 선생님 비밀 응원톡을 발송했습니다.`
    );
    setPostmasterTarget(null);
    setPostmasterMessage('');
  };

  const matchingMetrics = React.useMemo(() => {
    const incomingCountMap = new Map<string, number>();
    const studentById = new Map(students.map((s) => [s.id, s]));
    for (const s of students) {
      incomingCountMap.set(s.id, 0);
    }

    let assignedCount = 0;
    let mutualPairsRaw = 0;
    for (const s of students) {
      if (s.targetId && studentById.has(s.targetId)) {
        assignedCount++;
        incomingCountMap.set(
          s.targetId,
          (incomingCountMap.get(s.targetId) || 0) + 1
        );
        const target = studentById.get(s.targetId);
        if (target && target.targetId === s.id) {
          mutualPairsRaw++;
        }
      }
    }

    const unmatchedReceivers = students.filter(
      (s) => (incomingCountMap.get(s.id) || 0) === 0
    );
    const duplicateReceivers = students.filter(
      (s) => (incomingCountMap.get(s.id) || 0) >= 2
    );

    return {
      assignedCount,
      incomingCountMap,
      unmatchedReceivers,
      duplicateReceivers,
      mutualPairsCount: Math.floor(mutualPairsRaw / 2),
      isComplete1to1:
        students.length >= 2 &&
        assignedCount === students.length &&
        unmatchedReceivers.length === 0 &&
        duplicateReceivers.length === 0,
    };
  }, [students]);

  const openRevealShow = () => {
    setRevealIndex(0);
    setIsCurrentRevealed(false);
    setShowRevealShow(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-20 print:min-h-0 print:pb-0 print:bg-white">
      {/* 알림 토스트 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] max-w-md bg-[#3C1E1E] text-white px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-3 no-print">
          <SuhoKakaoLogo size={22} />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* 단정한 순백 교사 헤더: [교사용 대시보드] + 학급 전환 + [새 학급] + [잠금] */}
      {/* ================================================================= */}
      <header className="bg-white border-b border-[#E5E7EB] no-print">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-3.5 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 pb-3">
            <SuhoKakaoLogo size={36} />
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#767676]">
                <span>교사용 대시보드</span>
                <span
                  className={
                    isCloudConnected ? 'text-emerald-700' : 'text-[#767676]'
                  }
                >
                  · {isCloudConnected ? 'Google Sheets 연동' : '로컬 체험 모드'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <select
                  aria-label="관리 중인 학급 선택"
                  value={classId}
                  onChange={(e) => onSwitchClass(e.target.value)}
                  className="rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] px-2.5 py-1 text-sm font-black text-[#191919] focus:outline-none focus:border-[#3C1E1E]"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.config.className} · {c.students.length}명
                    </option>
                  ))}
                </select>

                {config.spreadsheetUrl && (
                  <a
                    href={config.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-extrabold inline-flex items-center gap-1"
                    title="연결된 내 구글 시트 원본 열기"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>구글 시트</span>
                  </a>
                )}

                {!isCloudConnected && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewClassTitle('');
                      setNewClassPw('');
                      setCreateClassErr('');
                      setShowCreateClassModal(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-extrabold inline-flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>새 학급</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLockTeacher}
                  className="px-2.5 py-1 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 border border-[#E5E7EB] text-[#767676] hover:text-[#191919] text-xs font-bold inline-flex items-center gap-1"
                  title="교사용 대시보드를 잠그고 입구 화면으로 돌아갑니다"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>교사 잠금</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3개 하단 밑줄 메뉴 탭 */}
          <nav className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className={`pb-3 px-1 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'setup'
                  ? 'border-[#191919] text-[#191919]'
                  : 'border-transparent text-[#767676] hover:text-[#191919]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>수업 준비</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`pb-3 px-1 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'status'
                  ? 'border-[#191919] text-[#191919]'
                  : 'border-transparent text-[#767676] hover:text-[#191919]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>수업 진행</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`pb-3 px-1 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'records'
                  ? 'border-[#191919] text-[#191919]'
                  : 'border-transparent text-[#767676] hover:text-[#191919]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>활동 기록</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('medals')}
              className={`pb-3 px-1 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'medals'
                  ? 'border-[#191919] text-[#191919]'
                  : 'border-transparent text-[#767676] hover:text-[#191919]'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>훈장 관리</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ================================================================= */}
      {/* [탭 1] 학급·매칭 설정 (학급 이름, 학생 명단, 30명 테스트, 순환 매칭) */}
      {/* ================================================================= */}
      {activeTab === 'setup' && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-7 space-y-6 no-print">
          <section className="rounded-2xl border border-[#e9d9ae] bg-[#fff5d6] p-5 sm:p-6">
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">수호톡 수업 준비</h1>
            <p className="mt-1 text-sm leading-relaxed text-[#685852]">명단을 등록하고 짝꿍을 배정한 뒤, 학생에게 입장 방법을 안내하세요.</p>
            <ol className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {[
                { id: 'student-roster', title: '1. 명단 등록', status: students.length >= 2 ? `${students.length}명 등록됨` : '학생 2명 이상 필요', current: students.length < 2 },
                { id: 'partner-matching', title: '2. 짝꿍 배정', status: matchingMetrics.isComplete1to1 ? '전원 배정됨' : `${matchingMetrics.assignedCount}/${students.length}명 배정`, current: students.length >= 2 && !matchingMetrics.isComplete1to1 },
                { id: 'student-invites', title: '3. 학생 초대', status: matchingMetrics.isComplete1to1 ? '입장 카드와 QR 공유' : '짝꿍 배정 후 안내', current: matchingMetrics.isComplete1to1 },
              ].map((step) => (
                <li key={step.id}>
                  <a href={`#${step.id}`} aria-current={step.current ? 'step' : undefined}
                    className={`flex min-h-16 flex-col justify-center gap-1 rounded-xl border px-4 py-2 hover:border-[#8c650c] ${step.current ? 'border-[#d7bc64] bg-[#fee500]' : 'border-[#e9d9ae] bg-white'}`}>
                    <span className="text-sm font-extrabold">{step.title}</span>
                    <span className="text-xs font-medium text-[#604832]">{step.status}</span>
                  </a>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-5">
              {/* 학급 이름 */}
              <section className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] space-y-3">
                <h3 className="text-base font-extrabold text-[#191919]">
                  우리 반 이름
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!classNameInput.trim()) return;
                    onUpdateClassName(classNameInput.trim());
                    showToast('학급 이름이 저장되었습니다.');
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={classNameInput}
                    onChange={(e) => setClassNameInput(e.target.value)}
                    placeholder="예) 4학년 2반 수호톡"
                    className="flex-1 rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none px-3.5 py-2 text-sm font-semibold text-[#191919]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black shrink-0"
                  >
                    저장
                  </button>
                </form>
              </section>

              {/* 학생 명단 입력 & 비밀 입장 코드 관리 */}
              <section id="student-roster" className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-[#191919]">
                    1. 학생 명단 ({students.length}명)
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {students.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `현재 등록된 학생 ${students.length}명과 활동 내역을 모두 비울까요?\n(비운 뒤 엑셀 명단을 새로 붙여넣을 수 있습니다.)`
                            )
                          ) {
                            onClearAllStudents();
                            showToast('학생 명단이 모두 비워졌습니다.');
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-700 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>명단 비우기</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowStudentPins(!showStudentPins)}
                      className="px-2.5 py-1 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 border border-[#E5E7EB] text-xs font-bold text-[#191919] inline-flex items-center gap-1"
                    >
                      {showStudentPins ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>비번 가리기</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>비번 보기</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddStudentSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="번호 이름 입력 (예: 1 김누리 또는 김누리)"
                    className="flex-1 rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] px-3.5 py-2 text-xs sm:text-sm text-[#191919]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#3C1E1E] text-white text-xs font-extrabold flex items-center gap-1 shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>추가</span>
                  </button>
                </form>

                <form onSubmit={handleBulkAddSubmit} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-[11px] font-bold text-[#767676]">
                      여러 명 한 번에 추가 (번호 이름 · 엑셀 2열[번호+이름] 세로 붙여넣기 지원):
                    </label>
                    {parsedBulkStudents.length > 0 && (
                      <span className="text-[11px] font-extrabold text-[#3C1E1E] bg-[#FEE500]/60 px-2 py-0.5 rounded">
                        {parsedBulkStudents.length}명 인식됨
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-stretch">
                    <textarea
                      rows={4}
                      value={bulkNamesInput}
                      onChange={(e) => setBulkNamesInput(e.target.value)}
                      placeholder={'엑셀에서 [번호 | 이름] 또는 [이름] 열을 복사해 붙여넣으세요\n예)\n1 김누리\n2 송명신\n4 송소미'}
                      className="flex-1 rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none px-3.5 py-2 text-xs text-[#191919] leading-relaxed resize-y"
                    />
                    <button
                      type="submit"
                      disabled={parsedBulkStudents.length === 0}
                      className="px-4 py-2 rounded-lg bg-[#F5F6F8] hover:bg-[#FEE500] disabled:opacity-50 disabled:hover:bg-[#F5F6F8] border border-[#E5E7EB] text-[#191919] text-xs font-extrabold shrink-0 transition-colors"
                    >
                      {parsedBulkStudents.length > 0
                        ? `${parsedBulkStudents.length}명 추가`
                        : '일괄 추가'}
                    </button>
                  </div>
                </form>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#F0F1F4] max-h-52 overflow-y-auto">
                  {students.map((stu) => (
                    <div
                      key={stu.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F5F6F8] border border-[#E5E7EB] text-xs font-bold text-[#191919]"
                    >
                      <span>
                        {stu.number}.{stu.name}
                      </span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#3C1E1E] tracking-wider">
                        {showStudentPins ? stu.pin : '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onRemoveStudent(stu.id);
                          showToast(`${stu.name} 학생이 명단에서 삭제되었습니다.`);
                        }}
                        className="text-gray-400 hover:text-red-600"
                        title="학생 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 비밀 입장 코드 배포 도구 바 */}
                <div className="pt-3 border-t border-[#F0F1F4] flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAllPins}
                    className="px-3 py-2 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 border border-[#E5E7EB] text-[#191919] text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>비번 명단 복사</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRegenerateAllPins();
                      showToast(
                        `${students.length}명 비밀 입장 코드가 모두 새로 발급되었습니다.`
                      );
                    }}
                    className="px-3 py-2 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 border border-[#E5E7EB] text-[#767676] hover:text-[#191919] text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>비번 전체 재발급</span>
                  </button>
                </div>
              </section>
            </div>

            {/* 우측: 수호천사 매칭 설정 (직접 선택 + 랜덤 + 서로 짝꿍 허용) */}
            <section id="partner-matching" className="lg:col-span-6 bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-[#191919]">
                    2. 짝꿍 배정
                  </h3>
                  <p className="text-xs text-[#767676] mt-0.5">
                    처음에는 자동으로 배정하고, 직접 정하려면 매칭 보드를 열어 주세요.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowMatchingModal(true)}
                    disabled={students.length < 2}
                    className="px-3.5 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] disabled:opacity-50 text-[#3C1E1E] text-xs font-black flex items-center gap-1.5"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" strokeWidth={2.4} />
                    <span>매칭 보드 열기</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRunRandomMatching();
                      setShowMatchingTable(true);
                      showToast('전원 랜덤 매칭이 완료되었습니다.');
                    }}
                    className="px-3 py-2 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 border border-[#E5E7EB] text-[#191919] text-xs font-bold flex items-center gap-1.5"
                  >
                    <Shuffle className="w-3.5 h-3.5" strokeWidth={2.2} />
                    <span>자동으로 배정하기</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearMatching();
                      showToast('모든 매칭을 미지정으로 비웠습니다.');
                    }}
                    className="px-3 py-2 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 border border-[#E5E7EB] text-xs font-bold text-[#767676] hover:text-[#191919]"
                  >
                    초기화
                  </button>
                </div>
              </div>

              {/* 실시간 매칭 점검 상태 바 */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0F1F4]">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {matchingMetrics.isComplete1to1 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        전원 1:1 매칭 완료
                        {matchingMetrics.mutualPairsCount > 0
                          ? ` · 서로 짝꿍 ${matchingMetrics.mutualPairsCount}쌍`
                          : ''}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-extrabold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>
                        배정 {matchingMetrics.assignedCount}/{students.length}명
                        {matchingMetrics.unmatchedReceivers.length > 0 &&
                          ` · 수호천사 없음: ${matchingMetrics.unmatchedReceivers
                            .slice(0, 3)
                            .map((s) => s.name)
                            .join(', ')}${
                            matchingMetrics.unmatchedReceivers.length > 3
                              ? ` 외 ${
                                  matchingMetrics.unmatchedReceivers.length - 3
                                }명`
                              : ''
                          }`}
                        {matchingMetrics.duplicateReceivers.length > 0 &&
                          ` · 중복 지목 ${matchingMetrics.duplicateReceivers.length}명`}
                      </span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowMatchingTable(!showMatchingTable)}
                  className="text-xs font-bold text-[#767676] flex items-center gap-1 hover:text-[#191919]"
                >
                  {showMatchingTable ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>가리기</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>보기</span>
                    </>
                  )}
                </button>
              </div>

              {showMatchingTable && (
                <div className="space-y-2.5">
                  {students.length > 10 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#767676] absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={matchingSearch}
                        onChange={(e) => setMatchingSearch(e.target.value)}
                        placeholder="매칭 학생 검색"
                        className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] pl-8 pr-3 py-1.5 text-xs text-[#191919] focus:outline-none focus:border-[#3C1E1E]"
                      />
                    </div>
                  )}

                  <div className="rounded-lg border border-[#E5E7EB] divide-y divide-[#F0F1F4] max-h-[420px] overflow-y-auto bg-white">
                    {students
                      .filter((s) =>
                        `${s.number}번 ${s.name}`.includes(matchingSearch.trim())
                      )
                      .map((stu) => {
                        const targetObj = students.find(
                          (c) => c.id === stu.targetId
                        );
                        const isMutual = Boolean(
                          targetObj && targetObj.targetId === stu.id
                        );

                        return (
                          <div
                            key={stu.id}
                            className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs hover:bg-[#F5F6F8]/60"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-extrabold text-[#191919] truncate">
                                {stu.number}번 {stu.name}
                              </span>
                              {isMutual && (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold shrink-0">
                                  서로 짝꿍
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[#767676] font-bold">➔</span>
                              <select
                                aria-label={`${stu.name} 짝꿍 선택`}
                                value={stu.targetId}
                                onChange={(e) =>
                                  onUpdateStudentTarget(stu.id, e.target.value)
                                }
                                className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#3C1E1E] ${
                                  stu.targetId
                                    ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#3C1E1E]'
                                    : 'bg-[#F5F6F8] border-[#E5E7EB] text-[#767676]'
                                }`}
                              >
                                <option value="">미지정</option>
                                {students
                                  .filter((cand) => cand.id !== stu.id)
                                  .map((cand) => {
                                    const takenByOther = students.some(
                                      (other) =>
                                        other.id !== stu.id &&
                                        other.targetId === cand.id
                                    );
                                    return (
                                      <option key={cand.id} value={cand.id}>
                                        {cand.number}번 {cand.name}
                                        {takenByOther ? ' (배정됨)' : ''}
                                      </option>
                                    );
                                  })}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </section>
          </div>
          <section id="student-invites" className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black">3. 학생 초대</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#685852]">
              {matchingMetrics.isComplete1to1
                ? '학급 링크나 QR을 안내하고, 각 학생에게 본인의 입장 코드를 건네 주세요.'
                : '짝꿍 배정을 마친 뒤 접속 링크와 개인 입장 코드를 안내하세요.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowLoginSlipsModal(true)} disabled={!students.length}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#fee500] px-4 text-sm font-extrabold hover:bg-[#f4d900] disabled:opacity-45">
                <Printer size={17} aria-hidden="true" /> 개인 입장 카드 인쇄
              </button>
              <button type="button" onClick={() => setShowQrBoardModal(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#e5e7eb] px-4 text-sm font-bold hover:bg-[#f5f6f8]">
                <QrCode size={17} aria-hidden="true" /> 교실에 QR 띄우기
              </button>
              <button type="button" onClick={() => setShowGuidePosterModal(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#e9d9ae] bg-[#fff5d6] px-4 text-sm font-extrabold text-[#735020] hover:bg-[#fee500]">
                <Printer size={17} aria-hidden="true" /> 규칙·점수 안내판 인쇄
              </button>
              <button type="button" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(loginUrl);
                  showToast('학생 링크를 복사했습니다.');
                } catch {
                  showToast('링크를 복사하지 못했습니다. QR 화면에서 주소를 확인하세요.');
                }
              }} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#e5e7eb] px-4 text-sm font-bold hover:bg-[#f5f6f8]">
                <Copy size={17} aria-hidden="true" /> 학생 링크 복사
              </button>
              {matchingMetrics.isComplete1to1 && <button type="button" onClick={() => setActiveTab('status')}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-bold hover:bg-[#f5f6f8]">
                수업 진행 화면 열기 <ArrowRight size={17} aria-hidden="true" />
              </button>}
            </div>
          </section>
        </main>
      )}

      {/* ================================================================= */}
      {/* [탭 2] 학급 현황 (메인 대시보드 - 심플 & 명쾌한 구조) */}
      {/* ================================================================= */}
      {activeTab === 'status' && (
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5 no-print">
          <section className="rounded-2xl border border-[#e9d9ae] bg-[#fff5d6] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#735020]">학생에게 열어둔 활동 · {STAGE_INFO[config.stage].label}</p>
                <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">오늘 확인할 일</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeaderboardModal(true)}
                  disabled={!students.length}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] disabled:opacity-50 px-3.5 py-2 text-xs sm:text-sm font-black text-[#3C1E1E] border border-[#d7bc64]"
                >
                  <Trophy className="w-4 h-4 text-[#B45309]" />
                  <span>명예의 전당 (순위판)</span>
                </button>
                <a href="#student-progress" onClick={() => { setOverviewFilter(null); setOnlyIncompleteFinale(false); setStudentSearch(''); }}
                  className="rounded-lg px-3 py-2.5 text-sm font-bold underline underline-offset-4">전체 현황 보기</a>
              </div>
            </div>
            {!students.length ? (
              <p className="mt-3 text-sm">수업 준비에서 학생 명단을 먼저 등록해 주세요.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {config.stage === 1 && (
                  <a href="#student-progress" onClick={() => { setOverviewFilter({ classId, stage: config.stage, kind: 'letter' }); setStudentSearch(''); }}
                    className="rounded-lg border border-[#e9d9ae] bg-white px-4 py-3 text-sm font-extrabold hover:border-[#8c650c]">
                    첫 편지 미작성 {students.length - stageSummary.openingLetterDoneCount}명
                  </a>
                )}
                {collectingFinale && (
                  <a href="#student-progress" onClick={() => { setOverviewFilter(null); setOnlyIncompleteFinale(true); setStudentSearch(''); }}
                    className="rounded-lg border border-[#e9d9ae] bg-white px-4 py-3 text-sm font-extrabold hover:border-[#8c650c]">
                    마지막 활동 미완료 {stageSummary.incompleteFinaleCount}명
                  </a>
                )}
                {canCheckMissions && (
                  <a href="#student-progress" onClick={() => {
                    setStudentSearch('');
                    setOverviewFilter({ classId, stage: config.stage, kind: 'mission' });
                    setOnlyIncompleteFinale(false);
                  }} className="rounded-lg border border-[#e9d9ae] bg-white px-4 py-3 text-sm font-extrabold hover:border-[#8c650c]">
                    친구 확인 대기 {pendingMissionsCount}건
                  </a>
                )}
              </div>
            )}
          </section>

          {/* 수업 진행 단계 */}
          <section className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-[#191919]">
                  수업 진행 단계
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-[#FEE500] text-[#3C1E1E] text-[11px] font-black">
                  현재 {config.stage}단계
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#767676]">
                1단계 첫 편지 → 2단계 비밀 활동 → 3단계 추리 투표
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#F5F6F8] p-2 rounded-xl border border-[#E5E7EB]">
              {([1, 2, 3] as GameStage[]).map((stageNum) => {
                const info = STAGE_INFO[stageNum];
                const active = config.stage === stageNum;
                return (
                  <button
                    key={stageNum}
                    type="button"
                    onClick={() => {
                      if (!active) setPendingStageChange(stageNum);
                    }}
                    aria-current={active ? 'step' : undefined}
                    className={`text-left p-3 rounded-lg border transition-all flex flex-col justify-between gap-1.5 ${
                      active
                        ? 'bg-[#FEE500] text-[#3C1E1E] border-[#E5D200] shadow-sm cursor-default'
                        : 'bg-white text-[#191919] border-transparent hover:border-[#D1D5DB] hover:bg-white/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <span className="text-xs font-black">{info.label}</span>
                      {active && (
                        <span className="px-1.5 py-0.5 rounded bg-[#3C1E1E] text-[#FEE500] text-[10px] font-black shrink-0">
                          진행 중
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] leading-relaxed font-medium ${
                        active ? 'text-[#3C1E1E]/85' : 'text-[#767676]'
                      }`}
                    >
                      {info.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {collectingFinale && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e9d9ae] bg-[#fff5d6] p-3">
                <p className="text-sm font-bold">추리 투표 {stageSummary.votedCount}/{students.length}명 · 마지막 편지 {stageSummary.lettersDoneCount}/{students.length}명</p>
                <button type="button" onClick={() => setPendingStageChange('reveal')}
                  className="min-h-11 rounded-lg bg-[#fee500] px-4 text-sm font-extrabold hover:bg-[#f4d900]">정체 공개하기</button>
              </div>
            )}
            {identityRevealed && (
              <div className="pt-3 border-t border-[#F0F1F4] flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={openRevealShow}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-sm font-black flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-[#3C1E1E]" />
                  <span>수호천사 전체공개 발표하기 (전체화면)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  title="학생 1명당 2쪽 구성입니다. 인쇄 창에서 양면 인쇄 또는 2쪽 모아찍기를 선택하세요."
                  className="sm:w-auto py-2.5 px-5 rounded-lg bg-[#3C1E1E] hover:bg-black text-white text-sm font-extrabold flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-[#FEE500]" />
                  <span>전 학급 기록장 일괄 인쇄 ({students.length}명 · {students.length * 2}쪽)</span>
                </button>
              </div>
            )}
          </section>

          {/* 단계 무관 실시간 '수호천사와 톡하기' 제어 카드 */}
          {onToggleChatOpen && (
            <section
              className={`rounded-xl p-4 sm:p-5 shadow-sm border flex flex-wrap items-center justify-between gap-3 ${
                config.chatOpen
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-white border-[#E5E7EB]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    config.chatOpen
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#FFF5D6] text-[#735020]'
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-[#191919]">
                      수호천사와 톡하기 (1:1 비밀 대화방)
                    </h2>
                    {config.chatOpen ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        열림 · 대화 중
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#F5F6F8] border border-[#E5E7EB] text-[#767676] text-[11px] font-extrabold">
                        닫힘
                      </span>
                    )}
                    <span className="text-xs font-bold text-[#767676]">
                      · 누적 대화 {chats.length}건
                    </span>
                  </div>
                  <p className="text-xs text-[#685852] mt-0.5">
                    단계와 상관없이 열어두면 학생이 ‘나를 챙기는 수호천사’·‘내가 챙기는 친구’와 각각 1:1로 대화할 수 있습니다. (닫으면 대화 종료)
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={togglingChat}
                onClick={async () => {
                  if (togglingChat) return;
                  setTogglingChat(true);
                  try {
                    const nextOpen = !config.chatOpen;
                    const ok = await onToggleChatOpen(nextOpen);
                    if (ok) {
                      showToast(
                        nextOpen
                          ? '수호천사와 톡하기 대화방을 열었습니다!'
                          : '수호천사와 톡하기 대화방을 닫았습니다.'
                      );
                    } else {
                      showToast('대화방 상태를 변경하지 못했습니다. 다시 시도해 주세요.');
                    }
                  } finally {
                    setTogglingChat(false);
                  }
                }}
                className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-black inline-flex items-center gap-1.5 shrink-0 disabled:opacity-60 ${
                  config.chatOpen
                    ? 'bg-[#3C1E1E] hover:bg-black text-[#FEE500]'
                    : 'bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E]'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {togglingChat
                    ? '변경 중…'
                    : config.chatOpen
                    ? '수호톡 대화방 닫기'
                    : '수호톡 대화방 열기'}
                </span>
              </button>
            </section>
          )}

          {config.stage === 2 && (
            <WeeklyQuestPanel key={classId} settings={config} onSave={onChangeWeeklyQuest} onNotice={showToast} />
          )}

          {/* 단계별 맞춤형 학급 현황판 표 */}
          <section id="student-progress" className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-[#E5E7EB] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#191919]">
                  학생 활동 현황판 ({students.length}명)
                </h2>
                <p className="text-xs text-[#767676]">
                  {config.stage === 1
                    ? '학생이 첫 편지와 답장을 썼는지 확인하세요.'
                    : config.stage === 2
                    ? '수호천사에게 받은 미션이 0건인 학생은 관심 필요가 표시됩니다.'
                    : collectingFinale
                    ? '정체를 공개하기 전에 추리 투표와 마지막 편지 제출을 확인하세요.'
                    : '정체 공개 결과(추리 성공 · 정체 숨기기 성공)와 최종 점수를 확인할 수 있습니다.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#767676] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="학생 이름 검색"
                    className="rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] pl-8 pr-3 py-1.5 text-xs text-[#191919] w-40 focus:outline-none focus:border-[#3C1E1E]"
                  />
                </div>
                {config.stage === 2 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    받은 미션 0건: 관심 필요
                  </span>
                )}
              </div>
            </div>

            {activeOverviewFilter && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#fff5d6] px-3 py-2 text-sm">
                <span>{activeOverviewFilter === 'letter' ? '첫 편지 미작성 학생' : '친구 확인을 기다리는 학생'} {filteredStudents.length}명</span>
                <button type="button" onClick={() => setOverviewFilter(null)} className="min-h-9 rounded-md bg-white px-2 font-bold">필터 지우기</button>
              </div>
            )}

            {/* 1단계 전용 첫 편지·답장 요약 바 */}
            {config.stage === 1 && (
              <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-5 text-xs font-extrabold text-[#191919]">
                <span>
                  첫 편지 완료{' '}
                  <strong className="text-[#D97706]">
                    {stageSummary.openingLetterDoneCount}/{students.length}명
                  </strong>
                </span>
                <span>
                  첫 답장 완료{' '}
                  <strong className="text-emerald-700">
                    {stageSummary.openingReplyDoneCount}/{students.length}명
                  </strong>
                </span>
              </div>
            )}

            {/* 추리 투표·마지막 편지 제출 현황 */}
            {collectingFinale && (
              <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-lg p-3 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-4 text-xs font-extrabold text-[#191919]">
                  <span>
                    추리 투표 완료{' '}
                    <strong className="text-[#D97706]">
                      {stageSummary.votedCount}/{students.length}명
                    </strong>
                  </span>
                  <span>
                    편지 2통 완료{' '}
                    <strong className="text-[#D97706]">
                      {stageSummary.lettersDoneCount}/{students.length}명
                    </strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOverviewFilter(null);
                      setOnlyIncompleteFinale(!onlyIncompleteFinale);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all ${
                      onlyIncompleteFinale
                        ? 'bg-[#FEE500] text-[#3C1E1E] border-[#3C1E1E]'
                        : 'bg-white text-[#191919] border-[#E5E7EB] hover:bg-gray-100'
                    }`}
                  >
                    미완료만 보기 ({stageSummary.incompleteFinaleCount}명)
                  </button>

                  <button
                    type="button"
                    onClick={() => setHideGuessNames(!hideGuessNames)}
                    className="px-3 py-1.5 rounded-lg text-xs font-extrabold bg-white text-[#191919] border border-[#E5E7EB] hover:bg-gray-100 inline-flex items-center gap-1"
                  >
                    {hideGuessNames ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>지목 이름 보기</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>지목 이름 숨기기</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {identityRevealed && (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-5 text-xs font-extrabold text-[#191919]">
                <span>
                  추리 성공{' '}
                  <strong className="text-emerald-700">
                    {stageSummary.guessSuccessCount}/{students.length}명
                  </strong>
                </span>
                <span>
                  정체 숨기기 성공{' '}
                  <strong className="text-emerald-700">
                    {stageSummary.stealthSuccessCount}/{students.length}명
                  </strong>
                </span>
                <span>
                  편지 2통 완료{' '}
                  <strong className="text-[#B45309]">
                    {stageSummary.lettersDoneCount}/{students.length}명
                  </strong>
                </span>
              </div>
            )}

            {canCheckMissions && pendingMissionsCount > 0 && (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[#3C1E1E]">
                  짝꿍이 아직 승인하지 않은 미션이{' '}
                  <strong className="text-[#B45309]">
                    {pendingMissionsCount}건
                  </strong>{' '}
                  있습니다. (결석·미확인 시 교사가 대신 승인할 수 있어요.)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onApproveAllPending();
                    showToast(
                      `짝꿍 미확인 미션 ${pendingMissionsCount}건을 교사 대신 승인했습니다.`
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black flex items-center gap-1.5 shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    짝꿍 미확인 미션 교사 대신 승인 ({pendingMissionsCount}건)
                  </span>
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F5F6F8] text-[#191919] font-extrabold border-b border-[#E5E7EB]">
                    <th className="py-3 px-3 rounded-tl-lg">학생</th>
                    {config.stage < 3 && (
                      <>
                        <th className="py-3 px-3">첫 편지·답장</th>
                        {config.stage === 2 && <>
                        <th className="py-3 px-3">수행한 미션</th>
                        <th className="py-3 px-3">받은 미션</th>
                        <th className="py-3 px-3">미확인</th>
                        </>}
                        <th className="py-3 px-3">받은 훈장</th>
                        <th className="py-3 px-3">총점</th>
                        {config.stage === 2 && <th className="py-3 px-3">상태</th>}
                      </>
                    )}
                    {collectingFinale && (
                      <>
                        <th className="py-3 px-3">미션 인증</th>
                        <th className="py-3 px-3">추리 투표</th>
                        <th className="py-3 px-3">마음의 편지 (2통)</th>
                        <th className="py-3 px-3">받은 훈장</th>
                        <th className="py-3 px-3">총점</th>
                      </>
                    )}
                    {identityRevealed && (
                      <>
                        <th className="py-3 px-3">미션 인증</th>
                        <th className="py-3 px-3">추리 결과</th>
                        <th className="py-3 px-3">정체 숨기기</th>
                        <th className="py-3 px-3">편지 2통</th>
                        <th className="py-3 px-3">받은 훈장</th>
                        <th className="py-3 px-3">총점</th>
                      </>
                    )}
                    <th className="py-3 px-3 rounded-tr-lg text-right">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F1F4]">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={config.stage === 1 ? 5 : config.stage === 2 ? 9 : collectingFinale ? 7 : 8}
                        className="py-8 text-center text-xs font-bold text-[#767676]"
                      >
                        조건에 해당하는 학생이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stu) => {
                      const sScore = calculateStudentScore(
                        stu.id,
                        students,
                        missions,
                        getScoreStage(config)
                      );
                      const sentAllCount = missions.filter(
                        (m) => m.senderId === stu.id && !m.isPostmasterNote
                      ).length;
                      const receivedAllCount = missions.filter(
                        (m) => m.receiverId === stu.id
                      ).length;
                      const unverifiedReceivedCount = missions.filter(
                        (m) => m.receiverId === stu.id && m.status === 'pending'
                      ).length;

                      const isIsolated =
                        config.stage === 2 && receivedAllCount === 0;
                      const isLowReceived =
                        config.stage === 2 && receivedAllCount === 1;
                      const guessedStu = stu.guessedAngelId
                        ? students.find((c) => c.id === stu.guessedAngelId)
                        : undefined;
                      const letterCount =
                        (sScore.hasThankLetter ? 1 : 0) +
                        (sScore.hasRevealLetter ? 1 : 0);

                      return (
                        <tr
                          key={stu.id}
                          className={`hover:bg-[#F5F6F8]/70 transition-colors ${
                            isIsolated ? 'bg-red-50/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-extrabold text-[#191919] whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setDetailRecordStudentId(stu.id)}
                              className="text-left hover:underline underline-offset-2"
                              title="학생의 편지와 활동 기록 자세히 보기"
                            >
                              {stu.number}번 {stu.name}
                            </button>
                          </td>

                          {config.stage < 3 && (
                            <>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {stu.openingLetterToAngel?.trim() &&
                                stu.openingReplyToTarget?.trim() ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                                    편지·답장 완료
                                  </span>
                                ) : stu.openingLetterToAngel?.trim() ? (
                                  <span className="px-2 py-0.5 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs font-extrabold">
                                    편지 O · 답장 대기
                                  </span>
                                ) : stu.openingReplyToTarget?.trim() ? (
                                  <span className="px-2 py-0.5 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs font-extrabold">
                                    답장 O · 편지 X
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-[#767676]">
                                    미작성
                                  </span>
                                )}
                              </td>
                              {config.stage === 2 && <>
                              <td className="py-2.5 px-3 font-semibold text-[#191919] whitespace-nowrap">
                                {sScore.verifiedSentCount}인증{' '}
                                <span className="text-xs text-[#767676]">
                                  ({sentAllCount})
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                                <span
                                  className={
                                    isIsolated
                                      ? 'text-red-600 font-extrabold'
                                      : 'text-[#191919]'
                                  }
                                >
                                  {receivedAllCount}건
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {unverifiedReceivedCount > 0 ? (
                                  <span className="px-2 py-0.5 rounded-md bg-[#FEE500] text-[#3C1E1E] font-extrabold text-xs">
                                    {unverifiedReceivedCount}건
                                  </span>
                                ) : (
                                  <span className="text-xs text-[#767676]">-</span>
                                )}
                              </td>
                              </>}
                            </>
                          )}

                          {collectingFinale && (
                            <>
                              <td className="py-2.5 px-3 font-semibold text-[#191919] whitespace-nowrap">
                                {sScore.verifiedSentCount}회
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {stu.guessedAngelId ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                                      투표 완료
                                    </span>
                                    {!hideGuessNames && guessedStu && (
                                      <span className="text-xs font-bold text-[#191919]">
                                        → {guessedStu.number}번 {guessedStu.name}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-extrabold">
                                    미제출
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {letterCount === 2 ? (
                                  <span className="px-2 py-0.5 rounded-md bg-[#FEE500] text-[#3C1E1E] text-xs font-extrabold">
                                    2/2 완료 (+30)
                                  </span>
                                ) : letterCount === 1 ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs font-extrabold">
                                      1/2 작성 중
                                    </span>
                                    <span className="text-[11px] text-[#767676]">
                                      ({sScore.hasThankLetter ? '감사 O' : '감사 X'} ·{' '}
                                      {sScore.hasRevealLetter ? '공개 O' : '공개 X'})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-medium text-[#767676]">
                                    미작성
                                  </span>
                                )}
                              </td>
                            </>
                          )}

                          {identityRevealed && (
                            <>
                              <td className="py-2.5 px-3 font-semibold text-[#191919] whitespace-nowrap">
                                {sScore.verifiedSentCount}회
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  {guessedStu && (
                                    <span className="text-xs font-bold text-[#767676]">
                                      {guessedStu.number}.{guessedStu.name}
                                    </span>
                                  )}
                                  {sScore.guessBonus === 50 ? (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                                      정답 +50
                                    </span>
                                  ) : stu.guessedAngelId ? (
                                    <span className="text-xs font-bold text-[#767676]">
                                      오답
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                                      미제출
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {!sScore.isStealthMasterEligible ? (
                                  <span className="text-xs font-medium text-[#767676]">
                                    5회 미만
                                  </span>
                                ) : sScore.wasCaughtByTarget ? (
                                  <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-extrabold">
                                    들킴
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                                    안 들킴 +50
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {letterCount === 2 ? (
                                  <span className="px-2 py-0.5 rounded-md bg-[#FEE500] text-[#3C1E1E] text-xs font-extrabold">
                                    2/2 완료
                                  </span>
                                ) : letterCount === 1 ? (
                                  <span className="px-2 py-0.5 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs font-extrabold">
                                    1/2
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-[#767676]">
                                    미작성
                                  </span>
                                )}
                              </td>
                            </>
                          )}

                          {/* 공통 컬럼: 받은 훈장 / 총점 */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {(stu.medals || []).length > 0 ? (
                              <span className="text-xs font-extrabold text-[#B45309]">
                                {(stu.medals || []).length}개 (+{sScore.medalPoints}점)
                              </span>
                            ) : (
                              <span className="text-xs text-[#767676]">0개</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-black text-[#191919] whitespace-nowrap">
                            {sScore.totalScore}점
                          </td>

                          {config.stage === 2 && (
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isIsolated ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 font-extrabold text-xs">
                                  <AlertCircle className="w-3 h-3" />
                                  관심 필요
                                </span>
                              ) : isLowReceived ? (
                                <span className="text-xs font-bold text-[#767676]">
                                  격려 권장
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-[#191919]">
                                  원활
                                </span>
                              )}
                            </td>
                          )}

                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setAwardMedalTarget(stu);
                                  const first = medalTemplates[0];
                                  if (first) {
                                    setModalIcon(first.icon);
                                    setModalTitle(first.title);
                                    setModalReason(first.reason);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black inline-flex items-center gap-1"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>훈장</span>
                              </button>
                              {config.stage === 2 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPostmasterTarget(stu);
                                    setPostmasterMessage(
                                      `${stu.name}야! 오늘 친구들에게 친절하게 대하는 모습이 정말 멋졌어! 선생님이 항상 응원할게!`
                                    );
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 text-[#191919] text-xs font-bold inline-flex items-center gap-1 border border-[#E5E7EB]"
                                >
                                  <MailPlus className="w-3.5 h-3.5" />
                                  <span>응원</span>
                                </button>
                              )}
                              {identityRevealed && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewWorkbookStudent(stu)}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-[#191919] hover:bg-[#F5F6F8] text-xs font-bold inline-flex items-center gap-1"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>인쇄</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDetailRecordStudentId(stu.id)}
                                title="잠입 확인(읽기 전용) — 학생의 새 편지 알림에 영향 없음"
                                className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-bold text-[#191919] hover:bg-[#FFF5D6] inline-flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#735020]" />
                                <span>기록</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectStudentPreview(stu.id)}
                                title="잠입 확인 모드로 학생 화면 보기 — 학생의 새 편지 알림이나 확인 상태에 영향을 주지 않습니다"
                                className="px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-bold text-[#767676] hover:bg-[#F5F6F8]"
                              >
                                잠입 보기
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}

      {/* ================================================================= */}
      {/* [탭 2-1] 활동 기록 (편지/비밀 활동 모아보기 · 익명화 · CSV 내보내기) */}
      {/* ================================================================= */}
      {activeTab === 'records' && (
        <TeacherRecordsTab
          key={classId}
          students={students}
          missions={missions}
          chats={chats}
          config={config}
          anonymize={anonymizeRecords}
          onToggleAnonymize={() => setAnonymizeRecords((prev) => !prev)}
          onOpenStudentRecord={(stu) => setDetailRecordStudentId(stu.id)}
          onOpenLetterCapture={(rec) => setActiveLetterCapture(rec)}
          onNotice={showToast}
        />
      )}

      {/* ================================================================= */}
      {/* [탭 3] 훈장 관리 (전용 탭: 우리 반 커스텀 훈장 제작 & 학생 수여) */}
      {/* ================================================================= */}
      {activeTab === 'medals' && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-7 no-print">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E7EB] space-y-6">
            <div className="border-b border-[#F0F1F4] pb-3">
              <h2 className="text-lg font-extrabold text-[#191919]">
                영예의 훈장 만들기(커스텀) & 학생 수여 (+30점)
              </h2>
              <p className="text-xs sm:text-sm text-[#767676] mt-0.5">
                우리 반만의 훈장을 직접 만들고, 열심히 활동하는 학생에게 바로 +30점 훈장을 수여하세요.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 좌측 7컬럼: 훈장 목록 & 빠른 수여 */}
              <div className="lg:col-span-7 space-y-4">
                <div className="text-xs font-extrabold text-[#191919]">
                  1. 수여할 훈장 고르기 ({medalTemplates.length}종)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {medalTemplates.map((tpl) => {
                    const isPicked = selectedTemplate?.id === tpl.id;
                    return (
                      <div
                        key={tpl.id}
                        className={`rounded-lg p-3 border flex items-start justify-between gap-2 transition-all cursor-pointer ${
                          isPicked
                            ? 'bg-[#FFFBEB] border-[#3C1E1E] ring-1 ring-[#3C1E1E]'
                            : 'bg-[#F5F6F8] border-[#E5E7EB] hover:bg-white'
                        }`}
                        onClick={() => setSelectedTemplateId(tpl.id)}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <HonorMedalIcon type={tpl.icon} size={38} />
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#191919] truncate">
                              {tpl.title} (+{tpl.points}점)
                            </div>
                            <p className="text-[11px] text-[#767676] line-clamp-2 leading-snug mt-0.5">
                              {tpl.reason}
                            </p>
                          </div>
                        </div>
                        {medalTemplates.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMedalTemplate(tpl.id);
                              showToast('훈장 목록에서 삭제되었습니다.');
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 shrink-0"
                            title="훈장 템플릿 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 빠른 수여 컨트롤 바 */}
                <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-lg p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <select
                    value={quickAwardStudentId}
                    onChange={(e) => setQuickAwardStudentId(e.target.value)}
                    className="rounded-lg bg-white border border-[#E5E7EB] px-3 py-2 text-xs sm:text-sm font-extrabold text-[#191919]"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.number}번 {s.name} (현재 훈장 {(s.medals || []).length}개)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleQuickAwardMedal}
                    className="flex-1 py-2 px-4 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs sm:text-sm font-black flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-4 h-4" strokeWidth={2.4} />
                    <span>[{selectedTemplate?.title}] 수여하기 (+30점)</span>
                  </button>
                </div>
              </div>

              {/* 우측 5컬럼: 새 커스텀 훈장 직접 만들기 */}
              <form
                onSubmit={handleCreateCustomMedal}
                className="lg:col-span-5 bg-[#F5F6F8] rounded-xl p-5 border border-[#E5E7EB] space-y-3"
              >
                <div className="text-xs font-extrabold text-[#191919]">
                  2. 우리 반 새 커스텀 훈장 만들기
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {MEDAL_ICON_CHOICES.map((choice) => (
                    <button
                      key={choice.icon}
                      type="button"
                      onClick={() => setCustomIcon(choice.icon)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all ${
                        customIcon === choice.icon
                          ? 'bg-[#FEE500] border-[#3C1E1E] text-[#3C1E1E]'
                          : 'bg-white border-[#E5E7EB] text-[#767676]'
                      }`}
                    >
                      <HonorMedalIcon type={choice.icon} size={22} />
                      <span>{choice.label}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="새 훈장 이름 (예: 급식 정리 천사 훈장)"
                  className="w-full rounded-lg bg-white border border-[#E5E7EB] px-3.5 py-2 text-xs sm:text-sm text-[#191919]"
                />
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="칭찬 사유 (예: 급식실 뒷정리를 솔선수범해 주었어요!)"
                  className="w-full rounded-lg bg-white border border-[#E5E7EB] px-3.5 py-2 text-xs sm:text-sm text-[#191919]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#3C1E1E] hover:bg-black text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>커스텀 훈장 목록에 추가하기</span>
                </button>
              </form>
            </div>
          </div>
        </main>
      )}

      {/* ================================================================= */}
      {/* @media print 전용 */}
      {/* ================================================================= */}
      <div className="hidden print-only">
        {showGuidePosterModal ? (
          <SuhoGuidePoster classNameText={config.className} />
        ) : showLoginSlipsModal ? (
          <LoginSlipPrintSheet
            classId={classId}
            students={students}
            config={config}
            loginUrl={loginUrl}
          />
        ) : !identityRevealed ? null : previewWorkbookStudent ? (
          <WorkbookPrintSheet
            student={
              students.find((s) => s.id === previewWorkbookStudent.id) ||
              previewWorkbookStudent
            }
            students={students}
            missions={missions}
            config={config}
            isPageBreak={false}
          />
        ) : (
          students.map((stu, idx) => (
            <WorkbookPrintSheet
              key={stu.id}
              student={stu}
              students={students}
              missions={missions}
              config={config}
              isPageBreak={idx < students.length - 1}
            />
          ))
        )}
      </div>

      {/* ================================================================= */}
      {/* 3단계 전체화면 한 명씩 정체 공개 애니메이션 쇼 모달 */}
      {/* ================================================================= */}
      {identityRevealed && showRevealShow && (
        <div className="fixed inset-0 z-[60] bg-[#F5F6F8] flex flex-col no-print">
          <div className="bg-white border-b border-[#E5E7EB] px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <SuhoKakaoLogo size={34} />
              <div>
                <div className="text-[11px] font-bold text-[#767676]">
                  {config.className}
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#191919]">
                  수호천사 전체 정체 공개 발표
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-[#FEE500] text-[#3C1E1E]">
                {revealIndex < students.length
                  ? `${revealIndex + 1} / ${students.length}명`
                  : '전체 연결 고리 요약'}
              </span>
              {revealIndex < students.length && (
                <button
                  type="button"
                  onClick={() => setRevealIndex(students.length)}
                  className="px-3 py-1.5 rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] text-[#191919] text-xs font-extrabold"
                >
                  전체 요약 보기
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowRevealShow(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#3C1E1E] text-white text-xs font-extrabold flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span>발표 닫기</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex items-center justify-center p-6">
            {revealIndex < students.length ? (() => {
              const targetStu = students[revealIndex];
              const angelStu = findGuardianAngelOf(targetStu.id, students);
              const receivedHints = missions.filter(
                (m) => m.receiverId === targetStu.id && !m.isPostmasterNote
              );
              const targetScore = calculateStudentScore(
                targetStu.id,
                students,
                missions,
                3
              );
              const angelScore = angelStu
                ? calculateStudentScore(angelStu.id, students, missions, 3)
                : null;
              const guessedStu = students.find(
                (s) => s.id === targetStu.guessedAngelId
              );

              return (
                <div className="max-w-3xl w-full bg-white rounded-xl p-8 sm:p-10 shadow-xl border-2 border-[#FEE500] text-center space-y-6">
                  {!isCurrentRevealed ? (
                    <>
                      <div className="flex justify-center">
                        <div className="bg-[#F5F6F8] p-4 rounded-xl">
                          <SuhoHamster variant="stealth" size={110} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="inline-block px-3 py-1 rounded-md bg-[#FEE500] text-xs font-black text-[#3C1E1E]">
                          두구두구... 과연 누구일까요?
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-[#191919]">
                          <span>
                            {targetStu.number}번 {targetStu.name}
                          </span>{' '}
                          친구를 몰래 챙겨준
                          <br />
                          수호천사는 누구였을까요?
                        </h3>
                      </div>

                      <div className="bg-[#F5F6F8] rounded-lg p-4 text-left space-y-2">
                        <div className="text-xs font-extrabold text-[#767676]">
                          그동안 {targetStu.name}에게 도착했던 미션 힌트:
                        </div>
                        {receivedHints.length === 0 ? (
                          <p className="text-xs text-[#767676]">
                            조용히 마음으로 응원해 주던 비밀 수호천사가 있었어요!
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {receivedHints.slice(0, 3).map((h) => (
                              <div
                                key={h.id}
                                className="bg-white rounded-lg px-3.5 py-2 border border-[#E5E7EB] text-xs sm:text-sm text-[#191919]"
                              >
                                “{h.content}”
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="pt-2 text-xs font-bold text-[#191919]">
                          {targetStu.name} 친구의 추리:{' '}
                          <span className="text-[#D97706]">
                            {guessedStu
                              ? `${guessedStu.number}번 ${guessedStu.name}`
                              : '미제출'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCurrentRevealed(true)}
                        className="px-7 py-3.5 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-base sm:text-lg font-black inline-flex items-center gap-2 shadow-md transition-transform hover:scale-105"
                      >
                        <Sparkles className="w-5 h-5" strokeWidth={2.4} />
                        <span>두구두구... 수호천사 공개하기!</span>
                      </button>
                    </>
                  ) : (
                    <div className="animate-suho-reveal space-y-6">
                      <div className="flex justify-center">
                        <div className="bg-[#FFFBEB] p-4 rounded-xl border-2 border-[#FEE500]">
                          <SuhoHamster variant="welcome" size={115} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="inline-block px-3 py-1 rounded-md bg-[#FEE500] text-[#3C1E1E] text-xs font-black">
                          정체 공개!
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-[#191919] leading-snug">
                          {targetStu.name} 친구의 수호천사는
                          <br />
                          바로{' '}
                          <span className="inline-block bg-[#FEE500] text-[#3C1E1E] px-4 py-1 rounded-lg mt-2 border-2 border-[#3C1E1E]">
                            {angelStu
                              ? `${angelStu.number}번 ${angelStu.name}`
                              : '미지정'}
                          </span>{' '}
                          친구였습니다!
                        </h3>
                      </div>

                      {angelStu?.revealLetterToTarget && (
                        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-4 text-left">
                          <div className="text-xs font-extrabold text-[#B45309] mb-1">
                            {angelStu.name} 친구가 보낸 정체 공개 편지:
                          </div>
                          <p className="text-sm text-[#191919] leading-relaxed font-medium">
                            “{angelStu.revealLetterToTarget}”
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                        <div className="bg-[#F5F6F8] rounded-lg p-3.5">
                          <span className="text-[#767676] block text-xs">
                            {targetStu.name}의 추리 결과
                          </span>
                          <strong className="text-sm font-black text-[#191919]">
                            {targetScore.guessBonus === 50
                              ? '정확히 맞혔어요! (+50점)'
                              : `아쉬워요! (${guessedStu ? guessedStu.name : '미제출'} 지목)`}
                          </strong>
                        </div>
                        {angelStu && angelScore && (
                          <div className="bg-[#F5F6F8] rounded-lg p-3.5">
                            <span className="text-[#767676] block text-xs">
                              수호천사 {angelStu.name}의 정체 숨기기
                            </span>
                            <strong className="text-sm font-black text-[#191919]">
                              {angelScore.stealthMasterBonus === 50
                                ? '안 들키고 성공! (+50점)'
                                : angelScore.wasCaughtByTarget
                                ? '정체가 들켰어요!'
                                : '인증 5회 미만'}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="max-w-4xl w-full bg-white rounded-xl p-8 shadow-xl border-2 border-[#FEE500] space-y-6 animate-suho-reveal">
                <div className="text-center space-y-2">
                  <span className="inline-block px-3 py-1 rounded-md bg-[#FEE500] text-[#3C1E1E] text-xs font-black">
                    모두 수고했어요!
                  </span>
                  <h3 className="text-2xl font-black text-[#191919]">
                    우리 반 수호천사 연결 고리 한눈에 보기 ({students.length}명)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
                  {students.map((stu) => {
                    const angel = findGuardianAngelOf(stu.id, students);
                    return (
                      <div
                        key={stu.id}
                        className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-lg p-3.5 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[11px] text-[#767676] block">
                            수호천사
                          </span>
                          <span className="font-black text-sm text-[#3C1E1E]">
                            {angel ? `${angel.number}번 ${angel.name}` : '-'}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#D97706]" />
                        <div className="text-right">
                          <span className="text-[11px] text-[#767676] block">
                            챙김 받은 짝꿍
                          </span>
                          <span className="font-black text-sm text-[#191919]">
                            {stu.number}번 {stu.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border-t border-[#E5E7EB] px-6 py-4 flex items-center justify-between max-w-4xl w-full mx-auto rounded-t-xl">
            <button
              type="button"
              disabled={revealIndex === 0}
              onClick={() => {
                setRevealIndex((i) => Math.max(0, i - 1));
                setIsCurrentRevealed(false);
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-extrabold flex items-center gap-1.5 ${
                revealIndex === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'bg-[#F5F6F8] hover:bg-gray-200 text-[#191919]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전 친구</span>
            </button>

            {revealIndex < students.length ? (
              <button
                type="button"
                onClick={() => {
                  setRevealIndex((i) => Math.min(students.length, i + 1));
                  setIsCurrentRevealed(false);
                }}
                className="px-5 py-2 rounded-lg bg-[#3C1E1E] hover:bg-black text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5"
              >
                <span>
                  {revealIndex + 1 < students.length
                    ? `다음 친구 (${students[revealIndex + 1].number}번 ${
                        students[revealIndex + 1].name
                      })`
                    : '전체 연결 고리 요약 보기'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowRevealShow(false)}
                className="px-5 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs sm:text-sm font-black"
              >
                발표 마치기
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 모달 1: [선생님 비밀 응원 발송] */}
      {/* ================================================================= */}
      {postmasterTarget && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-md bg-[#FEE500] text-[#3C1E1E]">
                <HeartHandshake className="w-4 h-4" />
                선생님 비밀 응원 보내기
              </span>
              <button
                type="button"
                onClick={() => setPostmasterTarget(null)}
                className="p-1 rounded-lg hover:bg-[#F5F6F8]"
              >
                <X className="w-5 h-5 text-[#191919]" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <SuhoHamster variant="heart" size={54} />
              <div>
                <h3 className="text-base font-extrabold text-[#191919]">
                  To. {postmasterTarget.number}번 {postmasterTarget.name} 학생에게
                </h3>
                <p className="text-xs text-[#767676]">
                  선생님 명의로 학생에게 따뜻한 특별 응원 메시지를 보낼 수 있어요.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendPostmasterSubmit}>
              <textarea
                rows={3}
                value={postmasterMessage}
                onChange={(e) => setPostmasterMessage(e.target.value)}
                className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none p-3.5 text-sm text-[#191919]"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPostmasterTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#767676]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#FEE500] text-[#3C1E1E] text-xs font-black flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>응원 발송하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 모달 2: 개별 학생 A4 활동 기록지 인쇄 미리보기 모달 */}
      {/* ================================================================= */}
      {identityRevealed && previewWorkbookStudent && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 no-print">
          <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-[#191919]" />
                <div>
                  <h3 className="text-lg font-extrabold text-[#191919]">
                    {previewWorkbookStudent.number}번 {previewWorkbookStudent.name}{' '}
                    학생 활동 기록장 (A4 2쪽)
                  </h3>
                  <p className="text-xs text-[#767676]">
                    인쇄 설정에서 <strong>양면 인쇄</strong>(앞·뒤 1장) 또는 <strong>2쪽 모아찍기</strong>(반접이 소책자)를 선택해 뽑아 주세요.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>이 학생 기록장 인쇄 / PDF (2쪽)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewWorkbookStudent(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-5 h-5 text-[#191919]" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-6 pr-1">
              <WorkbookPrintSheet
                student={
                  students.find((s) => s.id === previewWorkbookStudent.id) ||
                  previewWorkbookStudent
                }
                students={students}
                missions={missions}
                config={config}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 모달 3: 학생 행에서 여는 [훈장 수여 (+30점)] 모달 */}
      {/* ================================================================= */}
      {awardMedalTarget && (() => {
        const liveStudent =
          students.find((s) => s.id === awardMedalTarget.id) || awardMedalTarget;
        const liveMedals = liveStudent.medals || [];

        return (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 no-print">
            <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-[#D97706]" strokeWidth={2.2} />
                  <div>
                    <h3 className="text-lg font-extrabold text-[#191919]">
                      {liveStudent.number}번 {liveStudent.name} 학생에게 훈장 수여 (+30점)
                    </h3>
                    <p className="text-xs text-[#767676]">
                      수여한 훈장은 학생 화면 오른쪽 진열장에 쌓이고 총점에 +30점이 더해집니다.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAwardMedalTarget(null)}
                  className="p-1.5 rounded-lg hover:bg-[#F5F6F8]"
                >
                  <X className="w-5 h-5 text-[#191919]" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-5 pr-1">
                <div>
                  <label className="block text-xs font-extrabold text-[#191919] mb-2">
                    1. 훈장 선택하기
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {medalTemplates.map((preset) => {
                      const active =
                        modalIcon === preset.icon && modalTitle === preset.title;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setModalIcon(preset.icon);
                            setModalTitle(preset.title);
                            setModalReason(preset.reason);
                          }}
                          className={`text-left rounded-lg p-2.5 border flex items-center gap-2.5 transition-all ${
                            active
                              ? 'bg-[#FFFBEB] border-[#3C1E1E] ring-1 ring-[#3C1E1E]'
                              : 'bg-[#F5F6F8] border-[#E5E7EB] hover:bg-white'
                          }`}
                        >
                          <HonorMedalIcon type={preset.icon} size={38} />
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[#191919] truncate">
                              {preset.title}
                            </div>
                            <div className="text-[11px] text-[#B45309] font-bold">
                              +{preset.points}점 보너스
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!modalTitle.trim() || !modalReason.trim()) return;
                    onAwardMedal(
                      liveStudent.id,
                      modalIcon,
                      modalTitle.trim(),
                      modalReason.trim()
                    );
                    showToast(
                      `${liveStudent.name} 학생에게 [${modalTitle.trim()}] (+30점)을 수여했습니다.`
                    );
                  }}
                  className="bg-[#F5F6F8] rounded-xl p-4 border border-[#E5E7EB] space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <HonorMedalIcon type={modalIcon} size={46} />
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-[#767676] mb-1">
                        훈장 이름 (수정 가능)
                      </label>
                      <input
                        type="text"
                        value={modalTitle}
                        onChange={(e) => setModalTitle(e.target.value)}
                        className="w-full rounded-lg bg-white border border-[#E5E7EB] px-3 py-2 text-xs sm:text-sm font-bold text-[#191919]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#767676] mb-1">
                      선생님 칭찬 한마디
                    </label>
                    <input
                      type="text"
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      className="w-full rounded-lg bg-white border border-[#E5E7EB] px-3 py-2 text-xs sm:text-sm text-[#191919]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs sm:text-sm font-black flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-4 h-4" strokeWidth={2.3} />
                    <span>{liveStudent.name} 학생에게 훈장 수여하기 (+30점)</span>
                  </button>
                </form>

                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-[#191919]">
                    현재 보유 중인 훈장 ({liveMedals.length}개 · +{liveMedals.length * 30}점)
                  </div>
                  {liveMedals.length === 0 ? (
                    <p className="text-xs text-[#767676]">
                      아직 수여한 훈장이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {liveMedals.map((m) => (
                        <div
                          key={m.id}
                          className="bg-[#F5F6F8] rounded-lg p-2.5 border border-[#E5E7EB] flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <HonorMedalIcon type={m.icon} size={32} />
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-[#191919] truncate">
                                {m.title} (+{m.points}점)
                              </div>
                              <div className="text-[11px] text-[#767676] truncate">
                                {m.reason}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveMedal(liveStudent.id, m.id);
                              showToast('선택한 훈장을 회수했습니다.');
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                            title="훈장 회수"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ================================================================= */}
      {/* 모달 4: [입장 카드 인쇄 (오려 나눠주기)] A4 미리보기 모달 */}
      {/* ================================================================= */}
      {showLoginSlipsModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 no-print">
          <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-[#191919]" />
                <div>
                  <h3 className="text-lg font-extrabold text-[#191919]">
                    학생 개인 비밀 입장 카드 인쇄 ({students.length}명)
                  </h3>
                  <p className="text-xs text-[#767676]">
                    A4 1장당 10명씩 인쇄됩니다. 실선을 따라 직사각형으로 잘라 학생들에게 나누어 주세요.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>입장 카드 인쇄하기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginSlipsModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-5 h-5 text-[#191919]" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto pr-1">
              <LoginSlipPrintSheet
                classId={classId}
                students={students}
                config={config}
                loginUrl={loginUrl}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 모달 5: [접속 QR 크게 보기] 교실 전자칠판/TV 프로젝터용 모달 */}
      {/* ================================================================= */}
      {showQrBoardModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#191919]" />
                <h3 className="text-base font-extrabold text-[#191919]">
                  {config.className} 접속 QR
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQrBoardModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#F5F6F8]"
              >
                <X className="w-5 h-5 text-[#191919]" />
              </button>
            </div>

            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-6 flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-lg border border-[#E5E7EB]">
                <QRCodeSVG
                  value={loginUrl}
                  size={220}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#191919"
                />
              </div>
              <p className="text-xs font-bold text-[#3C1E1E]">
                카메라로 QR을 찍고 이름 + 5자리 코드를 입력하세요
              </p>
            </div>

            <p className="text-xs text-[#767676]">
              [학생 접속 링크 복사]를 눌러 우리 반 알림장·하이클래스에 공유해 주세요.
            </p>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(loginUrl);
                    showToast('학생 접속 링크가 클립보드에 복사되었습니다.');
                  } catch {
                    showToast('링크 복사에 실패했습니다.');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>학생 접속 링크 복사</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQrBoardModal(false)}
                className="px-4 py-2 rounded-lg bg-[#F5F6F8] hover:bg-gray-200 border border-[#E5E7EB] text-xs font-bold text-[#191919]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 모달 6: [새 학급 만들기] 모달 */}
      {/* ================================================================= */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#3C1E1E]" />
                <h3 className="text-base font-extrabold text-[#191919]">
                  새 학급 만들기
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateClassModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#F5F6F8]"
              >
                <X className="w-5 h-5 text-[#191919]" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleanTitle = newClassTitle.trim();
                const cleanPw = newClassPw.trim();
                if (!cleanTitle) {
                  setCreateClassErr('학급 이름을 입력해 주세요.');
                  return;
                }
                if (cleanPw.length < 4) {
                  setCreateClassErr('교사용 비밀번호를 4자 이상 입력해 주세요.');
                  return;
                }
                onCreateClass(cleanTitle, cleanPw);
                setShowCreateClassModal(false);
                setActiveTab('setup');
                showToast(
                  `[${cleanTitle}] 학급과 전용 접속 링크가 생성되었습니다.`
                );
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-extrabold text-[#191919] mb-1">
                  학급 이름
                </label>
                <input
                  type="text"
                  value={newClassTitle}
                  onChange={(e) => {
                    setNewClassTitle(e.target.value);
                    setCreateClassErr('');
                  }}
                  placeholder="예) 5학년 1반 수호톡"
                  autoFocus
                  className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none px-3.5 py-2 text-sm font-semibold text-[#191919]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#191919] mb-1">
                  교사용 비밀번호 (4자 이상)
                </label>
                <input
                  type="password"
                  value={newClassPw}
                  onChange={(e) => {
                    setNewClassPw(e.target.value);
                    setCreateClassErr('');
                  }}
                  placeholder="4자 이상 입력"
                  autoComplete="new-password"
                  className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none px-3.5 py-2 text-sm text-[#191919]"
                />
              </div>

              {createClassErr && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs font-bold">
                  {createClassErr}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#767676] hover:bg-[#F5F6F8]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black"
                >
                  학급 생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMatchingModal && (
        <MatchingBoardModal
          students={students}
          onBatchUpdateTargets={onBatchUpdateTargets}
          onRunRandomMatching={onRunRandomMatching}
          onClearMatching={onClearMatching}
          onClose={() => setShowMatchingModal(false)}
          onNotify={showToast}
        />
      )}

      {pendingStageChange !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="progress-dialog-title"
            className="w-full max-w-md space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-2xl">
            <h2 id="progress-dialog-title" className="text-lg font-black">
              {pendingStageChange === 'reveal' ? '수호천사의 정체를 공개할까요?' : `${STAGE_INFO[pendingStageChange].label} 열기`}
            </h2>
            <div className="space-y-2 rounded-xl bg-[#fff5d6] p-4 text-sm leading-relaxed">
              {pendingStageChange === 'reveal' ? <>
                <p>공개하면 학생이 수호천사의 정체, 추리 결과와 받은 마지막 편지를 볼 수 있어요. 투표와 편지 작성이 마감됩니다.</p>
                <p className="font-extrabold">추리 투표 {stageSummary.votedCount}/{students.length}명 · 마지막 편지 {stageSummary.lettersDoneCount}/{students.length}명</p>
              </> : <>
                <p>{STAGE_INFO[pendingStageChange].desc}</p>
                {pendingStageChange === 3 && <p className="font-bold">정체는 선생님이 ‘정체 공개하기’를 누를 때 열립니다.</p>}
                {pendingStageChange < config.stage && <p>작성한 편지와 활동 기록은 그대로 남습니다.</p>}
              </>}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" disabled={savingProgress} onClick={() => setPendingStageChange(null)}
                className="min-h-11 rounded-lg px-4 text-sm font-bold hover:bg-[#f5f6f8]">취소</button>
              <button type="button" disabled={savingProgress} onClick={() => void confirmProgress()}
                className={`min-h-11 rounded-lg px-4 text-sm font-extrabold disabled:opacity-50 ${
                  pendingStageChange === 'reveal' ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-[#fee500] hover:bg-[#f4d900]'
                }`}>
                {savingProgress ? '저장 중…' : pendingStageChange === 'reveal' ? '학생에게 정체 공개' : `${pendingStageChange}단계로 전환하기`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuidePosterModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 no-print"
          onClick={() => setShowGuidePosterModal(false)}
        >
          <div
            className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col p-5 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-[#191919]" />
                <div>
                  <h3 className="text-lg font-extrabold text-[#191919]">
                    교실 게시판용 규칙·점수 안내판 (A4 1장)
                  </h3>
                  <p className="text-xs text-[#767676]">
                    인쇄하거나 PDF로 저장해 교실 게시판에 붙여두세요. (A3 확대 인쇄도 선명합니다!)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>안내판 인쇄 / PDF 저장</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuidePosterModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-5 h-5 text-[#191919]" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto pr-1">
              <SuhoGuidePoster classNameText={config.className} />
            </div>
          </div>
        </div>
      )}

      {showLeaderboardModal && (
        <LeaderboardModal
          students={students}
          missions={missions}
          config={config}
          anonymize={anonymizeRecords}
          onToggleAnonymize={() => setAnonymizeRecords((prev) => !prev)}
          onClose={() => setShowLeaderboardModal(false)}
        />
      )}

      {detailRecordStudent && (
        <StudentRecordModal
          student={detailRecordStudent}
          students={students}
          missions={missions}
          config={config}
          anonymize={anonymizeRecords}
          onToggleAnonymize={() => setAnonymizeRecords((prev) => !prev)}
          onSelectStudent={(studentId) => setDetailRecordStudentId(studentId)}
          onOpenLetterCapture={(rec) => setActiveLetterCapture(rec)}
          onClose={() => setDetailRecordStudentId(null)}
          onNotice={showToast}
        />
      )}

      {activeLetterCapture && (
        <TeacherLetterCaptureModal
          letter={activeLetterCapture}
          students={students}
          anonymize={anonymizeRecords}
          onToggleAnonymize={() => setAnonymizeRecords((prev) => !prev)}
          onClose={() => setActiveLetterCapture(null)}
          onNotice={showToast}
        />
      )}
    </div>
  );
};
