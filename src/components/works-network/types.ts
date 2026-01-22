import type { WorkWithAuthor, TextualRelationshipWithWorks } from '@/hooks/useWorks';

export type LayoutMode = 'timeline' | 'radial';

export interface WorkPosition {
  x: number;
  y: number;
  depth: number;
  angle?: number;
  radius?: number;
}

export interface WorksLayoutProps {
  works: WorkWithAuthor[];
  relationships: TextualRelationshipWithWorks[];
  selectedWork: WorkWithAuthor | null;
  onSelectWork: (work: WorkWithAuthor | null) => void;
  workDepthLevels: Record<string, number>;
  selectedWorkConnections: Set<string>;
  highlightSelected: boolean;
  viewWidth: number;
  viewHeight: number;
  centerWork?: WorkWithAuthor | null;
}

export const DEPTH_COLORS: Record<number, string> = {
  0: '#8b5cf6', // violet - original texts
  1: '#10b981', // emerald - direct commentaries  
  2: '#ec4899', // pink - supercommentaries
  3: '#f59e0b', // amber - super-supercommentaries
};

export const CATEGORY_COLORS: Record<string, string> = {
  commentary: '#10b981',
  supercommentary: '#3b82f6',
  citation: '#8b5cf6',
  glossary: '#f59e0b',
  abridgment: '#ec4899',
  translation: '#06b6d4',
  default: '#6b7280',
};
