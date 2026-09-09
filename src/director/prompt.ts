import type { BailianMessage } from './bailianProvider';
import type { DirectorInput } from './types';
import type { CandidateIndexes } from './validator';
import { createFixtureProject } from '../project/fixtures';

export function buildDirectorMessages(
  skill: string,
  input: DirectorInput & { candidateIndexes: CandidateIndexes },
): BailianMessage[] {
  const shape = createFixtureProject();
  shape.project = {
    ...shape.project,
    ...input.project,
    video: { sourceFileName: null, zIndex: 0, locked: true },
  };
  shape.segments = [];
  shape.effects = [shape.effects[0]!];
  shape.soundEvents = [];
  shape.directorMeta = {
    densityTargetPerMin: 9,
    maxConcurrentFx: 3,
    notes: [],
  };

  return [
    { role: 'system', content: skill },
    {
      role: 'user',
      content: [
        '根据下方已完成的 SRT、视频上下文、候选能力和自进化偏好，严格执行 CueCut Director Skill。',
        '只返回一个 cuecut.composition/1 JSON 对象，不要 Markdown，不要解释。',
        '必须保留输出骨架中的所有字段，尤其是 project.fps、project.canvasWidth、project.canvasHeight、project.aspectRatio、project.platformHint、project.contentStyleHint，以及每个 effect.layout 的 nx、ny、nw、nh、scale、anchor、preferredSide、relationToSubject。',
        '所有 Effect/Motion/SFX ID 只能来自 candidateIndexes；所有时间必须位于 project.durationSec 内。',
        '有效输出骨架：',
        JSON.stringify(shape),
        '本次 DirectorInput：',
        JSON.stringify(input),
      ].join('\n\n'),
    },
  ];
}
