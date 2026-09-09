import type { ProjectComposition } from '../../project/schema';

interface LayersPanelProps {
  project: ProjectComposition;
  selectedEffectId: string;
  onSelect: (effectId: string) => void;
}

const layerNames: Record<string, string> = {
  'fx-ring': '指标环 A',
  'fx-quote': '金句卡 B',
  'fx-compare': '对比卡 A',
};

export function LayersPanel({ project, selectedEffectId, onSelect }: LayersPanelProps) {
  return (
    <section className="block layer-block" data-testid="layers-panel">
          <div className="blockhead">
            <span>图层</span>
            <span className="tiny">MULTI FX</span>
          </div>
          <div className="blockscroll">
            {project.effects.map((effect, index) => (
              <button
                className={'layer' + (effect.effectId === selectedEffectId ? ' sel' : '')}
                data-testid={'layer-' + effect.effectId}
                key={effect.effectId}
                onClick={() => onSelect(effect.effectId)}
                type="button"
              >
                <span className="badge">F{project.effects.length - index}</span>
                <span>
                  <span className="lname">{layerNames[effect.effectId] ?? effect.familyId}</span>
                  <span className="meta">
                    {effect.time.startSec.toFixed(2)}–{effect.time.endSec.toFixed(2)}s
                  </span>
                </span>
                <span>◉</span>
              </button>
            ))}
            <div className="layer video" data-testid="video-layer">
              <span className="badge">V0</span>
              <span>
                  <span className="lname">{project.project.video.sourceFileName ?? '原始视频'}</span>
                <span className="meta">0–{project.project.durationSec}s · 永久 z0</span>
              </span>
              <span>🔒</span>
            </div>
          </div>
    </section>
  );
}
