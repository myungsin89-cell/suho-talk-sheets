import {
  ClassConfig,
  ClassRoom,
  MedalTemplate,
  MissionLog,
  MissionStatus,
  Student,
  WeeklyQuestSettings,
} from '../types';
import { INITIAL_MEDAL_TEMPLATES } from '../data/mockData';
import type { ClassProgress } from '../utils/classProgress';

/**
 * 사용자가 입력한 Apps Script 웹앱 URL 또는 배포 ID(AKfycb...)를 표준 exec URL로 정규화합니다.
 */
export const normalizeGasWebAppUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec/i.test(trimmed)) {
    return trimmed.split('?')[0];
  }
  if (/^[A-Za-z0-9_-]{20,}$/.test(trimmed)) {
    return `https://script.google.com/macros/s/${trimmed}/exec`;
  }
  return '';
};

export const extractGasDeploymentId = (url: string): string => {
  const match = url.trim().match(/\/macros\/s\/([^/]+)\/exec/i);
  return match ? match[1] : url.trim();
};

const hydrateClassroom = (raw: ClassRoom, gasWebAppUrl: string, spreadsheetUrl?: string): ClassRoom => ({
  ...raw,
  config: {
    ...raw.config,
    gasWebAppUrl,
    spreadsheetUrl: spreadsheetUrl || raw.config.spreadsheetUrl,
  },
  medalTemplates:
    Array.isArray(raw.medalTemplates) && raw.medalTemplates.length > 0
      ? raw.medalTemplates
      : INITIAL_MEDAL_TEMPLATES,
  students: Array.isArray(raw.students) ? raw.students : [],
  missions: Array.isArray(raw.missions) ? raw.missions : [],
  chats: Array.isArray(raw.chats) ? raw.chats : [],
});

async function postGas<T extends object = Record<string, unknown>>(
  gasWebAppUrl: string,
  payload: Record<string, unknown>
): Promise<T & { ok: boolean; error?: string; code?: string }> {
  const url = normalizeGasWebAppUrl(gasWebAppUrl);
  if (!url) {
    return { ok: false, error: '올바른 Google Apps Script 웹앱 URL이 아닙니다.' } as T & {
      ok: boolean;
      error?: string;
      code?: string;
    };
  }

  let lastErr = '구글 시트 서버에 연결하지 못했습니다.';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });
      if (!res.ok) {
        lastErr = `구글 시트 응답 오류 (${res.status})`;
        if (attempt === 0 && res.status >= 500) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        return { ok: false, error: lastErr } as T & { ok: boolean; error?: string; code?: string };
      }
      const data = (await res.json()) as T & { ok: boolean; error?: string; code?: string };
      return data;
    } catch {
      lastErr = '구글 시트 웹앱에 연결하지 못했습니다. 배포 권한(모든 사용자)을 확인해 주세요.';
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  return { ok: false, error: lastErr } as T & { ok: boolean; error?: string; code?: string };
}

export interface GasPingResult {
  ok: boolean;
  initialized?: boolean;
  classId?: string;
  className?: string;
  spreadsheetUrl?: string;
  error?: string;
}

export const pingGasWebApp = async (gasWebAppUrl: string): Promise<GasPingResult> => {
  return postGas<GasPingResult>(gasWebAppUrl, { action: 'ping' });
};

export const setupGasClassroom = async (
  gasWebAppUrl: string,
  params: {
    classId: string;
    className: string;
    teacherPassword: string;
    medalTemplates: MedalTemplate[];
  }
): Promise<{ ok: boolean; classroom?: ClassRoom; error?: string }> => {
  const res = await postGas<{ classroom?: ClassRoom; spreadsheetUrl?: string }>(gasWebAppUrl, {
    action: 'teacher_setup',
    ...params,
  });
  if (!res.ok || !res.classroom) {
    return { ok: false, error: res.error || '학급 초기 설정에 실패했습니다.' };
  }
  return {
    ok: true,
    classroom: hydrateClassroom(res.classroom, normalizeGasWebAppUrl(gasWebAppUrl), res.spreadsheetUrl),
  };
};

export const loginGasTeacher = async (
  gasWebAppUrl: string,
  teacherPassword: string
): Promise<{ ok: boolean; classroom?: ClassRoom; code?: string; error?: string }> => {
  const res = await postGas<{ classroom?: ClassRoom; spreadsheetUrl?: string }>(gasWebAppUrl, {
    action: 'teacher_login',
    teacherPassword,
  });
  if (!res.ok || !res.classroom) {
    return { ok: false, code: res.code, error: res.error || '교사 로그인에 실패했습니다.' };
  }
  return {
    ok: true,
    classroom: hydrateClassroom(res.classroom, normalizeGasWebAppUrl(gasWebAppUrl), res.spreadsheetUrl),
  };
};

