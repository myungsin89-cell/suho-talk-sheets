import React, { useEffect, useState } from 'react';
import {
  ActivityType,
  ChatMessage,
  ClassConfig,
  ClassRoom,
  GameStage,
  MedalAward,
  MissionLog,
  Student,
} from './types';
import {
  ACTIVITY_META_LIST,
  createDefaultClassRoom,
  generateClassCode,
  generateStudentPin,
  getTodayDateKey,
  INITIAL_MEDAL_TEMPLATES,
} from './data/mockData';
import {
  approveGasAllPending,
  deleteGasStudent,
  extractGasDeploymentId,
  fetchGasStudentRoster,
  fetchGasTeacherClassroom,
  loginGasStudent,
  loginGasTeacher,
  normalizeGasWebAppUrl,
  replaceGasAll,
  saveGasProgress,
  saveGasStudentWork,
  saveGasWeeklyQuest,
  sendGasPostmasterNote,
  sendGasStudentChat,
  sendGasStudentMission,
  setGasChatOpen,
  setupGasClassroom,
  StudentRosterEntry,
  subscribeToGasPolling,
  syncGasStudentClassroom,
  updateGasStudentMission,
  updateGasTeacherMeta,
  upsertGasStudents,
} from './services/classroomRepo';
import { StudentView, StudentWork } from './components/StudentView';
import { TeacherDashboard, TeacherTab } from './components/TeacherDashboard';
import { LoginWelcomeView } from './components/LoginWelcomeView';
import {
  SavedGasConnection,
  TeacherEntryView,
} from './components/TeacherEntryView';
import { SuhoKakaoLogo } from './components/SuhoHamster';
import { SuhoGuidePoster } from './components/SuhoGuidePoster';
import {
  getStudentWorkbookPageCount,
  WorkbookPrintSheet,
} from './components/WorkbookPrintSheet';
import { getDailyLimitStatus } from './utils/scoring';
import {
  applyWeeklyQuestChange,
  isSameWeeklyQuest,
  isWeeklyQuestVisible,
} from './utils/weeklyQuest';
import { ClassProgress, isIdentityRevealed } from './utils/classProgress';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const STORAGE_KEY_LOCAL_CLASSES = 'suhotalk_sheets_local_classes_v1';
const STORAGE_KEY_SAVED_SHEETS = 'suhotalk_sheets_connections_v1';
const STORAGE_KEY_ACTIVE_SESSION = 'suhotalk_sheets_teacher_session_v1';

interface TeacherSessionRecord {
  mode: 'gas' | 'local';
  gasWebAppUrl?: string;
  teacherPassword?: string;
  activeClassId?: string;
}

interface StudentSessionRecord {
  studentId: string;
  pin: string;
}

const assignRandomDerangement = (list: Student[]): Student[] => {
  if (list.length < 2) return list;
  const targets = list.map((s) => s.id);

  for (let attempt = 0; attempt < 150; attempt++) {
    for (let i = targets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [targets[i], targets[j]] = [targets[j], targets[i]];
    }
    if (targets.every((tid, idx) => tid !== list[idx].id)) {
      return list.map((s, idx) => ({ ...s, targetId: targets[idx] }));
    }
  }

  return list.map((s, idx) => ({
    ...s,
    targetId: list[(idx + 1) % list.length].id,
  }));
};

