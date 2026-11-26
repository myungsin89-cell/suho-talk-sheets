import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { QUEST_PRESETS } from '../data/mockData';
import type { WeeklyQuestChange, WeeklyQuestSettings } from '../types';
import { isSameWeeklyQuest, isWeeklyQuestVisible } from '../utils/weeklyQuest';

export type SaveWeeklyQuest = (change: WeeklyQuestChange, previous: WeeklyQuestSettings) => Promise<boolean>;

interface WeeklyQuestPanelProps {
  settings: WeeklyQuestSettings;
  onSave: SaveWeeklyQuest;
  onNotice: (message: string) => void;
}

const primaryAction = 'min-h-11 rounded-lg bg-[#fee500] px-3.5 py-2 text-sm font-extrabold hover:bg-[#f4d900] disabled:opacity-50';
const secondaryAction = 'min-h-11 rounded-lg border border-[#e9d9ae] bg-white px-3.5 py-2 text-sm font-bold hover:bg-[#fff7df] disabled:opacity-50';

export function WeeklyQuestPanel({ settings, onSave, onNotice }: WeeklyQuestPanelProps) {
  const [editor, setEditor] = useState<{ mode: 'start' | 'edit'; previous: WeeklyQuestSettings } | null>(null);
  const [draft, setDraft] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const hasQuest = Boolean(settings.weeklyQuest.trim());
  const visible = isWeeklyQuestVisible(settings);
  const staleEditor = Boolean(editor && !isSameWeeklyQuest(editor.previous, settings));

  useEffect(() => {
    if (editor) field.current?.focus();
  }, [editor]);

  const openEditor = (mode: 'start' | 'edit') => {
    setDraft(mode === 'edit' ? settings.weeklyQuest : '');
    setShowPresets(false);
    setError('');
    setEditor({ mode, previous: settings });
  };

  const save = async (change: WeeklyQuestChange, previous: WeeklyQuestSettings) => {
    if (saving.current) return;
    saving.current = true;
    setIsSaving(true);
    setError('');
    try {
      if (await onSave(change, previous)) {
        setEditor(null);
        const notice = change.type === 'start' ? '새 미션을 시작했습니다. 학생마다 한 번씩 제출할 수 있어요.'
          : change.type === 'edit' ? '내용을 수정했습니다. 학생의 제출 상태는 유지됩니다.'
          : change.hidden ? '학생 화면에서 미션을 숨겼습니다.' : '학생 화면에 미션을 다시 표시했습니다.';
        onNotice(notice);
        return;
      }
    } catch {
      // Keep the draft for a retry.
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
    setError('미션을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  };

  return (
    <section aria-labelledby="weekly-quest-heading" className="space-y-4 rounded-xl border border-[#e9d9ae] bg-[#fffdf2] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="weekly-quest-heading" className="flex items-center gap-2 text-base font-black">
          <Sparkles size={17} className="text-[#a25c05]" aria-hidden="true" /> 주간 미션
        </h2>
        {hasQuest && (
          <span className="rounded-md border border-[#e9d9ae] bg-white px-2 py-1 text-xs font-bold">
            {visible ? '학생에게 표시 중' : '학생 화면에서 숨김'}
          </span>
        )}
      </div>

      {hasQuest && (
        <div className="space-y-1 rounded-lg border border-[#e9d9ae] bg-white px-4 py-3">
          <p className="text-xs font-bold text-[#685852]">현재 미션</p>
          <p className="whitespace-pre-wrap break-words text-sm font-bold">{settings.weeklyQuest}</p>
          <p className="text-xs text-[#685852]">+25점 · {settings.weeklyQuestId ? '미션당 1회 제출' : '주 1회 제출'}</p>
        </div>
      )}
      {!hasQuest && !editor && <p className="text-sm text-[#685852]">첫 미션을 시작하면 학생 화면에 나타납니다.</p>}

      {editor ? (
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          if (!staleEditor && draft.trim()) void save({ type: editor.mode, content: draft }, editor.previous);
        }}>
          <div>
            <label htmlFor="weekly-quest-text" className="block text-sm font-extrabold">
              {editor.mode === 'start' ? '새 미션 내용' : '수정할 미션 내용'}
            </label>
            <p id="weekly-quest-help" className="mt-1 text-sm leading-relaxed text-[#685852]">
              {editor.mode === 'start'
                ? '학생마다 새 미션을 한 번씩 제출할 수 있어요. 이전 제출 기록과 점수는 남습니다.'
                : '학생이 이미 제출했는지와 획득한 점수는 그대로 유지됩니다.'}
            </p>
          </div>
          <textarea ref={field} id="weekly-quest-text" rows={2} value={draft}
            disabled={isSaving} onChange={(event) => setDraft(event.target.value)}
            aria-describedby="weekly-quest-help"
            className="block w-full resize-y rounded-lg border border-[#d4c4a8] bg-white p-3 text-base focus-visible:outline-[#7c4d08]" />
          {editor.mode === 'start' && (
            <div>
              <button type="button" className={secondaryAction} disabled={isSaving} aria-expanded={showPresets}
                onClick={() => setShowPresets(!showPresets)}>추천 예시</button>
              {showPresets && <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {QUEST_PRESETS.map((preset) => (
                  <li key={preset}><button type="button" disabled={isSaving}
                    className={`${secondaryAction} w-full text-left`}
                    onClick={() => { setDraft(preset); setShowPresets(false); field.current?.focus(); }}>{preset}</button></li>
                ))}
              </ul>}
            </div>
          )}
          {staleEditor && <p role="alert" className="text-sm text-red-700">다른 화면에서 미션이 바뀌었어요. 취소한 뒤 다시 열어 주세요.</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={primaryAction} disabled={isSaving || staleEditor || !draft.trim()}>
              {isSaving ? '저장 중…' : editor.mode === 'start' ? '학생에게 새 미션 열기' : '내용 수정 저장'}
            </button>
            <button type="button" className={secondaryAction} disabled={isSaving}
              onClick={() => { setError(''); setEditor(null); }}>취소</button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primaryAction} disabled={isSaving} onClick={() => openEditor('start')}>새 미션 시작</button>
          {hasQuest && <>
            <button type="button" className={secondaryAction} disabled={isSaving} onClick={() => openEditor('edit')}>내용 수정</button>
            <button type="button" className={secondaryAction} disabled={isSaving}
              onClick={() => void save({ type: 'visibility', hidden: visible }, settings)}>
              {visible ? '미션 숨기기' : '미션 다시 표시'}
            </button>
          </>}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
