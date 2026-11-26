import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Student } from '../types';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  GripVertical,
  LayoutGrid,
  Search,
  Shuffle,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

interface MatchingBoardModalProps {
  students: Student[];
  onBatchUpdateTargets: (updates: Record<string, string>) => void;
  onRunRandomMatching: () => void;
  onClearMatching: () => void;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

type LeftFilter = 'all' | 'unassigned' | 'assigned';

interface DragPayload {
  targetId: string;
  fromSenderId?: string;
}

export const MatchingBoardModal: React.FC<MatchingBoardModalProps> = ({
  students,
  onBatchUpdateTargets,
  onRunRandomMatching,
  onClearMatching,
  onClose,
  onNotify,
}) => {
  const [leftFilter, setLeftFilter] = useState<LeftFilter>('all');
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [mutualMode, setMutualMode] = useState(false);

  const [focusedSenderId, setFocusedSenderId] = useState<string | null>(() => {
    const firstEmpty = students.find(
      (s) => !s.targetId || !students.some((c) => c.id === s.targetId)
    );
    return firstEmpty?.id || students[0]?.id || null;
  });

  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const dragPayloadRef = useRef<DragPayload | null>(null);
  const [dragOverSenderId, setDragOverSenderId] = useState<string | null>(null);
  const [dragOverPool, setDragOverPool] = useState(false);

  const startDrag = (payload: DragPayload, e: React.DragEvent) => {
    dragPayloadRef.current = payload;
    setDragPayload(payload);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('application/json', JSON.stringify(payload));
      e.dataTransfer.setData('text/plain', payload.targetId);
    } catch {
      // ignore restricted dataTransfer errors
    }
  };

  const clearDrag = () => {
    dragPayloadRef.current = null;
    setDragPayload(null);
    setDragOverSenderId(null);
    setDragOverPool(false);
  };

