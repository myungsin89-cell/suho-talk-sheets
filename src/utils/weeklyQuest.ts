import type { WeeklyQuestChange, WeeklyQuestSettings } from '../types';

export const isWeeklyQuestVisible = (settings: WeeklyQuestSettings) =>
  Boolean(settings.weeklyQuest.trim() && !settings.weeklyQuestHidden);

export const isSameWeeklyQuest = (a: WeeklyQuestSettings, b: WeeklyQuestSettings) =>
  a.weeklyQuest === b.weeklyQuest &&
  a.weeklyQuestId === b.weeklyQuestId &&
  Boolean(a.weeklyQuestHidden) === Boolean(b.weeklyQuestHidden);

export const applyWeeklyQuestChange = (
  current: WeeklyQuestSettings,
  change: WeeklyQuestChange,
  createId: () => string
): WeeklyQuestSettings | null => {
  if (change.type === 'visibility') {
    if (!current.weeklyQuest.trim()) return null;
    return {
      weeklyQuest: current.weeklyQuest,
      weeklyQuestId: current.weeklyQuestId,
      weeklyQuestHidden: change.hidden,
    };
  }

  const content = change.content.trim();
  if (!content) return null;
  if (change.type === 'start') {
    return { weeklyQuest: content, weeklyQuestId: createId(), weeklyQuestHidden: false };
  }

  if (!current.weeklyQuest.trim()) return null;
  return {
    weeklyQuest: content,
    weeklyQuestId: current.weeklyQuestId,
    weeklyQuestHidden: current.weeklyQuestHidden,
  };
};
