import React, { useState } from 'react';
import {
  ActivityType,
  ChatMessage,
  ClassConfig,
  GameStage,
  MissionLog,
  Student,
} from '../types';
import {
  ACTIVITY_META_LIST,
  getTodayDateKey,
} from '../data/mockData';
import {
  calculateStudentScore,
  findGuardianAngelOf,
  findTargetPartnerOf,
  getDailyLimitStatus,
} from '../utils/scoring';
import { getScoreStage, isIdentityRevealed } from '../utils/classProgress';
import { isWeeklyQuestVisible } from '../utils/weeklyQuest';
import { SuhoHamster, SuhoKakaoLogo } from './SuhoHamster';
import { HonorMedalIcon } from './HonorMedalIcon';
import { ActivityLineIcon } from './WorkbookPrintSheet';
import { LetterStationeryEditor } from './LetterStationeryEditor';
import { ArrivedLetterData, LetterArrivalModal } from './LetterArrivalModal';
import { StudentChatView } from './StudentChatView';
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  EyeOff,
  Feather,
  HelpCircle,
  Lock,
  LogOut,
  MailCheck,
  MailOpen,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

interface StudentViewProps {
  classId: string;
  student: Student;
  students: Student[];
  missions: MissionLog[];
  chats?: ChatMessage[];
  config: ClassConfig;
  onSendMission: (type: ActivityType, content: string) => Promise<boolean>;
  onVerifyMission: (missionId: string, reply: string) => Promise<boolean>;
  onHoldMission: (missionId: string) => Promise<boolean>;
  onSaveWork: (patch: StudentWork) => Promise<boolean>;
  onSendChat?: (partnerRole: 'angel' | 'target', content: string) => Promise<boolean>;
  onChatActiveChange?: (active: boolean) => void;
  onLogout?: () => void;
  isPreviewMode?: boolean;
}

type StudentPage = 'home' | 'first-letter' | 'first-reply' | 'mission' | 'inbox' | 'guess' | 'final-reveal' | 'final-thank' | 'records' | 'finale' | 'chat';
type LetterField = 'openingLetterToAngel' | 'openingReplyToTarget' | 'thankLetterToAngel' | 'revealLetterToTarget';
export type StudentWork = Partial<Pick<Student, LetterField | 'guessedAngelId'>>;

