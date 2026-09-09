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
        'VisualUnit 是时间和语义的正式单位：每个 effect 必须引用对应的 segmentId，并只从该 VisualUnit 的 CandidateBundle 选择 Effect。',
        'CandidateBundle 中的 capability、contentSlots、duration、aspect ratio、useCases、avoidCases 与 dataContract 是硬约束，不得把未提供的候选当作可用候选。',
        'numeric、percentage、ring、progress、chart 和 data 内容必须可解析为 number，且 content.provenance.source 只能为 srt、user 或 project-data；不得发明字幕、用户或项目数据中不存在的数字。',
        '当候选能力支持 Steps、Checklist、List、Ranking 或 Process 时，保留完整 item 顺序；每个 item 必须包含 text 和 item cue（startSec），不得遗漏后续步骤。',
        'SelectionTrace 必须按 VisualUnit 记录 retrievedCandidates、selected、dataContractPassed 和 durationContractPassed；不要伪造通过状态。',
        '同一 Effect family 不得连续使用超过 3 次；优先在对应 CandidateBundle 中选择语义相符且未造成过度重复的候选。',
        '有效输出骨架：',
        JSON.stringify(shape),
        '本次 DirectorInput：',
        JSON.stringify(input),
      ].join('\n\n'),
    },
  ];
}