  const readDragPayload = (e: React.DragEvent): DragPayload | null => {
    if (dragPayloadRef.current) return dragPayloadRef.current;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const parsed = JSON.parse(raw) as DragPayload;
        if (parsed && typeof parsed.targetId === 'string') return parsed;
      }
    } catch {
      // ignore parse errors
    }
    return null;
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const studentById = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const metrics = useMemo(() => {
    const receiverCounts = new Map<string, number>();
    students.forEach((s) => receiverCounts.set(s.id, 0));

    let assignedCount = 0;
    const unassignedSenders: Student[] = [];

    students.forEach((s) => {
      if (s.targetId && studentById.has(s.targetId) && s.targetId !== s.id) {
        assignedCount += 1;
        receiverCounts.set(
          s.targetId,
          (receiverCounts.get(s.targetId) || 0) + 1
        );
      } else {
        unassignedSenders.push(s);
      }
    });

    const unmatchedPool = students.filter(
      (s) => (receiverCounts.get(s.id) || 0) === 0
    );
    const duplicateReceiverIds = new Set(
      students
        .filter((s) => (receiverCounts.get(s.id) || 0) > 1)
        .map((s) => s.id)
    );

    let mutualPairsCount = 0;
    const seenPairs = new Set<string>();
    students.forEach((s) => {
      const target = studentById.get(s.targetId);
      if (target && target.targetId === s.id) {
        const key = [s.id, target.id].sort().join(':');
        if (!seenPairs.has(key)) {
          seenPairs.add(key);
          mutualPairsCount += 1;
        }
      }
    });

    const isComplete1to1 =
      students.length >= 2 &&
      unassignedSenders.length === 0 &&
      unmatchedPool.length === 0 &&
      duplicateReceiverIds.size === 0;

    return {
      receiverCounts,
      assignedCount,
      unassignedSenders,
      unmatchedPool,
      duplicateReceiverIds,
      mutualPairsCount,
      isComplete1to1,
    };
  }, [students, studentById]);

  // 선택된 포커스 학생이 명단에서 사라졌다면 안전 보정
  useEffect(() => {
    if (focusedSenderId && !studentById.has(focusedSenderId)) {
      const nextEmpty = metrics.unassignedSenders[0];
      setFocusedSenderId(nextEmpty?.id || students[0]?.id || null);
    }
  }, [focusedSenderId, studentById, metrics.unassignedSenders, students]);

  const focusedSender = focusedSenderId
    ? studentById.get(focusedSenderId) || null
    : null;

  const findNextEmptySenderId = (
    afterSenderId: string,
    pendingUpdates: Record<string, string>
  ): string | null => {
    const startIdx = students.findIndex((s) => s.id === afterSenderId);
    const ordered =
      startIdx >= 0
        ? [...students.slice(startIdx + 1), ...students.slice(0, startIdx + 1)]
        : students;
    const nextEmpty = ordered.find((s) => {
      const nextTarget =
        pendingUpdates[s.id] !== undefined ? pendingUpdates[s.id] : s.targetId;
      return !nextTarget || !studentById.has(nextTarget);
    });
    return nextEmpty ? nextEmpty.id : null;
  };

  const assignTarget = (
    senderId: string,
    targetId: string,
    fromSenderId?: string
  ) => {
    if (senderId === targetId) {
      onNotify('자기 자신은 수호천사 짝꿍으로 지정할 수 없어요.');
      return;
    }
    const sender = studentById.get(senderId);
    const target = studentById.get(targetId);
    if (!sender || !target) return;

    const updates: Record<string, string> = {};
    const prevTargetOfSender =
      sender.targetId && studentById.has(sender.targetId)
        ? sender.targetId
        : '';

    if (fromSenderId) {
      if (fromSenderId === senderId) return;
      if (prevTargetOfSender === fromSenderId) {
        // 그대로 맞교환하면 fromSender가 자기 자신을 갖게 되는 경우 방지
        updates[senderId] = targetId;
        updates[fromSenderId] = '';
        onNotify(
          `${target.number}번 ${target.name} 학생을 ${sender.number}번 ${sender.name} 짝꿍으로 옮겼습니다.`
        );
      } else {
        updates[senderId] = targetId;
        if (prevTargetOfSender) {
          updates[fromSenderId] = prevTargetOfSender;
          onNotify('두 학생의 짝꿍을 맞바꾸었습니다.');
        } else {
          updates[fromSenderId] = '';
          onNotify(
            `${target.number}번 ${target.name} 학생을 ${sender.number}번 ${sender.name} 짝꿍으로 옮겼습니다.`
          );
        }
      }
    } else {
      updates[senderId] = targetId;

      if (mutualMode) {
        const senderAlreadyTakenByOther = students.some(
          (s) => s.id !== targetId && s.targetId === senderId
        );
        const targetHasNoPartner =
          !target.targetId || !studentById.has(target.targetId);

        if (!senderAlreadyTakenByOther && targetHasNoPartner) {
          updates[targetId] = senderId;
          onNotify(
            `${sender.number}번 ${sender.name} ↔ ${target.number}번 ${target.name} 서로 짝꿍으로 연결했습니다.`
          );
        }
      }
    }

    onBatchUpdateTargets(updates);

    const nextEmptyId = findNextEmptySenderId(senderId, updates);
    if (nextEmptyId) {
      setFocusedSenderId(nextEmptyId);
    } else {
      setFocusedSenderId(senderId);
    }
  };

  const handleUnassignSender = (senderId: string, returnedTargetId?: string) => {
    const sender = studentById.get(senderId);
    const targetId = returnedTargetId || sender?.targetId;
    const target = targetId ? studentById.get(targetId) : undefined;
    onBatchUpdateTargets({ [senderId]: '' });
    setFocusedSenderId(senderId);
    if (target) {
      onNotify(`${target.number}번 ${target.name} 학생을 남은 목록으로 되돌렸습니다.`);
    }
  };

  const handleFillRemainingRandom = () => {
    if (students.length < 2) {
      onNotify('학생이 2명 이상일 때 매칭할 수 있습니다.');
      return;
    }
    const { unassignedSenders, unmatchedPool, duplicateReceiverIds } = metrics;
    if (unassignedSenders.length === 0) {
      onNotify('이미 모든 학생의 빈자리가 채워져 있습니다.');
      return;
    }
    if (duplicateReceiverIds.size > 0) {
      onNotify(
        '중복 지목된 학생이 있습니다. 빨간 [중복] 표시를 ×로 정리한 뒤 다시 눌러 주세요.'
      );
      return;
    }
    if (unassignedSenders.length !== unmatchedPool.length) {
      onNotify(
        '남은 빈자리 수와 남은 학생 수가 다릅니다. 중복 항목을 정리하거나 [전체 랜덤]을 이용해 주세요.'
      );
      return;
    }

    if (
      unassignedSenders.length === 1 &&
      unassignedSenders[0].id === unmatchedPool[0].id
    ) {
      const onlyStu = unassignedSenders[0];
      onNotify(
        `마지막 남은 ${onlyStu.number}번 ${onlyStu.name} 학생은 자기 자신만 남아 채울 수 없어요. 다른 학생 1명의 짝꿍을 ×로 비운 뒤 다시 눌러 주세요.`
      );
      return;
    }

    const poolIds = unmatchedPool.map((s) => s.id);
    for (let i = poolIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolIds[i], poolIds[j]] = [poolIds[j], poolIds[i]];
    }

    for (let i = 0; i < unassignedSenders.length; i++) {
      if (poolIds[i] === unassignedSenders[i].id) {
        const swapIdx = unassignedSenders.findIndex(
          (other, j) =>
            j !== i &&
            poolIds[j] !== unassignedSenders[i].id &&
            poolIds[i] !== other.id
        );
        if (swapIdx >= 0) {
          [poolIds[i], poolIds[swapIdx]] = [poolIds[swapIdx], poolIds[i]];
        }
      }
    }

    const valid = unassignedSenders.every((s, idx) => poolIds[idx] !== s.id);
    if (!valid) {
      onNotify(
        '남은 조합을 자동으로 맞출 수 없어 한 자리만 비운 뒤 다시 시도해 주세요.'
      );
      return;
    }

    const updates: Record<string, string> = {};
    unassignedSenders.forEach((s, idx) => {
      updates[s.id] = poolIds[idx];
    });
    onBatchUpdateTargets(updates);
    onNotify(
      `남은 빈자리 ${unassignedSenders.length}명을 빈자리·중복 없이 자동으로 채웠습니다!`
    );
  };

  const filteredLeftStudents = useMemo(() => {
    const q = leftSearch.trim();
    return students.filter((s) => {
      const hasValidTarget = Boolean(
        s.targetId && studentById.has(s.targetId) && s.targetId !== s.id
      );
      if (leftFilter === 'unassigned' && hasValidTarget) return false;
      if (leftFilter === 'assigned' && !hasValidTarget) return false;
      if (!q) return true;
      const target = hasValidTarget ? studentById.get(s.targetId) : null;
      const hay = `${s.number}번 ${s.name} ${
        target ? `${target.number}번 ${target.name}` : ''
      }`;
      return hay.includes(q);
    });
  }, [students, studentById, leftFilter, leftSearch]);

  const filteredPoolStudents = useMemo(() => {
    const q = rightSearch.trim();
    if (!q) return metrics.unmatchedPool;
    return metrics.unmatchedPool.filter((s) =>
      `${s.number}번 ${s.name}`.includes(q)
    );
  }, [metrics.unmatchedPool, rightSearch]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] max-h-[820px] flex flex-col shadow-2xl border border-[#E5E7EB] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 & 원클릭 액션 바 */}
        <div className="px-5 py-3.5 bg-[#F5F6F8] border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FEE500] text-[#3C1E1E] flex items-center justify-center shrink-0">
              <LayoutGrid className="w-4 h-4" strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-[#191919]">
                  수호천사 매칭 보드
                </h2>
                {metrics.isComplete1to1 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      전원 1:1 완료
                      {metrics.mutualPairsCount > 0
                        ? ` · 서로 짝꿍 ${metrics.mutualPairsCount}쌍`
                        : ''}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs font-extrabold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      완료 {metrics.assignedCount}/{students.length}명 · 남은 빈자리{' '}
                      {metrics.unassignedSenders.length}명
                    </span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#767676] mt-0.5">
                오른쪽 카드를 왼쪽 빈 슬롯으로 <strong>드래그</strong>하거나, 왼쪽 슬롯 선택 후 카드를 <strong>클릭</strong>해 채우세요. (이미 채운 카드는 다른 슬롯으로 끌어 맞교환 가능)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-[11px] font-bold text-[#191919] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mutualMode}
                onChange={(e) => setMutualMode(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#3C1E1E]"
              />
              <span>서로 짝꿍(A↔B) 동시 연결</span>
            </label>

            {metrics.unassignedSenders.length > 0 && (
              <button
                type="button"
                onClick={handleFillRemainingRandom}
                className="px-3 py-1.5 rounded-lg bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] text-xs font-black inline-flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>남은 {metrics.unassignedSenders.length}명만 랜덤 채우기</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onRunRandomMatching();
                onNotify('전원 랜덤 매칭이 완료되었습니다.');
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-100 border border-[#E5E7EB] text-[#191919] text-xs font-bold inline-flex items-center gap-1"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>전체 랜덤</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClearMatching();
                setFocusedSenderId(students[0]?.id || null);
                onNotify('모든 매칭을 비웠습니다.');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-[#E5E7EB] hover:border-red-200 text-[#767676] hover:text-red-700 text-xs font-bold inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>비우기</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#3C1E1E] hover:bg-[#2a1414] text-white text-xs font-extrabold inline-flex items-center gap-1"
            >
              <span>완료</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 본문: 좌우 2단 분할 */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E5E7EB]">
          {/* 왼쪽: 수호천사 슬롯 목록 (7칸) */}
          <div className="lg:col-span-7 flex flex-col min-h-0 bg-white">
            <div className="px-4 py-3 border-b border-[#F0F1F4] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-[#F5F6F8] p-1 rounded-lg border border-[#E5E7EB]">
                {(
                  [
                    { id: 'all', label: `전체 ${students.length}` },
                    {
                      id: 'unassigned',
                      label: `빈자리 ${metrics.unassignedSenders.length}`,
                    },
                    { id: 'assigned', label: `완료 ${metrics.assignedCount}` },
                  ] as { id: LeftFilter; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLeftFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-colors ${
                      leftFilter === tab.id
                        ? 'bg-white text-[#191919] shadow-sm'
                        : 'text-[#767676] hover:text-[#191919]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-44 sm:w-52">
                <Search className="w-3.5 h-3.5 text-[#767676] absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={leftSearch}
                  onChange={(e) => setLeftSearch(e.target.value)}
                  placeholder="학생 검색..."
                  className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] pl-8 pr-2.5 py-1.5 text-xs text-[#191919] focus:outline-none focus:border-[#3C1E1E] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredLeftStudents.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#767676] font-bold">
                  {leftFilter === 'unassigned'
                    ? '빈자리가 모두 채워졌습니다!'
                    : '표시할 학생이 없습니다.'}
                </div>
              ) : (
                filteredLeftStudents.map((stu) => {
                  const target =
                    stu.targetId && studentById.has(stu.targetId)
                      ? studentById.get(stu.targetId) || null
                      : null;
                  const isFocused = focusedSenderId === stu.id;
                  const isMutual = Boolean(target && target.targetId === stu.id);
                  const isDuplicate = Boolean(
                    target && metrics.duplicateReceiverIds.has(target.id)
                  );
                  const isSelfDrag = dragPayload?.targetId === stu.id;
                  const isDropActive =
                    dragOverSenderId === stu.id && !isSelfDrag;

                  return (
                    <div
                      key={stu.id}
                      onClick={() => setFocusedSenderId(stu.id)}
                      onDragOver={(e) => {
                        const payload = dragPayloadRef.current;
                        if (!payload || payload.targetId === stu.id) {
                          return;
                        }
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverSenderId !== stu.id) {
                          setDragOverSenderId(stu.id);
                        }
                      }}
                      onDragLeave={(e) => {
                        if (
                          !e.currentTarget.contains(e.relatedTarget as Node) &&
                          dragOverSenderId === stu.id
                        ) {
                          setDragOverSenderId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const payload = readDragPayload(e);
                        clearDrag();
                        if (!payload) return;
                        assignTarget(
                          stu.id,
                          payload.targetId,
                          payload.fromSenderId
                        );
                      }}
                      className={`px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isDropActive
                          ? 'bg-[#FFF9CC] border-[#3C1E1E] border-dashed ring-2 ring-[#FEE500]'
                          : isFocused
                          ? 'bg-[#FFFDF0] border-[#3C1E1E] shadow-sm'
                          : 'bg-white border-[#E5E7EB] hover:bg-[#F9FAFB]'
                      }`}
                    >
                      {/* 왼쪽: 수호천사(보내는 학생) */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 ${
                            isFocused
                              ? 'bg-[#3C1E1E] text-[#FEE500]'
                              : 'bg-[#F5F6F8] text-[#191919] border border-[#E5E7EB]'
                          }`}
                        >
                          {stu.number}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-extrabold text-[#191919] truncate">
                              {stu.name}
                            </span>
                            {isFocused && (
                              <span className="text-[10px] font-extrabold text-[#3C1E1E] bg-[#FEE500] px-1.5 py-0.5 rounded shrink-0">
                                선택됨
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <ArrowRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />

                      {/* 오른쪽: 챙겨줄 친구 슬롯 */}
                      <div className="w-[52%] sm:w-[54%] flex items-center justify-end">
                        {target ? (
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              startDrag(
                                {
                                  targetId: target.id,
                                  fromSenderId: stu.id,
                                },
                                e
                              );
                            }}
                            onDragEnd={clearDrag}
                            className={`w-full px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing ${
                              isDuplicate
                                ? 'bg-red-50 border-red-300 text-red-800'
                                : isMutual
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-[#F5F6F8] border-[#D1D5DB] text-[#191919]'
                            }`}
                            title="다른 슬롯으로 끌어 맞교환하거나 오른쪽 풀로 빼낼 수 있습니다"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <GripVertical className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                              <span className="text-xs font-extrabold truncate">
                                {target.number}번 {target.name}
                              </span>
                              {isMutual && !isDuplicate && (
                                <span className="px-1.5 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200 text-[10px] font-black shrink-0">
                                  서로
                                </span>
                              )}
                              {isDuplicate && (
                                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-black shrink-0">
                                  중복
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnassignSender(stu.id);
                              }}
                              className="p-0.5 rounded hover:bg-black/10 text-[#767676] hover:text-red-700 shrink-0"
                              title="배정 해제 (오른쪽 목록으로 되돌리기)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`w-full px-3 py-1.5 rounded-lg border border-dashed text-center text-[11px] font-bold transition-colors ${
                              isDropActive
                                ? 'border-[#3C1E1E] bg-[#FEE500]/50 text-[#3C1E1E]'
                                : isFocused
                                ? 'border-[#3C1E1E] bg-[#FEE500]/25 text-[#3C1E1E]'
                                : 'border-[#D1D5DB] bg-[#F9FAFB] text-[#9CA3AF]'
                            }`}
                          >
                            {isDropActive
                              ? '여기에 놓기'
                              : isFocused
                              ? '오른쪽에서 짝꿍 클릭 또는 드래그'
                              : '빈 슬롯 (여기에 놓기)'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 오른쪽: 아직 수호천사가 없는 친구 카드 풀 (5칸) */}
          <div
            onDragEnter={(e) => {
              if (dragPayloadRef.current?.fromSenderId) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverPool(true);
              }
            }}
            onDragOver={(e) => {
              if (dragPayloadRef.current?.fromSenderId) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (!dragOverPool) setDragOverPool(true);
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverPool(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const payload = readDragPayload(e);
              clearDrag();
              if (payload?.fromSenderId) {
                handleUnassignSender(payload.fromSenderId, payload.targetId);
              }
            }}
            className={`lg:col-span-5 flex flex-col min-h-0 transition-colors ${
              dragOverPool
                ? 'bg-red-50 ring-2 ring-inset ring-red-300'
                : dragPayload?.fromSenderId
                ? 'bg-red-50/35'
                : 'bg-[#FAFAFB]'
            }`}
          >
            <div className="px-4 py-3 border-b border-[#E5E7EB] space-y-2 shrink-0 bg-white/80">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#191919]">
                    아직 수호천사가 없는 친구 ({metrics.unmatchedPool.length}명)
                  </h3>
                  <p className="text-[11px] text-[#767676] mt-0.5">
                    {focusedSender ? (
                      <>
                        현재 선택:{' '}
                        <strong className="text-[#3C1E1E] bg-[#FEE500]/70 px-1 rounded">
                          {focusedSender.number}번 {focusedSender.name}
                        </strong>{' '}
                        ➔ 카드 클릭 시 즉시 배정
                      </>
                    ) : (
                      '카드를 왼쪽 슬롯으로 끌어다 놓으세요'
                    )}
                  </p>
                </div>
              </div>

              {metrics.unmatchedPool.length > 8 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#767676] absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={rightSearch}
                    onChange={(e) => setRightSearch(e.target.value)}
                    placeholder="남은 친구 검색..."
                    className="w-full rounded-lg bg-[#F5F6F8] border border-[#E5E7EB] pl-8 pr-2.5 py-1.5 text-xs text-[#191919] focus:outline-none focus:border-[#3C1E1E] focus:bg-white"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {dragPayload?.fromSenderId ? (
                <div
                  className={`mb-3 rounded-xl border-2 border-dashed p-3.5 text-center text-xs font-extrabold transition-colors ${
                    dragOverPool
                      ? 'border-red-500 bg-red-100/80 text-red-800'
                      : 'border-red-300 bg-red-50/90 text-red-700'
                  }`}
                >
                  여기에 놓으면 배정이 해제되어 남은 친구 목록으로 돌아갑니다
                </div>
              ) : null}

              {metrics.unmatchedPool.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  <p className="text-sm font-black text-emerald-900">
                    남은 친구 0명!
                  </p>
                  <p className="text-xs text-emerald-800 leading-relaxed whitespace-pre-line">
                    {metrics.isComplete1to1
                      ? '모든 학생에게 수호천사가 1명씩 빠짐없이 배정되었습니다.\n우측 상단 [완료]를 눌러 닫으시면 됩니다.'
                      : '모든 학생이 지목되었습니다. 왼쪽에서 빨간 [중복] 표시만 정리하면 1:1 완료됩니다.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                  {filteredPoolStudents.map((stu) => {
                    const isSelfOfFocused = focusedSenderId === stu.id;
                    return (
                      <div
                        key={stu.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          startDrag({ targetId: stu.id }, e);
                        }}
                        onDragEnd={clearDrag}
                        onClick={() => {
                          if (isSelfOfFocused) return;
                          if (!focusedSenderId) {
                            onNotify('먼저 왼쪽에서 수호천사 슬롯을 선택해 주세요.');
                            return;
                          }
                          assignTarget(focusedSenderId, stu.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (isSelfOfFocused || !focusedSenderId) return;
                            assignTarget(focusedSenderId, stu.id);
                          }
                        }}
                        className={`px-3 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all select-none cursor-grab active:cursor-grabbing ${
                          isSelfOfFocused
                            ? 'bg-gray-100 border-gray-200 text-gray-500'
                            : 'bg-white hover:bg-[#FFF9CC] border-[#E5E7EB] hover:border-[#3C1E1E] text-[#191919] shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-md text-[11px] font-black flex items-center justify-center shrink-0 ${
                              isSelfOfFocused
                                ? 'bg-gray-200 text-gray-500'
                                : 'bg-[#FEE500] text-[#3C1E1E]'
                            }`}
                          >
                            {stu.number}
                          </span>
                          <span className="text-xs font-extrabold truncate">
                            {stu.name}
                          </span>
                        </div>
                        {isSelfOfFocused ? (
                          <span className="text-[10px] font-bold shrink-0">
                            본인 (드래그 가능)
                          </span>
                        ) : (
                          <GripVertical className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
