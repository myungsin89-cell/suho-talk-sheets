/**
 * ============================================================================
 * 수호톡 (Suho-Talk) Google Sheets 무서버 백엔드 (Google Apps Script)
 * ============================================================================
 * 사용 방법:
 * 1. 구글 시트 상단 메뉴 [확장 프로그램] -> [Apps Script] 열기
 * 2. 기존 코드를 모두 지우고 이 파일 전체를 붙여넣기 후 저장(Ctrl+S)
 * 3. 상단 [배포] -> [새 배포] -> 유형: [웹 앱]
 *    - 다음 사용자 권한으로 실행: 나(본인 계정)
 *    - 액세스 권한이 있는 사용자: 모든 사용자
 * 4. [배포] 클릭 후 권한 승인 -> 발급된 웹 앱 URL을 수호톡 교사 화면에 붙여넣기
 * ============================================================================
 */

const SHEET_CONFIG = 'config';
const SHEET_STUDENTS = 'students';
const SHEET_MISSIONS = 'missions';
const SHEET_CHATS = 'chats';
const CACHE_KEY_SNAPSHOT = 'suho_snapshot_v1';
const CACHE_TTL_SECONDS = 3;

const STUDENT_HEADERS = [
  'id',
  'number',
  'name',
  'pin',
  'target_id',
  'opening_letter',
  'opening_reply',
  'guessed_angel_id',
  'thank_letter',
  'reveal_letter',
  'medals_json',
];

const MISSION_HEADERS = [
  'id',
  'sender_id',
  'receiver_id',
  'type',
  'content',
  'points',
  'status',
  'reply',
  'date_key',
  'created_at_label',
  'verified_at_label',
  'is_postmaster_note',
  'quest_id',
  'quest_text',
  'created_ts',
];

const CHAT_HEADERS = [
  'id',
  'room_id',
  'sender_id',
  'receiver_id',
  'content',
  'created_at_label',
  'created_ts',
];

/**
 * 시트 4개(config, students, missions, chats)와 헤더를 자동 초기화합니다.
 */
function initSuhoTalkSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetWithHeaders_(ss, SHEET_CONFIG, ['key', 'value']);
  ensureSheetWithHeaders_(ss, SHEET_STUDENTS, STUDENT_HEADERS);
  ensureSheetWithHeaders_(ss, SHEET_MISSIONS, MISSION_HEADERS);
  ensureSheetWithHeaders_(ss, SHEET_CHATS, CHAT_HEADERS);
}