export const fetchGasTeacherClassroom = async (
  gasWebAppUrl: string,
  teacherPassword: string
): Promise<ClassRoom | null> => {
  const res = await loginGasTeacher(gasWebAppUrl, teacherPassword);
  return res.ok && res.classroom ? res.classroom : null;
};

export const updateGasTeacherMeta = async (
  gasWebAppUrl: string,
  teacherPassword: string,
  patch: { className?: string; medalTemplates?: MedalTemplate[] }
): Promise<boolean> => {
  const res = await postGas(gasWebAppUrl, {
    action: 'teacher_update_meta',
    teacherPassword,
    ...patch,
  });
  return Boolean(res.ok);
};

export const setGasChatOpen = async (
  gasWebAppUrl: string,
  teacherPassword: string,
  chatOpen: boolean
): Promise<boolean> => {
  const res = await postGas(gasWebAppUrl, {
    action: 'teacher_set_chat_open',
    teacherPassword,
    chatOpen,
  });
  return Boolean(res.ok);
};

export const saveGasProgress = async (
  gasWebAppUrl: string,
  teacherPassword: string,
  previous: ClassProgress,
  next: ClassProgress
): Promise<boolean> => {
  const res = await postGas(gasWebAppUrl, {
    action: 'teacher_save_progress',
    teacherPassword,
    previous,
    next,
  });
  return Boolean(res.ok);
};

export const saveGasWeeklyQuest = async (
  gasWebAppUrl: string,
  teacherPassword: string,
  previous: WeeklyQuestSettings,
  next: WeeklyQuestSettings
): Promise<boolean> => {
  const res = await postGas(gasWebAppUrl, {
    action: 'teacher_save_weekly_quest',
    teacherPassword,
    previous,
    next,
  });
  return Boolean(res.ok);
};

export const upsertGasStudents = async (
  gasWebAppUrl: string,
  teacherPassword: string,
  students: Student[]
): Promise<boolean> => {
  if (students.length === 0) return true;
  const res = await postGas(gasWebAppUrl, {
    action: 'teacher_upsert_students',
    teacherPassword,
    students,
  });
  return Boolean(res.ok);
};

export const deleteGasStudent = async (
  gasWebAppUrl: string,
  teacherPassword: string,
  studentId: string
): Promise<boolean> => {
  const res = await postGas(gasWebAppUrl, {
    action: 'teacher_delete_student',
    teacherPassword,
    studentId,
  });
  return Boolean(res.ok);
};

export const replaceGasAll = async (
  gasWebAppUrl: string,
  teacherPassword: string,
  students: Student[],
  missions: MissionLog[]
): Promise<boolean> => {
  const res = await postGas(gasWebAppUrl, {
    action: 'teacher_replace_all',
    teacherPassword,
    students,
    missions,
  });
  return Boolean(res.ok);
};

export const sendGasPostmasterNote = async (
  gasWebAppUrl: string,
  teacherPassword: string,
  mission: MissionLog
): Promise<boolean> => {
  const res = await postGas(gasWebAppUrl, {
    action: 'teacher_send_postmaster',
    teacherPassword,
    mission,
  });
  return Boolean(res.ok);
};

export const approveGasAllPending = async (
  gasWebAppUrl: string,
  teacherPassword: string,
  verifiedAt: string
): Promise<boolean> => {
  const res = await postGas(gasWebAppUrl, {
    action: 'teacher_approve_all_pending',
    teacherPassword,
    verifiedAt,
  });
  return Boolean(res.ok);
};

// =========================================================================
// 학생용 API (구글 로그인 없음 · 4자리 PIN 검증 · 비밀 보호)
// =========================================================================
export interface StudentRosterEntry {
  id: string;
  number: number;
  name: string;
}

export const fetchGasStudentRoster = async (
  gasWebAppUrl: string
): Promise<{
  ok: boolean;
  classId?: string;
  config?: ClassConfig;
  roster?: StudentRosterEntry[];
  error?: string;
}> => {
  const res = await postGas<{
    classId?: string;
    config?: ClassConfig;
    roster?: StudentRosterEntry[];
  }>(gasWebAppUrl, { action: 'student_roster' });
  if (!res.ok || !res.config) {
    return { ok: false, error: res.error || '학급 정보를 불러오지 못했습니다.' };
  }
  return {
    ok: true,
    classId: res.classId || 'SHEET',
    config: { ...res.config, gasWebAppUrl: normalizeGasWebAppUrl(gasWebAppUrl) },
    roster: Array.isArray(res.roster) ? res.roster : [],
  };
};

