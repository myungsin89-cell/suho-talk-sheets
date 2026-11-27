import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessage, Student } from '../types';
import { SuhoHamster } from './SuhoHamster';
import { Lock, MessageCircle, Send } from 'lucide-react';

interface StudentChatViewProps {
  student: Student;
  myAngel?: Student;
  myTarget?: Student;
  chats: ChatMessage[];
  chatOpen: boolean;
  identityRevealed: boolean;
  isPreviewMode: boolean;
  unreadAngelCount: number;
  unreadTargetCount: number;
  onMarkRoomRead: (role: 'angel' | 'target', incomingCount: number) => void;
  onSendChat: (partnerRole: 'angel' | 'target', content: string) => Promise<boolean>;
}

export const StudentChatView: React.FC<StudentChatViewProps> = ({
  student,
  myAngel,
  myTarget,
  chats,
  chatOpen,
  identityRevealed,
  isPreviewMode,
  unreadAngelCount,
  unreadTargetCount,
  onMarkRoomRead,
  onSendChat,
}) => {
  const [activeRoom, setActiveRoom] = useState<'angel' | 'target'>(() =>
    unreadTargetCount > 0 && unreadAngelCount === 0 ? 'target' : 'angel'
  );
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cooldownTimerRef = useRef<number>();

  const angelRoomId = myAngel ? `${myAngel.id}->${student.id}` : '';
  const targetRoomId = myTarget ? `${student.id}->${myTarget.id}` : '';

  const angelMessages = useMemo(
    () => (angelRoomId ? chats.filter((c) => c.roomId === angelRoomId) : []),
    [chats, angelRoomId]
  );
  const targetMessages = useMemo(
    () => (targetRoomId ? chats.filter((c) => c.roomId === targetRoomId) : []),
    [chats, targetRoomId]
  );

  const currentMessages = activeRoom === 'angel' ? angelMessages : targetMessages;
  const currentIncomingCount = currentMessages.filter(
    (m) => m.senderId !== student.id
  ).length;

  const partnerReady = activeRoom === 'angel' ? Boolean(myAngel) : Boolean(myTarget);
  const angelDisplayName =
    identityRevealed && myAngel && myAngel.id !== '__ANGEL__'
      ? `${myAngel.number}번 ${myAngel.name}`
      : '나의 비밀 수호천사';
  const targetDisplayName = myTarget
    ? `${myTarget.number}번 ${myTarget.name}`
    : '내가 챙겨줄 친구';

  useEffect(() => {
    onMarkRoomRead(activeRoom, currentIncomingCount);
  }, [activeRoom, currentIncomingCount, onMarkRoomRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeRoom, currentMessages.length]);

  useEffect(() => () => window.clearTimeout(cooldownTimerRef.current), []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = draft.trim();
    if (!clean || !chatOpen || isPreviewMode || sending || cooldown || !partnerReady) {
      return;
    }
    setSending(true);
    try {
      const ok = await onSendChat(activeRoom, clean);
      if (ok) {
        setDraft('');
        setCooldown(true);
        cooldownTimerRef.current = window.setTimeout(() => setCooldown(false), 1200);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 대화 상대 전환 탭 */}
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="1:1 수호톡 대화방 선택">
        <button
          type="button"
          role="tab"
          aria-selected={activeRoom === 'angel'}
          onClick={() => setActiveRoom('angel')}
          className={`min-h-14 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            activeRoom === 'angel'
              ? 'bg-[#fee500] border-[#8c650c] text-[#2d201a] shadow-xs'
              : 'bg-white border-[#e7ded0] text-[#685852] hover:text-[#2d201a]'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold opacity-80">나를 챙겨주는</span>
            {unreadAngelCount > 0 && activeRoom !== 'angel' && (
              <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                {unreadAngelCount}
              </span>
            )}
          </div>
          <div className="text-sm font-black truncate mt-0.5">{angelDisplayName}</div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeRoom === 'target'}
          onClick={() => setActiveRoom('target')}
          className={`min-h-14 rounded-xl border px-3 py-2.5 text-left transition-colors ${
            activeRoom === 'target'
              ? 'bg-[#fee500] border-[#8c650c] text-[#2d201a] shadow-xs'
              : 'bg-white border-[#e7ded0] text-[#685852] hover:text-[#2d201a]'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-bold opacity-80">내가 챙겨주는 친구</span>
            {unreadTargetCount > 0 && activeRoom !== 'target' && (
              <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                {unreadTargetCount}
              </span>
            )}
          </div>
          <div className="text-sm font-black truncate mt-0.5">{targetDisplayName}</div>
        </button>
      </div>

      {/* 상태 안내 바 */}
      {chatOpen ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
          <span>
            {activeRoom === 'angel'
              ? '수호천사와 1:1 비밀 톡 중이에요. 예쁜 말로 대화해요!'
              : `${targetDisplayName} 친구에게는 내가 비밀 수호천사로 보여요. 정체가 들키지 않게 대화해 보세요!`}
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-[#e7ded0] bg-[#f7f4ef] px-4 py-2.5 flex items-center gap-2 text-xs sm:text-sm font-bold text-[#685852]">
          <Lock className="w-4 h-4 shrink-0" />
          <span>선생님이 수호톡 시간을 마무리했어요. 주고받은 대화를 읽어볼 수 있어요.</span>
        </div>
      )}

      {/* 카카오톡 스타일 대화창 */}
      <section className="rounded-2xl border border-[#e7ded0] bg-[#BACEE0]/45 overflow-hidden flex flex-col">
        <div className="h-[380px] sm:h-[430px] overflow-y-auto p-4 space-y-3">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2.5 px-4">
              <div className="bg-white/90 p-3 rounded-2xl border border-[#e7ded0]">
                <SuhoHamster
                  variant={activeRoom === 'angel' ? 'heart' : 'welcome'}
                  size={64}
                />
              </div>
              <p className="text-sm font-extrabold text-[#2d201a]">
                {chatOpen
                  ? '아직 대화가 없어요. 먼저 반갑게 인사를 건네 보세요!'
                  : '이 대화방에 주고받은 대화가 없어요.'}
              </p>
              <p className="text-xs font-medium text-[#604832]">
                {activeRoom === 'angel'
                  ? '예) 안녕 수호천사야! 오늘 챙겨줘서 고마워!'
                  : '예) 안녕! 나는 너의 비밀 수호천사야. 오늘 하루 어땠어?'}
              </p>
            </div>
          ) : (
            currentMessages.map((msg) => {
              const isMine = msg.senderId === student.id;
              const senderName =
                activeRoom === 'angel' ? angelDisplayName : targetDisplayName;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {!isMine && (
                    <span className="text-[11px] font-extrabold text-[#475569] mb-1 px-1">
                      {senderName}
                    </span>
                  )}
                  <div
                    className={`flex items-end gap-1.5 max-w-[85%] ${
                      isMine ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-xs ${
                        isMine
                          ? 'bg-[#FEE500] text-[#2d201a] rounded-tr-sm font-medium'
                          : 'bg-white text-[#191919] border border-[#e5e7eb] rounded-tl-sm font-medium'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] font-semibold text-[#64748b] shrink-0 pb-0.5">
                      {msg.createdAt}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* 메시지 입력 영역 */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border-t border-[#e7ded0] p-3 flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4 text-[#75675d] shrink-0 hidden sm:block" />
          <input
            type="text"
            value={draft}
            maxLength={200}
            disabled={!chatOpen || isPreviewMode || sending || !partnerReady}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder={
              !chatOpen
                ? '선생님이 수호톡을 열면 입력할 수 있어요'
                : isPreviewMode
                ? '잠입 확인 모드에서는 메시지를 보낼 수 없어요'
                : '따뜻한 말을 적어 보세요 (최대 200자)'
            }
            className="flex-1 min-h-11 rounded-xl border border-[#d7cbb9] bg-[#fffcf7] px-3.5 py-2 text-sm text-[#2d201a] placeholder:text-[#75675d] disabled:bg-[#f5f6f8] disabled:text-[#767676] focus:outline-none focus:border-[#8c650c]"
          />
          <button
            type="submit"
            disabled={!chatOpen || isPreviewMode || sending || cooldown || !draft.trim() || !partnerReady}
            className="min-h-11 px-4 rounded-xl bg-[#FEE500] hover:bg-[#F5DC00] disabled:opacity-50 text-[#2d201a] text-sm font-black inline-flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? '전송 중' : '보내기'}</span>
          </button>
        </form>
      </section>
    </div>
  );
};
