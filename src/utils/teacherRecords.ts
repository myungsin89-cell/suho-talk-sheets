import {
  ActivityType,
  ChatMessage,
  ClassConfig,
  MissionLog,
  MissionStatus,
  Student,
} from '../types';
import { getScoreStage } from './classProgress';
import {
  calculateStudentScore,
  findGuardianAngelOf,
  findTargetPartnerOf,
} from './scoring';

export type LetterKind =
  | 'opening_letter'
  | 'opening_reply'
  | 'thank_letter'
  | 'reveal_letter';

export interface TeacherLetterRecord {
  id: string;
  kind: LetterKind;
  stage: 1 | 3;
  kindLabel: string;
  sender: Student;
  receiver?: Student;
  receiverRoleLabel: string;
  content: string;
  charCount: number;
}

/**
 * 학생 이름을 익명 표시용 문자열(예: 김누리 -> 김○○)로 마스킹합니다.
 */
export const maskStudentName = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return '○';
  return `${trimmed[0]}${'○'.repeat(trimmed.length - 1)}`;
};

/**
 * 번호와 이름을 포함한 학생 표시 문자열을 반환합니다.
 */
export const formatStudentLabel = (
  student: Student | undefined,
  anonymize: boolean,
  fallback = '미지정'
): string => {
  if (!student) return fallback;
  const displayName = anonymize ? maskStudentName(student.name) : student.name;
  return `${student.number}번 ${displayName}`;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 편지/미션 본문 안에 등장하는 학급 학생 이름을 찾아 익명 처리합니다.
 */
export const maskTextNames = (
  text: string,
  students: Student[],
  anonymize: boolean
): string => {
  if (!anonymize || !text) return text;
  const uniqueNames = Array.from(
    new Set(
      students
        .map((s) => s.name.trim())
        .filter((name) => name.length >= 2)
    )
  ).sort((a, b) => b.length - a.length);

  if (uniqueNames.length === 0) return text;

  let masked = text;
  for (const name of uniqueNames) {
    const pattern = new RegExp(escapeRegExp(name), 'g');
    masked = masked.replace(pattern, maskStudentName(name));
  }
  return masked;
};

export const getActivityTypeLabel = (
  type: ActivityType,
  isPostmasterNote?: boolean
): string => {
  if (isPostmasterNote) return '선생님 응원';
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

export const getMissionStatusLabel = (status: MissionStatus): string => {
  switch (status) {
    case 'verified':
      return '승인 완료';
    case 'pending':
      return '승인 대기';
    case 'hold':
      return '보류';
  }
};

/**
 * 전체 학생의 1단계·3단계 편지를 정규화된 목록으로 추출합니다.
 */
export const buildLetterRecords = (
  students: Student[]
): TeacherLetterRecord[] => {
  const studentById = new Map(students.map((s) => [s.id, s]));
  const angelByTargetId = new Map<string, Student>();
  for (const stu of students) {
    if (stu.targetId && !angelByTargetId.has(stu.targetId)) {
      angelByTargetId.set(stu.targetId, stu);
    }
  }

  const sortedStudents = [...students].sort((a, b) => a.number - b.number);
  const records: TeacherLetterRecord[] = [];

  for (const stu of sortedStudents) {
    const myAngel = angelByTargetId.get(stu.id);
    const myTarget = stu.targetId ? studentById.get(stu.targetId) : undefined;

    const specs: {
      kind: LetterKind;
      stage: 1 | 3;
      kindLabel: string;
      raw?: string;
      receiver?: Student;
      receiverRoleLabel: string;
    }[] = [
      {
        kind: 'opening_letter',
        stage: 1,
        kindLabel: '1단계 첫 편지',
        raw: stu.openingLetterToAngel,
        receiver: myAngel,
        receiverRoleLabel: '나의 수호천사',
      },
      {
        kind: 'opening_reply',
        stage: 1,
        kindLabel: '1단계 첫 답장',
        raw: stu.openingReplyToTarget,
        receiver: myTarget,
        receiverRoleLabel: '내가 챙기는 짝꿍',
      },
      {
        kind: 'thank_letter',
        stage: 3,
        kindLabel: '3단계 감사 편지',
        raw: stu.thankLetterToAngel,
        receiver: myAngel,
        receiverRoleLabel: '나의 수호천사',
      },
      {
        kind: 'reveal_letter',
        stage: 3,
        kindLabel: '3단계 정체 공개 편지',
        raw: stu.revealLetterToTarget,
        receiver: myTarget,
        receiverRoleLabel: '내가 챙기는 짝꿍',
      },
    ];

    for (const spec of specs) {
      const trimmed = (spec.raw || '').trim();
      if (!trimmed) continue;
      records.push({
        id: `${stu.id}:${spec.kind}`,
        kind: spec.kind,
        stage: spec.stage,
        kindLabel: spec.kindLabel,
        sender: stu,
        receiver: spec.receiver,
        receiverRoleLabel: spec.receiverRoleLabel,
        content: trimmed,
        charCount: trimmed.length,
      });
    }
  }

  return records;
};

/**
 * 특정 학생과 편지 종류에 해당하는 정규화된 편지 레코드를 생성합니다.
 */
export const makeLetterRecord = (
  sender: Student | undefined,
  kind: LetterKind,
  students: Student[]
): TeacherLetterRecord | null => {
  if (!sender) return null;

  const meta: Record<
    LetterKind,
    {
      stage: 1 | 3;
      kindLabel: string;
      raw?: string;
      receiver?: Student;
      receiverRoleLabel: string;
    }
  > = {
    opening_letter: {
      stage: 1,
      kindLabel: '1단계 첫 편지',
      raw: sender.openingLetterToAngel,
      receiver: findGuardianAngelOf(sender.id, students),
      receiverRoleLabel: '나의 수호천사',
    },
    opening_reply: {
      stage: 1,
      kindLabel: '1단계 첫 답장',
      raw: sender.openingReplyToTarget,
      receiver: findTargetPartnerOf(sender.id, students),
      receiverRoleLabel: '내가 챙기는 짝꿍',
    },
    thank_letter: {
      stage: 3,
      kindLabel: '3단계 감사 편지',
      raw: sender.thankLetterToAngel,
      receiver: findGuardianAngelOf(sender.id, students),
      receiverRoleLabel: '나의 수호천사',
    },
    reveal_letter: {
      stage: 3,
      kindLabel: '3단계 정체 공개 편지',
      raw: sender.revealLetterToTarget,
      receiver: findTargetPartnerOf(sender.id, students),
      receiverRoleLabel: '내가 챙기는 짝꿍',
    },
  };

  const spec = meta[kind];
  const trimmed = (spec.raw || '').trim();
  if (!trimmed) return null;

  return {
    id: `${sender.id}:${kind}`,
    kind,
    stage: spec.stage,
    kindLabel: spec.kindLabel,
    sender,
    receiver: spec.receiver,
    receiverRoleLabel: spec.receiverRoleLabel,
    content: trimmed,
    charCount: trimmed.length,
  };
};

/**
 * 편지 레코드에 대응하는 상대방의 짝꿍 편지/답장 레코드를 찾습니다.
 */
export const findPairedLetterRecord = (
  record: TeacherLetterRecord,
  students: Student[]
): TeacherLetterRecord | null => {
  if (!record.receiver) return null;

  const pairedKindMap: Record<LetterKind, LetterKind> = {
    opening_letter: 'opening_reply',
    opening_reply: 'opening_letter',
    reveal_letter: 'thank_letter',
    thank_letter: 'reveal_letter',
  };

  return makeLetterRecord(record.receiver, pairedKindMap[record.kind], students);
};

/**
 * 개별 학생의 전체 활동·편지 기록을 한글/워드/PPT 붙여넣기용 텍스트로 정리합니다.
 */
export const formatStudentRecordSummaryText = (
  student: Student,
  students: Student[],
  missions: MissionLog[],
  config: ClassConfig,
  anonymize: boolean
): string => {
  const myAngel = findGuardianAngelOf(student.id, students);
  const myTarget = findTargetPartnerOf(student.id, students);
  const guessedStu = student.guessedAngelId
    ? students.find((s) => s.id === student.guessedAngelId)
    : undefined;
  const score = calculateStudentScore(
    student.id,
    students,
    missions,
    getScoreStage(config)
  );
  const sentMissions = missions.filter(
    (m) => m.senderId === student.id && !m.isPostmasterNote
  );
  const receivedMissions = missions.filter((m) => m.receiverId === student.id);
  const studentById = new Map(students.map((s) => [s.id, s]));

  const maskBody = (raw?: string) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return '(작성 없음)';
    return maskTextNames(trimmed, students, anonymize);
  };

  const lines: string[] = [
    `[${config.className}] ${formatStudentLabel(student, anonymize)} 활동 기록 (${anonymize ? '익명' : '실명'})`,
    `- 내가 챙기는 짝꿍: ${formatStudentLabel(myTarget, anonymize)}`,
    `- 나를 챙기는 수호천사: ${formatStudentLabel(myAngel, anonymize)}`,
    `- 총점: ${score.totalScore}점 (인증 ${score.verifiedSentCount}회 · 훈장 ${(student.medals || []).length}개)`,
    '',
    '1. 1단계 첫 편지 · 답장',
    `[보낸 첫 편지 → 수호천사(${formatStudentLabel(myAngel, anonymize)})]`,
    maskBody(student.openingLetterToAngel),
    `[수호천사의 첫 답장 ← ${formatStudentLabel(myAngel, anonymize)}]`,
    maskBody(myAngel?.openingReplyToTarget),
    `[짝꿍의 첫 편지 ← ${formatStudentLabel(myTarget, anonymize)}]`,
    maskBody(myTarget?.openingLetterToAngel),
    `[보낸 첫 답장 → 짝꿍(${formatStudentLabel(myTarget, anonymize)})]`,
    maskBody(student.openingReplyToTarget),
    '',
    `2. 2단계 보낸 비밀 활동 (${sentMissions.length}건)`,
  ];

  if (sentMissions.length === 0) {
    lines.push('- 기록 없음');
  } else {
    for (const m of sentMissions) {
      const replyText = m.reply?.trim()
        ? ` | 짝꿍 한마디: "${maskTextNames(m.reply.trim(), students, anonymize)}"`
        : '';
      lines.push(
        `- [${m.dateKey} · ${getActivityTypeLabel(m.type)} · ${getMissionStatusLabel(m.status)}] ${maskTextNames(m.content, students, anonymize)}${replyText}`
      );
    }
  }

  lines.push('', `3. 2단계 받은 비밀 활동 (${receivedMissions.length}건)`);
  if (receivedMissions.length === 0) {
    lines.push('- 기록 없음');
  } else {
    for (const m of receivedMissions) {
      const senderLabel = m.isPostmasterNote || m.senderId === 'POSTMASTER'
        ? '선생님'
        : formatStudentLabel(studentById.get(m.senderId), anonymize);
      const replyText = m.reply?.trim()
        ? ` | 남긴 한마디: "${maskTextNames(m.reply.trim(), students, anonymize)}"`
        : '';
      lines.push(
        `- [${m.dateKey} · ${senderLabel} · ${getActivityTypeLabel(m.type, m.isPostmasterNote)} · ${getMissionStatusLabel(m.status)}] ${maskTextNames(m.content, students, anonymize)}${replyText}`
      );
    }
  }

  const guessResult = !student.guessedAngelId
    ? '미제출'
    : myAngel && student.guessedAngelId === myAngel.id
    ? `${formatStudentLabel(guessedStu, anonymize)} (정답)`
    : `${formatStudentLabel(guessedStu, anonymize)} (오답)`;

  lines.push(
    '',
    '4. 3단계 추리 · 마지막 편지',
    `- 수호천사 추리: ${guessResult}`,
    `[수호천사에게 쓴 감사 편지 → ${formatStudentLabel(myAngel, anonymize)}]`,
    maskBody(student.thankLetterToAngel),
    `[수호천사가 보내온 정체 공개 편지 ← ${formatStudentLabel(myAngel, anonymize)}]`,
    maskBody(myAngel?.revealLetterToTarget),
    `[짝꿍에게 쓴 정체 공개 편지 → ${formatStudentLabel(myTarget, anonymize)}]`,
    maskBody(student.revealLetterToTarget),
    `[짝꿍이 보내온 감사 편지 ← ${formatStudentLabel(myTarget, anonymize)}]`,
    maskBody(myTarget?.thankLetterToAngel)
  );

  if ((student.medals || []).length > 0) {
    lines.push('', `5. 선생님 수여 훈장 (${student.medals!.length}개)`);
    for (const medal of student.medals!) {
      lines.push(
        `- [${medal.awardedAt}] ${medal.title} (+${medal.points}점): ${maskTextNames(medal.reason, students, anonymize)}`
      );
    }
  }

  return lines.join('\n');
};

export const escapeCsvCell = (
  value: string | number | undefined | null
): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const sanitizeFilenamePart = (raw: string): string => {
  const cleaned = raw
    .trim()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_');
  return cleaned || '수호톡';
};

const getTodayStamp = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

export const downloadCsvFile = (
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void => {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  const csvContent = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportLettersCsv = (
  className: string,
  students: Student[],
  anonymize: boolean
): number => {
  const letters = buildLetterRecords(students);
  if (letters.length === 0) return 0;

  const headers = [
    '학급',
    '단계',
    '편지 구분',
    '보낸 학생',
    '받는 학생',
    '받는 역할',
    '편지 내용',
    '글자 수',
  ];
  const rows = letters.map((rec) => [
    className,
    `${rec.stage}단계`,
    rec.kindLabel,
    formatStudentLabel(rec.sender, anonymize),
    formatStudentLabel(rec.receiver, anonymize),
    rec.receiverRoleLabel,
    maskTextNames(rec.content, students, anonymize),
    rec.charCount,
  ]);

  const filename = `${sanitizeFilenamePart(className)}_편지기록_${
    anonymize ? '익명' : '실명'
  }_${getTodayStamp()}.csv`;
  downloadCsvFile(filename, headers, rows);
  return rows.length;
};

export const exportMissionsCsv = (
  className: string,
  students: Student[],
  missions: MissionLog[],
  anonymize: boolean
): number => {
  if (missions.length === 0) return 0;

  const studentById = new Map(students.map((s) => [s.id, s]));
  const headers = [
    '학급',
    '날짜',
    '작성 시각',
    '활동 유형',
    '주간 미션 내용',
    '보낸 학생(수호천사)',
    '받은 학생(짝꿍)',
    '활동 내용',
    '짝꿍 한마디',
    '승인 상태',
    '점수',
  ];

  const rows = missions.map((m) => {
    const senderLabel =
      m.isPostmasterNote || m.senderId === 'POSTMASTER'
        ? '선생님'
        : formatStudentLabel(studentById.get(m.senderId), anonymize);
    const receiverLabel = formatStudentLabel(
      studentById.get(m.receiverId),
      anonymize
    );

    return [
      className,
      m.dateKey,
      m.createdAt,
      getActivityTypeLabel(m.type, m.isPostmasterNote),
      m.questText || '',
      senderLabel,
      receiverLabel,
      maskTextNames(m.content, students, anonymize),
      m.reply ? maskTextNames(m.reply, students, anonymize) : '',
      getMissionStatusLabel(m.status),
      m.points,
    ];
  });

  const filename = `${sanitizeFilenamePart(className)}_비밀활동_${
    anonymize ? '익명' : '실명'
  }_${getTodayStamp()}.csv`;
  downloadCsvFile(filename, headers, rows);
  return rows.length;
};

export const exportAllRecordsCsv = (
  className: string,
  students: Student[],
  missions: MissionLog[],
  anonymize: boolean
): number => {
  const letters = buildLetterRecords(students);
  if (letters.length === 0 && missions.length === 0) return 0;

  const studentById = new Map(students.map((s) => [s.id, s]));
  const headers = [
    '학급',
    '기록 구분',
    '단계/날짜',
    '세부 유형',
    '보낸 학생',
    '받는 학생',
    '내용',
    '짝꿍 한마디/답장',
    '상태/비고',
  ];

  const letterRows = letters.map((rec) => [
    className,
    '편지',
    `${rec.stage}단계`,
    rec.kindLabel,
    formatStudentLabel(rec.sender, anonymize),
    formatStudentLabel(rec.receiver, anonymize),
    maskTextNames(rec.content, students, anonymize),
    '',
    `${rec.receiverRoleLabel} · ${rec.charCount}자`,
  ]);

  const missionRows = missions.map((m) => {
    const senderLabel =
      m.isPostmasterNote || m.senderId === 'POSTMASTER'
        ? '선생님'
        : formatStudentLabel(studentById.get(m.senderId), anonymize);
    const receiverLabel = formatStudentLabel(
      studentById.get(m.receiverId),
      anonymize
    );
    const extraNote = m.questText
      ? `${getMissionStatusLabel(m.status)} · 주간미션: ${m.questText}`
      : `${getMissionStatusLabel(m.status)} (${m.points}점)`;

    return [
      className,
      '비밀 활동',
      m.dateKey,
      getActivityTypeLabel(m.type, m.isPostmasterNote),
      senderLabel,
      receiverLabel,
      maskTextNames(m.content, students, anonymize),
      m.reply ? maskTextNames(m.reply, students, anonymize) : '',
      extraNote,
    ];
  });

  const rows = [...letterRows, ...missionRows];
  const filename = `${sanitizeFilenamePart(className)}_전체활동기록_${
    anonymize ? '익명' : '실명'
  }_${getTodayStamp()}.csv`;
  downloadCsvFile(filename, headers, rows);
  return rows.length;
};

export const exportChatsCsv = (
  className: string,
  students: Student[],
  chats: ChatMessage[],
  anonymize: boolean
): number => {
  if (chats.length === 0) return 0;

  const studentById = new Map(students.map((s) => [s.id, s]));
  const headers = [
    '학급',
    '대화방(수호천사→짝꿍)',
    '시각',
    '보낸 학생',
    '받는 학생',
    '대화 내용',
  ];

  const rows = chats.map((c) => {
    const [angelId, targetId] = c.roomId.split('->');
    const roomLabel = `${formatStudentLabel(
      studentById.get(angelId),
      anonymize
    )} → ${formatStudentLabel(studentById.get(targetId), anonymize)}`;
    const senderLabel = formatStudentLabel(studentById.get(c.senderId), anonymize);
    const receiverLabel = formatStudentLabel(studentById.get(c.receiverId), anonymize);
    return [
      className,
      roomLabel,
      c.createdAt,
      senderLabel,
      receiverLabel,
      maskTextNames(c.content, students, anonymize),
    ];
  });

  const filename = `${sanitizeFilenamePart(className)}_수호톡대화_${
    anonymize ? '익명' : '실명'
  }_${getTodayStamp()}.csv`;
  downloadCsvFile(filename, headers, rows);
  return rows.length;
};