function ensureSheetWithHeaders_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function invalidateCache_() {
  try {
    CacheService.getScriptCache().remove(CACHE_KEY_SNAPSHOT);
  } catch (e) {
    // ignore cache errors
  }
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(12000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function parseJsonSafe_(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(String(raw));
  } catch (e) {
    return fallback;
  }
}

function readSnapshot_(bypassCache) {
  const cache = CacheService.getScriptCache();
  if (!bypassCache) {
    try {
      const cached = cache.get(CACHE_KEY_SNAPSHOT);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      // ignore cache read error
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cfgSheet = ensureSheetWithHeaders_(ss, SHEET_CONFIG, ['key', 'value']);
  const stuSheet = ensureSheetWithHeaders_(ss, SHEET_STUDENTS, STUDENT_HEADERS);
  const misSheet = ensureSheetWithHeaders_(ss, SHEET_MISSIONS, MISSION_HEADERS);
  const chatSheet = ensureSheetWithHeaders_(ss, SHEET_CHATS, CHAT_HEADERS);

  const cfgMap = {};
  const cfgLast = cfgSheet.getLastRow();
  if (cfgLast >= 2) {
    const cfgRows = cfgSheet.getRange(2, 1, cfgLast - 1, 2).getValues();
    for (let i = 0; i < cfgRows.length; i++) {
      const k = String(cfgRows[i][0] || '').trim();
      if (k) cfgMap[k] = String(cfgRows[i][1] === undefined || cfgRows[i][1] === null ? '' : cfgRows[i][1]);
    }
  }

  const students = [];
  const stuLast = stuSheet.getLastRow();
  if (stuLast >= 2) {
    const stuRows = stuSheet
      .getRange(2, 1, stuLast - 1, STUDENT_HEADERS.length)
      .getValues();
    for (let i = 0; i < stuRows.length; i++) {
      const r = stuRows[i];
      const id = String(r[0] || '').trim();
      if (!id) continue;
      students.push({
        id: id,
        number: Number(r[1]) || i + 1,
        name: String(r[2] || '').trim(),
        pin: String(r[3] || '').trim().toUpperCase(),
        targetId: String(r[4] || '').trim(),
        openingLetterToAngel: String(r[5] || ''),
        openingReplyToTarget: String(r[6] || ''),
        guessedAngelId: String(r[7] || '').trim(),
        thankLetterToAngel: String(r[8] || ''),
        revealLetterToTarget: String(r[9] || ''),
        medals: parseJsonSafe_(r[10], []),
      });
    }
  }
  students.sort(function (a, b) {
    return a.number - b.number;
  });

  const missions = [];
  const misLast = misSheet.getLastRow();
  if (misLast >= 2) {
    const misRows = misSheet
      .getRange(2, 1, misLast - 1, MISSION_HEADERS.length)
      .getValues();
    for (let i = 0; i < misRows.length; i++) {
      const r = misRows[i];
      const id = String(r[0] || '').trim();
      if (!id) continue;
      const item = {
        id: id,
        senderId: String(r[1] || '').trim(),
        receiverId: String(r[2] || '').trim(),
        type: String(r[3] || 'stealth').trim(),
        content: String(r[4] || ''),
        points: Number(r[5]) || 0,
        status: String(r[6] || 'pending').trim(),
        dateKey: String(r[8] || '').trim(),
        createdAt: String(r[9] || '').trim(),
      };
      if (String(r[7] || '')) item.reply = String(r[7]);
      if (String(r[10] || '')) item.verifiedAt = String(r[10]);
      if (String(r[11] || '').toLowerCase() === 'true' || r[11] === true) {
        item.isPostmasterNote = true;
      }
      if (String(r[12] || '')) item.questId = String(r[12]);
      if (String(r[13] || '')) item.questText = String(r[13]);
      missions.push(item);
    }
  }

  const chats = [];
  const chatLast = chatSheet.getLastRow();
  if (chatLast >= 2) {
    const chatRows = chatSheet
      .getRange(2, 1, chatLast - 1, CHAT_HEADERS.length)
      .getValues();
    for (let i = 0; i < chatRows.length; i++) {
      const r = chatRows[i];
      const id = String(r[0] || '').trim();
      if (!id) continue;
      chats.push({
        id: id,
        roomId: String(r[1] || '').trim(),
        senderId: String(r[2] || '').trim(),
        receiverId: String(r[3] || '').trim(),
        content: String(r[4] || ''),
        createdAt: String(r[5] || '').trim(),
      });
    }
  }

  const rawStage = Number(cfgMap.stage);
  const stage = rawStage === 2 || rawStage === 3 ? rawStage : 1;
  const revealOpened =
    cfgMap.reveal_opened === 'true'
      ? true
      : cfgMap.reveal_opened === 'false'
      ? false
      : undefined;

  const snapshot = {
    initialized: Boolean(cfgMap.teacher_password),
    spreadsheetUrl: ss.getUrl(),
    classroom: {
      id: cfgMap.class_id || 'SHEET',
      teacherPassword: cfgMap.teacher_password || '',
      config: {
        className: cfgMap.class_name || ss.getName() || '우리 반 수호톡',
        weeklyQuest: cfgMap.weekly_quest || '',
        weeklyQuestId: cfgMap.weekly_quest_id || undefined,
        weeklyQuestHidden: cfgMap.weekly_quest_hidden === 'true',
        stage: stage,
        revealOpened: revealOpened,
        chatOpen: cfgMap.chat_open === 'true',
        gasWebAppUrl: '',
        spreadsheetUrl: ss.getUrl(),
      },
      students: students,
      missions: missions,
      chats: chats,
      medalTemplates: parseJsonSafe_(cfgMap.medal_templates_json, []),
      createdAt: cfgMap.created_at || '',
    },
  };

  try {
    const serialized = JSON.stringify(snapshot);
    if (serialized.length < 95000) {
      cache.put(CACHE_KEY_SNAPSHOT, serialized, CACHE_TTL_SECONDS);
    }
  } catch (e) {
    // ignore cache write error
  }

  return snapshot;
}

function writeConfigPairs_(updates) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ensureSheetWithHeaders_(ss, SHEET_CONFIG, ['key', 'value']);
  const lastRow = sheet.getLastRow();
  const existing = {};
  if (lastRow >= 2) {
    const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (let i = 0; i < rows.length; i++) {
      const k = String(rows[i][0] || '').trim();
      if (k) existing[k] = i + 2;
    }
  }

  const keys = Object.keys(updates);
  const toAppend = [];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = updates[k] === undefined || updates[k] === null ? '' : String(updates[k]);
    if (existing[k]) {
      sheet.getRange(existing[k], 2).setValue(v);
    } else {
      toAppend.push([k, v]);
    }
  }
  if (toAppend.length > 0) {
    sheet
      .getRange(sheet.getLastRow() + 1, 1, toAppend.length, 2)
      .setValues(toAppend);
  }
}

function studentToRow_(s) {
  return [
    s.id,
    Number(s.number) || 1,
    s.name || '',
    String(s.pin || '').toUpperCase(),
    s.targetId || '',
    s.openingLetterToAngel || '',
    s.openingReplyToTarget || '',
    s.guessedAngelId || '',
    s.thankLetterToAngel || '',
    s.revealLetterToTarget || '',
    JSON.stringify(Array.isArray(s.medals) ? s.medals : []),
  ];
}

function missionToRow_(m) {
  return [
    m.id,
    m.senderId || '',
    m.receiverId || '',
    m.type || 'stealth',
    m.content || '',
    Number(m.points) || 0,
    m.status || 'pending',
    m.reply || '',
    m.dateKey || '',
    m.createdAt || '',
    m.verifiedAt || '',
    m.isPostmasterNote ? 'true' : 'false',
    m.questId || '',
    m.questText || '',
    new Date().toISOString(),
  ];
}

function isIdentityRevealed_(config) {
  return config.stage === 3 && config.revealOpened !== false;
}

/**
 * 학생 브라우저에 내려줄 최소 데이터만 추려 비밀(수호천사 정체, 타인 PIN·편지)을 보호합니다.
 */
function sanitizeClassroomForStudent_(classroom, studentId) {
  const revealed = isIdentityRevealed_(classroom.config);
  const students = classroom.students;
  let me = null;
  let realAngel = null;
  for (let i = 0; i < students.length; i++) {
    if (students[i].id === studentId) me = students[i];
    if (students[i].targetId === studentId && !realAngel) realAngel = students[i];
  }
  const myTargetId = me ? me.targetId : '';

  const safeStudents = students.map(function (s) {
    if (s.id === studentId) {
      return {
        id: s.id,
        number: s.number,
        name: s.name,
        pin: '',
        targetId: s.targetId,
        openingLetterToAngel: s.openingLetterToAngel || '',
        openingReplyToTarget: s.openingReplyToTarget || '',
        guessedAngelId: s.guessedAngelId || '',
        thankLetterToAngel: s.thankLetterToAngel || '',
        revealLetterToTarget: s.revealLetterToTarget || '',
        medals: s.medals || [],
      };
    }

    if (revealed) {
      const isAngel = realAngel && s.id === realAngel.id;
      const isTarget = myTargetId && s.id === myTargetId;
      return {
        id: s.id,
        number: s.number,
        name: s.name,
        pin: '',
        targetId: isAngel ? s.targetId : '',
        openingLetterToAngel: isTarget ? s.openingLetterToAngel || '' : '',
        openingReplyToTarget: isAngel ? s.openingReplyToTarget || '' : '',
        guessedAngelId: isTarget ? s.guessedAngelId || '' : '',
        thankLetterToAngel: isTarget ? s.thankLetterToAngel || '' : '',
        revealLetterToTarget: isAngel ? s.revealLetterToTarget || '' : '',
        medals: [],
      };
    }

    const isMyTarget = myTargetId && s.id === myTargetId;
    return {
      id: s.id,
      number: s.number,
      name: s.name,
      pin: '',
      targetId: '',
      openingLetterToAngel: isMyTarget ? s.openingLetterToAngel || '' : '',
      openingReplyToTarget: '',
      guessedAngelId: '',
      thankLetterToAngel: '',
      revealLetterToTarget: '',
      medals: [],
    };
  });

  if (!revealed && realAngel) {
    safeStudents.push({
      id: '__ANGEL__',
      number: 0,
      name: '비밀 수호천사',
      pin: '',
      targetId: studentId,
      openingLetterToAngel: '',
      openingReplyToTarget: realAngel.openingReplyToTarget || '',
      guessedAngelId: '',
      thankLetterToAngel: '',
      revealLetterToTarget: '',
      medals: [],
    });
  }

  const safeMissions = [];
  for (let i = 0; i < classroom.missions.length; i++) {
    const m = classroom.missions[i];
    if (m.senderId !== studentId && m.receiverId !== studentId) continue;
    const copy = Object.assign({}, m);
    if (!revealed && !copy.isPostmasterNote && realAngel && copy.senderId === realAngel.id) {
      copy.senderId = '__ANGEL__';
    }
    safeMissions.push(copy);
  }

  const safeChats = [];
  const rawChats = Array.isArray(classroom.chats) ? classroom.chats : [];
  const angelRoomId = realAngel ? realAngel.id + '->' + studentId : '';
  const targetRoomId = myTargetId ? studentId + '->' + myTargetId : '';
  for (let i = 0; i < rawChats.length; i++) {
    const c = rawChats[i];
    if (c.roomId !== angelRoomId && c.roomId !== targetRoomId) continue;
    const copy = Object.assign({}, c);
    if (!revealed && realAngel && c.roomId === angelRoomId) {
      copy.roomId = '__ANGEL__->' + studentId;
      if (copy.senderId === realAngel.id) copy.senderId = '__ANGEL__';
      if (copy.receiverId === realAngel.id) copy.receiverId = '__ANGEL__';
    }
    safeChats.push(copy);
  }

  return {
    id: classroom.id,
    teacherPassword: '',
    config: classroom.config,
    students: safeStudents,
    missions: safeMissions,
    chats: safeChats,
    medalTemplates: [],
    createdAt: classroom.createdAt,
  };
}

function verifyTeacherPassword_(snapshot, password) {
  if (!snapshot.initialized) return false;
  return String(password || '').trim() === String(snapshot.classroom.teacherPassword || '').trim();
}

function verifyStudentPin_(snapshot, studentId, pin) {
  const cleanPin = String(pin || '').trim().toUpperCase();
  if (!studentId || !cleanPin) return null;
  for (let i = 0; i < snapshot.classroom.students.length; i++) {
    const s = snapshot.classroom.students[i];
    if (s.id === studentId && String(s.pin || '').trim().toUpperCase() === cleanPin) {
      return s;
    }
  }
  return null;
}

function getWeekKey_(dateKey) {
  const parts = String(dateKey || '').split('-');
  const y = Number(parts[0]) || 2026;
  const m = Number(parts[1]) || 1;
  const d = Number(parts[2]) || 1;
  const dt = new Date(y, m - 1, d);
  const diff = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - diff);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return dt.getFullYear() + '-' + mm + '-' + dd;
}

