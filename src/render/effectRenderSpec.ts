import type { SceneItem } from './scene';

export type EffectPrimitiveKind = 'panel' | 'ring' | 'number' | 'text' | 'accent-bar' | 'list' | 'quote-mark' | 'bars' | 'outline' | 'underline' | 'image';

export interface EffectRenderPrimitive {
  kind: EffectPrimitiveKind;
  role: string;
}

export interface EffectRenderSpec {
  rendererId: string;
  visualKind: SceneItem['visualKind'];
  primitives: EffectRenderPrimitive[];
}

const primitive = (kind: EffectPrimitiveKind, role: string): EffectRenderPrimitive => ({ kind, role });

export function createEffectRenderSpec(item: Pick<SceneItem, 'visualKind' | 'variantId' | 'asset'>): EffectRenderSpec {
  const asset = item.asset ? [primitive('image', 'asset')] : [];
  switch (item.visualKind) {
    case 'metric':
      return { rendererId: 'metric', visualKind: item.visualKind, primitives: [...asset, primitive('panel', 'surface'), primitive('ring', 'indicator'), primitive('number', 'value'), primitive('text', 'label')] };
    case 'list':
      return { rendererId: 'list', visualKind: item.visualKind, primitives: [...asset, primitive('panel', 'surface'), primitive('accent-bar', 'accent'), primitive('list', 'items'), primitive('text', 'label')] };
    case 'quote':
      return { rendererId: 'quote', visualKind: item.visualKind, primitives: [...asset, primitive('panel', 'surface'), primitive('quote-mark', 'quote'), primitive('text', 'content')] };
    case 'chart':
      return { rendererId: 'chart', visualKind: item.visualKind, primitives: [...asset, primitive('panel', 'surface'), primitive('bars', 'data'), primitive('text', 'label')] };
    case 'highlight':
      return { rendererId: 'highlight', visualKind: item.visualKind, primitives: [...asset, primitive('panel', 'surface'), primitive('outline', 'border'), primitive('underline', 'emphasis'), primitive('text', 'content')] };
    case 'badge':
      return { rendererId: 'badge', visualKind: item.visualKind, primitives: [...asset, primitive('panel', 'surface'), primitive('accent-bar', 'badge'), primitive('text', 'label')] };
    default:
      return { rendererId: 'text', visualKind: item.visualKind, primitives: [...asset, primitive('panel', 'surface'), primitive('text', 'content')] };
  }
}

export function renderSpecSignature(spec: EffectRenderSpec): string {
  return `${spec.rendererId}:${spec.primitives.map((item) => item.kind).join(',')}`;
}
