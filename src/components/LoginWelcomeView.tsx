import React, { useState } from 'react';
import { ArrowRight, KeyRound } from 'lucide-react';
import { ClassConfig, Student } from '../types';
import { SuhoHamster, SuhoKakaoLogo } from './SuhoHamster';

export type StudentAuthResult =
  | { ok: true; studentId: string; pin: string }
  | { ok: false; field: 'name' | 'code'; message: string };

interface LoginWelcomeViewProps {
  students: Pick<Student, 'id' | 'number' | 'name' | 'pin'>[];
  config: ClassConfig;
  onSelectStudent: (studentId: string, pin?: string) => void;
  onAuthenticateStudent?: (name: string, pin: string) => Promise<StudentAuthResult>;
}

export const LoginWelcomeView: React.FC<LoginWelcomeViewProps> = ({
  students,
  config,
  onSelectStudent,
  onAuthenticateStudent,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ field: 'name' | 'code'; message: string } | null>(null);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const codeRef = React.useRef<HTMLInputElement>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const cleanName = name.trim();
    if (!cleanName) {
      setError({ field: 'name', message: '내 이름을 입력해 주세요.' });
      nameRef.current?.focus();
      return;
    }
    if (code.length !== 4) {
      setError({ field: 'code', message: '영어와 숫자 4자리를 모두 입력해 주세요.' });
      codeRef.current?.focus();
      return;
    }

    if (onAuthenticateStudent) {
      setSubmitting(true);
      try {
        const result = await onAuthenticateStudent(cleanName, code);
        if (!result.ok) {
          setError({ field: result.field, message: result.message });
          if (result.field === 'name') nameRef.current?.focus();
          else codeRef.current?.focus();
          return;
        }
        onSelectStudent(result.studentId, result.pin);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const sameName = students.filter((student) => student.name.trim() === cleanName);
    if (!sameName.length) {
      setError({
        field: 'name',
        message: '우리 반 명단에서 이름을 찾지 못했어요. 이름을 다시 확인해 주세요.',
      });
      nameRef.current?.focus();
      return;
    }
    const match = sameName.find((student) => (student.pin || '').toUpperCase() === code);
    if (!match) {
      setError({
        field: 'code',
        message: '선생님께 받은 입장 코드를 다시 확인해 주세요.',
      });
      codeRef.current?.focus();
      return;
    }
    onSelectStudent(match.id, code);
  };

  return (
    <main className="suho-student min-h-dvh px-4 py-6 sm:grid sm:place-items-center">
      <div className="mx-auto w-full max-w-[440px] sm:py-8">
        <div className="mb-5 flex items-center gap-2 text-sm font-extrabold">
          <SuhoKakaoLogo size={28} />
          <span>수호톡</span>
        </div>
        <section className="suho-sheet p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 break-words text-sm font-bold text-[#685852]">{config.className}</p>
              <h1 className="text-2xl font-black tracking-tight">수호톡 입장하기</h1>
              <p className="mt-2 text-base leading-relaxed text-[#685852]">내 이름과 선생님께 받은 입장 코드를 적어 주세요.</p>
            </div>
            <SuhoHamster variant="welcome" size={62} className="shrink-0" />
          </div>
          {students.length === 0 ? (
            <p className="mt-6 rounded-xl bg-[#F7F4EF] p-4 text-base leading-relaxed text-[#685852]">
              선생님이 우리 반을 준비하고 있어요. 준비가 끝나면 다시 들어와 주세요.
            </p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="mb-1.5 block text-sm font-extrabold" htmlFor="student-name">내 이름</label>
                <input id="student-name" ref={nameRef} className="suho-field w-full"
                  value={name} onChange={(event) => { setName(event.target.value); setError(null); }}
                  placeholder="예: 김초록" autoComplete="off"
                  aria-invalid={error?.field === 'name'} aria-describedby={error?.field === 'name' ? 'login-error' : undefined} />
                {error?.field === 'name' && <p id="login-error" role="alert" className="mt-2 text-sm text-red-700">{error.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-extrabold" htmlFor="student-code">입장 코드</label>
                <input id="student-code" ref={codeRef} className="suho-field w-full uppercase tracking-widest"
                  value={code} onChange={(event) => { setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)); setError(null); }}
                  placeholder="영어와 숫자 4자리" autoComplete="off" autoCapitalize="characters" spellCheck={false}
                  aria-invalid={error?.field === 'code'} aria-describedby={error?.field === 'code' ? 'login-error' : undefined} />
                {error?.field === 'code' && <p id="login-error" role="alert" className="mt-2 text-sm text-red-700">{error.message}</p>}
              </div>
              <button className="suho-primary w-full" type="submit" disabled={submitting}>
                {submitting ? '확인 중…' : '입장하기'} {!submitting && <ArrowRight size={19} aria-hidden="true" />}
              </button>
            </form>
          )}
        </section>
        {students.length > 0 && <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[#685852]">
          <KeyRound size={16} aria-hidden="true" /> 코드를 잊었다면 선생님께 물어보세요.
        </p>}
      </div>
    </main>
  );
};