function doGet(e) {
  try {
    const snapshot = readSnapshot_(false);
    return jsonOut_({
      ok: true,
      initialized: snapshot.initialized,
      classId: snapshot.classroom.id,
      className: snapshot.classroom.config.className,
      spreadsheetUrl: snapshot.spreadsheetUrl,
    });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doPost(e) {
  try {
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const body = JSON.parse(rawBody);
    const action = String(body.action || '');

    // 읽기 전용 액션 (Lock 불필요, 캐시 활용)
    if (action === 'ping') {
      const snap = readSnapshot_(false);
      return jsonOut_({
        ok: true,
        initialized: snap.initialized,
        classId: snap.classroom.id,
        className: snap.classroom.config.className,
        spreadsheetUrl: snap.spreadsheetUrl,
      });
    }

    if (action === 'student_roster') {
      const snap = readSnapshot_(false);
      return jsonOut_({
        ok: true,
        initialized: snap.initialized,
        classId: snap.classroom.id,
        config: snap.classroom.config,
        roster: snap.classroom.students.map(function (s) {
          return { id: s.id, number: s.number, name: s.name };
        }),
      });
    }

    if (action === 'student_login') {
      const snap = readSnapshot_(false);
      const name = String(body.name || '').trim();
      const pin = String(body.pin || '').trim().toUpperCase();
      const sameName = snap.classroom.students.filter(function (s) {
        return s.name.trim() === name;
      });
      if (sameName.length === 0) {
        return jsonOut_({
          ok: false,
          field: 'name',
          error: name
            ? '우리 반 명단에서 이름을 찾지 못했어요. 이름을 다시 확인해 주세요.'
            : '내 이름을 입력해 주세요.',
        });
      }
      let matched = null;
      for (let i = 0; i < sameName.length; i++) {
        if (sameName[i].pin.toUpperCase() === pin) {
          matched = sameName[i];
          break;
        }
      }
      if (pin.length !== 4 || !matched) {
        return jsonOut_({
          ok: false,
          field: 'code',
          error:
            pin.length !== 4
              ? '영어와 숫자 4자리를 모두 입력해 주세요.'
              : '선생님께 받은 입장 코드를 다시 확인해 주세요.',
        });
      }
      return jsonOut_({
        ok: true,
        studentId: matched.id,
        classroom: sanitizeClassroomForStudent_(snap.classroom, matched.id),
      });
    }

    if (action === 'student_sync') {
      const snap = readSnapshot_(false);
      const verified = verifyStudentPin_(snap, body.studentId, body.pin);
      if (!verified) {
        return jsonOut_({ ok: false, error: '학생 인증 정보가 일치하지 않습니다.' });
      }
      return jsonOut_({
        ok: true,
        classroom: sanitizeClassroomForStudent_(snap.classroom, verified.id),
      });
    }

    if (action === 'teacher_login' || action === 'teacher_get') {
      const snap = readSnapshot_(false);
      if (!snap.initialized) {
        return jsonOut_({ ok: false, code: 'NOT_INITIALIZED', error: '아직 학급 초기 설정이 완료되지 않았습니다.' });
      }
      if (!verifyTeacherPassword_(snap, body.teacherPassword)) {
        return jsonOut_({ ok: false, code: 'INVALID_PASSWORD', error: '교사용 비밀번호가 일치하지 않습니다.' });
      }
      return jsonOut_({
        ok: true,
        classroom: snap.classroom,
        spreadsheetUrl: snap.spreadsheetUrl,
      });
    }

    // 쓰기 액션 (ScriptLock 적용)
    return withLock_(function () {
      const snap = readSnapshot_(true);

      if (action === 'teacher_setup') {
        if (snap.initialized) {
          return jsonOut_({ ok: false, error: '이미 초기 설정이 완료된 시트입니다. 기존 비밀번호로 로그인해 주세요.' });
        }
        const cleanName = String(body.className || '').trim();
        const cleanPw = String(body.teacherPassword || '').trim();
        if (!cleanName || cleanPw.length < 4) {
          return jsonOut_({ ok: false, error: '학급 이름과 4자 이상의 교사용 비밀번호를 입력해 주세요.' });
        }
        const today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
        writeConfigPairs_({
          class_id: String(body.classId || '4B2K').toUpperCase(),
          class_name: cleanName,
          teacher_password: cleanPw,
          stage: '1',
          reveal_opened: 'false',
          chat_open: 'false',
          weekly_quest: '',
          weekly_quest_id: '',
          weekly_quest_hidden: 'false',
          medal_templates_json: JSON.stringify(Array.isArray(body.medalTemplates) ? body.medalTemplates : []),
          created_at: today,
          updated_at: new Date().toISOString(),
        });
        invalidateCache_();
        const fresh = readSnapshot_(true);
        return jsonOut_({ ok: true, classroom: fresh.classroom, spreadsheetUrl: fresh.spreadsheetUrl });
      }

      // 교사 인증 필수 쓰기 액션들
      if (action.indexOf('teacher_') === 0) {
        if (!verifyTeacherPassword_(snap, body.teacherPassword)) {
          return jsonOut_({ ok: false, error: '교사 인증에 실패했습니다.' });
        }

        if (action === 'teacher_update_meta') {
          const updates = { updated_at: new Date().toISOString() };
          if (body.className !== undefined) updates.class_name = String(body.className).trim();
          if (body.medalTemplates !== undefined) {
            updates.medal_templates_json = JSON.stringify(body.medalTemplates);
          }
          writeConfigPairs_(updates);
          invalidateCache_();
          return jsonOut_({ ok: true });
        }

        if (action === 'teacher_set_chat_open') {
          writeConfigPairs_({
            chat_open: String(Boolean(body.chatOpen)),
            updated_at: new Date().toISOString(),
          });
          invalidateCache_();
          return jsonOut_({ ok: true });
        }

        if (action === 'teacher_save_progress') {
          const prev = body.previous || {};
          const next = body.next || {};
          const curStage = snap.classroom.config.stage;
          const curReveal = snap.classroom.config.revealOpened;
          if (curStage !== prev.stage || curReveal !== prev.revealOpened) {
            return jsonOut_({ ok: false, error: '진행 상태가 이미 변경되었습니다. 새로고침 후 다시 시도해 주세요.' });
          }
          writeConfigPairs_({
            stage: String(next.stage),
            reveal_opened: next.revealOpened === undefined ? '' : String(Boolean(next.revealOpened)),
            updated_at: new Date().toISOString(),
          });
          invalidateCache_();
          return jsonOut_({ ok: true });
        }

        if (action === 'teacher_save_weekly_quest') {
          const prev = body.previous || {};
          const next = body.next || {};
          const cfg = snap.classroom.config;
          if (
            cfg.stage !== 2 ||
            cfg.weeklyQuest !== (prev.weeklyQuest || '') ||
            (cfg.weeklyQuestId || '') !== (prev.weeklyQuestId || '') ||
            Boolean(cfg.weeklyQuestHidden) !== Boolean(prev.weeklyQuestHidden)
          ) {
            return jsonOut_({ ok: false, error: '주간 미션 상태가 이미 변경되었습니다.' });
          }
          writeConfigPairs_({
            weekly_quest: next.weeklyQuest || '',
            weekly_quest_id: next.weeklyQuestId || '',
            weekly_quest_hidden: String(Boolean(next.weeklyQuestHidden)),
            updated_at: new Date().toISOString(),
          });
          invalidateCache_();
          return jsonOut_({ ok: true });
        }

        if (action === 'teacher_upsert_students') {
          const incoming = Array.isArray(body.students) ? body.students : [];
          if (incoming.length === 0) return jsonOut_({ ok: true });
          const ss = SpreadsheetApp.getActiveSpreadsheet();
          const sheet = ensureSheetWithHeaders_(ss, SHEET_STUDENTS, STUDENT_HEADERS);
          const lastRow = sheet.getLastRow();
          const rowIndexById = {};
          if (lastRow >= 2) {
            const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
            for (let i = 0; i < ids.length; i++) {
              const id = String(ids[i][0] || '').trim();
              if (id) rowIndexById[id] = i + 2;
            }
          }
          const toAppend = [];
          for (let i = 0; i < incoming.length; i++) {
            const row = studentToRow_(incoming[i]);
            if (rowIndexById[incoming[i].id]) {
              sheet
                .getRange(rowIndexById[incoming[i].id], 1, 1, STUDENT_HEADERS.length)
                .setValues([row]);
            } else {
              toAppend.push(row);
            }
          }
          if (toAppend.length > 0) {
            sheet
              .getRange(sheet.getLastRow() + 1, 1, toAppend.length, STUDENT_HEADERS.length)
              .setValues(toAppend);
          }
          invalidateCache_();
          return jsonOut_({ ok: true });
        }

        if (action === 'teacher_delete_student') {
          const targetId = String(body.studentId || '').trim();
          const ss = SpreadsheetApp.getActiveSpreadsheet();
          const sheet = ensureSheetWithHeaders_(ss, SHEET_STUDENTS, STUDENT_HEADERS);
          const remaining = snap.classroom.students
            .filter(function (s) {
              return s.id !== targetId;
            })
            .map(function (s) {
              if (s.targetId === targetId) {
                return Object.assign({}, s, { targetId: '' });
              }
              return s;
            });
          if (sheet.getLastRow() >= 2) {
            sheet.getRange(2, 1, sheet.getLastRow() - 1, STUDENT_HEADERS.length).clearContent();
          }
          if (remaining.length > 0) {
            sheet
              .getRange(2, 1, remaining.length, STUDENT_HEADERS.length)
              .setValues(remaining.map(studentToRow_));
          }
          invalidateCache_();
          return jsonOut_({ ok: true });
        }

        if (action === 'teacher_replace_all') {
          const nextStudents = Array.isArray(body.students) ? body.students : [];
          const nextMissions = Array.isArray(body.missions) ? body.missions : [];
          const ss = SpreadsheetApp.getActiveSpreadsheet();
          const stuSheet = ensureSheetWithHeaders_(ss, SHEET_STUDENTS, STUDENT_HEADERS);
          const misSheet = ensureSheetWithHeaders_(ss, SHEET_MISSIONS, MISSION_HEADERS);
          const chatSheet = ensureSheetWithHeaders_(ss, SHEET_CHATS, CHAT_HEADERS);
          if (stuSheet.getLastRow() >= 2) {
            stuSheet.getRange(2, 1, stuSheet.getLastRow() - 1, STUDENT_HEADERS.length).clearContent();
          }
          if (nextStudents.length > 0) {
            stuSheet
              .getRange(2, 1, nextStudents.length, STUDENT_HEADERS.length)
              .setValues(nextStudents.map(studentToRow_));
          }
          if (misSheet.getLastRow() >= 2) {
            misSheet.getRange(2, 1, misSheet.getLastRow() - 1, MISSION_HEADERS.length).clearContent();
          }
          if (nextMissions.length > 0) {
            misSheet
              .getRange(2, 1, nextMissions.length, MISSION_HEADERS.length)
              .setValues(nextMissions.map(missionToRow_));
          }
          if (nextStudents.length === 0 && chatSheet.getLastRow() >= 2) {
            chatSheet.getRange(2, 1, chatSheet.getLastRow() - 1, CHAT_HEADERS.length).clearContent();
          }
          invalidateCache_();
          return jsonOut_({ ok: true });
        }

        if (action === 'teacher_send_postmaster') {
          const mission = body.mission;
          if (!mission || !mission.id) return jsonOut_({ ok: false, error: '잘못된 응원 데이터입니다.' });
          const ss = SpreadsheetApp.getActiveSpreadsheet();
          const sheet = ensureSheetWithHeaders_(ss, SHEET_MISSIONS, MISSION_HEADERS);
          sheet.appendRow(missionToRow_(mission));
          invalidateCache_();
          return jsonOut_({ ok: true });
        }

        if (action === 'teacher_approve_all_pending') {
          const verifiedAt = String(body.verifiedAt || '');
          const ss = SpreadsheetApp.getActiveSpreadsheet();
          const sheet = ensureSheetWithHeaders_(ss, SHEET_MISSIONS, MISSION_HEADERS);
          const lastRow = sheet.getLastRow();
          if (lastRow >= 2) {
            const rows = sheet.getRange(2, 1, lastRow - 1, MISSION_HEADERS.length).getValues();
            let changed = false;
            for (let i = 0; i < rows.length; i++) {
              if (String(rows[i][6] || '').trim() === 'pending') {
                rows[i][6] = 'verified';
                if (!String(rows[i][7] || '').trim()) {
                  rows[i][7] = '선생님 대신 승인 완료';
                }
                rows[i][10] = verifiedAt;
                changed = true;
              }
            }
            if (changed) {
              sheet.getRange(2, 1, rows.length, MISSION_HEADERS.length).setValues(rows);
            }
          }
          invalidateCache_();
          return jsonOut_({ ok: true });
        }

        return jsonOut_({ ok: false, error: '지원하지 않는 교사 요청입니다.' });
      }

      // 학생 인증 필수 쓰기 액션들
      const student = verifyStudentPin_(snap, body.studentId, body.pin);
      if (!student) {
        return jsonOut_({ ok: false, error: '학생 인증 정보가 일치하지 않습니다.' });
      }
      const cfg = snap.classroom.config;
      const revealed = isIdentityRevealed_(cfg);

      if (action === 'student_save_work') {
        const patch = body.patch || {};
        const isOpening =
          patch.openingLetterToAngel !== undefined ||
          patch.openingReplyToTarget !== undefined;
        if (revealed) {
          return jsonOut_({ ok: false, error: '정체 공개 후에는 수정할 수 없습니다.' });
        }
        if (!isOpening && cfg.stage !== 3) {
          return jsonOut_({ ok: false, error: '현재 단계에서는 저장할 수 없습니다.' });
        }
        if (
          (patch.openingLetterToAngel !== undefined && String(student.openingLetterToAngel || '').trim()) ||
          (patch.openingReplyToTarget !== undefined && String(student.openingReplyToTarget || '').trim())
        ) {
          return jsonOut_({ ok: false, error: '이미 보낸 1단계 편지는 수정할 수 없습니다.' });
        }

        const updated = Object.assign({}, student);
        if (patch.openingLetterToAngel !== undefined) updated.openingLetterToAngel = String(patch.openingLetterToAngel);
        if (patch.openingReplyToTarget !== undefined) updated.openingReplyToTarget = String(patch.openingReplyToTarget);
        if (patch.guessedAngelId !== undefined) updated.guessedAngelId = String(patch.guessedAngelId);
        if (patch.thankLetterToAngel !== undefined) updated.thankLetterToAngel = String(patch.thankLetterToAngel);
        if (patch.revealLetterToTarget !== undefined) updated.revealLetterToTarget = String(patch.revealLetterToTarget);

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ensureSheetWithHeaders_(ss, SHEET_STUDENTS, STUDENT_HEADERS);
        const lastRow = sheet.getLastRow();
        if (lastRow >= 2) {
          const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
          for (let i = 0; i < ids.length; i++) {
            if (String(ids[i][0] || '').trim() === student.id) {
              sheet.getRange(i + 2, 1, 1, STUDENT_HEADERS.length).setValues([studentToRow_(updated)]);
              break;
            }
          }
        }
        invalidateCache_();
        const fresh = readSnapshot_(true);
        return jsonOut_({
          ok: true,
          classroom: sanitizeClassroomForStudent_(fresh.classroom, student.id),
        });
      }

      if (action === 'student_send_mission') {
        const mission = body.mission;
        if (cfg.stage !== 2 || revealed || !student.targetId || !mission) {
          return jsonOut_({ ok: false, error: '현재 미션을 보낼 수 없습니다.' });
        }
        if (mission.senderId !== student.id || mission.receiverId !== student.targetId) {
          return jsonOut_({ ok: false, error: '잘못된 미션 대상입니다.' });
        }
        const mySent = snap.classroom.missions.filter(function (m) {
          return m.senderId === student.id && !m.isPostmasterNote;
        });
        if (mission.type === 'quest') {
          if (cfg.weeklyQuestHidden || !String(cfg.weeklyQuest || '').trim()) {
            return jsonOut_({ ok: false, error: '진행 중인 주간 미션이 없습니다.' });
          }
          const dupQuest = mySent.some(function (m) {
            if (m.type !== 'quest') return false;
            if (cfg.weeklyQuestId) return m.questId === cfg.weeklyQuestId;
            return !m.questId && getWeekKey_(m.dateKey) === getWeekKey_(mission.dateKey);
          });
          if (dupQuest) {
            return jsonOut_({ ok: false, error: '이번 주간 미션은 이미 제출했습니다.' });
          }
        } else {
          const todayCount = mySent.filter(function (m) {
            return m.type !== 'quest' && m.dateKey === mission.dateKey;
          }).length;
          if (todayCount >= 2) {
            return jsonOut_({ ok: false, error: '오늘 일반 활동은 2회까지 보낼 수 있습니다.' });
          }
        }

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ensureSheetWithHeaders_(ss, SHEET_MISSIONS, MISSION_HEADERS);
        sheet.appendRow(missionToRow_(mission));
        invalidateCache_();
        const fresh = readSnapshot_(true);
        return jsonOut_({
          ok: true,
          classroom: sanitizeClassroomForStudent_(fresh.classroom, student.id),
        });
      }

      if (action === 'student_update_mission') {
        if (cfg.stage < 2 || revealed) {
          return jsonOut_({ ok: false, error: '현재 미션을 확인할 수 없습니다.' });
        }
        const missionId = String(body.missionId || '').trim();
        const nextStatus = String(body.status || '').trim();
        if (nextStatus !== 'verified' && nextStatus !== 'hold') {
          return jsonOut_({ ok: false, error: '잘못된 상태값입니다.' });
        }
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ensureSheetWithHeaders_(ss, SHEET_MISSIONS, MISSION_HEADERS);
        const lastRow = sheet.getLastRow();
        let updatedRow = false;
        if (lastRow >= 2) {
          const rows = sheet.getRange(2, 1, lastRow - 1, MISSION_HEADERS.length).getValues();
          for (let i = 0; i < rows.length; i++) {
            if (String(rows[i][0] || '').trim() === missionId) {
              if (String(rows[i][2] || '').trim() !== student.id) {
                return jsonOut_({ ok: false, error: '본인이 받은 미션만 확인할 수 있습니다.' });
              }
              rows[i][6] = nextStatus;
              if (nextStatus === 'verified') {
                rows[i][7] = String(body.reply || '');
                rows[i][10] = String(body.verifiedAt || '');
              }
              sheet.getRange(i + 2, 1, 1, MISSION_HEADERS.length).setValues([rows[i]]);
              updatedRow = true;
              break;
            }
          }
        }
        if (!updatedRow) {
          return jsonOut_({ ok: false, error: '미션을 찾을 수 없습니다.' });
        }
        invalidateCache_();
        const fresh = readSnapshot_(true);
        return jsonOut_({
          ok: true,
          classroom: sanitizeClassroomForStudent_(fresh.classroom, student.id),
        });
      }

      if (action === 'student_send_chat') {
        if (!cfg.chatOpen) {
          return jsonOut_({ ok: false, error: '현재 수호톡 대화방이 닫혀 있습니다.' });
        }
        const partnerRole = String(body.partnerRole || '');
        const cleanContent = String(body.content || '').trim().slice(0, 200);
        if (!cleanContent) {
          return jsonOut_({ ok: false, error: '메시지를 입력해 주세요.' });
        }

        let roomId = '';
        let receiverId = '';
        if (partnerRole === 'angel') {
          let realAngel = null;
          for (let i = 0; i < snap.classroom.students.length; i++) {
            if (snap.classroom.students[i].targetId === student.id) {
              realAngel = snap.classroom.students[i];
              break;
            }
          }
          if (!realAngel) {
            return jsonOut_({ ok: false, error: '수호천사가 아직 배정되지 않았습니다.' });
          }
          roomId = realAngel.id + '->' + student.id;
          receiverId = realAngel.id;
        } else if (partnerRole === 'target') {
          if (!student.targetId) {
            return jsonOut_({ ok: false, error: '챙겨줄 친구가 아직 배정되지 않았습니다.' });
          }
          roomId = student.id + '->' + student.targetId;
          receiverId = student.targetId;
        } else {
          return jsonOut_({ ok: false, error: '잘못된 대화방 요청입니다.' });
        }

        const nowLabel = Utilities.formatDate(new Date(), 'Asia/Seoul', 'HH:mm');
        const chatId = 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const chatSheet = ensureSheetWithHeaders_(ss, SHEET_CHATS, CHAT_HEADERS);
        chatSheet.appendRow([
          chatId,
          roomId,
          student.id,
          receiverId,
          cleanContent,
          nowLabel,
          new Date().toISOString(),
        ]);
        invalidateCache_();
        const fresh = readSnapshot_(true);
        return jsonOut_({
          ok: true,
          classroom: sanitizeClassroomForStudent_(fresh.classroom, student.id),
        });
      }

      return jsonOut_({ ok: false, error: '알 수 없는 요청입니다.' });
    });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