const getNowLabel = () => {
  const now = new Date();
  return `오늘 ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
};

export const App: React.FC = () => {
  const searchParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;
  const rawGasParam = searchParams?.get('gas') || null;
  const classParam = searchParams?.get('class') || null;
  const isPosterStandalone = searchParams?.get('poster') === '1';
  const posterClassName = searchParams?.get('className') || '우리 반 수호톡';
  const workbookParam = searchParams?.get('workbook');
  const isWorkbookDemo =
    workbookParam === '1' ||
    workbookParam === '2' ||
    workbookParam === '4' ||
    workbookParam === 'mixed';
  const studentGasUrl = rawGasParam ? normalizeGasWebAppUrl(rawGasParam) : '';
  const isStudentMode = Boolean(studentGasUrl || classParam);

  // =========================================================================
  // 1) 학생 모드 상태 (?gas=... 또는 로컬 체험 ?class=...)
  // =========================================================================
  const studentSessionKey = studentGasUrl
    ? `suhotalk_gas_stu_${extractGasDeploymentId(studentGasUrl)}`
    : classParam
    ? `suhotalk_local_stu_${classParam.trim().toUpperCase()}`
    : '';

  const [studentSession, setStudentSession] = useState<StudentSessionRecord | null>(() => {
    if (!studentSessionKey) return null;
    try {
      const raw = sessionStorage.getItem(studentSessionKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<StudentSessionRecord>;
      if (parsed.studentId) {
        return { studentId: parsed.studentId, pin: parsed.pin || '' };
      }
    } catch {
      // ignore storage errors
    }
    return null;
  });

  const [gasStudentLoading, setGasStudentLoading] = useState<boolean>(Boolean(studentGasUrl));
  const [gasStudentError, setGasStudentError] = useState<string>('');
  const [gasStudentRoster, setGasStudentRoster] = useState<{
    classId: string;
    config: ClassConfig;
    roster: StudentRosterEntry[];
  } | null>(null);
  const [gasStudentClassroom, setGasStudentClassroom] = useState<ClassRoom | null>(null);
  const [studentChatActive, setStudentChatActive] = useState(false);

  // =========================================================================
  // 2) 교사 모드 상태 (Google Sheets 연결 + 로컬 체험)
  // =========================================================================
  const [localClasses, setLocalClasses] = useState<ClassRoom[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOCAL_CLASSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [createDefaultClassRoom()];
  });

  const [savedConnections, setSavedConnections] = useState<SavedGasConnection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_SHEETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [teacherSession, setTeacherSession] = useState<TeacherSessionRecord | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);
      if (saved) {
        return JSON.parse(saved) as TeacherSessionRecord;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [gasTeacherClassroom, setGasTeacherClassroom] = useState<ClassRoom | null>(null);
  const [restoringTeacherSession, setRestoringTeacherSession] = useState<boolean>(
    Boolean(!isStudentMode && !isPosterStandalone && !isWorkbookDemo && teacherSession?.mode === 'gas' && teacherSession.gasWebAppUrl && teacherSession.teacherPassword)
  );

  const [teacherInitialTab, setTeacherInitialTab] = useState<TeacherTab>('status');
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  const [previewStage, setPreviewStage] = useState<GameStage | null>(null);
  const [previewRevealed, setPreviewRevealed] = useState(false);

  // 로컬 체험 데이터 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL_CLASSES, JSON.stringify(localClasses));
    } catch {
      // ignore
    }
  }, [localClasses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_SHEETS, JSON.stringify(savedConnections));
    } catch {
      // ignore
    }
  }, [savedConnections]);

  // =========================================================================
  // 학생 GAS 초기 로드 + 12~15초 폴링
  // =========================================================================
  useEffect(() => {
    if (!studentGasUrl) return;
    let active = true;

    const loadStudentInitial = async () => {
      try {
        if (studentSession?.studentId && studentSession.pin) {
          const synced = await syncGasStudentClassroom(
            studentGasUrl,
            studentSession.studentId,
            studentSession.pin
          );
          if (!active) return;
          if (synced) {
            setGasStudentClassroom(synced);
            setGasStudentError('');
            return;
          }
          setStudentSession(null);
          try {
            sessionStorage.removeItem(studentSessionKey);
          } catch {
            // ignore
          }
        }
        const rosterRes = await fetchGasStudentRoster(studentGasUrl);
        if (!active) return;
        if (rosterRes.ok && rosterRes.config) {
          setGasStudentRoster({
            classId: rosterRes.classId || classParam || 'SHEET',
            config: rosterRes.config,
            roster: rosterRes.roster || [],
          });
          setGasStudentError('');
        } else {
          setGasStudentError(rosterRes.error || '학급 시트를 불러오지 못했습니다.');
        }
      } finally {
        if (active) setGasStudentLoading(false);
      }
    };

    void loadStudentInitial();
    return () => {
      active = false;
    };
  }, [studentGasUrl, studentSession?.studentId, studentSession?.pin, studentSessionKey, classParam]);

  useEffect(() => {
    if (!studentGasUrl || !studentSession?.studentId || !studentSession.pin) return;
    const fastChatPolling = studentChatActive && Boolean(gasStudentClassroom?.config.chatOpen);
    return subscribeToGasPolling(
      () => {
        void syncGasStudentClassroom(
          studentGasUrl,
          studentSession.studentId,
          studentSession.pin
        ).then((fresh) => {
          if (fresh) setGasStudentClassroom(fresh);
        });
      },
      fastChatPolling ? 5000 : 12000
    );
  }, [
    studentGasUrl,
    studentSession?.studentId,
    studentSession?.pin,
    studentChatActive,
    gasStudentClassroom?.config.chatOpen,
  ]);

  // =========================================================================
  // 교사 GAS 세션 복원 + 12~15초 폴링
  // =========================================================================
  useEffect(() => {
    if (isStudentMode || isPosterStandalone || isWorkbookDemo) return;
    if (teacherSession?.mode !== 'gas' || !teacherSession.gasWebAppUrl || !teacherSession.teacherPassword) {
      setRestoringTeacherSession(false);
      return;
    }
    if (gasTeacherClassroom && gasTeacherClassroom.config.gasWebAppUrl === teacherSession.gasWebAppUrl) {
      setRestoringTeacherSession(false);
      return;
    }

    let active = true;
    const restore = async () => {
      try {
        const res = await loginGasTeacher(
          teacherSession.gasWebAppUrl!,
          teacherSession.teacherPassword!
        );
        if (!active) return;
        if (res.ok && res.classroom) {
          setGasTeacherClassroom(res.classroom);
        } else {
          setTeacherSession(null);
          try {
            localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
          } catch {
            // ignore
          }
        }
      } finally {
        if (active) setRestoringTeacherSession(false);
      }
    };
    void restore();
    return () => {
      active = false;
    };
  }, [isStudentMode, teacherSession, gasTeacherClassroom]);

  useEffect(() => {
    if (
      isStudentMode ||
      teacherSession?.mode !== 'gas' ||
      !teacherSession.gasWebAppUrl ||
      !teacherSession.teacherPassword ||
      !gasTeacherClassroom
    ) {
      return;
    }
    const url = teacherSession.gasWebAppUrl;
    const pw = teacherSession.teacherPassword;
    return subscribeToGasPolling(() => {
      void fetchGasTeacherClassroom(url, pw).then((fresh) => {
        if (fresh) setGasTeacherClassroom(fresh);
      });
    });
  }, [isStudentMode, teacherSession, gasTeacherClassroom]);

  const persistTeacherSessionRecord = (
    record: TeacherSessionRecord | null,
    rememberInBrowser: boolean
  ) => {
    setTeacherSession(record);
    try {
      if (record && rememberInBrowser) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, JSON.stringify(record));
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
      }
    } catch {
      // ignore
    }
  };

  const upsertSavedConnection = (cls: ClassRoom) => {
    const url = cls.config.gasWebAppUrl;
    if (!url) return;
    setSavedConnections((prev) => {
      const nextItem: SavedGasConnection = {
        id: cls.id,
        className: cls.config.className,
        gasWebAppUrl: url,
        spreadsheetUrl: cls.config.spreadsheetUrl,
      };
      const exists = prev.some((c) => c.gasWebAppUrl === url);
      return exists
        ? prev.map((c) => (c.gasWebAppUrl === url ? nextItem : c))
        : [nextItem, ...prev];
    });
  };

  if (isPosterStandalone) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] py-6 px-4 print:min-h-0 print:p-0 print:bg-white">
        <div className="max-w-[760px] mx-auto mb-4 flex items-center justify-between gap-2 no-print">
          <div className="text-sm font-extrabold text-[#191919]">
            교실 게시판용 규칙·점수 안내판 (A4 1장)
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black"
          >
            인쇄 / PDF 저장
          </button>
        </div>
        <SuhoGuidePoster classNameText={posterClassName} />
      </div>
    );
  }

  if (isWorkbookDemo) {
    const sampleClass = createDefaultClassRoom();
    const demoConfig: ClassConfig = {
      ...sampleClass.config,
      className: '4학년 4반',
      stage: 3,
      revealOpened: true,
    };
    const count = workbookParam === '2' || workbookParam === 'mixed' ? 2 : 1;
    const demoStudents = sampleClass.students.map((stu) => ({
      ...stu,
      openingLetterToAngel:
        stu.openingLetterToAngel ||
        '안녕, 나의 수호천사야! 나는 요즘 피구랑 보드게임을 좋아해. 앞으로 잘 부탁해!',
      openingReplyToTarget:
        stu.openingReplyToTarget ||
        '반가워! 내가 너를 몰래 잘 챙겨줄게. 오늘도 즐거운 하루 보내자!',
      thankLetterToAngel:
        stu.thankLetterToAngel ||
        '그동안 몰래 챙겨줘서 정말 고마웠어! 덕분에 학교 생활이 훨씬 더 즐겁고 따뜻했어.',
      revealLetterToTarget:
        stu.revealLetterToTarget ||
        `안녕! 너의 비밀 수호천사는 바로 나 ${stu.name}이었어. 네가 환하게 웃을 때마다 나도 참 기뻤어!`,
    }));

    const firstStu = demoStudents[0];
    const firstTargetId = firstStu.targetId || demoStudents[1]?.id || firstStu.id;
    const firstAngelId =
      demoStudents.find((s) => s.targetId === firstStu.id)?.id ||
      demoStudents[demoStudents.length - 1]?.id ||
      firstStu.id;

    let demoMissions = [...sampleClass.missions];
    if (workbookParam === '4' || workbookParam === 'mixed') {
      const existingSentCount = demoMissions.filter(
        (m) => m.senderId === firstStu.id && !m.isPostmasterNote
      ).length;
      const existingRecvCount = demoMissions.filter(
        (m) => m.receiverId === firstStu.id
      ).length;

      const extraSentNeeded = Math.max(0, 10 - existingSentCount);
      for (let i = 0; i < extraSentNeeded; i++) {
        demoMissions.push({
          id: `demo_extra_sent_${i}`,
          senderId: firstStu.id,
          receiverId: firstTargetId,
          type: i % 2 === 0 ? 'stealth' : 'heart',
          content: `추가 비밀 선행 활동 ${i + 1}: 짝꿍이 기분 좋도록 몰래 자리와 사물함을 챙겨주었어요.`,
          points: 10,
          status: 'verified',
          reply: i % 2 === 0 ? '정말 고마워!' : undefined,
          dateKey: '2026-11-26',
          createdAt: `11월 ${18 + i}일 10:0${i}`,
          verifiedAt: `11월 ${18 + i}일 11:00`,
        });
      }

      const extraRecvNeeded = Math.max(0, 9 - existingRecvCount);
      for (let i = 0; i < extraRecvNeeded; i++) {
        demoMissions.push({
          id: `demo_extra_recv_${i}`,
          senderId: firstAngelId,
          receiverId: firstStu.id,
          type: i % 2 === 0 ? 'power' : 'stealth',
          content: `수호천사의 추가 응원 활동 ${i + 1}: 급식과 정리 시간에 조용히 도와주었어요.`,
          points: 20,
          status: 'verified',
          reply: i % 3 === 0 ? '수호천사 최고!' : undefined,
          dateKey: '2026-11-26',
          createdAt: `11월 ${18 + i}일 13:1${i}`,
          verifiedAt: `11월 ${18 + i}일 14:00`,
        });
      }
    }

    const targetList = demoStudents.slice(0, count);
    const totalDemoPages = targetList.reduce(
      (sum, stu) => sum + getStudentWorkbookPageCount(stu.id, demoMissions),
      0
    );

    return (
      <div className="min-h-screen bg-[#F5F6F8] py-6 px-4 print:min-h-0 print:p-0 print:bg-white">
        <div className="max-w-[760px] mx-auto mb-4 flex flex-wrap items-center justify-between gap-2 no-print">
          <div>
            <div className="text-sm font-extrabold text-[#191919]">
              수호천사 활동 기록장 미리보기 ({count}명 · 총 {totalDemoPages}쪽)
            </div>
            <div className="text-xs text-[#767676]">
              양면 인쇄(앞·뒤) 또는 2쪽 모아찍기(소책자)로 인쇄하기 알맞도록 항상 짝수 쪽으로 구성됩니다.
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black"
          >
            인쇄 / PDF 저장
          </button>
        </div>
        <div className="space-y-6 print:space-y-0">
          {targetList.map((stu, idx) => (
            <WorkbookPrintSheet
              key={stu.id}
              student={stu}
              students={demoStudents}
              missions={demoMissions}
              config={demoConfig}
              isPageBreak={idx < targetList.length - 1}
            />
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 1) 학생 전용 경로 (?gas=... 또는 로컬 ?class=...)
  // =========================================================================
  if (isStudentMode) {
    if (studentGasUrl) {
      if (gasStudentLoading) {
        return (
          <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center space-y-3 shadow-sm">
              <div className="flex justify-center">
                <SuhoKakaoLogo size={40} />
              </div>
              <p className="text-sm font-extrabold text-[#191919]">
                우리 반 구글 시트에서 불러오는 중...
              </p>
            </div>
          </div>
        );
      }

      if (gasStudentError && !gasStudentClassroom && !gasStudentRoster) {
        return (
          <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-xl p-8 text-center space-y-4 shadow-sm">
              <div className="flex justify-center">
                <SuhoKakaoLogo size={44} />
              </div>
              <h1 className="text-lg font-black text-[#191919]">
                학급 시트에 연결하지 못했습니다
              </h1>
              <p className="text-xs sm:text-sm text-[#767676] leading-relaxed">
                {gasStudentError}
              </p>
            </div>
          </div>
        );
      }

      const loggedInStudent =
        gasStudentClassroom && studentSession
          ? gasStudentClassroom.students.find((s) => s.id === studentSession.studentId)
          : undefined;

      if (!loggedInStudent || !gasStudentClassroom || !studentSession) {
        return (
          <LoginWelcomeView
            students={(gasStudentRoster?.roster || []).map((r) => ({
              ...r,
              pin: '',
            }))}
            config={
              gasStudentRoster?.config || {
                className: '우리 반 수호톡',
                weeklyQuest: '',
                stage: 1,
                gasWebAppUrl: studentGasUrl,
              }
            }
            onAuthenticateStudent={async (name, pin) => {
              const res = await loginGasStudent(studentGasUrl, name, pin);
              if (!res.ok) return res;
              setGasStudentClassroom(res.classroom);
              return { ok: true, studentId: res.studentId, pin };
            }}
            onSelectStudent={(studentId, pin = '') => {
              const rec = { studentId, pin };
              setStudentSession(rec);
              if (studentSessionKey) {
                try {
                  sessionStorage.setItem(studentSessionKey, JSON.stringify(rec));
                } catch {
                  // ignore
                }
              }
            }}
          />
        );
      }

      return (
        <StudentView
          key={`${gasStudentClassroom.id}:${loggedInStudent.id}`}
          classId={gasStudentClassroom.id}
          student={loggedInStudent}
          students={gasStudentClassroom.students}
          missions={gasStudentClassroom.missions}
          chats={gasStudentClassroom.chats || []}
          config={gasStudentClassroom.config}
          onChatActiveChange={setStudentChatActive}
          onSendChat={async (partnerRole, content) => {
            const updated = await sendGasStudentChat(
              studentGasUrl,
              studentSession.studentId,
              studentSession.pin,
              partnerRole,
              content
            );
            if (!updated) return false;
            setGasStudentClassroom(updated);
            return true;
          }}
          onSendMission={async (type, content) => {
            if (!loggedInStudent.targetId || gasStudentClassroom.config.stage !== 2) return false;
            const dateKey = getTodayDateKey();
            const questId =
              type === 'quest' ? gasStudentClassroom.config.weeklyQuestId : undefined;
            const limit = getDailyLimitStatus(
              loggedInStudent.id,
              gasStudentClassroom.missions,
              dateKey,
              questId
            );
            if (
              type === 'quest'
                ? !isWeeklyQuestVisible(gasStudentClassroom.config) || !limit.canSendQuest
                : !limit.canSendRegular
            ) {
              return false;
            }
            const meta =
              ACTIVITY_META_LIST.find((a) => a.type === type) || ACTIVITY_META_LIST[0];
            const newMission: MissionLog = {
              id: questId
                ? `m_quest_${gasStudentClassroom.id}_${questId}_${loggedInStudent.id}`
                : `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              senderId: loggedInStudent.id,
              receiverId: loggedInStudent.targetId,
              type,
              content,
              points: meta.points,
              status: 'pending',
              dateKey,
              createdAt: getNowLabel(),
              ...(questId ? { questId, questText: gasStudentClassroom.config.weeklyQuest } : {}),
            };
            const updated = await sendGasStudentMission(
              studentGasUrl,
              studentSession.studentId,
              studentSession.pin,
              newMission
            );
            if (!updated) return false;
            setGasStudentClassroom(updated);
            return true;
          }}
          onVerifyMission={async (missionId, reply) => {
            const updated = await updateGasStudentMission(
              studentGasUrl,
              studentSession.studentId,
              studentSession.pin,
              missionId,
              { status: 'verified', reply, verifiedAt: getNowLabel() }
            );
            if (!updated) return false;
            setGasStudentClassroom(updated);
            return true;
          }}
          onHoldMission={async (missionId) => {
            const updated = await updateGasStudentMission(
              studentGasUrl,
              studentSession.studentId,
              studentSession.pin,
              missionId,
              { status: 'hold' }
            );
            if (!updated) return false;
            setGasStudentClassroom(updated);
            return true;
          }}
          onSaveWork={async (patch: StudentWork) => {
            const updated = await saveGasStudentWork(
              studentGasUrl,
              studentSession.studentId,
              studentSession.pin,
              patch
            );
            if (!updated) return false;
            setGasStudentClassroom(updated);
            return true;
          }}
          onLogout={() => {
            setStudentSession(null);
            setGasStudentClassroom(null);
            if (studentSessionKey) {
              try {
                sessionStorage.removeItem(studentSessionKey);
              } catch {
                // ignore
              }
            }
          }}
        />
      );
    }

    // 로컬 체험 학생 접속 (?class=XXXX without ?gas=)
    const cleanClassParam = (classParam || '').trim().toUpperCase();
    const localClass = localClasses.find(
      (c) => c.id.toUpperCase() === cleanClassParam
    );

    if (!localClass) {
      return (
        <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E5E7EB] rounded-xl p-8 text-center space-y-4 shadow-sm">
            <div className="flex justify-center">
              <SuhoKakaoLogo size={44} />
            </div>
            <h1 className="text-lg font-black text-[#191919]">
              학급을 찾을 수 없습니다
            </h1>
            <p className="text-xs sm:text-sm text-[#767676] leading-relaxed">
              연결된 수호톡 학급 정보를 찾을 수 없어요. 선생님께 정확한 접속 QR이나 링크를 다시 확인해 주세요.
            </p>
          </div>
        </div>
      );
    }

    const loggedInLocalStu = studentSession
      ? localClass.students.find((s) => s.id === studentSession.studentId)
      : undefined;

    if (!loggedInLocalStu) {
      return (
        <LoginWelcomeView
          students={localClass.students}
          config={localClass.config}
          onSelectStudent={(studentId, pin = '') => {
            const rec = { studentId, pin };
            setStudentSession(rec);
            if (studentSessionKey) {
              try {
                sessionStorage.setItem(studentSessionKey, JSON.stringify(rec));
              } catch {
                // ignore
              }
            }
          }}
        />
      );
    }

    const updateLocalClass = (updater: (cls: ClassRoom) => ClassRoom) => {
      setLocalClasses((prev) =>
        prev.map((cls) => (cls.id === localClass.id ? updater(cls) : cls))
      );
    };

    return (
      <StudentView
        key={`${localClass.id}:${loggedInLocalStu.id}`}
        classId={localClass.id}
        student={loggedInLocalStu}
        students={localClass.students}
        missions={localClass.missions}
        chats={localClass.chats || []}
        config={localClass.config}
        onSendChat={async (partnerRole, content) => {
          if (!localClass.config.chatOpen) return false;
          const myAngel = localClass.students.find((s) => s.targetId === loggedInLocalStu.id);
          const roomId =
            partnerRole === 'angel'
              ? myAngel
                ? `${myAngel.id}->${loggedInLocalStu.id}`
                : ''
              : loggedInLocalStu.targetId
              ? `${loggedInLocalStu.id}->${loggedInLocalStu.targetId}`
              : '';
          const receiverId =
            partnerRole === 'angel' ? myAngel?.id || '' : loggedInLocalStu.targetId;
          if (!roomId || !receiverId) return false;
          const now = new Date();
          const createdAt = `${String(now.getHours()).padStart(2, '0')}:${String(
            now.getMinutes()
          ).padStart(2, '0')}`;
          const newMsg: ChatMessage = {
            id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            roomId,
            senderId: loggedInLocalStu.id,
            receiverId,
            content,
            createdAt,
          };
          updateLocalClass((cls) => ({
            ...cls,
            chats: [...(cls.chats || []), newMsg],
          }));
          return true;
        }}
        onSendMission={async (type: ActivityType, content: string) => {
          if (!loggedInLocalStu.targetId || localClass.config.stage !== 2) return false;
          const dateKey = getTodayDateKey();
          const questId =
            type === 'quest' ? localClass.config.weeklyQuestId : undefined;
          const limit = getDailyLimitStatus(
            loggedInLocalStu.id,
            localClass.missions,
            dateKey,
            questId
          );
          if (
            type === 'quest'
              ? !isWeeklyQuestVisible(localClass.config) || !limit.canSendQuest
              : !limit.canSendRegular
          ) {
            return false;
          }
          const meta =
            ACTIVITY_META_LIST.find((a) => a.type === type) || ACTIVITY_META_LIST[0];
          const newMission: MissionLog = {
            id: questId
              ? `m_quest_${localClass.id}_${questId}_${loggedInLocalStu.id}`
              : `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            senderId: loggedInLocalStu.id,
            receiverId: loggedInLocalStu.targetId,
            type,
            content,
            points: meta.points,
            status: 'pending',
            dateKey,
            createdAt: getNowLabel(),
            ...(questId ? { questId, questText: localClass.config.weeklyQuest } : {}),
          };
          updateLocalClass((cls) => ({
            ...cls,
            missions: [...cls.missions, newMission],
          }));
          return true;
        }}
        onVerifyMission={async (missionId, reply) => {
          updateLocalClass((cls) => ({
            ...cls,
            missions: cls.missions.map((m) =>
              m.id === missionId
                ? { ...m, status: 'verified', reply, verifiedAt: getNowLabel() }
                : m
            ),
          }));
          return true;
        }}
        onHoldMission={async (missionId) => {
          updateLocalClass((cls) => ({
            ...cls,
            missions: cls.missions.map((m) =>
              m.id === missionId ? { ...m, status: 'hold' } : m
            ),
          }));
          return true;
        }}
        onSaveWork={async (patch) => {
          const isOpeningLetter =
            'openingLetterToAngel' in patch || 'openingReplyToTarget' in patch;
          if (
            isOpeningLetter
              ? isIdentityRevealed(localClass.config)
              : localClass.config.stage !== 3 || isIdentityRevealed(localClass.config)
          ) {
            return false;
          }
          if (
            ('openingLetterToAngel' in patch && Boolean(loggedInLocalStu.openingLetterToAngel?.trim())) ||
            ('openingReplyToTarget' in patch && Boolean(loggedInLocalStu.openingReplyToTarget?.trim()))
          ) {
            return false;
          }
          updateLocalClass((cls) => ({
            ...cls,
            students: cls.students.map((s) =>
              s.id === loggedInLocalStu.id ? { ...s, ...patch } : s
            ),
          }));
          return true;
        }}
        onLogout={() => {
          setStudentSession(null);
          if (studentSessionKey) {
            try {
              sessionStorage.removeItem(studentSessionKey);
            } catch {
              // ignore
            }
          }
        }}
      />
    );
  }

  // =========================================================================
  // 2) 교사 포털 (Google Sheets 무서버 연결 / 로컬 체험)
  // =========================================================================
  if (restoringTeacherSession) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center space-y-3 shadow-sm">
          <div className="flex justify-center">
            <SuhoKakaoLogo size={40} />
          </div>
          <p className="text-sm font-extrabold text-[#191919]">
            연결된 구글 시트에서 학급 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  const isGasMode =
    teacherSession?.mode === 'gas' &&
    Boolean(teacherSession.gasWebAppUrl) &&
    Boolean(teacherSession.teacherPassword) &&
    Boolean(gasTeacherClassroom);

  const isLocalTeacherMode = teacherSession?.mode === 'local';

  if (!isGasMode && !isLocalTeacherMode) {
    return (
      <TeacherEntryView
        savedConnections={savedConnections}
        localDemoClass={localClasses[0]}
        onConnectGasSheet={async ({
          gasWebAppUrl,
          mode,
          className,
          teacherPassword,
          rememberInBrowser,
        }) => {
          if (mode === 'setup') {
            const res = await setupGasClassroom(gasWebAppUrl, {
              classId: generateClassCode(),
              className: (className || '').trim(),
              teacherPassword,
              medalTemplates: INITIAL_MEDAL_TEMPLATES,
            });
            if (!res.ok || !res.classroom) {
              return res.error || '학급 초기 설정에 실패했습니다.';
            }
            setGasTeacherClassroom(res.classroom);
            upsertSavedConnection(res.classroom);
            persistTeacherSessionRecord(
              { mode: 'gas', gasWebAppUrl: res.classroom.config.gasWebAppUrl, teacherPassword },
              rememberInBrowser
            );
            setTeacherInitialTab('setup');
            setPreviewStudentId(null);
            return null;
          }

          const res = await loginGasTeacher(gasWebAppUrl, teacherPassword);
          if (!res.ok || !res.classroom) {
            return res.error || '비밀번호가 일치하지 않습니다.';
          }
          setGasTeacherClassroom(res.classroom);
          upsertSavedConnection(res.classroom);
          persistTeacherSessionRecord(
            { mode: 'gas', gasWebAppUrl: res.classroom.config.gasWebAppUrl, teacherPassword },
            rememberInBrowser
          );
          setTeacherInitialTab('status');
          setPreviewStudentId(null);
          return null;
        }}
        onRemoveSavedConnection={(url) => {
          setSavedConnections((prev) => prev.filter((c) => c.gasWebAppUrl !== url));
        }}
        onEnterLocalDemo={() => {
          persistTeacherSessionRecord(
            { mode: 'local', activeClassId: localClasses[0].id },
            false
          );
          setTeacherInitialTab('status');
          setPreviewStudentId(null);
        }}
      />
    );
  }

  const activeClass: ClassRoom = isGasMode
    ? gasTeacherClassroom!
    : localClasses.find((c) => c.id === teacherSession?.activeClassId) || localClasses[0];

  const gasUrl = isGasMode ? teacherSession!.gasWebAppUrl! : '';
  const gasPw = isGasMode ? teacherSession!.teacherPassword! : '';

  const updateActiveClass = (updater: (cls: ClassRoom) => ClassRoom): ClassRoom => {
    const next = updater(activeClass);
    if (isGasMode) {
      setGasTeacherClassroom(next);
    } else {
      setLocalClasses((prev) =>
        prev.map((cls) => (cls.id === activeClass.id ? next : cls))
      );
    }
    return next;
  };

  // 교사 잠입 확인 (학생 화면 미리보기)
  if (previewStudentId && activeClass.students.length > 0) {
    const previewStudent =
      activeClass.students.find((s) => s.id === previewStudentId) ||
      activeClass.students[0];
    const currentIdx = activeClass.students.findIndex(
      (s) => s.id === previewStudent.id
    );
    const stepPreviewStudent = (delta: number) => {
      const nextIdx =
        (currentIdx + delta + activeClass.students.length) %
        activeClass.students.length;
      setPreviewStudentId(activeClass.students[nextIdx].id);
    };
    const stage = previewStage ?? activeClass.config.stage;
    const previewOnly = async () => false;

    return (
      <div className="min-h-screen bg-[#F5F6F8]">
        <div className="bg-[#ECEEF2] text-[#191919] border-b border-[#DDE1E6] sticky top-0 z-40 no-print">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => setPreviewStudentId(null)}
                className="px-2.5 py-1 rounded-md bg-[#3C1E1E] text-[#FEE500] font-extrabold inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>교사 대시보드로 돌아가기</span>
              </button>

              <select
                aria-label="미리보기 학생 전환"
                value={previewStudent.id}
                onChange={(e) => setPreviewStudentId(e.target.value)}
                className="rounded-md bg-white border border-[#D1D5DB] px-2.5 py-1 text-xs font-bold text-[#191919]"
              >
                {activeClass.students.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.number}번 {stu.name}
                  </option>
                ))}
              </select>

              {activeClass.students.length > 1 && (
                <div className="inline-flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => stepPreviewStudent(-1)}
                    className="p-1 rounded-md bg-white border border-[#D1D5DB] hover:bg-[#FEE500]"
                    title="이전 학생"
                    aria-label="이전 학생"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepPreviewStudent(1)}
                    className="p-1 rounded-md bg-white border border-[#D1D5DB] hover:bg-[#FEE500]"
                    title="다음 학생"
                    aria-label="다음 학생"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-[#FFF5D6] border border-[#E9D9AE] px-2 py-0.5 font-extrabold text-[#735020]">
                잠입 확인 모드 (읽기 전용 · 학생 알림 유지)
              </span>

              <div className="inline-flex items-center bg-white border border-[#D1D5DB] rounded-md p-0.5 gap-0.5">
                {([
                  { stage: 1 as GameStage, label: '1단계' },
                  { stage: 2 as GameStage, label: '2단계' },
                  { stage: 3 as GameStage, label: '3단계' },
                ]).map((item) => (
                  <button
                    key={item.stage}
                    type="button"
                    onClick={() => setPreviewStage(item.stage)}
                    aria-pressed={stage === item.stage}
                    className={`min-h-9 px-2.5 rounded text-xs font-bold transition-all ${
                      stage === item.stage
                        ? 'bg-[#FEE500] text-[#3C1E1E] font-extrabold'
                        : 'text-[#767676] hover:text-[#191919]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {stage === 3 && (
                <button
                  type="button"
                  aria-pressed={previewRevealed}
                  onClick={() => setPreviewRevealed(!previewRevealed)}
                  className="min-h-9 rounded-md border border-[#D1D5DB] bg-white px-2.5 text-xs font-bold aria-pressed:bg-[#FEE500]"
                >
                  정체 공개 화면
                </button>
              )}
            </div>
          </div>
        </div>

        <StudentView
          key={`${activeClass.id}:${previewStudent.id}`}
          classId={activeClass.id}
          student={previewStudent}
          students={activeClass.students}
          missions={activeClass.missions}
          chats={activeClass.chats || []}
          config={{ ...activeClass.config, stage, revealOpened: previewRevealed }}
          isPreviewMode
          onSendMission={previewOnly}
          onVerifyMission={previewOnly}
          onHoldMission={previewOnly}
          onSaveWork={previewOnly}
        />
      </div>
    );
  }

  return (
    <TeacherDashboard
      classId={activeClass.id}
      classes={isGasMode ? [activeClass] : localClasses}
      isCloudConnected={isGasMode}
      students={activeClass.students}
      missions={activeClass.missions}
      chats={activeClass.chats || []}
      config={activeClass.config}
      medalTemplates={activeClass.medalTemplates}
      initialTab={teacherInitialTab}
      onToggleChatOpen={async (open) => {
        if (isGasMode) {
          const ok = await setGasChatOpen(gasUrl, gasPw, open);
          if (!ok) return false;
        }
        updateActiveClass((cls) => ({
          ...cls,
          config: { ...cls.config, chatOpen: open },
        }));
        return true;
      }}
      onSwitchClass={(nextId) => {
        if (!isGasMode) {
          persistTeacherSessionRecord({ mode: 'local', activeClassId: nextId }, false);
        }
        setPreviewStudentId(null);
      }}
      onCreateClass={(name, pw) => {
        if (isGasMode) return;
        const existingIds = new Set(localClasses.map((c) => c.id.toUpperCase()));
        const newId = generateClassCode(existingIds);
        const newClass: ClassRoom = {
          id: newId,
          teacherPassword: pw.trim(),
          config: {
            className: name.trim(),
            weeklyQuest: '',
            stage: 1,
            gasWebAppUrl: '',
          },
          students: [],
          missions: [],
          medalTemplates: INITIAL_MEDAL_TEMPLATES,
          createdAt: getTodayDateKey(),
        };
        setLocalClasses((prev) => [...prev, newClass]);
        persistTeacherSessionRecord({ mode: 'local', activeClassId: newId }, false);
        setTeacherInitialTab('setup');
      }}
      onLockTeacher={() => {
        setGasTeacherClassroom(null);
        persistTeacherSessionRecord(null, false);
        setPreviewStudentId(null);
      }}
      onUpdateClassName={(className) => {
        const updated = updateActiveClass((cls) => ({
          ...cls,
          config: { ...cls.config, className },
        }));
        if (isGasMode) {
          upsertSavedConnection(updated);
          void updateGasTeacherMeta(gasUrl, gasPw, { className });
        }
      }}
      onChangeWeeklyQuest={async (change, previous) => {
        if (
          activeClass.config.stage !== 2 ||
          !isSameWeeklyQuest(activeClass.config, previous)
        ) {
          return false;
        }
        const next = applyWeeklyQuestChange(
          previous,
          change,
          () =>
            globalThis.crypto?.randomUUID?.() ??
            `q_${Date.now()}_${Math.random().toString(36).slice(2)}`
        );
        if (!next) return false;
        if (isGasMode) {
          const ok = await saveGasWeeklyQuest(gasUrl, gasPw, previous, next);
          if (!ok) return false;
        }
        updateActiveClass((cls) =>
          isSameWeeklyQuest(cls.config, previous)
            ? { ...cls, config: { ...cls.config, ...next } }
            : cls
        );
        return true;
      }}
      onChangeProgress={async (action) => {
        const previous = activeClass.config;
        if (
          action === 'reveal'
            ? previous.stage !== 3 || isIdentityRevealed(previous)
            : previous.stage === action
        ) {
          return false;
        }
        const next: ClassProgress =
          action === 'reveal'
            ? { stage: 3, revealOpened: true }
            : { stage: action, revealOpened: false };
        if (isGasMode) {
          const ok = await saveGasProgress(gasUrl, gasPw, previous, next);
          if (!ok) return false;
        }
        updateActiveClass((cls) =>
          cls.config.stage === previous.stage &&
          cls.config.revealOpened === previous.revealOpened
            ? { ...cls, config: { ...cls.config, ...next } }
            : cls
        );
        return true;
      }}
      onAddStudent={(name, explicitNumber) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        const maxNum = activeClass.students.reduce(
          (max, s) => Math.max(max, s.number),
          0
        );
        const studentNumber =
          explicitNumber && explicitNumber > 0 ? explicitNumber : maxNum + 1;
        const usedPins = new Set(
          activeClass.students.map((s) => s.pin.toUpperCase())
        );
        const newStu: Student = {
          id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          number: studentNumber,
          name: cleanName,
          pin: generateStudentPin(usedPins),
          targetId: '',
        };
        updateActiveClass((cls) => ({
          ...cls,
          students: [...cls.students, newStu].sort((a, b) => a.number - b.number),
        }));
        if (isGasMode) {
          void upsertGasStudents(gasUrl, gasPw, [newStu]);
        }
      }}
      onBulkAddStudents={(items) => {
        const usedNums = new Set(activeClass.students.map((s) => s.number));
        let nextNum =
          activeClass.students.reduce((max, s) => Math.max(max, s.number), 0) + 1;
        const usedPins = new Set(
          activeClass.students.map((s) => s.pin.toUpperCase())
        );
        const added: Student[] = items
          .map((item) => ({ name: item.name.trim(), number: item.number }))
          .filter((item) => item.name.length > 0)
          .map((item, idx) => {
            let num: number;
            if (item.number && item.number > 0) {
              num = item.number;
            } else {
              while (usedNums.has(nextNum)) nextNum += 1;
              num = nextNum;
              nextNum += 1;
            }
            usedNums.add(num);
            const pin = generateStudentPin(usedPins);
            usedPins.add(pin);
            return {
              id: `s_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
              number: num,
              name: item.name,
              pin,
              targetId: '',
            };
          });
        if (added.length === 0) return;
        updateActiveClass((cls) => ({
          ...cls,
          students: [...cls.students, ...added].sort((a, b) => a.number - b.number),
        }));
        if (isGasMode) {
          void upsertGasStudents(gasUrl, gasPw, added);
        }
      }}
      onRemoveStudent={(studentId) => {
        updateActiveClass((cls) => ({
          ...cls,
          students: cls.students
            .filter((s) => s.id !== studentId)
            .map((s) => (s.targetId === studentId ? { ...s, targetId: '' } : s)),
        }));
        if (isGasMode) {
          void deleteGasStudent(gasUrl, gasPw, studentId);
        }
      }}
      onClearAllStudents={() => {
        updateActiveClass((cls) => ({ ...cls, students: [], missions: [] }));
        if (isGasMode) {
          void replaceGasAll(gasUrl, gasPw, [], []);
        }
      }}
      onUpdateStudentTarget={(studentId, targetId) => {
        const updated = updateActiveClass((cls) => ({
          ...cls,
          students: cls.students.map((s) =>
            s.id === studentId ? { ...s, targetId } : s
          ),
        }));
        const changed = updated.students.find((s) => s.id === studentId);
        if (isGasMode && changed) {
          void upsertGasStudents(gasUrl, gasPw, [changed]);
        }
      }}
      onBatchUpdateTargets={(updates) => {
        const updateIds = Object.keys(updates);
        if (updateIds.length === 0) return;
        const nextStudents = activeClass.students.map((s) =>
          updates[s.id] !== undefined ? { ...s, targetId: updates[s.id] } : s
        );
        const changedRows = nextStudents.filter((s) => updates[s.id] !== undefined);
        updateActiveClass((cls) => ({ ...cls, students: nextStudents }));
        if (isGasMode && changedRows.length > 0) {
          void upsertGasStudents(gasUrl, gasPw, changedRows);
        }
      }}
      onRunRandomMatching={() => {
        const nextStudents = assignRandomDerangement(activeClass.students);
        updateActiveClass((cls) => ({ ...cls, students: nextStudents }));
        if (isGasMode) {
          void upsertGasStudents(gasUrl, gasPw, nextStudents);
        }
      }}
      onClearMatching={() => {
        const nextStudents = activeClass.students.map((s) => ({
          ...s,
          targetId: '',
        }));
        updateActiveClass((cls) => ({ ...cls, students: nextStudents }));
        if (isGasMode) {
          void upsertGasStudents(gasUrl, gasPw, nextStudents);
        }
      }}
      onRegenerateAllPins={() => {
        const usedPins = new Set<string>();
        const nextStudents = activeClass.students.map((s) => {
          const pin = generateStudentPin(usedPins);
          usedPins.add(pin);
          return { ...s, pin };
        });
        updateActiveClass((cls) => ({ ...cls, students: nextStudents }));
        if (isGasMode) {
          void upsertGasStudents(gasUrl, gasPw, nextStudents);
        }
      }}
      onApproveAllPending={() => {
        const verifiedAt = getNowLabel();
        updateActiveClass((cls) => ({
          ...cls,
          missions: cls.missions.map((m) =>
            m.status === 'pending'
              ? {
                  ...m,
                  status: 'verified' as const,
                  reply: m.reply || '선생님 대신 승인 완료',
                  verifiedAt,
                }
              : m
          ),
        }));
        if (isGasMode) {
          void approveGasAllPending(gasUrl, gasPw, verifiedAt);
        }
      }}
      onSendPostmasterNote={(receiverId, content) => {
        const noteMission: MissionLog = {
          id: `m_pm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          senderId: 'POSTMASTER',
          receiverId,
          type: 'heart',
          content,
          points: 0,
          status: 'pending',
          dateKey: getTodayDateKey(),
          createdAt: getNowLabel(),
          isPostmasterNote: true,
        };
        updateActiveClass((cls) => ({
          ...cls,
          missions: [...cls.missions, noteMission],
        }));
        if (isGasMode) {
          void sendGasPostmasterNote(gasUrl, gasPw, noteMission);
        }
      }}
      onAwardMedal={(studentId, icon, title, reason) => {
        const now = new Date();
        const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일`;
        const targetStu = activeClass.students.find((s) => s.id === studentId);
        if (!targetStu) return;
        const newMedal: MedalAward = {
          id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          icon,
          title,
          reason,
          points: 30,
          awardedAt: dateLabel,
        };
        const updatedStu: Student = {
          ...targetStu,
          medals: [...(targetStu.medals || []), newMedal],
        };
        updateActiveClass((cls) => ({
          ...cls,
          students: cls.students.map((s) =>
            s.id === studentId ? updatedStu : s
          ),
        }));
        if (isGasMode) {
          void upsertGasStudents(gasUrl, gasPw, [updatedStu]);
        }
      }}
      onRemoveMedal={(studentId, medalId) => {
        const targetStu = activeClass.students.find((s) => s.id === studentId);
        if (!targetStu) return;
        const updatedStu: Student = {
          ...targetStu,
          medals: (targetStu.medals || []).filter((m) => m.id !== medalId),
        };
        updateActiveClass((cls) => ({
          ...cls,
          students: cls.students.map((s) =>
            s.id === studentId ? updatedStu : s
          ),
        }));
        if (isGasMode) {
          void upsertGasStudents(gasUrl, gasPw, [updatedStu]);
        }
      }}
      onAddMedalTemplate={(icon, title, reason) => {
        const updated = updateActiveClass((cls) => ({
          ...cls,
          medalTemplates: [
            ...cls.medalTemplates,
            {
              id: `tpl_${Date.now()}`,
              icon,
              title,
              reason,
              points: 30,
            },
          ],
        }));
        if (isGasMode) {
          void updateGasTeacherMeta(gasUrl, gasPw, {
            medalTemplates: updated.medalTemplates,
          });
        }
      }}
      onDeleteMedalTemplate={(templateId) => {
        const updated = updateActiveClass((cls) => ({
          ...cls,
          medalTemplates: cls.medalTemplates.filter((t) => t.id !== templateId),
        }));
        if (isGasMode) {
          void updateGasTeacherMeta(gasUrl, gasPw, {
            medalTemplates: updated.medalTemplates,
          });
        }
      }}
      onSelectStudentPreview={(studentId) => {
        setPreviewStage(activeClass.config.stage);
        setPreviewRevealed(isIdentityRevealed(activeClass.config));
        setPreviewStudentId(studentId);
      }}
    />
  );
};

export default App;