export const StudentView: React.FC<StudentViewProps> = ({
  classId,
  student,
  students,
  missions,
  chats = [],
  config,
  onSendMission,
  onVerifyMission,
  onHoldMission,
  onSaveWork,
  onSendChat,
  onChatActiveChange,
  onLogout,
  isPreviewMode = false,
}) => {
  const identityRevealed = isIdentityRevealed(config);
  const isFinaleWriting = config.stage === 3 && !identityRevealed;
  const canReviewMissions = config.stage >= 2 && !identityRevealed;
  const hasWeeklyQuest = config.stage === 2 && isWeeklyQuestVisible(config);
  const phase = identityRevealed ? 'revealed' : config.stage;
  const [navigation, setNavigation] = useState<{ phase: typeof phase; page: StudentPage }>({ phase, page: 'home' });
  const page = navigation.phase === phase ? navigation.page : 'home';
  const [selectedStageState, setSelectedStageState] = useState<{ phase: typeof phase; stage: GameStage }>({
    phase,
    stage: config.stage,
  });
  const viewingStage: GameStage =
    !identityRevealed &&
    selectedStageState.phase === phase &&
    selectedStageState.stage <= config.stage
      ? selectedStageState.stage
      : config.stage;
  const pageTitle = React.useRef<HTMLHeadingElement>(null);
  const focusOnNavigate = React.useRef(false);
  const goTo = (nextPage: StudentPage) => {
    if (nextPage === page) return;
    focusOnNavigate.current = true;
    setNavigation({ phase, page: nextPage });
  };
  const selectStage = (nextStage: GameStage) => {
    if (identityRevealed || nextStage > config.stage) return;
    setSelectedStageState({ phase, stage: nextStage });
    if (page !== 'home') {
      focusOnNavigate.current = true;
    }
    setNavigation({ phase, page: 'home' });
  };

  React.useEffect(() => {
    if (!focusOnNavigate.current) return;
    focusOnNavigate.current = false;
    pageTitle.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [page]);

  const [selectedActivity, setSelectedActivity] = useState<ActivityType>(hasWeeklyQuest ? 'quest' : 'stealth');
  const [activityDraft, setActivityDraft] = useState<{ context: string; content: string }>();
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [verifyingMission, setVerifyingMission] = useState<MissionLog | null>(null);
  const [replyText, setReplyText] = useState('');
  const [drafts, setDrafts] = useState<Partial<Record<LetterField, string>>>({});
  const [guessDraft, setGuessDraft] = useState<string>();
  const selectedGuessId = guessDraft ?? student.guessedAngelId ?? '';

  const score = calculateStudentScore(student.id, students, missions, getScoreStage(config));
  const myTarget = findTargetPartnerOf(student.id, students);
  const myAngel = findGuardianAngelOf(student.id, students);
  const [showTargetName, setShowTargetName] = useState(false);
  const targetHideTimerRef = React.useRef<number>();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = React.useRef<number>();
  const [activeLetterModal, setActiveLetterModal] = useState<ArrivedLetterData | null>(null);
  const [readLetters, setReadLetters] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const saveInProgress = React.useRef(false);

  const getLetterReadKey = (id: string, content: string) =>
    `suhotalk_read_letter_${classId}_${student.id}_${id}_${content.length}_${content.slice(0, 12)}`;

  const isLetterRead = (letter: ArrivedLetterData) => {
    const key = getLetterReadKey(letter.id, letter.content);
    if (readLetters.includes(key)) return true;
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  };

  const markLetterRead = () => {
    if (isPreviewMode || !activeLetterModal) return;
    const key = getLetterReadKey(activeLetterModal.id, activeLetterModal.content);
    setReadLetters((previous) => previous.includes(key) ? previous : [...previous, key]);
    try {
      localStorage.setItem(key, '1');
    } catch {
      // Reading the letter still works when browser storage is unavailable.
    }
  };

  React.useEffect(() => {
    setShowTargetName(false);
    setActiveLetterModal(null);
    setVerifyingMission(null);
    setShowScoreModal(false);
    setSelectedStageState({ phase, stage: config.stage });
    setNavigation({ phase, page: 'home' });
    window.clearTimeout(targetHideTimerRef.current);
  }, [phase, config.stage]);

  React.useEffect(() => () => {
    window.clearTimeout(targetHideTimerRef.current);
    window.clearTimeout(toastTimerRef.current);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setActiveLetterModal(null);
      setShowScoreModal(false);
      setVerifyingMission(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTargetName = () => {
    window.clearTimeout(targetHideTimerRef.current);
    setShowTargetName(!showTargetName);
    if (!showTargetName) {
      targetHideTimerRef.current = window.setTimeout(() => setShowTargetName(false), 4000);
    }
  };

  const showToast = (message: string) => {
    window.clearTimeout(toastTimerRef.current);
    setToastMsg(message);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 3500);
  };

  const save = async (action: () => Promise<boolean>, message: string) => {
    if (isPreviewMode || saveInProgress.current) return false;
    saveInProgress.current = true;
    setIsSaving(true);
    try {
      if (await action()) {
        showToast(message);
        return true;
      }
    } catch {
      // Keep the student's input available for a retry.
    } finally {
      saveInProgress.current = false;
      setIsSaving(false);
    }
    showToast('저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    return false;
  };

  const targetGuessedStudent = students.find((s) => s.id === score.targetGuessedStudentId);
  const myGuessedStudent = students.find((s) => s.id === student.guessedAngelId);
  const dailyLimit = getDailyLimitStatus(student.id, missions, getTodayDateKey(), config.weeklyQuestId);
  const myMedals = student.medals || [];
  const visibleActivities = ACTIVITY_META_LIST.filter((item) => hasWeeklyQuest || item.type !== 'quest');
  const mySentMissions = missions.filter((m) => m.senderId === student.id && !m.isPostmasterNote);
  const pendingSentCount = mySentMissions.filter((m) => m.status === 'pending').length;
  const rejectedSentCount = mySentMissions.filter((m) => m.status === 'hold').length;
  const myReceivedMissions = missions.filter((m) => m.receiverId === student.id);
  const pendingReceivedCount = myReceivedMissions.filter((m) => m.status === 'pending').length;
  const canChooseActivity = (type: ActivityType) => type === 'quest' ? dailyLimit.canSendQuest : dailyLimit.canSendRegular;
  const selectedMeta = visibleActivities.find((m) => m.type === selectedActivity && canChooseActivity(m.type))
    || visibleActivities.find((m) => canChooseActivity(m.type))
    || visibleActivities[0];
  const activityContext = selectedMeta.type === 'quest' ? `quest:${config.weeklyQuestId ?? 'legacy'}` : 'regular';
  const activityContent = activityDraft?.context === activityContext ? activityDraft.content : '';
  const isSelectedTypeDisabled = selectedMeta.type === 'quest' ? !dailyLimit.canSendQuest : !dailyLimit.canSendRegular;

  const handleReportSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = activityContent.trim();
    if (!myTarget || isSelectedTypeDisabled) return;
    if (!content) {
      showToast('친구를 위해 어떤 일을 했는지 적어 주세요.');
      return;
    }
    if (await save(() => onSendMission(selectedMeta.type, content), '기록을 보냈어요. 친구가 확인할 차례예요.')) {
      setActivityDraft(undefined);
      goTo('home');
    }
  };

  const handleConfirmVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verifyingMission) return;
    if (await save(() => onVerifyMission(verifyingMission.id, replyText.trim()), '친구가 도와준 일을 확인했어요.')) {
      setVerifyingMission(null);
      setReplyText('');
    }
  };

  const handleGuessSave = async () => {
    if (!selectedGuessId) return;
    if (await save(() => onSaveWork({ guessedAngelId: selectedGuessId }), '추리를 저장했어요. 정체 공개 날 결과를 알려 드려요.')) {
      setGuessDraft(undefined);
      goTo('home');
    }
  };

  const handleLetterSave = async (event: React.FormEvent, field: LetterField) => {
    event.preventDefault();
    if (
      (field === 'openingLetterToAngel' && Boolean(student.openingLetterToAngel?.trim())) ||
      (field === 'openingReplyToTarget' && Boolean(student.openingReplyToTarget?.trim()))
    ) {
      return;
    }
    const content = (drafts[field] ?? student[field] ?? '').trim();
    if (!content) {
      showToast('편지에 마음을 담아 한 문장 적어 주세요.');
      return;
    }
    if (isFinaleWriting && content.length < 5) {
      showToast('마지막 편지는 다섯 글자 이상 적어 주세요.');
      return;
    }
    const message = isFinaleWriting ? '저장했어요. 정체 공개 날 친구에게 전달돼요.' : '편지를 보냈어요.';
    if (await save(() => onSaveWork({ [field]: content }), message)) {
      setDrafts((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
      goTo('home');
    }
  };

  const getShortMissionLabel = (type: ActivityType) => {
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

  const getMissionSubHint = (type: ActivityType) => {
    switch (type) {
      case 'quest':
        return config.weeklyQuestId ? '미션당 1회' : '주 1회';
      case 'stealth':
        return '자리·물건';
      case 'heart':
        return '쪽지·칭찬';
      case 'power':
        return '청소·도움';
    }
  };

  // [탭 B] 받은 미션 승인 화면
  const renderReceivedApprovalQueue = () => {
    const pendingList = myReceivedMissions
      .filter((m) => m.status === 'pending')
      .reverse();
    const completedReceived = myReceivedMissions
      .filter((m) => m.status === 'verified' || m.status === 'hold')
      .reverse();

    return (
      <div className="space-y-4">
        {/* 간결한 1줄 상단 바 */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#191919]">
            <ShieldCheck className="w-4 h-4 text-[#D97706]" strokeWidth={2.2} />
            <span>받은 미션</span>
          </div>
          <span className="text-xs font-medium text-[#767676]">
            직접 받은 도움을 확인해 주세요.
          </span>
        </div>

        {/* 확인 대기 미션 카드 */}
        {pendingList.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-7 text-center space-y-2 shadow-sm">
            <SuhoHamster variant="welcome" size={60} className="mx-auto" />
            <h3 className="text-sm font-extrabold text-[#191919]">
              확인할 미션이 없어요
            </h3>
            <p className="text-xs text-[#767676]">
              수호천사가 도와준 일을 남기면 여기에 보여요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingList.map((m) => {
              const meta =
                ACTIVITY_META_LIST.find((a) => a.type === m.type) ||
                ACTIVITY_META_LIST[0];

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] border-l-4 border-l-[#FEE500] p-4 sm:p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-extrabold text-[#191919]">
                        {m.isPostmasterNote
                          ? '선생님 특별 응원'
                          : identityRevealed && myAngel
                          ? `수호천사 ${myAngel.number}번 ${myAngel.name}`
                          : '비밀 수호천사'}
                      </span>
                      <span className="text-[#767676]">
                        · {m.isPostmasterNote ? '특별 격려' : meta.title} ·{' '}
                        {m.createdAt}
                      </span>
                    </div>

                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md border bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]">
                      확인이 필요해요
                    </span>
                  </div>

                  {m.questText && <p className="break-words text-xs font-bold text-[#685852]">주간 미션: {m.questText}</p>}

                  <p className="text-sm font-medium text-[#191919] leading-relaxed">
                    {m.content}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyingMission(m);
                        setReplyText('');
                      }}
                      disabled={isSaving || isPreviewMode}
                      className="suho-primary text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>확인했어요</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void save(() => onHoldMission(m.id), '‘잘 모르겠어요’로 응답했어요. 수호천사에게 전달됩니다.')}
                      disabled={isSaving || isPreviewMode}
                      className="suho-secondary text-sm disabled:opacity-55"
                    >
                      <HelpCircle className="w-4 h-4" aria-hidden="true" />
                      <span>잘 모르겠어요</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 응답 완료된 미션 기록 아카이브 (확인 완료 / 잘 모르겠어요) */}
        <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#191919] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>응답한 미션 ({completedReceived.length}건)</span>
            </h3>
            <span className="text-xs font-medium text-[#767676]">
              솔직한 확인 감사합니다
            </span>
          </div>

          {completedReceived.length === 0 ? (
            <p className="text-xs text-[#767676] px-5 py-6 text-center">
              아직 응답한 미션이 없어요.
            </p>
          ) : (
            <div className="divide-y divide-[#F0F1F4]">
              {completedReceived.map((m) => {
                const meta =
                  ACTIVITY_META_LIST.find((a) => a.type === m.type) ||
                  ACTIVITY_META_LIST[0];
                const isVerified = m.status === 'verified';
                return (
                  <div key={m.id} className="p-4 sm:px-5 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-extrabold text-[#191919]">
                          {m.isPostmasterNote
                            ? '선생님 응원'
                            : identityRevealed && myAngel
                            ? `수호천사 ${myAngel.name}`
                            : '비밀 수호천사'}
                        </span>
                        <span className="text-[#767676]">
                          · {m.isPostmasterNote ? '특별 격려' : meta.title} ·{' '}
                          {m.createdAt}
                        </span>
                      </div>

                      {isVerified ? (
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          확인 완료
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          잘 모르겠어요 (미확인)
                        </span>
                      )}
                    </div>

                    {m.questText && <p className="break-words text-xs font-bold text-[#685852]">주간 미션: {m.questText}</p>}

                    <p className="text-xs sm:text-sm text-[#191919] font-medium leading-relaxed">
                      {m.content}
                    </p>

                    {isVerified && m.reply && (
                      <p className="text-xs text-[#767676] border-l-2 border-[#FEE500] pl-2.5 mt-1">
                        내가 남긴 한마디: “{m.reply}”
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  };

  const firstLetterDone = Boolean(student.openingLetterToAngel?.trim());
  const firstReplyDone = Boolean(student.openingReplyToTarget?.trim());
  const revealDone = score.hasRevealLetter;
  const thankDone = score.hasThankLetter;
  const studentLabel = `${student.number}번 ${student.name}`;
  const stageLabel = identityRevealed ? '정체 공개' : { 1: '첫 편지', 2: '비밀 활동', 3: '추리 투표와 마지막 편지' }[viewingStage];
  const ready = Boolean(myTarget && myAngel);

  const letterDetails = {
    'first-letter': {
      field: 'openingLetterToAngel',
      title: firstLetterDone ? '내가 보낸 첫 편지' : '첫 편지 쓰기',
      to: '나를 챙겨줄 수호천사에게',
      from: studentLabel, example: '안녕, 수호천사야! 내가 좋아하는 건…', done: firstLetterDone,
    },
    'first-reply': {
      field: 'openingReplyToTarget',
      title: firstReplyDone ? '내가 보낸 첫 답장' : '첫 답장 쓰기',
      to: '내가 챙겨줄 친구에게',
      from: '너의 비밀 수호천사', example: '안녕! 나는 너를 챙겨줄 비밀 수호천사야. 만나서 반가워!', done: firstReplyDone,
    },
    'final-reveal': {
      field: 'revealLetterToTarget', title: '정체 공개 편지 쓰기', to: '내가 챙겨준 친구에게',
      from: studentLabel, example: `안녕! 너의 수호천사는 바로 나 ${student.name}이었어. 그동안…`, done: revealDone,
    },
    'final-thank': {
      field: 'thankLetterToAngel', title: '감사 편지 쓰기', to: '나를 챙겨준 수호천사에게',
      from: studentLabel, example: '수호천사야, 네가 나를 도와준 날이 기억나. 특히…', done: thankDone,
    },
  } as const;
  const letterForm = page === 'first-letter' || page === 'first-reply' || page === 'final-reveal' || page === 'final-thank'
    ? letterDetails[page] : null;
  const letterFormIsWarm = page === 'first-letter' || page === 'final-reveal';
  const isSentOpeningLetterLocked =
    (page === 'first-letter' && firstLetterDone) ||
    (page === 'first-reply' && firstReplyDone);

  const targetOpeningLetter = myTarget?.openingLetterToAngel?.trim() || '';
  const angelOpeningReply = myAngel?.openingReplyToTarget?.trim() || '';
  const angelRevealLetter = myAngel?.revealLetterToTarget?.trim() || '';
  const targetThankLetter = myTarget?.thankLetterToAngel?.trim() || '';

  const targetOpeningLetterData: ArrivedLetterData | null = targetOpeningLetter
    ? {
        id: 'opening_letter',
        theme: 'warm',
        arrivalTitle: '내가 챙겨줄 친구의 첫 편지',
        badgeLabel: '친구의 첫 편지',
        toLabel: '나의 수호천사',
        fromLabel: '내가 챙겨줄 친구',
        content: targetOpeningLetter,
        hamsterVariant: 'welcome',
        actionLabel: !identityRevealed && ready && !firstReplyDone ? '답장 쓰기' : undefined,
        onAction: () => goTo('first-reply'),
      }
    : null;

  const angelOpeningReplyData: ArrivedLetterData | null = angelOpeningReply
    ? {
        id: 'opening_reply',
        theme: 'rose',
        arrivalTitle: '수호천사의 첫 답장',
        badgeLabel: '수호천사의 첫 답장',
        toLabel: studentLabel,
        fromLabel: '나의 비밀 수호천사',
        content: angelOpeningReply,
        hamsterVariant: 'heart',
      }
    : null;

  const receivedLetters: ArrivedLetterData[] = [];
  if (identityRevealed && myAngel && angelRevealLetter) receivedLetters.push({
    id: 'reveal_letter', theme: 'warm', arrivalTitle: '수호천사의 정체 공개 편지',
    badgeLabel: '정체 공개 편지', toLabel: studentLabel, fromLabel: myAngel.name,
    content: angelRevealLetter, hamsterVariant: 'heart',
  });
  if (identityRevealed && myTarget && targetThankLetter) receivedLetters.push({
    id: 'thank_letter', theme: 'rose', arrivalTitle: '내가 챙겨준 친구의 감사 편지',
    badgeLabel: '감사 편지', toLabel: studentLabel, fromLabel: myTarget.name,
    content: targetThankLetter, hamsterVariant: 'welcome',
  });
  if (targetOpeningLetterData) receivedLetters.push(targetOpeningLetterData);
  if (angelOpeningReplyData) receivedLetters.push(angelOpeningReplyData);

  const stage1ArrivedLetters = [targetOpeningLetterData, angelOpeningReplyData].filter(
    (letter): letter is ArrivedLetterData => letter !== null
  );
  const stage1UnreadCount = stage1ArrivedLetters.filter((letter) => !isLetterRead(letter)).length;
  const stage1NeedsWriting = !identityRevealed && ready && (!firstLetterDone || (Boolean(targetOpeningLetter) && !firstReplyDone));
  const stage3NeedsWriting = isFinaleWriting && ready && (!student.guessedAngelId || !revealDone || !thankDone);

  const unreadLetters = receivedLetters.filter((letter) => !isLetterRead(letter));
  const inboxCount = unreadLetters.length + (canReviewMissions ? pendingReceivedCount : 0);
  const openLetter = (letter: ArrivedLetterData) =>
    setActiveLetterModal({ ...letter, startOpened: isLetterRead(letter) });

  const finalActions = [
    { title: '나의 수호천사 추리하기', detail: '나를 챙겨준 것 같은 친구 한 명을 골라 보세요.',
      label: student.guessedAngelId ? '추리 수정' : '추리하기', page: 'guess', done: Boolean(student.guessedAngelId) },
    { title: '챙겨준 친구에게 정체 공개 편지 쓰기', detail: '그동안 있었던 일을 떠올리며 내 정체를 알려 주세요.',
      label: revealDone ? '편지 수정' : '편지 쓰기', page: 'final-reveal', done: revealDone },
    { title: '나를 챙겨준 수호천사에게 감사 편지 쓰기', detail: '수호천사에게 고마웠던 일을 적어 보세요.',
      label: thankDone ? '편지 수정' : '편지 쓰기', page: 'final-thank', done: thankDone },
  ] as const;

  React.useEffect(() => {
    onChatActiveChange?.(page === 'chat');
    return () => onChatActiveChange?.(false);
  }, [page, onChatActiveChange]);

  const [chatReadCounts, setChatReadCounts] = useState<{ angel: number; target: number }>(() => {
    const readStored = (role: 'angel' | 'target') => {
      try {
        const raw = localStorage.getItem(`suhotalk_chat_read_${classId}_${student.id}_${role}`);
        const num = Number(raw);
        return Number.isFinite(num) && num >= 0 ? num : 0;
      } catch {
        return 0;
      }
    };
    return { angel: readStored('angel'), target: readStored('target') };
  });

  const markChatRoomRead = React.useCallback(
    (role: 'angel' | 'target', incomingCount: number) => {
      if (isPreviewMode) return;
      setChatReadCounts((prev) => {
        if (prev[role] >= incomingCount) return prev;
        try {
          localStorage.setItem(
            `suhotalk_chat_read_${classId}_${student.id}_${role}`,
            String(incomingCount)
          );
        } catch {
          // ignore storage errors
        }
        return { ...prev, [role]: incomingCount };
      });
    },
    [classId, student.id, isPreviewMode]
  );

  const angelChatRoomId = myAngel ? `${myAngel.id}->${student.id}` : '';
  const targetChatRoomId = myTarget ? `${student.id}->${myTarget.id}` : '';
  const myRoomChats = chats.filter(
    (c) => c.roomId === angelChatRoomId || c.roomId === targetChatRoomId
  );
  const angelIncomingChats = myRoomChats.filter(
    (c) => c.roomId === angelChatRoomId && c.senderId !== student.id
  ).length;
  const targetIncomingChats = myRoomChats.filter(
    (c) => c.roomId === targetChatRoomId && c.senderId !== student.id
  ).length;
  const unreadAngelChatCount = Math.max(0, angelIncomingChats - chatReadCounts.angel);
  const unreadTargetChatCount = Math.max(0, targetIncomingChats - chatReadCounts.target);
  const totalUnreadChatCount = unreadAngelChatCount + unreadTargetChatCount;

  const pageLabel = letterForm?.title ?? ({
    mission: '친구를 도운 일',
    inbox: '받은 소식',
    guess: '수호천사 추리하기',
    records: '내 기록',
    finale: '나의 수호천사',
    chat: '수호천사와 톡하기',
  } as Partial<Record<StudentPage, string>>)[page];

  return (
    <div className="suho-student min-h-dvh">
      {/* 알림 토스트 */}
      {toastMsg && (
        <div role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-[#3C1E1E] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5">
          <SuhoKakaoLogo size={20} />
          <span className="text-xs sm:text-sm font-bold leading-snug">
            {toastMsg}
          </span>
        </div>
      )}

      <header className="border-b border-[#e7ded0] bg-white">
        <div className="mx-auto flex min-h-16 max-w-[720px] items-center justify-between gap-2 px-4 sm:px-6">
          <button type="button" onClick={() => goTo('home')} className="flex min-h-12 items-center gap-2 font-black" aria-label="수호톡 홈">
            <SuhoKakaoLogo size={30} /> <span>수호톡</span>
          </button>
          <div className="flex items-center gap-1.5">
            {!identityRevealed && myTarget && (
              <button type="button" onClick={handleToggleTargetName} aria-expanded={showTargetName} className="suho-secondary px-2.5 text-sm">
                {showTargetName ? <EyeOff size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
                {showTargetName ? '숨기기' : '내가 챙겨줄 친구'}
              </button>
            )}
            {onLogout && (
              <button type="button" onClick={onLogout} aria-label="나가기" title="나가기" className="suho-secondary px-2.5 text-sm">
                <LogOut size={18} aria-hidden="true" /><span className="hidden sm:inline">나가기</span>
              </button>
            )}
          </div>
        </div>
        {!identityRevealed && showTargetName && myTarget && (
          <div className="bg-[#fff3c9]">
            <p className="mx-auto max-w-[720px] px-4 py-3 text-sm sm:px-6" role="status">
              내가 몰래 챙겨줄 친구는 <strong>{myTarget.number}번 {myTarget.name}</strong>이에요. 4초 뒤에 이름을 숨겨요.
            </p>
          </div>
        )}
      </header>
      {isPreviewMode && <p className="border-b border-[#e7ded0] bg-[#fff5d6] px-4 py-2 text-center text-sm font-bold text-[#735020]">선생님 잠입 확인 모드 · 편지를 열어 보거나 화면을 확인해도 학생의 ‘새 편지’ 알림과 기록에는 영향을 주지 않아요.</p>}

      <main className="mx-auto w-full max-w-[720px] px-4 pb-14 pt-6 sm:px-6 sm:pt-9">
        {page !== 'home' && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => goTo('home')} className="suho-secondary">
              <ArrowLeft size={18} aria-hidden="true" /> 홈으로
            </button>
            <span className="text-sm font-bold text-[#685852]">{stageLabel}</span>
          </div>
        )}

        {page === 'home' ? (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold text-[#685852]">{config.className}</p>
              <h1 ref={pageTitle} tabIndex={-1} className="mt-1 text-[28px] font-black leading-tight tracking-tight sm:text-4xl">
                {student.name} 학생, 안녕하세요!
              </h1>
            </div>

            {!identityRevealed && ready && config.stage >= 2 && (
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="활동 단계 선택">
                {([1, 2, 3] as GameStage[])
                  .filter((stageNum) => stageNum <= config.stage)
                  .map((stageNum) => {
                    const active = viewingStage === stageNum;
                    const label =
                      stageNum === 1
                        ? '1단계 · 첫 편지'
                        : stageNum === 2
                        ? '2단계 · 비밀 활동'
                        : '3단계 · 추리·편지';

                    return (
                      <button
                        key={stageNum}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => selectStage(stageNum)}
                        className={`min-h-11 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 transition-colors ${
                          active
                            ? 'bg-[#fee500] border-[#8c650c] text-[#2d201a] shadow-xs'
                            : 'bg-white border-[#e7ded0] text-[#685852] hover:text-[#2d201a]'
                        }`}
                      >
                        <span>{label}</span>
                        {stageNum === 1 && stage1UnreadCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-black text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                            새 편지 {stage1UnreadCount}
                          </span>
                        )}
                        {stageNum === 1 && stage1UnreadCount === 0 && stage1NeedsWriting && (
                          <span className="rounded-full bg-[#fff3c9] border border-[#d7bc64] px-2 py-0.5 text-[11px] font-black text-[#735020]">
                            미완료
                          </span>
                        )}
                        {stageNum === 2 && canReviewMissions && pendingReceivedCount > 0 && (
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-black text-white">
                            확인 {pendingReceivedCount}
                          </span>
                        )}
                        {stageNum === 3 && stage3NeedsWriting && (
                          <span className="rounded-full bg-[#fff3c9] border border-[#d7bc64] px-2 py-0.5 text-[11px] font-black text-[#735020]">
                            진행 중
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            )}

            {ready && (Boolean(config.chatOpen) || myRoomChats.length > 0) && (
              <button
                type="button"
                onClick={() => goTo('chat')}
                className={`w-full rounded-2xl border p-4 flex items-center justify-between gap-3 text-left transition-colors ${
                  config.chatOpen
                    ? 'border-[#d7bc64] bg-[#fff5d6] hover:bg-[#fee500]/55 shadow-xs'
                    : 'border-[#e7ded0] bg-white hover:bg-[#f7f4ef]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      config.chatOpen
                        ? 'bg-[#fee500] text-[#2d201a]'
                        : 'bg-[#f7f4ef] text-[#685852]'
                    }`}
                  >
                    <MessageCircle size={20} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm sm:text-base font-black text-[#2d201a]">
                        수호천사와 톡하기
                      </span>
                      {config.chatOpen ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-black text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                          지금 열림
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f7f4ef] border border-[#e7ded0] px-2 py-0.5 text-[11px] font-bold text-[#75675d]">
                          대화 종료
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[#604832] mt-0.5 truncate">
                      {config.chatOpen
                        ? '나를 챙기는 수호천사 · 내가 챙기는 친구와 1:1 대화해요'
                        : '주고받은 지난 대화를 읽어볼 수 있어요'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {totalUnreadChatCount > 0 && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">
                      새 톡 {totalUnreadChatCount}
                    </span>
                  )}
                  <ChevronRight size={18} className="text-[#735020]" aria-hidden="true" />
                </div>
              </button>
            )}

            {identityRevealed ? (
              <>
                <section className="relative overflow-hidden rounded-[22px] border border-[#e9d9ae] bg-[#fff3c9] p-5 sm:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#735020]">선생님이 연 활동 · 정체 공개</p>
                      <h2 className="mt-2 break-keep text-xl font-black leading-snug tracking-tight sm:text-3xl">
                        수호천사의 정체가 공개됐어요
                      </h2>
                    </div>
                    <SuhoHamster variant="heart" size={76} className="shrink-0 sm:scale-125 sm:mr-2" />
                  </div>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-[#604832]">
                    누가 나를 챙겨줬는지 보고, 그동안 주고받은 편지와 활동을 돌아봐요.
                  </p>
                  <button type="button" className="suho-primary mt-4 w-full sm:w-auto" onClick={() => goTo('finale')}>
                    정체 확인하기 <ChevronRight size={19} aria-hidden="true" />
                  </button>
                </section>

                <nav aria-label="학생 메뉴" className="suho-sheet divide-y divide-[#e7ded0] px-4 sm:px-5">
                  <button type="button" onClick={() => goTo('inbox')} className="flex min-h-14 w-full items-center gap-3 py-2 text-left font-extrabold hover:text-[#735020]">
                    <MailOpen size={21} aria-hidden="true" /> <span className="flex-1">받은 편지함</span>
                    {unreadLetters.length > 0 && <span className="rounded-full bg-[#fff3c9] px-2.5 py-1 text-sm text-[#694310]">새 편지 {unreadLetters.length}통</span>}
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => goTo('records')} className="flex min-h-14 w-full items-center gap-3 py-2 text-left font-extrabold hover:text-[#735020]">
                    <Trophy size={21} aria-hidden="true" /> <span className="flex-1">내 점수와 훈장</span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </nav>
              </>
            ) : !ready ? (
              <>
                <section className="relative overflow-hidden rounded-[22px] border border-[#e9d9ae] bg-[#fff3c9] p-5 sm:p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#735020]">준비 중</p>
                      <h2 className="mt-2 break-keep text-xl font-black leading-snug tracking-tight sm:text-3xl">
                        선생님이 내가 챙겨줄 친구를 배정하고 있어요
                      </h2>
                    </div>
                    <SuhoHamster variant="welcome" size={76} className="shrink-0 sm:scale-125 sm:mr-2" />
                  </div>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-[#604832]">
                    배정이 끝나면 이곳에 할 일이 나타나요.
                  </p>
                </section>

                <nav aria-label="학생 메뉴" className="suho-sheet divide-y divide-[#e7ded0] px-4 sm:px-5">
                  <button type="button" onClick={() => goTo('records')} className="flex min-h-14 w-full items-center gap-3 py-2 text-left font-extrabold hover:text-[#735020]">
                    <Trophy size={21} aria-hidden="true" /> <span className="flex-1">내 점수와 훈장</span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </nav>
              </>
            ) : viewingStage === 1 ? (
              <>
                {config.stage >= 2 && (
                  <p className="rounded-xl border border-[#e9d9ae] bg-[#fff5d6] px-4 py-3 text-xs sm:text-sm font-bold text-[#735020]">
                    지금 우리 반은 {config.stage}단계 진행 중이에요. 못 보낸 1단계 편지를 보내거나 늦게 온 편지를 확인할 수 있어요.
                  </p>
                )}

                <div className="space-y-4">
                  {/* 카드 1: 내가 수호천사에게 보내는 첫 편지 + 수호천사의 첫 답장 */}
                  <section className="suho-sheet p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-base sm:text-lg font-black text-[#2d201a]">
                        1. 나의 수호천사에게 첫 편지 쓰기
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                          firstLetterDone
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-[#fff3c9] text-[#735020] border border-[#e9d9ae]'
                        }`}
                      >
                        {firstLetterDone ? '보냄 완료' : '아직 안 씀'}
                      </span>
                    </div>
                    <p className="text-sm text-[#604832]">
                      나를 몰래 챙겨줄 수호천사에게 설레는 첫인사를 적어 보세요.
                    </p>
                    <button
                      type="button"
                      onClick={() => goTo('first-letter')}
                      className={firstLetterDone ? 'suho-secondary w-full sm:w-auto text-sm' : 'suho-primary w-full sm:w-auto text-sm'}
                    >
                      {firstLetterDone ? (
                        <>
                          <MailOpen size={16} aria-hidden="true" />
                          <span>보낸 첫 편지 보기</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} aria-hidden="true" />
                          <span>첫 편지 쓰기</span>
                        </>
                      )}
                    </button>

                    {angelOpeningReplyData && (
                      <div className="pt-2 border-t border-[#e7ded0]">
                        <button
                          type="button"
                          onClick={() => openLetter(angelOpeningReplyData)}
                          className="w-full rounded-xl border border-[#e9d9ae] bg-[#fff8e1] hover:bg-[#fff3c9] px-4 py-3 flex items-center justify-between gap-2 text-left transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MailOpen size={18} className="text-[#735020] shrink-0" aria-hidden="true" />
                            <span className="text-sm font-extrabold text-[#2d201a] truncate">
                              수호천사의 첫 답장이 도착했어요!
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isLetterRead(angelOpeningReplyData) ? (
                              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-black text-white">
                                새 편지
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-[#75675d]">읽음</span>
                            )}
                            <ChevronRight size={16} className="text-[#75675d]" aria-hidden="true" />
                          </div>
                        </button>
                      </div>
                    )}
                  </section>

                  {/* 카드 2: 내가 챙겨줄 친구의 첫 편지 읽기 + 답장 쓰기 */}
                  <section className="suho-sheet p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-base sm:text-lg font-black text-[#2d201a]">
                        2. 내가 챙겨줄 친구의 첫 편지 읽고 답장하기
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                          firstReplyDone
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : targetOpeningLetterData
                            ? 'bg-[#fee500] text-[#2d201a]'
                            : 'bg-[#f7f4ef] text-[#75675d] border border-[#e7ded0]'
                        }`}
                      >
                        {firstReplyDone ? '답장 완료' : targetOpeningLetterData ? '답장할 차례' : '편지 기다리는 중'}
                      </span>
                    </div>

                    {targetOpeningLetterData ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openLetter(targetOpeningLetterData)}
                          className="w-full rounded-xl border border-[#e9d9ae] bg-[#fff8e1] hover:bg-[#fff3c9] px-4 py-3 flex items-center justify-between gap-2 text-left transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MailOpen size={18} className="text-[#735020] shrink-0" aria-hidden="true" />
                            <span className="text-sm font-extrabold text-[#2d201a] truncate">
                              내가 챙겨줄 친구의 첫 편지 읽기
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isLetterRead(targetOpeningLetterData) ? (
                              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-black text-white">
                                새 편지
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-[#75675d]">읽음</span>
                            )}
                            <ChevronRight size={16} className="text-[#75675d]" aria-hidden="true" />
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => goTo('first-reply')}
                          className={firstReplyDone ? 'suho-secondary w-full sm:w-auto text-sm' : 'suho-primary w-full sm:w-auto text-sm'}
                        >
                          {firstReplyDone ? (
                            <>
                              <MailOpen size={16} aria-hidden="true" />
                              <span>보낸 답장 보기</span>
                            </>
                          ) : (
                            <>
                              <Send size={16} aria-hidden="true" />
                              <span>친구 편지에 답장 쓰기</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-[#604832]">
                          내가 챙겨줄 친구가 아직 첫 편지를 보내지 않았어요. 편지가 도착하면 여기에 알림이 떠요.
                        </p>
                        {firstReplyDone && (
                          <button
                            type="button"
                            onClick={() => goTo('first-reply')}
                            className="suho-secondary w-full sm:w-auto text-sm"
                          >
                            <MailOpen size={16} aria-hidden="true" />
                            <span>보낸 답장 보기</span>
                          </button>
                        )}
                      </>
                    )}
                  </section>
                </div>

                <nav aria-label="학생 메뉴" className="suho-sheet divide-y divide-[#e7ded0] px-4 sm:px-5">
                  <button type="button" onClick={() => goTo('records')} className="flex min-h-14 w-full items-center gap-3 py-2 text-left font-extrabold hover:text-[#735020]">
                    <Trophy size={21} aria-hidden="true" /> <span className="flex-1">내 점수와 훈장</span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </nav>
              </>
            ) : viewingStage === 2 ? (
              <>
                {config.stage > 2 && (
                  <p className="rounded-xl border border-[#e9d9ae] bg-[#fff5d6] px-4 py-3 text-xs sm:text-sm font-bold text-[#735020]">
                    지금은 3단계 진행 중이에요. 2단계 활동 기록과 미확인 미션을 확인할 수 있어요.
                  </p>
                )}

                {/* 2단계 메인: 도운 일 남기기 & 확인할 일 보기 2열 카드 */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (config.stage === 2) {
                        setSelectedActivity('stealth');
                        goTo('mission');
                      } else {
                        goTo('records');
                      }
                    }}
                    className="rounded-[22px] border-2 border-[#e9d9ae] bg-[#fff5d6] hover:bg-[#fee500]/55 hover:border-[#8c650c] transition-all text-left p-3.5 sm:p-5 flex flex-col justify-between gap-3 shadow-xs min-w-0"
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-1.5">
                        <SuhoHamster variant="stealth" angelStyle="boy" size={48} className="shrink-0" />
                        <span className="rounded-full bg-white/90 border border-[#e9d9ae] px-2 py-0.5 text-[10.5px] sm:text-xs font-black text-[#735020]">
                          {config.stage === 2
                            ? dailyLimit.canSendRegular
                              ? `오늘 ${dailyLimit.remainingRegularToday}/2회`
                              : '오늘 완료'
                            : `보낸 활동 ${mySentMissions.length}건`}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] sm:text-xs font-extrabold text-[#735020]">
                          내가 수호천사로서
                        </p>
                        <h2 className="break-keep text-base sm:text-xl font-black text-[#2d201a] leading-snug">
                          {config.stage === 2 ? '도운 일 남기기' : '내가 보낸 활동'}
                        </h2>
                        <p className="break-keep text-[11.5px] sm:text-sm font-medium text-[#604832] leading-snug">
                          내가 챙겨줄 친구를 몰래 도운 일을 기록해요
                        </p>
                      </div>
                    </div>

                    <span className="w-full rounded-xl bg-[#fee500] text-[#2d201a] font-black text-xs sm:text-sm py-2.5 px-3 flex items-center justify-between gap-1">
                      <span className="truncate">
                        {config.stage === 2 ? '도운 일 기록하기' : '보낸 기록 보기'}
                      </span>
                      <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => goTo('inbox')}
                    className={`rounded-[22px] border-2 transition-all text-left p-3.5 sm:p-5 flex flex-col justify-between gap-3 shadow-xs min-w-0 ${
                      pendingReceivedCount > 0
                        ? 'border-emerald-400 bg-[#eefaf3] hover:bg-[#e1f6ea] hover:border-emerald-600'
                        : 'border-[#dce6df] bg-white hover:bg-[#f5faf7] hover:border-emerald-400'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-start justify-between gap-1.5">
                        <SuhoHamster variant="heart" angelStyle="girl" size={48} className="shrink-0" />
                        {pendingReceivedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[10.5px] sm:text-xs font-black text-white shadow-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                            확인할 일 {pendingReceivedCount}건
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#eef7f1] border border-[#b7dbc5] px-2 py-0.5 text-[10.5px] sm:text-xs font-black text-[#1B4D3E]">
                            확인 완료
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] sm:text-xs font-extrabold text-[#1B4D3E]">
                          수호천사에게 받은 도움
                        </p>
                        <h2 className="break-keep text-base sm:text-xl font-black text-[#2d201a] leading-snug">
                          확인할 일 보기
                        </h2>
                        <p className="break-keep text-[11.5px] sm:text-sm font-medium text-[#4a5d52] leading-snug">
                          {pendingReceivedCount > 0
                            ? `확인해야 할 활동이 ${pendingReceivedCount}건 있어요!`
                            : '수호천사가 남긴 활동과 편지를 봐요'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`w-full rounded-xl font-black text-xs sm:text-sm py-2.5 px-3 flex items-center justify-between gap-1 ${
                        pendingReceivedCount > 0
                          ? 'bg-[#1B4D3E] text-white'
                          : 'bg-[#eef7f1] border border-[#b7dbc5] text-[#1B4D3E]'
                      }`}
                    >
                      <span className="truncate">
                        {pendingReceivedCount > 0 ? '지금 확인하기' : '받은 소식 보기'}
                      </span>
                      <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
                    </span>
                  </button>
                </div>

                {/* 주간 특별 미션 배너 (열려 있을 때만) */}
                {config.stage === 2 && hasWeeklyQuest && (
                  <section className="rounded-2xl border border-[#e9d9ae] bg-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <SuhoHamster variant="quest" size={44} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#B45309]">
                          <Sparkles size={13} aria-hidden="true" />
                          <span>선생님이 올린 주간 특별 미션 · +25점</span>
                        </div>
                        <p className="text-sm sm:text-base font-extrabold text-[#2d201a] mt-0.5 break-words">
                          {config.weeklyQuest}
                        </p>
                      </div>
                    </div>
                    {dailyLimit.canSendQuest ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedActivity('quest');
                          goTo('mission');
                        }}
                        className="suho-primary text-xs sm:text-sm w-full sm:w-auto shrink-0"
                      >
                        <span>주간 미션 기록하기</span>
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black text-emerald-700 shrink-0">
                        주간 미션 참여 완료
                      </span>
                    )}
                  </section>
                )}

                <nav aria-label="2단계 활동 메뉴" className="suho-sheet px-4 sm:px-5">
                  <button type="button" onClick={() => goTo('records')} className="flex min-h-14 w-full items-center gap-3 py-2 text-left font-extrabold hover:text-[#735020]">
                    <Trophy size={21} aria-hidden="true" /> <span className="flex-1">내 점수와 훈장</span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </nav>
              </>
            ) : (
              <>
                <section className="rounded-[22px] border border-[#e9d9ae] bg-[#fff3c9] p-5 sm:p-6 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#735020]">3단계 · 추리 투표와 마지막 편지</p>
                      <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl text-[#2d201a]">
                        마무리 할 일 3가지
                      </h2>
                    </div>
                    <SuhoHamster variant="heart" size={64} className="shrink-0" />
                  </div>
                  <p className="text-sm text-[#604832]">
                    아래 3가지를 모두 마친 뒤 선생님이 수호천사의 정체를 공개해요.
                  </p>
                </section>

                <div className="suho-sheet divide-y divide-[#e7ded0] px-4 sm:px-5">
                  {finalActions.map((action, idx) => (
                    <div key={action.page} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-black text-[#2d201a]">
                            {idx + 1}. {action.title}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                              action.done
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-[#fff3c9] text-[#735020] border border-[#e9d9ae]'
                            }`}
                          >
                            {action.done ? '완료' : '미완료'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#75675d]">{action.detail}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => goTo(action.page)}
                        className={action.done ? 'suho-secondary text-xs sm:text-sm shrink-0' : 'suho-primary text-xs sm:text-sm shrink-0'}
                      >
                        <span>{action.label}</span>
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>

                <nav aria-label="학생 메뉴" className="suho-sheet divide-y divide-[#e7ded0] px-4 sm:px-5">
                  <button type="button" onClick={() => goTo('inbox')} className="flex min-h-14 w-full items-center gap-3 py-2 text-left font-extrabold hover:text-[#735020]">
                    <MailOpen size={21} aria-hidden="true" /> <span className="flex-1">받은 소식</span>
                    {inboxCount > 0 && <span className="rounded-full bg-[#fff3c9] px-2.5 py-1 text-sm text-[#694310]">새 소식 {inboxCount}개</span>}
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => goTo('records')} className="flex min-h-14 w-full items-center gap-3 py-2 text-left font-extrabold hover:text-[#735020]">
                    <Trophy size={21} aria-hidden="true" /> <span className="flex-1">내 점수와 훈장</span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </nav>
              </>
            )}
          </div>
        ) : (
          <h1 ref={pageTitle} tabIndex={-1} className="mb-5 text-2xl font-black tracking-tight sm:text-3xl">{pageLabel}</h1>
        )}

        {letterForm && (
          isSentOpeningLetterLocked ? (
            <div className="space-y-4">
              {page === 'first-reply' && targetOpeningLetter && (
                <div className="rounded-xl border border-[#e9d9ae] bg-[#fff5d6] p-4 space-y-1.5">
                  <div className="text-xs font-extrabold text-[#735020]">
                    내가 챙겨줄 친구가 보낸 첫 편지
                  </div>
                  <p className="text-sm text-[#2d201a] leading-relaxed whitespace-pre-wrap">
                    {targetOpeningLetter}
                  </p>
                </div>
              )}

              <p className="rounded-xl border border-[#e9d9ae] bg-[#fff5d6] px-4 py-3 text-sm font-bold text-[#735020]">
                이미 보낸 편지예요. 보낸 편지는 수정할 수 없어요.
              </p>

              <div className={`overflow-hidden rounded-2xl border ${letterFormIsWarm ? 'border-[#e7d8b9] bg-[#fff9eb]' : 'border-[#edcfc8] bg-[#fff4f1]'}`}>
                <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#d7c1a7] px-4 py-4 sm:px-6">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#685852]">받는 사람</p>
                    <p className="mt-0.5 break-keep text-base font-black text-[#2b2118] sm:text-lg">{letterForm.to}</p>
                  </div>
                  <SuhoHamster variant={letterFormIsWarm ? 'welcome' : 'heart'} size={42} className="shrink-0" />
                </div>
                <div className={`px-4 py-3 text-base text-[#2b2118] sm:px-6 min-h-[160px] ${letterFormIsWarm ? 'letter-paper-warm' : 'letter-paper-rose'}`}>
                  <p className="whitespace-pre-wrap leading-[32px]">
                    {student[letterForm.field]}
                  </p>
                </div>
                <div className="border-t border-dashed border-[#d7c1a7] px-4 py-3 text-right text-sm text-[#685852] sm:px-6">
                  보낸 사람 <strong className="ml-1 text-[#2b2118]">{letterForm.from}</strong>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={(event) => handleLetterSave(event, letterForm.field)}>
              {page === 'first-reply' && targetOpeningLetter && (
                <div className="rounded-xl border border-[#e9d9ae] bg-[#fff5d6] p-4 space-y-1.5">
                  <div className="text-xs font-extrabold text-[#735020]">
                    내가 챙겨줄 친구가 보낸 첫 편지
                  </div>
                  <p className="text-sm text-[#2d201a] leading-relaxed whitespace-pre-wrap">
                    {targetOpeningLetter}
                  </p>
                </div>
              )}
              {isFinaleWriting && (
                <p className="rounded-xl border border-[#e9d9ae] bg-[#fff3c9] px-4 py-3 text-sm font-bold leading-relaxed">
                  {letterForm.done ? '저장됨 · 정체 공개 날 전달돼요.' : '지금 저장하면 정체 공개 날 친구에게 전달돼요.'}
                </p>
              )}
              <LetterStationeryEditor
                theme={letterFormIsWarm ? 'warm' : 'rose'}
                toLabel={letterForm.to}
                fromLabel={letterForm.from}
                value={drafts[letterForm.field] ?? student[letterForm.field] ?? ''}
                onChange={(value) => setDrafts((previous) => ({ ...previous, [letterForm.field]: value }))}
                placeholder={letterForm.example}
                minRows={5}
                hamsterVariant={letterFormIsWarm ? 'welcome' : 'heart'}
              />
              {(page === 'first-letter' || page === 'first-reply') && (
                <p className="text-xs font-bold text-[#75675d]">
                  보낸 편지는 수정할 수 없으니 천천히 확인하고 보내세요.
                </p>
              )}
              <button type="submit" disabled={isSaving || isPreviewMode || identityRevealed} className="suho-primary w-full sm:w-auto">
                <Send size={18} aria-hidden="true" />
                {isSaving ? '저장 중…' : isFinaleWriting || letterForm.done ? '편지 저장하기' : '편지 보내기'}
              </button>
            </form>
          )
        )}

        {page === 'chat' && (
          <StudentChatView
            student={student}
            myAngel={myAngel}
            myTarget={myTarget}
            chats={myRoomChats}
            chatOpen={Boolean(config.chatOpen)}
            identityRevealed={identityRevealed}
            isPreviewMode={isPreviewMode}
            unreadAngelCount={unreadAngelChatCount}
            unreadTargetCount={unreadTargetChatCount}
            onMarkRoomRead={markChatRoomRead}
            onSendChat={async (role, content) => {
              if (!onSendChat || isPreviewMode) return false;
              return onSendChat(role, content);
            }}
          />
        )}

        {page === 'inbox' && (
          <div className="space-y-5">
            {canReviewMissions && config.stage === 2 && renderReceivedApprovalQueue()}
            <section className="suho-sheet p-4 sm:p-5">
              <h2 className="mb-2 text-lg font-extrabold">받은 편지</h2>
              {receivedLetters.length === 0 ? (
                <p className="py-2 text-base text-[#685852]">아직 도착한 편지가 없어요. 편지가 오면 여기에 나타나요.</p>
              ) : (
                <ul className="divide-y divide-[#e7ded0]">
                  {receivedLetters.map((letter) => (
                    <li key={letter.id}>
                      <button type="button" onClick={() => openLetter(letter)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left hover:text-[#735020]">
                        <MailOpen size={21} className="shrink-0" aria-hidden="true" />
                        <span className="flex-1 font-bold">{letter.arrivalTitle}</span>
                        {!isLetterRead(letter) && <span className="shrink-0 rounded-full bg-[#fff3c9] px-2 py-1 text-xs font-bold">새 편지</span>}
                        <ChevronRight size={17} className="shrink-0" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {canReviewMissions && config.stage !== 2 && renderReceivedApprovalQueue()}
          </div>
        )}

        {page === 'guess' && isFinaleWriting && (
          <section className="suho-sheet space-y-4 p-4 sm:p-6">
            <p className="text-base text-[#685852]">나를 챙겨준 것 같은 친구 한 명을 골라 주세요.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {students
                .filter((candidate) => candidate.id !== student.id && candidate.id !== '__ANGEL__' && candidate.number > 0)
                .map((candidate) => (
                <button key={candidate.id} type="button" aria-pressed={selectedGuessId === candidate.id}
                  onClick={() => setGuessDraft(candidate.id)}
                  className="suho-secondary justify-between text-left text-sm aria-pressed:border-[#8c650c] aria-pressed:bg-[#fff3c9]">
                  <span className="break-words">{candidate.number}번 {candidate.name}</span>
                  {selectedGuessId === candidate.id && <Check size={16} className="shrink-0" aria-hidden="true" />}
                </button>
              ))}
            </div>
            {myGuessedStudent && <p className="text-sm font-bold text-[#685852]">저장한 추리: {myGuessedStudent.name}</p>}
            <button type="button" disabled={!selectedGuessId || isSaving || isPreviewMode} onClick={handleGuessSave} className="suho-primary w-full sm:w-auto">
              {isSaving ? '저장 중…' : '추리 저장하기'}
            </button>
          </section>
        )}

        {page === 'mission' && config.stage === 2 && (
          <div className="space-y-4">
            {/* 1. 친구 미션 인증 신청 폼 */}
            <section className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-extrabold text-[#191919] flex items-center gap-2">
                    <ClipboardCheck
                      className="w-4 h-4 text-[#D97706]"
                      strokeWidth={2.3}
                    />
                    <span>어떤 일을 했나요?</span>
                  </h2>
                  <span className="text-xs font-medium text-[#767676]">
                    일반 미션 오늘 {dailyLimit.remainingRegularToday}/2회 남음
                  </span>
                </div>

                {/* 주간 미션 1줄 공지 */}
                {hasWeeklyQuest && (
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1 flex items-center gap-1.5">
                      <Sparkles
                        className="w-3.5 h-3.5 text-[#D97706] shrink-0"
                        strokeWidth={2.2}
                      />
                      <span className="font-extrabold text-[#3C1E1E] shrink-0">
                        주간 미션:
                      </span>
                      <span className="font-medium text-[#191919] break-words">
                        {config.weeklyQuest}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-extrabold shrink-0 ${
                        dailyLimit.canSendQuest
                          ? 'text-[#B45309]'
                          : 'text-emerald-700'
                      }`}
                    >
                      {dailyLimit.canSendQuest ? getMissionSubHint('quest') : '제출 완료'}
                    </span>
                  </div>
                )}

                {/* 3~4개 미션 유형 카드 */}
                <div
                  className={`grid gap-2 ${
                    hasWeeklyQuest
                      ? 'grid-cols-2 sm:grid-cols-4'
                      : 'grid-cols-1 sm:grid-cols-3'
                  }`}
                >
                  {visibleActivities.map((item) => {
                    const isSelected = selectedMeta.type === item.type;
                    const isDisabled =
                      item.type === 'quest'
                        ? !dailyLimit.canSendQuest
                        : !dailyLimit.canSendRegular;
                    const statusBadgeText =
                      item.type === 'quest' ? '완료' : '오늘 마감';

                    return (
                      <button
                        key={item.type}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={isDisabled || isSaving}
                        onClick={() => setSelectedActivity(item.type)}
                        className={`text-left rounded-lg p-3 border transition-all flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-[#FEE500]/30 border-[#3C1E1E] ring-1 ring-[#3C1E1E]'
                            : 'bg-[#F5F6F8] border-[#E5E7EB] hover:bg-white'
                        } ${isDisabled ? 'opacity-55' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <ActivityLineIcon
                            type={item.type}
                            className="w-4 h-4 text-[#3C1E1E] shrink-0"
                          />
                          {isDisabled ? (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-gray-200 text-[#767676]">
                              {statusBadgeText}
                            </span>
                          ) : (
                            <span className="text-[11px] font-black text-[#B45309]">
                              +{item.points}점
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-[#191919] leading-tight">
                            {getShortMissionLabel(item.type)}
                          </div>
                          <div className="text-[10px] font-medium text-[#767676] mt-0.5">
                            {getMissionSubHint(item.type)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 수행한 행동 기록 입력 */}
                <div className="space-y-1.5">
                  <label htmlFor="mission-content" className="block text-sm font-extrabold text-[#191919]">
                    친구를 위해 무엇을 했나요?
                  </label>
                  <textarea id="mission-content"
                    rows={2}
                    value={activityContent}
                    onChange={(e) => setActivityDraft({ context: activityContext, content: e.target.value })}
                    placeholder={selectedMeta.type === 'quest'
                      ? '선생님이 올린 미션을 어떻게 했는지 적어 주세요.'
                      : `예) ${selectedMeta.examples[0]}`}
                    className="suho-field w-full resize-y"
                  />
                </div>

                {!myTarget && (
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] rounded-lg px-3 py-2 text-xs font-bold">
                    선생님이 아직 내가 챙겨줄 친구를 배정 중이에요.
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSelectedTypeDisabled || !myTarget || isSaving || isPreviewMode}
                    className="suho-primary w-full sm:w-auto"
                  >
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
                    <span>{isSaving ? '보내는 중…' : '기록 보내기'}</span>
                  </button>
                </div>
              </form>
            </section>

            {/* 2. 내가 보낸 기록 (단일 카드 + 구분선 리스트) */}
            <section className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-[#191919]">
                  내가 보낸 기록 ({mySentMissions.length}건)
                </h3>
                <span className="text-xs font-bold text-[#767676]">
                  친구 확인 {score.verifiedSentCount} · 기다리는 중 {pendingSentCount}
                  {rejectedSentCount > 0 ? ` · 미확인 ${rejectedSentCount}` : ''}
                </span>
              </div>

              {mySentMissions.length === 0 ? (
                <div className="p-7 text-center text-xs font-bold text-[#767676]">
                  아직 보낸 기록이 없어요.
                </div>
              ) : (
                <div className="divide-y divide-[#F0F1F4]">
                  {[...mySentMissions].reverse().map((m) => {
                    const meta =
                      ACTIVITY_META_LIST.find((a) => a.type === m.type) ||
                      ACTIVITY_META_LIST[0];

                    return (
                      <div key={m.id} className="p-4 sm:px-5 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#767676]">
                            <ActivityLineIcon
                              type={m.type}
                              className="w-3.5 h-3.5 text-[#191919]"
                            />
                            <span className="text-[#191919]">
                              {meta.title}
                            </span>
                            <span>· {m.createdAt}</span>
                          </span>

                          {m.status === 'verified' ? (
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              친구 확인 +{m.points}점
                            </span>
                          ) : m.status === 'hold' ? (
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                              잘 모르겠다고 해요
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                              친구가 확인할 차례
                            </span>
                          )}
                        </div>

                        {m.questText && <p className="break-words text-xs font-bold text-[#685852]">주간 미션: {m.questText}</p>}

                        <p className="text-sm text-[#191919] font-medium leading-relaxed">
                          {m.content}
                        </p>

                        {m.status === 'hold' && (
                          <div className="text-[11px] font-medium text-rose-700">
                            내가 챙겨줄 친구가 잘 모르겠다고 해요. 다음엔 조금 더 분명하게 마음을 전해 보세요!
                          </div>
                        )}

                        {m.status === 'verified' &&
                          (m.reply ? (
                            <p className="text-xs text-[#767676] border-l-2 border-[#FEE500] pl-2.5 mt-1">
                              내가 챙겨줄 친구: “{m.reply}”
                            </p>
                          ) : (
                            <div className="text-[11px] text-[#767676]">
                              친구가 확인했어요 ({m.verifiedAt})
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {page === 'finale' && identityRevealed && (
          <div className="space-y-4">
            <section className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] flex items-center gap-4">
              <div className="bg-[#FEE500]/20 p-2 rounded-lg shrink-0">
                <SuhoHamster variant="heart" size={62} />
              </div>
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEE500] text-[#3C1E1E] text-[11px] font-black mb-1">
                  <Sparkles className="w-3 h-3" />
                  비밀 정체 공개 완료
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#191919] leading-snug">
                  {student.name}님의 수호천사는{' '}
                  <span className="underline decoration-[#FEE500] decoration-4 underline-offset-4">
                    {myAngel ? `${myAngel.number}번 ${myAngel.name}` : '미지정'}
                  </span>{' '}
                  친구였어요!
                </h2>
                <p className="text-xs text-[#767676] mt-1">
                  내가 몰래 챙겨준 친구는{' '}
                  <strong className="text-[#191919]">
                    {myTarget ? `${myTarget.number}번 ${myTarget.name}` : '-'}
                  </strong>
                  님이었어요.
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#767676]">
                      <Search className="w-3.5 h-3.5" />
                      수호천사 추리 결과
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        score.guessBonus === 50
                          ? 'bg-[#FEE500] text-[#3C1E1E]'
                          : 'bg-[#F5F6F8] text-[#767676]'
                      }`}
                    >
                      {score.guessBonus === 50 ? '성공 +50점' : '0점'}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-[#191919]">
                    {score.guessBonus === 50
                      ? `정확해요! ${myAngel?.name} 친구를 딱 맞혔어요!`
                      : `아쉬워요! 실제 수호천사는 ${myAngel?.name} 친구였어요.`}
                  </p>
                </div>
                <div className="bg-[#F5F6F8] rounded-lg px-3 py-2 text-xs text-[#767676] flex justify-between">
                  <span>내가 투표한 친구</span>
                  <strong className="text-[#191919]">
                    {myGuessedStudent
                      ? `${myGuessedStudent.number}번 ${myGuessedStudent.name}`
                      : '미제출'}
                  </strong>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#767676]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      내가 들켰을까? (정체 숨기기)
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        score.stealthMasterBonus === 50
                          ? 'bg-[#FEE500] text-[#3C1E1E]'
                          : 'bg-[#F5F6F8] text-[#767676]'
                      }`}
                    >
                      {score.stealthMasterBonus === 50 ? '성공 +50점' : '0점'}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-[#191919]">
                    {!score.isStealthMasterEligible
                      ? `인증 미션 ${score.verifiedSentCount}회(5회 미만)로 보너스 0점`
                      : score.wasCaughtByTarget
                      ? `앗! 내가 챙겨준 친구(${myTarget?.name})에게 정체를 들켰어요!`
                      : `완벽 방어! ${score.verifiedSentCount}회 미션을 수행하고도 안 들켰어요!`}
                  </p>
                </div>
                <div className="bg-[#F5F6F8] rounded-lg px-3 py-2 text-xs text-[#767676] flex justify-between">
                  <span>내가 챙겨준 친구({myTarget?.name})의 지목</span>
                  <strong className="text-[#191919]">
                    {targetGuessedStudent
                      ? `${targetGuessedStudent.number}번 ${targetGuessedStudent.name}`
                      : '미제출'}
                  </strong>
                </div>
              </div>
            </div>

            {(myAngel || myTarget) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myAngel && (
                  <section className="bg-[#FFFDF7] rounded-xl p-5 shadow-sm border border-[#E7D8B9] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <MailCheck className="w-4 h-4 text-[#3C1E1E] shrink-0" />
                        <h3 className="text-sm font-extrabold text-[#191919] truncate">
                          수호천사({myAngel.number}번 {myAngel.name})의 마지막 편지
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveLetterModal({
                            id: 'reveal_letter',
                            theme: 'warm',
                            arrivalTitle: `수호천사(${myAngel.number}번 ${myAngel.name})의 마지막 편지`,
                            badgeLabel: '정체 공개 마지막 편지',
                            toLabel: `${student.number}번 ${student.name}`,
                            fromLabel: `${myAngel.number}번 ${myAngel.name} (나의 수호천사)`,
                            content:
                              angelRevealLetter ||
                              `안녕 ${student.name}! 너의 수호천사는 바로 나 ${myAngel.name}이었어!`,
                            hamsterVariant: 'heart',
                            startOpened: false,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-[11px] font-black inline-flex items-center gap-1 shrink-0"
                      >
                        <MailOpen className="w-3 h-3" />
                        <span>편지지 펼치기</span>
                      </button>
                    </div>
                    <div className="letter-paper-warm border border-[#E7D8B9] rounded-lg px-4 py-2 text-sm text-[#2B2118] whitespace-pre-wrap">
                      {angelRevealLetter ||
                        `안녕 ${student.name}! 너의 수호천사는 바로 나 ${myAngel.name}이었어!`}
                    </div>
                    {(student.thankLetterToAngel || '').trim() && (
                      <div className="bg-white/90 border border-[#E7D8B9]/70 rounded-lg p-3 text-xs text-[#191919] space-y-1">
                        <div className="font-bold text-[#767676]">
                          내가 보낸 마지막 감사 답장
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {student.thankLetterToAngel}
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {myTarget && (
                  <section className="bg-[#FFFBF9] rounded-xl p-5 shadow-sm border border-[#F3D2CA] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Feather className="w-4 h-4 text-[#3C1E1E] shrink-0" />
                        <h3 className="text-sm font-extrabold text-[#191919] truncate">
                          내가 챙겨준 친구({myTarget.number}번 {myTarget.name})의 감사 편지
                        </h3>
                      </div>
                      {targetThankLetter && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveLetterModal({
                              id: 'thank_letter',
                              theme: 'rose',
                              arrivalTitle: `내가 챙겨준 친구(${myTarget.number}번 ${myTarget.name})의 감사 편지`,
                              badgeLabel: '마지막 감사 편지',
                              toLabel: `${student.number}번 ${student.name} (수호천사)`,
                              fromLabel: `${myTarget.number}번 ${myTarget.name} (내가 챙겨준 친구)`,
                              content: targetThankLetter,
                              hamsterVariant: 'welcome',
                              startOpened: false,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-[11px] font-black inline-flex items-center gap-1 shrink-0"
                        >
                          <MailOpen className="w-3 h-3" />
                          <span>편지지 펼치기</span>
                        </button>
                      )}
                    </div>
                    <div className="letter-paper-rose border border-[#F3D2CA] rounded-lg px-4 py-2 text-sm text-[#2B2118] whitespace-pre-wrap">
                      {targetThankLetter ||
                        '내가 챙겨준 친구가 아직 감사 편지를 작성하지 않았어요.'}
                    </div>
                    {(student.revealLetterToTarget || '').trim() && (
                      <div className="bg-white/90 border border-[#F3D2CA]/70 rounded-lg p-3 text-xs text-[#191919] space-y-1">
                        <div className="font-bold text-[#B45309]">
                          내가 보낸 정체 공개 편지
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {student.revealLetterToTarget}
                        </p>
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}

            {(student.openingLetterToAngel?.trim() ||
              myAngel?.openingReplyToTarget?.trim() ||
              myTarget?.openingLetterToAngel?.trim() ||
              student.openingReplyToTarget?.trim()) && (
              <section className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] space-y-3">
                <h3 className="text-sm font-extrabold text-[#191919]">
                  활동 첫날 주고받은 첫 편지 · 답장
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#FFFDF7] border border-[#E7D8B9] rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[#3C1E1E]">
                        내가 {myAngel?.name || '수호천사'}에게 보낸 첫 편지
                      </span>
                      {angelOpeningReply && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveLetterModal({
                              id: 'opening_reply',
                              theme: 'rose',
                              arrivalTitle: `${myAngel?.name || '수호천사'}의 첫 답장`,
                              badgeLabel: '수호천사의 첫 답장',
                              toLabel: `${student.number}번 ${student.name}`,
                              fromLabel: myAngel
                                ? `${myAngel.number}번 ${myAngel.name}`
                                : '나의 수호천사',
                              content: angelOpeningReply,
                              hamsterVariant: 'heart',
                              startOpened: false,
                            })
                          }
                          className="text-[11px] font-black text-[#B45309] underline"
                        >
                          답장 펼치기
                        </button>
                      )}
                    </div>
                    <p className="text-[#191919] leading-relaxed whitespace-pre-wrap">
                      {student.openingLetterToAngel?.trim() || '미작성'}
                    </p>
                    {angelOpeningReply && (
                      <p className="text-[#767676] border-l-2 border-[#FEE500] pl-2.5 leading-relaxed whitespace-pre-wrap">
                        {myAngel?.name || '수호천사'}의 답장: “{angelOpeningReply}”
                      </p>
                    )}
                  </div>
                  <div className="bg-[#FFFBF9] border border-[#F3D2CA] rounded-lg p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[#191919]">
                        내가 챙겨준 친구({myTarget?.name || '친구'})의 첫 편지 · 내 답장
                      </span>
                      {targetOpeningLetter && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveLetterModal({
                              id: 'opening_letter',
                              theme: 'warm',
                              arrivalTitle: `${myTarget?.name || '내가 챙겨준 친구'}의 첫 편지`,
                              badgeLabel: '친구의 첫 편지',
                              toLabel: `${student.number}번 ${student.name} (수호천사)`,
                              fromLabel: myTarget
                                ? `${myTarget.number}번 ${myTarget.name}`
                                : '내가 챙겨준 친구',
                              content: targetOpeningLetter,
                              hamsterVariant: 'welcome',
                              startOpened: false,
                            })
                          }
                          className="text-[11px] font-black text-[#9F1239] underline"
                        >
                          편지 펼치기
                        </button>
                      )}
                    </div>
                    <p className="text-[#191919] leading-relaxed whitespace-pre-wrap">
                      {targetOpeningLetter || '미작성'}
                    </p>
                    {student.openingReplyToTarget?.trim() && (
                      <p className="text-[#767676] border-l-2 border-[#FEE500] pl-2.5 leading-relaxed whitespace-pre-wrap">
                        내 첫 답장: “{student.openingReplyToTarget}”
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] space-y-3">
              <h3 className="text-sm font-extrabold text-[#191919]">
                그동안 주고받은 미션 기록 ({mySentMissions.length}건 수행 ·{' '}
                {myReceivedMissions.length}건 받음)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#F5F6F8] rounded-lg p-3.5 space-y-2">
                  <div className="font-extrabold text-[#3C1E1E]">
                    To. {myTarget?.name}에게 수행한 미션
                  </div>
                  {mySentMissions.map((m) => (
                    <div
                      key={m.id}
                      className="bg-[#FEE500] p-2.5 rounded-lg text-[#3C1E1E]"
                    >
                      <p className="font-medium">{m.content}</p>
                      {m.reply && (
                        <p className="text-[#3C1E1E]/75 mt-1">
                          친구 한마디: “{m.reply}”
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-[#F5F6F8] rounded-lg p-3.5 space-y-2">
                  <div className="font-extrabold text-[#191919]">
                    From. {myAngel?.name}에게 받은 미션
                  </div>
                  {myReceivedMissions.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white p-2.5 rounded-lg border border-[#E5E7EB]"
                    >
                      <p className="text-[#191919] font-medium">{m.content}</p>
                      {m.reply && (
                        <p className="text-[#767676] mt-1">
                          내 한마디: “{m.reply}”
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
        {page === 'records' && (
          <div className="space-y-4">
            {/* 카드 1: 내 총점 */}
            <section className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] space-y-4">
              <div className="bg-[#FEE500] rounded-lg p-4 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#3C1E1E]/85">
                    <Trophy className="w-4 h-4" strokeWidth={2.2} />
                    <span>현재 내 총점</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScoreModal(true)}
                    className="text-xs font-bold text-[#3C1E1E]/80 hover:text-[#3C1E1E] inline-flex items-center gap-0.5"
                  >
                    <span>상세 내역</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-3xl sm:text-4xl font-black text-[#3C1E1E] tracking-tight">
                  {score.totalScore}
                  <span className="text-lg font-extrabold ml-0.5">점</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#767676]">
                  <span>첫 편지·답장</span>
                  <strong className="text-[#191919]">
                    +{score.openingLetterBonus}점
                  </strong>
                </div>
                <div className="flex items-center justify-between text-[#767676]">
                  <span>미션 인증 ({score.verifiedSentCount}회)</span>
                  <strong className="text-[#191919]">
                    +{score.activitySubtotal}점
                  </strong>
                </div>
                <div className="flex items-center justify-between text-[#767676]">
                  <span>선생님 훈장 ({score.medalCount}개)</span>
                  <strong className="text-[#B45309]">+{score.medalPoints}점</strong>
                </div>
                {(score.letterBonus > 0 || identityRevealed) && (
                  <div className="flex items-center justify-between text-[#767676]">
                    <span>마지막 편지·추리·숨기기</span>
                    <strong className="text-[#191919]">
                      +
                      {score.letterBonus +
                        score.guessBonus +
                        score.stealthMasterBonus}
                      점
                    </strong>
                  </div>
                )}
              </div>
            </section>

            {/* 카드 2: 내가 받은 훈장 */}
            <section className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#D97706]" strokeWidth={2.2} />
                  <h2 className="text-base font-extrabold text-[#191919]">
                    내가 받은 훈장
                  </h2>
                </div>
                <span className="text-xs font-extrabold text-[#B45309]">
                  {myMedals.length}개 · +{score.medalPoints}점
                </span>
              </div>

              {myMedals.length === 0 ? (
                <div className="bg-[#F5F6F8] rounded-lg p-6 text-center space-y-2">
                  <HonorMedalIcon
                    type="medal"
                    size={40}
                    className="mx-auto opacity-40 grayscale"
                  />
                  <p className="text-xs font-semibold text-[#767676] leading-relaxed">
                    아직 받은 훈장이 없어요.
                    <br />
                    열심히 활동하면 선생님이
                    <br />
                    <strong className="text-[#191919]">영예의 훈장(+30점)</strong>을 주실 거예요!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#F0F1F4]">
                  {myMedals.map((medal) => (
                    <div
                      key={medal.id}
                      className="py-3 first:pt-1 last:pb-0 flex items-start gap-3"
                    >
                      <HonorMedalIcon type={medal.icon} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-[#191919] truncate">
                            {medal.title}
                          </span>
                          <span className="text-xs font-black text-[#B45309] shrink-0">
                            +{medal.points}점
                          </span>
                        </div>
                        <p className="text-[11px] text-[#767676] mt-0.5 leading-snug">
                          {medal.reason}
                        </p>
                        <span className="block text-[10px] text-[#767676]/80 mt-1">
                          수여일: {medal.awardedAt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* 모달 1: 내 점수 획득 내역 표 */}
      {/* ================================================================= */}
      {showScoreModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-md w-full p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#D97706]" strokeWidth={2.2} />
                <h3 className="text-base sm:text-lg font-extrabold text-[#191919]">
                  {student.name}님의 점수 획득 내역
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScoreModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#F5F6F8] text-[#191919]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="bg-[#F5F6F8] rounded-lg p-3.5 space-y-1.5">
                <div className="font-extrabold text-[#191919] border-b border-[#E5E7EB] pb-1.5 flex justify-between">
                  <span>1. 수호천사 활동 점수 (친구 확인)</span>
                  <span>+{score.activitySubtotal}점</span>
                </div>
                <div className="flex justify-between text-xs text-[#767676]">
                  <span>· 주간 미션 (+25점 × {score.questCount})</span>
                  <span className="font-bold text-[#191919]">+{score.questPoints}점</span>
                </div>
                <div className="flex justify-between text-xs text-[#767676]">
                  <span>· 몰래 챙겨주기 (+10점 × {score.stealthCount})</span>
                  <span className="font-bold text-[#191919]">+{score.stealthPoints}점</span>
                </div>
                <div className="flex justify-between text-xs text-[#767676]">
                  <span>· 마음 표현하기 (+20점 × {score.heartCount})</span>
                  <span className="font-bold text-[#191919]">+{score.heartPoints}점</span>
                </div>
                <div className="flex justify-between text-xs text-[#767676]">
                  <span>· 직접 도와주기 (+30점 × {score.powerCount})</span>
                  <span className="font-bold text-[#191919]">+{score.powerPoints}점</span>
                </div>
              </div>

              <div className="bg-[#F5F6F8] rounded-lg p-3.5 space-y-1.5">
                <div className="font-extrabold text-[#191919] border-b border-[#E5E7EB] pb-1.5 flex justify-between">
                  <span>2. 1단계 첫 편지 &amp; 첫 답장 (+15점씩)</span>
                  <span>+{score.openingLetterBonus}점</span>
                </div>
                <div className="flex justify-between text-xs text-[#767676]">
                  <span>· 나의 수호천사에게 첫 편지 (5자↑)</span>
                  <span className="font-bold text-[#191919]">
                    {score.hasOpeningLetter ? '+15점' : '0점'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#767676]">
                  <span>· 내가 챙겨줄 친구에게 첫 답장 (5자↑)</span>
                  <span className="font-bold text-[#191919]">
                    {score.hasOpeningReply ? '+15점' : '0점'}
                  </span>
                </div>
              </div>

              <div className="bg-[#F5F6F8] rounded-lg p-3.5 flex justify-between items-center">
                <div>
                  <div className="font-extrabold text-[#191919]">
                    3. 선생님 수여 영예의 훈장
                  </div>
                  <div className="text-xs text-[#767676]">
                    +30점 × {score.medalCount}개 획득
                  </div>
                </div>
                <span className="font-extrabold text-[#B45309]">
                  +{score.medalPoints}점
                </span>
              </div>

              <div className="bg-[#F5F6F8] rounded-lg p-3.5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[#191919]">
                    4-1. 마지막 날 추리 성공
                  </span>
                  <span className="font-extrabold text-[#191919]">
                    {identityRevealed ? `+${score.guessBonus}점` : '정체 공개 후'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-[#191919]">
                    4-2. 정체 숨기기 성공 (5회↑)
                  </span>
                  <span className="font-extrabold text-[#191919]">
                    {identityRevealed
                      ? `+${score.stealthMasterBonus}점`
                      : '정체 공개 후'}
                  </span>
                </div>
              </div>

              <div className="bg-[#F5F6F8] rounded-lg p-3.5 flex justify-between items-center">
                <span className="font-extrabold text-[#191919]">
                  5. 마지막 편지 &amp; 감사 답장 (+15점씩)
                </span>
                <span className="font-extrabold text-[#191919]">
                  +{score.letterBonus}점
                </span>
              </div>
            </div>

            <div className="mt-4 bg-[#FEE500] text-[#3C1E1E] rounded-lg p-4 flex items-center justify-between">
              <span className="font-extrabold text-sm">현재 나의 총점</span>
              <span className="text-2xl font-black">{score.totalScore}점</span>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 모달 2: [승인하기 (맞아요)] 확인 모달 (한마디는 선택사항) */}
      {/* ================================================================= */}
      {canReviewMissions && verifyingMission && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-md bg-[#FEE500] text-[#3C1E1E]">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.3} />
                친구가 도와준 일
              </span>
              <button
                type="button"
                onClick={() => setVerifyingMission(null)}
                className="p-1 rounded-lg hover:bg-[#F5F6F8]"
              >
                <X className="w-5 h-5 text-[#191919]" />
              </button>
            </div>

            <div className="bg-[#F5F6F8] rounded-lg p-3.5 text-xs sm:text-sm text-[#191919] mb-4 leading-relaxed border border-[#E5E7EB]">
              “{verifyingMission.content}”
            </div>

            <form onSubmit={handleConfirmVerify}>
              <label htmlFor="mission-reply" className="block text-sm font-extrabold text-[#191919] mb-2">
                수호천사에게 고마운 답장 한마디 (선택)
              </label>
              <input id="mission-reply"
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="예: 도와줘서 고마워!"
                autoFocus
                className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none px-4 py-2.5 text-sm text-[#191919]"
              />
              <p className="text-[11px] text-[#767676] mt-2">
                답장을 적지 않고 바로 확인해도 돼요. 확인하면 수호천사에게 전달됩니다.
              </p>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyingMission(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#767676] hover:bg-[#F5F6F8]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isPreviewMode}
                  className="suho-primary text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
                  <span>{isSaving ? '저장 중…' : '확인 저장하기'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeLetterModal && (identityRevealed || activeLetterModal.id.startsWith('opening_')) && (
        <LetterArrivalModal
          letter={activeLetterModal}
          onClose={() => setActiveLetterModal(null)}
          onRead={isPreviewMode ? () => {} : markLetterRead}
        />
      )}
    </div>
  );
};
