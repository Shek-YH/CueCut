import type { SceneVisualKind } from './scene';

export interface VisualSurfaceRule {
  background: string;
  backgroundAlpha: number;
  accent: string;
  accentAlpha: number;
  contentAlpha: number;
  accentBar: boolean;
}

export function visualSurfaceForKind(kind: SceneVisualKind, accent: string): VisualSurfaceRule {
  switch (kind) {
    case 'chart':
      return { background: '#111827', backgroundAlpha: 0.92, accent, accentAlpha: 0.92, contentAlpha: 0.92, accentBar: false };
    case 'metric':
      return { background: accent, backgroundAlpha: 1, accent, accentAlpha: 1, contentAlpha: 1, accentBar: false };
    case 'list':
      return { background: '#171B26', backgroundAlpha: 1, accent, accentAlpha: 1, contentAlpha: 1, accentBar: true };
    case 'quote':
      return { background: '#282341', backgroundAlpha: 1, accent, accentAlpha: 1, contentAlpha: 1, accentBar: true };
    case 'highlight':
      return { background: '#101B24', backgroundAlpha: 0.8, accent, accentAlpha: 1, contentAlpha: 1, accentBar: false };
    case 'badge':
      return { background: '#3B2434', backgroundAlpha: 0.9333333333333333, accent, accentAlpha: 1, contentAlpha: 1, accentBar: false };
    case 'text':
      return { background: accent, backgroundAlpha: 0.85, accent, accentAlpha: 1, contentAlpha: 1, accentBar: false };
  }
}
