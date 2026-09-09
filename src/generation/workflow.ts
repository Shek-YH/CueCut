import { buildDirectorInput } from '../director/contextBuilder';
import type { DirectorInput, TranscriptInput, VisualContext } from '../director/types';
import type { DirectorResult } from '../director/service';
import type { BailianAsrResult } from '../media/bailianAsr';
import type { CandidateIndexes } from '../director/validator';

export interface AudioExtractionResult {
  audioDataUri: string;
  format: 'mp3' | 'wav' | 'opus' | 'aac';
  sampleRate?: number;
}

export interface GenerationInput {
  project: DirectorInput['project'];
  visualContext: VisualContext;
  effects: Array<{ id: string; tags: string[] }>;
  motions: Array<{ id: string; tags: string[] }>;
  sfx: Array<{ id: string; tags: string[]; isFavorite: boolean; usageScore: number }>;
  preferences: Record<string, unknown>;
}

export interface GenerationWorkflowDependencies {
  extractAudio: (input: GenerationInput) => Promise<AudioExtractionResult>;
  transcribe: (audio: AudioExtractionResult) => Promise<BailianAsrResult>;
  generateDirector: (input: DirectorInput & { candidateIndexes: CandidateIndexes }) => Promise<DirectorResult>;
}

export interface GenerationWorkflowResult {
  transcript: TranscriptInput[];
  asr: BailianAsrResult;
  director: DirectorResult;
}

export function createGenerationWorkflow(deps: GenerationWorkflowDependencies) {
  return {
    async generate(input: GenerationInput): Promise<GenerationWorkflowResult> {
      const audio = await deps.extractAudio(input);
      const asr = await deps.transcribe(audio);
      const directorInput = buildDirectorInput({
        project: input.project,
        transcript: asr.segments,
        visualContext: input.visualContext,
        effects: input.effects,
        motions: input.motions,
        sfx: input.sfx,
        preferences: input.preferences,
      });
      const candidateIndexes: CandidateIndexes = {
        effects: directorInput.effectCandidates.map((candidate) => {
          const [familyId, variantId] = candidate.id.split(':');
          return { familyId: familyId ?? candidate.id, variantId: variantId ?? candidate.id };
        }),
        motions: directorInput.motionCandidates.map((candidate) => candidate.id),
        sfx: directorInput.sfxCandidates.map((candidate) => candidate.id),
      };
      const director = await deps.generateDirector({ ...directorInput, candidateIndexes });
      return { transcript: asr.segments, asr, director };
    },
  };
}
