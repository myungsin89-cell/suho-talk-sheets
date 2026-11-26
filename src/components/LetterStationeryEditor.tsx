import React from 'react';
import { SuhoHamster } from './SuhoHamster';

interface LetterStationeryEditorProps {
  theme: 'warm' | 'rose';
  toLabel: string;
  fromLabel: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  minRows: number;
  hamsterVariant: 'welcome' | 'heart';
}

export const LetterStationeryEditor: React.FC<LetterStationeryEditorProps> = ({
  theme, toLabel, fromLabel, value, onChange, placeholder, minRows, hamsterVariant,
}) => {
  const textId = React.useId();
  const isWarm = theme === 'warm';

  return (
    <div className={`overflow-hidden rounded-2xl border ${isWarm ? 'border-[#e7d8b9] bg-[#fff9eb]' : 'border-[#edcfc8] bg-[#fff4f1]'}`}>
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#d7c1a7] px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#685852]">받는 사람</p>
          <p className="mt-0.5 break-keep text-base font-black text-[#2b2118] sm:text-lg">{toLabel}</p>
        </div>
        <SuhoHamster variant={hamsterVariant} size={42} className="shrink-0" />
      </div>
      <label htmlFor={textId} className="sr-only">편지 내용</label>
      <textarea
        id={textId}
        rows={minRows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`block w-full resize-y px-4 py-2 text-base text-[#2b2118] placeholder:text-[#75675d] sm:px-6 ${isWarm ? 'letter-paper-warm' : 'letter-paper-rose'}`}
      />
      <div className="border-t border-dashed border-[#d7c1a7] px-4 py-3 text-right text-sm text-[#685852] sm:px-6">
        보낸 사람 <strong className="ml-1 text-[#2b2118]">{fromLabel}</strong>
      </div>
    </div>
  );
};
