import { retrieveCandidates } from './retriever';
import type { DirectorInput, TranscriptInput, VisualContext } from './types';

interface Candidate {
  id: string;
  tags: string[];
}

interface SfxCandidate extends Candidate {
  isFavorite: boolean;
  usageScore: number;
}

function semanticTags(transcript: TranscriptInput[]): string[] {
  const text = transcript.map((segment) => segment.text).join(' ');
  const tags: string[] = [];
  if (/[0-9０-９%％]/.test(text) || /数字|比例|指标|统计/.test(text)) tags.push('number', 'data');
  if (/比较|对比|区别|不同/.test(text)) tags.push('comparison');
  if (/引用|观点|金句|认为/.test(text)) tags.push('quote');
  if (/强调|重点|注意|关键/.test(text)) tags.push('emphasis');
  return tags.length ? tags : ['neutral'];
}

export function buildDirectorInput(input: {
  project: DirectorInput['project'];
  transcript: TranscriptInput[];
  visualContext: VisualContext;
  effects: Candidate[];
  motions: Candidate[];
  sfx: SfxCandidate[];
  preferences: Record<string, unknown>;
}): DirectorInput {
  const tags = semanticTags(input.transcript);
  const rankedSfx = input.sfx
    .map((candidate, index) => ({
      candidate,
      index,
      score: candidate.tags.filter((tag) => tags.includes(tag)).length * 10 + (candidate.isFavorite ? 1 : 0) + candidate.usageScore * 0.001,
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 8)
    .map(({ candidate }) => candidate);

  return {
    project: input.project,
    transcript: input.transcript,
    visualContext: input.visualContext,
    effectCandidates: retrieveCandidates(input.effects, tags, 8),
    motionCandidates: retrieveCandidates(input.motions, tags, 6),
    sfxCandidates: rankedSfx,
    preferences: input.preferences,
  };
}

