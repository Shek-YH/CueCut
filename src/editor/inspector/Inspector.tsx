import type { ProjectStore } from '../../project/store';
import type { EffectInstance, ProjectComposition } from '../../project/schema';

interface InspectorProps {
  project: ProjectComposition;
  selectedEffectId: string;
  store: ProjectStore;
  onOpenLab: () => void;
}

export function Inspector({ project, selectedEffectId, store, onOpenLab }: InspectorProps) {
  const effect = project.effects.find((item) => item.effectId === selectedEffectId) ?? project.effects[0];

  if (!effect) return <aside className="panel right" data-testid="inspector" />;

  const commitTime = (key: 'startSec' | 'endSec', value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    store.updateEffect(effect.effectId, (draft) => ({
      ...draft,
      time: { ...draft.time, [key]: parsed },
    }));
  };

  return (
    <aside className="panel right" data-testid="inspector">
      <div className="phead">
        <strong>{effect.familyId === 'numeric' ? '指标环 A' : effect.familyId}</strong>
        <span className="tiny">AI CHOICE</span>
      </div>
      <div className="scroll">
        <div className="special">
          <div className="ititle">
            <span>指标环专属设置</span>
            <span className="tiny">SPECIAL</span>
          </div>
          <div className="field">
            <label htmlFor="value-range">
              <span>数值</span>
              <b>{String(effect.content.value ?? '92.4')}</b>
            </label>
            <input id="value-range" type="range" min="0" max="116" defaultValue="92" />
          </div>
          <div className="field">
            <label htmlFor="unit-field">单位</label>
            <input id="unit-field" defaultValue="%" />
          </div>
        </div>
        <div className="igroup">
          <div className="ititle">
            <span>AI 生成结果</span>
            <span className="tiny">ONE CALL</span>
          </div>
          <div className="summary">
            Variant: {effect.variantId}
            <br />
            Enter: {effect.motion.enter.motionId} · {effect.motion.enter.durationSec.toFixed(2)}s
            <br />
            Exit: {effect.motion.exit.motionId} · {effect.motion.exit.durationSec.toFixed(2)}s
            <br />
            Color: {effect.appearance.accent}
            <br />
            SFX: {effect.sfx?.sfxId ?? 'None'}
          </div>
        </div>
        <div className="igroup">
          <div className="ititle">
            <span>通用时间</span>
            <span className="tiny">COMMON</span>
          </div>
          <div className="two">
            <div className="field">
              <label htmlFor="start-field">开始</label>
              <input id="start-field" defaultValue={effect.time.startSec.toFixed(2)} onBlur={(event) => commitTime('startSec', event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="end-field">结束</label>
              <input id="end-field" defaultValue={effect.time.endSec.toFixed(2)} onBlur={(event) => commitTime('endSec', event.target.value)} />
            </div>
          </div>
        </div>
        <div className="igroup">
          <button className="btn primary wide" onClick={onOpenLab} type="button">
            在 Effect Lab 中试模板 / 进出场 / 颜色
          </button>
        </div>
      </div>
    </aside>
  );
}