export const loginGasStudent = async (
  gasWebAppUrl: string,
  name: string,
  pin: string
): Promise<
  | { ok: true; studentId: string; classroom: ClassRoom }
  | { ok: false; field: 'name' | 'code'; message: string }
> => {
  const res = await postGas<{
    studentId?: string;
    classroom?: ClassRoom;
    field?: 'name' | 'code';
  }>(gasWebAppUrl, { action: 'student_login', name, pin });

  if (!res.ok || !res.studentId || !res.classroom) {
    return {
      ok: false,
      field: res.field === 'name' ? 'name' : 'code',
      message: res.error || '이름이나 입장 코드를 다시 확인해 주세요.',
    };
  }
  return {
    ok: true,
    studentId: res.studentId,
    classroom: hydrateClassroom(res.classroom, normalizeGasWebAppUrl(gasWebAppUrl)),
  };
};

export const syncGasStudentClassroom = async (
  gasWebAppUrl: string,
  studentId: string,
  pin: string
): Promise<ClassRoom | null> => {
  const res = await postGas<{ classroom?: ClassRoom }>(gasWebAppUrl, {
    action: 'student_sync',
    studentId,
    pin,
  });
  if (!res.ok || !res.classroom) return null;
  return hydrateClassroom(res.classroom, normalizeGasWebAppUrl(gasWebAppUrl));
};

export const saveGasStudentWork = async (
  gasWebAppUrl: string,
  studentId: string,
  pin: string,
  patch: Partial<Student>
): Promise<ClassRoom | null> => {
  const res = await postGas<{ classroom?: ClassRoom }>(gasWebAppUrl, {
    action: 'student_save_work',
    studentId,
    pin,
    patch,
  });
  if (!res.ok || !res.classroom) return null;
  return hydrateClassroom(res.classroom, normalizeGasWebAppUrl(gasWebAppUrl));
};

export const sendGasStudentMission = async (
  gasWebAppUrl: string,
  studentId: string,
  pin: string,
  mission: MissionLog
): Promise<ClassRoom | null> => {
  const res = await postGas<{ classroom?: ClassRoom }>(gasWebAppUrl, {
    action: 'student_send_mission',
    studentId,
    pin,
    mission,
  });
  if (!res.ok || !res.classroom) return null;
  return hydrateClassroom(res.classroom, normalizeGasWebAppUrl(gasWebAppUrl));
};

export const updateGasStudentMission = async (
  gasWebAppUrl: string,
  studentId: string,
  pin: string,
  missionId: string,
  patch: { status: MissionStatus; reply?: string; verifiedAt?: string }
): Promise<ClassRoom | null> => {
  const res = await postGas<{ classroom?: ClassRoom }>(gasWebAppUrl, {
    action: 'student_update_mission',
    studentId,
    pin,
    missionId,
    ...patch,
  });
  if (!res.ok || !res.classroom) return null;
  return hydrateClassroom(res.classroom, normalizeGasWebAppUrl(gasWebAppUrl));
};

export const sendGasStudentChat = async (
  gasWebAppUrl: string,
  studentId: string,
  pin: string,
  partnerRole: 'angel' | 'target',
  content: string
): Promise<ClassRoom | null> => {
  const res = await postGas<{ classroom?: ClassRoom }>(gasWebAppUrl, {
    action: 'student_send_chat',
    studentId,
    pin,
    partnerRole,
    content,
  });
  if (!res.ok || !res.classroom) return null;
  return hydrateClassroom(res.classroom, normalizeGasWebAppUrl(gasWebAppUrl));
};

/**
 * Google Sheets(GAS) 환경용 12~15초 지터 폴링 구독 (탭이 보일 때만 동작)
 */
export const subscribeToGasPolling = (
  onTick: () => void,
  baseIntervalMs = 12000
): (() => void) => {
  let timerId: number | null = null;
  let stopped = false;

  const scheduleNext = () => {
    if (stopped) return;
    const jitter = Math.floor(Math.random() * 3000);
    timerId = window.setTimeout(() => {
      if (!stopped && document.visibilityState === 'visible') {
        onTick();
      }
      scheduleNext();
    }, baseIntervalMs + jitter);
  };

  const handleVisibility = () => {
    if (!stopped && document.visibilityState === 'visible') {
      onTick();
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  scheduleNext();

  return () => {
    stopped = true;
    if (timerId !== null) window.clearTimeout(timerId);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
};
