export interface NativeEligibilityInput {
  kind: string;
  description: string;
  semanticTags: string[];
}

const nativeTerms = /\b(text|number|percentage|counter|step number|arrow|line|box|icon|simple bar chart|simple progress|underline|highlight|basic card)\b/iu;

export function isNativeRenderable(input: NativeEligibilityInput): boolean {
  return nativeTerms.test([input.kind, input.description, ...input.semanticTags].join(' '));
}
