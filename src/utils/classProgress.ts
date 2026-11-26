import type { ClassConfig, GameStage } from '../types';

export type ClassProgress = Pick<ClassConfig, 'stage' | 'revealOpened'>;

export const isIdentityRevealed = (progress: ClassProgress) =>
  progress.stage === 3 && progress.revealOpened !== false;

export const getScoreStage = (progress: ClassProgress): GameStage =>
  isIdentityRevealed(progress) ? 3 : progress.stage === 1 ? 1 : 2;
