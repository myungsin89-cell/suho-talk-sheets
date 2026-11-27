/**
 * 구글 스프레드시트 확장 프로그램(Apps Script)에 복사해 붙여넣으면
 * 시트 3개(Students, Missions, Config)를 자동 생성하고
 * 모든 GET / POST 요청을 처리하는 완성된 Code.gs 전체 코드입니다.
 */
export const GAS_SERVER_CODE = `/**
 * ============================================================================
 * 수호톡 (Suho-Talk) - 우리 반 비밀 수호천사 Google Apps Script 백엔드 서버
 * ============================================================================
 * [설치 방법]
 * 1. 새 구글 스프레드시트를 만듭니다.
 * 2. 상단 메뉴 [확장 프로그램] -> [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 모두 지우고 이 코드를 그대로 붙여넣은 뒤 [저장(💾)]을 누릅니다.
 * 4. 상단 함수 선택창에서 'setupSheets'를 선택하고 [실행]을 한 번 눌러 권한을 승인합니다.
 * 5. 우측 상단 [배포] -> [새 배포] -> 유형: [웹 앱] 선택
 *    - 다음 사용자 인증 정보로 실행: '나 (본인 계정)'
 *    - 액세스 권한이 있는 사용자: '모든 사용자 (Anyone)'
 * 6. 생성된 '웹 앱 URL (https://script.google.com/macros/s/.../exec)'을 복사하여
 *    수호톡 교사 대시보드의 [구글 시트 서버 연동] 입력창에 붙여넣으면 완료됩니다!
 */

const SHEET_STUDENTS = 'Students';
const SHEET_MISSIONS = 'Missions';
const SHEET_CONFIG = 'Config';

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Students 시트 자동 생성
  let stuSheet = ss.getSheetByName(SHEET_STUDENTS);
  if (!stuSheet) {
    stuSheet = ss.insertSheet(SHEET_STUDENTS);
    stuSheet.appendRow([
      'id',
      'number',
      'name',
      'pin',
      'targetId',
      'guessedAngelId',
      'thankLetterToAngel',
      'revealLetterToTarget',
      'medalsJson'
    ]);
    stuSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#E8F3EC');
  }

  // 2. Missions 시트 자동 생성
  let misSheet = ss.getSheetByName(SHEET_MISSIONS);
  if (!misSheet) {
    misSheet = ss.insertSheet(SHEET_MISSIONS);
    misSheet.appendRow([
      'id',
      'senderId',
      'receiverId',
      'type',
      'content',
      'points',
      'status',
      'reply',
      'dateKey',
      'createdAt',
      'verifiedAt',
      'isPostmasterNote'
    ]);
    misSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#E8F3EC');
  }

  // 3. Config 시트 자동 생성
  let cfgSheet = ss.getSheetByName(SHEET_CONFIG);
  if (!cfgSheet) {
    cfgSheet = ss.insertSheet(SHEET_CONFIG);
    cfgSheet.appendRow(['key', 'value']);
    cfgSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#E8F3EC');
    cfgSheet.appendRow(['className', '4학년 2반 수호톡']);
    cfgSheet.appendRow(['weeklyQuest', '이번 주 챙겨줄 친구의 옷차림이나 멋진 점 1가지를 찾아 칭찬해 주기']);
    cfgSheet.appendRow(['stage', '1']);
  }
}

/**
 * 전체 데이터 읽기 (GET)
 */
function doGet(e) {
  setupSheets();
  const data = readAllData();
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 전체 상태 저장 및 개별 액션 처리 (POST)
 * CORS Preflight 방지를 위해 Content-Type: text/plain;charset=utf-8 로 수신합니다.
 */
function doPost(e) {
  setupSheets();
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);

    if (payload.action === 'SYNC_ALL') {
      writeAllData(payload.students || [], payload.missions || [], payload.config || {});
    }

    const updated = readAllData();
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: updated }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function readAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Students 읽기
  const stuRows = ss.getSheetByName(SHEET_STUDENTS).getDataRange().getValues();
  const students = [];
  for (let i = 1; i < stuRows.length; i++) {
    const r = stuRows[i];
    if (!r[0]) continue;
    let parsedMedals = [];
    try {
      if (r[8]) parsedMedals = JSON.parse(String(r[8]));
    } catch (err) {
      parsedMedals = [];
    }
    students.push({
      id: String(r[0]),
      number: Number(r[1] || i),
      name: String(r[2] || ''),
      pin: String(r[3] || ''),
      targetId: String(r[4] || ''),
      guessedAngelId: String(r[5] || ''),
      thankLetterToAngel: String(r[6] || ''),
      revealLetterToTarget: String(r[7] || ''),
      medals: Array.isArray(parsedMedals) ? parsedMedals : []
    });
  }

  // Missions 읽기
  const misRows = ss.getSheetByName(SHEET_MISSIONS).getDataRange().getValues();
  const missions = [];
  for (let i = 1; i < misRows.length; i++) {
    const r = misRows[i];
    if (!r[0]) continue;
    missions.push({
      id: String(r[0]),
      senderId: String(r[1] || ''),
      receiverId: String(r[2] || ''),
      type: String(r[3] || 'stealth'),
      content: String(r[4] || ''),
      points: Number(r[5] || 0),
      status: String(r[6] || 'pending'),
      reply: String(r[7] || ''),
      dateKey: String(r[8] || ''),
      createdAt: String(r[9] || ''),
      verifiedAt: String(r[10] || ''),
      isPostmasterNote: r[11] === true || r[11] === 'true'
    });
  }

  // Config 읽기
  const cfgRows = ss.getSheetByName(SHEET_CONFIG).getDataRange().getValues();
  const config = {
    className: '4학년 2반 수호톡',
    weeklyQuest: '이번 주 챙겨줄 친구의 멋진 점 1가지 칭찬하기',
    stage: 1
  };
  for (let i = 1; i < cfgRows.length; i++) {
    const key = String(cfgRows[i][0] || '');
    const val = cfgRows[i][1];
    if (key === 'className') config.className = String(val);
    if (key === 'weeklyQuest' || key === 'todayQuest') config.weeklyQuest = String(val);
    if (key === 'stage') config.stage = Number(val) || 1;
  }

  return { students: students, missions: missions, config: config };
}

function writeAllData(students, missions, config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Students 덮어쓰기
  const stuSheet = ss.getSheetByName(SHEET_STUDENTS);
  stuSheet.clearContents();
  const stuHeader = [[
    'id', 'number', 'name', 'pin', 'targetId',
    'guessedAngelId', 'thankLetterToAngel', 'revealLetterToTarget', 'medalsJson'
  ]];
  const stuValues = students.map(function(s) {
    return [
      s.id || '',
      s.number || 0,
      s.name || '',
      s.pin || '',
      s.targetId || '',
      s.guessedAngelId || '',
      s.thankLetterToAngel || '',
      s.revealLetterToTarget || '',
      JSON.stringify(s.medals || [])
    ];
  });
  const allStu = stuHeader.concat(stuValues);
  stuSheet.getRange(1, 1, allStu.length, 9).setValues(allStu);

  // Missions 덮어쓰기
  const misSheet = ss.getSheetByName(SHEET_MISSIONS);
  misSheet.clearContents();
  const misHeader = [[
    'id', 'senderId', 'receiverId', 'type', 'content', 'points',
    'status', 'reply', 'dateKey', 'createdAt', 'verifiedAt', 'isPostmasterNote'
  ]];
  const misValues = missions.map(function(m) {
    return [
      m.id || '',
      m.senderId || '',
      m.receiverId || '',
      m.type || 'stealth',
      m.content || '',
      m.points || 0,
      m.status || 'pending',
      m.reply || '',
      m.dateKey || '',
      m.createdAt || '',
      m.verifiedAt || '',
      Boolean(m.isPostmasterNote)
    ];
  });
  const allMis = misHeader.concat(misValues);
  misSheet.getRange(1, 1, allMis.length, 12).setValues(allMis);

  // Config 덮어쓰기
  const cfgSheet = ss.getSheetByName(SHEET_CONFIG);
  cfgSheet.clearContents();
  const cfgRows = [
    ['key', 'value'],
    ['className', config.className || '4학년 2반 수호톡'],
    ['weeklyQuest', config.weeklyQuest || ''],
    ['stage', String(config.stage || 1)]
  ];
  cfgSheet.getRange(1, 1, cfgRows.length, 2).setValues(cfgRows);
}
`;
