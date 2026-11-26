import React, { useState } from 'react';
import { ClassRoom } from '../types';
import {
  normalizeGasWebAppUrl,
  pingGasWebApp,
} from '../services/classroomRepo';
import { SuhoKakaoLogo } from './SuhoHamster';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  KeyRound,
  Link2,
  Lock,
  PlusCircle,
  School,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';

export interface SavedGasConnection {
  id: string;
  className: string;
  gasWebAppUrl: string;
  spreadsheetUrl?: string;
}

interface TeacherEntryViewProps {
  savedConnections: SavedGasConnection[];
  localDemoClass: ClassRoom;
  onConnectGasSheet: (params: {
    gasWebAppUrl: string;
    mode: 'setup' | 'login';
    className?: string;
    teacherPassword: string;
    rememberInBrowser: boolean;
  }) => Promise<string | null>;
  onRemoveSavedConnection: (gasWebAppUrl: string) => void;
  onEnterLocalDemo: () => void;
}

type EntryTab = 'saved' | 'connect';

export const TeacherEntryView: React.FC<TeacherEntryViewProps> = ({
  savedConnections,
  localDemoClass,
  onConnectGasSheet,
  onRemoveSavedConnection,
  onEnterLocalDemo,
}) => {
  const [activeTab, setActiveTab] = useState<EntryTab>(
    savedConnections.length > 0 ? 'saved' : 'connect'
  );
  const [showGuide, setShowGuide] = useState(savedConnections.length === 0);

  // 저장된 시트 로그인 상태
  const [selectedUrl, setSelectedUrl] = useState<string>(
    savedConnections[0]?.gasWebAppUrl || ''
  );
  const [savedPassword, setSavedPassword] = useState('');
  const [rememberSaved, setRememberSaved] = useState(true);
  const [savedError, setSavedError] = useState('');
  const [savedLoading, setSavedLoading] = useState(false);

  // 새 구글 시트 연결 상태
  const [rawGasUrl, setRawGasUrl] = useState('');
  const [checkingUrl, setCheckingUrl] = useState(false);
  const [checkedInfo, setCheckedInfo] = useState<{
    normalizedUrl: string;
    initialized: boolean;
    className: string;
  } | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberConnect, setRememberConnect] = useState(true);
  const [connectError, setConnectError] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);

  React.useEffect(() => {
    if (savedConnections.length === 0) {
      setSelectedUrl('');
      setActiveTab('connect');
    } else if (!savedConnections.some((c) => c.gasWebAppUrl === selectedUrl)) {
      setSelectedUrl(savedConnections[0].gasWebAppUrl);
    }
  }, [savedConnections, selectedUrl]);

  const handleCheckGasUrl = async () => {
    const normalized = normalizeGasWebAppUrl(rawGasUrl);
    if (!normalized) {
      setConnectError(
        'Apps Script 웹앱 주소(https://script.google.com/macros/s/.../exec)를 정확히 붙여넣어 주세요.'
      );
      setCheckedInfo(null);
      return;
    }

    setCheckingUrl(true);
    setConnectError('');
    try {
      const res = await pingGasWebApp(normalized);
      if (!res.ok) {
        setConnectError(
          res.error || '웹앱에 연결하지 못했습니다. [모든 사용자] 권한으로 배포했는지 확인해 주세요.'
        );
        setCheckedInfo(null);
        return;
      }
      setCheckedInfo({
        normalizedUrl: normalized,
        initialized: Boolean(res.initialized),
        className: res.className || '',
      });
      if (!res.initialized && res.className) {
        setNewClassName(res.className);
      }
    } finally {
      setCheckingUrl(false);
    }
  };

  const handleSavedLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUrl || savedLoading) return;
    if (!savedPassword.trim()) {
      setSavedError('교사용 비밀번호를 입력해 주세요.');
      return;
    }
    setSavedLoading(true);
    setSavedError('');
    try {
      const err = await onConnectGasSheet({
        gasWebAppUrl: selectedUrl,
        mode: 'login',
        teacherPassword: savedPassword.trim(),
        rememberInBrowser: rememberSaved,
      });
      if (err) setSavedError(err);
    } finally {
      setSavedLoading(false);
    }
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkedInfo || connectLoading) return;

    const cleanPw = newPassword.trim();
    if (checkedInfo.initialized) {
      if (!cleanPw) {
        setConnectError('기존에 설정한 교사용 비밀번호를 입력해 주세요.');
        return;
      }
    } else {
      if (!newClassName.trim()) {
        setConnectError('학급 이름을 입력해 주세요. (예: 4학년 2반 수호톡)');
        return;
      }
      if (cleanPw.length < 4) {
        setConnectError('교사용 비밀번호는 4자 이상 입력해 주세요.');
        return;
      }
      if (cleanPw !== confirmPassword.trim()) {
        setConnectError('비밀번호 확인이 일치하지 않습니다.');
        return;
      }
    }

    setConnectLoading(true);
    setConnectError('');
    try {
      const err = await onConnectGasSheet({
        gasWebAppUrl: checkedInfo.normalizedUrl,
        mode: checkedInfo.initialized ? 'login' : 'setup',
        className: newClassName.trim(),
        teacherPassword: cleanPw,
        rememberInBrowser: rememberConnect,
      });
      if (err) setConnectError(err);
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        {/* 좌측: 교사용 구글 시트 무서버 안내 */}
        <div className="md:col-span-5 bg-[#FEE500] text-[#3C1E1E] p-7 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-xs font-extrabold border border-[#E5D200]">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Google Sheets 무서버 버전</span>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <SuhoKakaoLogo size={38} />
              <h1 className="text-2xl font-black tracking-tight leading-tight">
                수호톡
              </h1>
            </div>

            <p className="text-xs font-bold text-[#3C1E1E]/85 leading-relaxed">
              외부 서버 없이 <strong>선생님 개인 비공개 구글 시트</strong>에 우리 반 활동 기록을 안전하게 저장합니다.
            </p>
          </div>

          <div className="bg-white/90 rounded-lg p-4 border border-[#E5D200] space-y-2 text-xs text-[#3C1E1E]">
            <div className="font-extrabold text-sm">개인정보 안심 · 서버비 0원</div>
            <ul className="space-y-1.5 font-medium text-[#3C1E1E]/85 leading-relaxed">
              <li>• 학생 이름·편지는 선생님 구글 드라이브에만 저장됩니다.</li>
              <li>• 학생은 구글 로그인 없이 QR + 4자리 코드로 입장합니다.</li>
              <li>• 정체 공개 전에는 학생이 수호천사를 절대 알 수 없습니다.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onEnterLocalDemo}
            className="w-full py-2.5 px-3 rounded-lg bg-white/90 hover:bg-white border border-[#E5D200] text-[#3C1E1E] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            <span>시트 없이 로컬 체험 모드로 둘러보기 ({localDemoClass.students.length}명 샘플)</span>
          </button>
        </div>

        {/* 우측: 저장된 시트 로그인 / 새 구글 시트 연결 */}
        <div className="md:col-span-7 p-6 sm:p-8 bg-white flex flex-col justify-between gap-5">
          <div className="space-y-5">
            <div className="flex items-center gap-6 border-b border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('saved');
                  setSavedError('');
                }}
                className={`pb-2.5 px-1 text-sm font-extrabold flex items-center gap-1.5 border-b-2 -mb-[1px] transition-colors ${
                  activeTab === 'saved'
                    ? 'border-[#191919] text-[#191919]'
                    : 'border-transparent text-[#767676] hover:text-[#191919]'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>연결된 내 학급 ({savedConnections.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('connect');
                  setConnectError('');
                }}
                className={`pb-2.5 px-1 text-sm font-extrabold flex items-center gap-1.5 border-b-2 -mb-[1px] transition-colors ${
                  activeTab === 'connect'
                    ? 'border-[#191919] text-[#191919]'
                    : 'border-transparent text-[#767676] hover:text-[#191919]'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>구글 시트 연결하기</span>
              </button>
            </div>

            {activeTab === 'saved' ? (
              savedConnections.length === 0 ? (
                <div className="bg-[#F5F6F8] border border-[#E5E7EB] rounded-lg p-6 text-center space-y-3">
                  <p className="text-xs sm:text-sm font-bold text-[#191919]">
                    아직 이 브라우저에 연결된 구글 시트가 없어요.
                    <br />
                    [구글 시트 연결하기] 탭에서 웹앱 주소를 붙여넣어 주세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('connect')}
                    className="px-4 py-2 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black inline-flex items-center gap-1.5"
                  >
                    <Link2 className="w-4 h-4" />
                    <span>구글 시트 연결하기</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSavedLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-[#191919] mb-1.5">
                      1. 연결된 학급 시트 선택
                    </label>
                    <div className="flex gap-2">
                      <select
                        aria-label="연결된 학급 시트 선택"
                        value={selectedUrl}
                        onChange={(e) => {
                          setSelectedUrl(e.target.value);
                          setSavedError('');
                        }}
                        className="flex-1 rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none px-3.5 py-2.5 text-sm font-bold text-[#191919]"
                      >
                        {savedConnections.map((c) => (
                          <option key={c.gasWebAppUrl} value={c.gasWebAppUrl}>
                            {c.className} ({c.id})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            selectedUrl &&
                            window.confirm('이 브라우저 목록에서 선택한 시트 연결만 삭제할까요?\n(구글 시트 원본 데이터는 삭제되지 않습니다.)')
                          ) {
                            onRemoveSavedConnection(selectedUrl);
                          }
                        }}
                        className="px-2.5 rounded-lg bg-[#F5F6F8] hover:bg-red-50 border border-[#E5E7EB] text-[#767676] hover:text-red-600"
                        title="목록에서 연결 제거"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#191919] mb-1.5">
                      2. 교사용 비밀번호
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#767676] absolute left-3.5 top-3" />
                      <input
                        type="password"
                        value={savedPassword}
                        onChange={(e) => {
                          setSavedPassword(e.target.value);
                          setSavedError('');
                        }}
                        placeholder="교사용 비밀번호 입력"
                        autoComplete="off"
                        className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none pl-10 pr-4 py-2.5 text-sm text-[#191919]"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-[#191919] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberSaved}
                      onChange={(e) => setRememberSaved(e.target.checked)}
                      className="w-4 h-4 accent-[#3C1E1E] rounded"
                    />
                    <span>이 브라우저에 로그인 유지 (다음부터 바로 입장)</span>
                  </label>

                  {savedError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3.5 py-2.5 text-xs font-bold">
                      {savedError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savedLoading}
                    className="w-full py-3 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] disabled:opacity-60 text-[#3C1E1E] font-black text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" strokeWidth={2.4} />
                    <span>{savedLoading ? '구글 시트 불러오는 중…' : '교사용 대시보드 열기'}</span>
                  </button>
                </form>
              )
            ) : (
              <div className="space-y-4">
                {/* 2분 따라하기 접이식 가이드 */}
                <div className="rounded-xl border border-[#e9d9ae] bg-[#fff5d6]/70 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowGuide((prev) => !prev)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-black text-[#735020]"
                  >
                    <span>처음 연결하시나요? 2분 만에 내 구글 시트 연결하기</span>
                    {showGuide ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {showGuide && (
                    <ol className="px-4 pb-3 space-y-1 text-[11px] font-semibold text-[#604832] leading-relaxed border-t border-[#e9d9ae]/70 pt-2.5">
                      <li>1. 배포받은 <strong>수호톡 구글 시트 템플릿</strong>을 사본 만들기 합니다.</li>
                      <li>2. 사본 시트 상단 <strong>[확장 프로그램 → Apps Script → 배포 → 새 배포]</strong>에서 유형을 <strong>웹 앱</strong>으로 고르고, 실행 주체 <strong>나</strong> · 액세스 <strong>모든 사용자</strong>로 배포합니다.</li>
                      <li>3. 발급된 <strong>웹 앱 URL</strong>을 아래 칸에 붙여넣고 <strong>[연결 확인]</strong>을 누르세요.</li>
                    </ol>
                  )}
                </div>

                {/* 1단계: 웹앱 URL 입력 및 확인 */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-[#191919]">
                    1. Apps Script 웹 앱 URL 붙여넣기
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={rawGasUrl}
                      onChange={(e) => {
                        setRawGasUrl(e.target.value);
                        setCheckedInfo(null);
                        setConnectError('');
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none px-3.5 py-2 text-xs sm:text-sm text-[#191919]"
                    />
                    <button
                      type="button"
                      disabled={checkingUrl}
                      onClick={() => void handleCheckGasUrl()}
                      className="px-3.5 py-2 rounded-lg bg-[#3C1E1E] hover:bg-black disabled:opacity-60 text-[#FEE500] text-xs font-black shrink-0"
                    >
                      {checkingUrl ? '확인 중…' : '연결 확인'}
                    </button>
                  </div>
                </div>

                {checkedInfo && (
                  <form onSubmit={handleConnectSubmit} className="space-y-3.5 pt-1">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        {checkedInfo.initialized
                          ? `기존 학급 시트(${checkedInfo.className})가 확인되었습니다. 비밀번호를 입력해 입장하세요.`
                          : '새 구글 시트 연결 완료! 학급 이름과 교사용 비밀번호를 설정해 주세요.'}
                      </span>
                    </div>

                    {!checkedInfo.initialized && (
                      <div>
                        <label className="block text-xs font-extrabold text-[#191919] mb-1">
                          2. 우리 반 이름
                        </label>
                        <div className="relative">
                          <School className="w-4 h-4 text-[#767676] absolute left-3.5 top-2.5" />
                          <input
                            type="text"
                            value={newClassName}
                            onChange={(e) => {
                              setNewClassName(e.target.value);
                              setConnectError('');
                            }}
                            placeholder="예) 4학년 2반 수호톡"
                            className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none pl-10 pr-4 py-2 text-sm font-semibold text-[#191919]"
                          />
                        </div>
                      </div>
                    )}

                    <div className={checkedInfo.initialized ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
                      <div>
                        <label className="block text-xs font-extrabold text-[#191919] mb-1">
                          {checkedInfo.initialized ? '2. 교사용 비밀번호 입력' : '3. 교사용 비밀번호 설정'}
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setConnectError('');
                          }}
                          placeholder="4자 이상 입력"
                          autoComplete={checkedInfo.initialized ? 'current-password' : 'new-password'}
                          className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none px-3.5 py-2 text-sm text-[#191919]"
                        />
                      </div>

                      {!checkedInfo.initialized && (
                        <div>
                          <label className="block text-xs font-extrabold text-[#191919] mb-1">
                            4. 비밀번호 확인
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              setConnectError('');
                            }}
                            placeholder="비밀번호 재입력"
                            autoComplete="new-password"
                            className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] focus:border-[#3C1E1E] focus:bg-white focus:outline-none px-3.5 py-2 text-sm text-[#191919]"
                          />
                        </div>
                      )}
                    </div>

                    <label className="flex items-center gap-2 text-xs font-bold text-[#191919] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberConnect}
                        onChange={(e) => setRememberConnect(e.target.checked)}
                        className="w-4 h-4 accent-[#3C1E1E] rounded"
                      />
                      <span>이 브라우저에 연결 및 로그인 유지</span>
                    </label>

                    <button
                      type="submit"
                      disabled={connectLoading}
                      className="w-full py-3 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] disabled:opacity-60 text-[#3C1E1E] font-black text-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>
                        {connectLoading
                          ? '연결하는 중…'
                          : checkedInfo.initialized
                          ? '이 구글 시트로 입장하기'
                          : '학급 시작하고 대시보드 열기'}
                      </span>
                    </button>
                  </form>
                )}

                {connectError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3.5 py-2.5 text-xs font-bold">
                    {connectError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#767676]">
            <span>시트 연결 후 학생 전용 QR 링크가 자동 생성됩니다.</span>
            <span className="font-bold text-emerald-700">
              ● 완전 무서버 · Google Sheets 전용
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
