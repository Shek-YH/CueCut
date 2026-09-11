import type { SceneContent, SceneItem } from './scene';

export interface FitTextOptions {
  text: string;
  maxWidth: number;
  maxHeight: number;
  fontSize: number;
  maxLines: number;
}

export interface FitTextResult {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  overflow: boolean;
}

export const TEXT_OVERFLOW_DIAGNOSTIC = '⚠';

export interface TextRegion {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  maxLines: number;
  align: 'left' | 'center';
  weight: number;
}

export interface SceneItemBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_FONT_SIZE = 8;

function characterWidth(character: string, fontSize: number): number {
  if (/\s/u.test(character)) return fontSize * 0.34;
  if (/\p{Mark}/u.test(character)) return 0;
  if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}/u.test(character)) return fontSize;
  if (/\p{Extended_Pictographic}/u.test(character)) return fontSize;
  if (/[A-Z]/u.test(character)) return fontSize * 0.68;
  if (/[a-z]/u.test(character)) return fontSize * 0.56;
  if (/[0-9]/u.test(character)) return fontSize * 0.58;
  if (/[.,:;!?()[\]{}'"`]/u.test(character)) return fontSize * 0.42;
  return fontSize * 0.62;
}

function measureLine(line: string, fontSize: number): number {
  return [...line].reduce((width, character) => width + characterWidth(character, fontSize), 0);
}

function wrapParagraph(paragraph: string, fontSize: number, maxWidth: number): string[] {
  if (paragraph.length === 0) return [''];
  const lines: string[] = [];
  let line = '';
  const pushLine = () => {
    if (line.length > 0) lines.push(line.trimEnd());
    line = '';
  };

  for (const token of paragraph.match(/\s+|[^\s]+/gu) ?? [paragraph]) {
    if (/^\s+$/u.test(token)) {
      if (line.length > 0 && measureLine(line + ' ', fontSize) <= maxWidth) line += ' ';
      else if (line.length > 0) pushLine();
      continue;
    }

    if (measureLine(line + token, fontSize) <= maxWidth) {
      line += token;
      continue;
    }

    if (line.length > 0) pushLine();
    for (const character of [...token]) {
      if (line.length > 0 && measureLine(line + character, fontSize) > maxWidth) pushLine();
      line += character;
    }
  }
  if (line.length > 0 || lines.length === 0) pushLine();
  return lines;
}

function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
  return text.replace(/\r\n?/gu, '\n').split('\n').flatMap((paragraph) => wrapParagraph(paragraph, fontSize, maxWidth));
}

export function fitText({ text, maxWidth, maxHeight, fontSize, maxLines }: FitTextOptions): FitTextResult {
  const safeText = String(text);
  const safeWidth = Math.max(1, Number.isFinite(maxWidth) ? maxWidth : 1);
  const safeHeight = Math.max(1, Number.isFinite(maxHeight) ? maxHeight : 1);
  const safeFontSize = Math.max(MIN_FONT_SIZE, Number.isFinite(fontSize) ? fontSize : MIN_FONT_SIZE);
  const minimumFontSize = Math.max(1, Math.min(MIN_FONT_SIZE, safeWidth));
  const safeMaxLines = Math.max(1, Math.floor(Number.isFinite(maxLines) ? maxLines : 1));

  for (let candidate = safeFontSize; candidate >= minimumFontSize; candidate -= 1) {
    const lineHeight = candidate * 1.2;
    const lines = wrapText(safeText, candidate, safeWidth);
    if (lines.length <= safeMaxLines && lines.length * lineHeight <= safeHeight + 0.01) {
      return { lines, fontSize: candidate, lineHeight, overflow: false };
    }
  }

  const lineHeight = minimumFontSize * 1.2;
  const lines = wrapText(safeText, minimumFontSize, safeWidth);
  return { lines, fontSize: minimumFontSize, lineHeight, overflow: true };
}

function contentText(content: SceneContent): string {
  if (content.kind === 'text') return content.text;
  if (content.kind === 'number') return String(content.value);
  if (content.kind === 'list') return content.items.map((item) => `✓ ${item}`).join('\n');
  return content.label;
}

function baseRegion(item: SceneItem, width: number, height: number): TextRegion {
  const kind = item.visualKind;
  return {
    text: contentText(item.content),
    x: 12,
    y: 0,
    width: Math.max(1, width - 24),
    height: Math.max(1, height),
    fontSize: kind === 'quote' ? 28 : kind === 'highlight' || kind === 'badge' ? 24 : kind === 'chart' ? 22 : 32,
    maxLines: kind === 'list' ? Math.max(4, contentText(item.content).split('\n').length * 4) : 4,
    align: kind === 'list' || kind === 'quote' ? 'left' : 'center',
    weight: kind === 'quote' ? 700 : 600,
  };
}

export function textRegionsForSceneItem(item: SceneItem, width: number, height: number): TextRegion[] {
  if (item.visualKind === 'metric') {
    const value = item.content.kind === 'number' ? String(item.content.value) : '';
    const label = item.content.kind === 'number' ? item.content.label : contentText(item.content);
    return [
      { text: value, x: 0, y: height * 0.12, width: width * 0.36, height: height * 0.68, fontSize: 42, maxLines: 2, align: 'center', weight: 700 },
      { text: label, x: width * 0.38, y: height * 0.25, width: width * 0.58, height: height * 0.52, fontSize: 18, maxLines: 3, align: 'center', weight: 600 },
    ];
  }
  const region = baseRegion(item, width, height);
  if (item.visualKind === 'list') {
    region.x = 18;
    region.y = 12;
    region.width = Math.max(1, width - 30);
    region.height = Math.max(1, height - 20);
  } else if (item.visualKind === 'quote') {
    region.x = 20;
    region.width = Math.max(1, width - 32);
  }
  return [region];
}

export function sceneItemBox(item: SceneItem, canvasWidth: number, canvasHeight: number): SceneItemBox {
  const width = Math.min(canvasWidth, Math.max(1, item.layout.nw * canvasWidth));
  const baseHeight = Math.min(canvasHeight, Math.max(1, item.layout.nh * canvasHeight));
  let height = baseHeight;
  if (item.visualKind === 'list') {
    const listText = contentText(item.content);
    const probe = fitText({
      text: listText,
      maxWidth: Math.max(1, width - 30),
      maxHeight: Number.MAX_SAFE_INTEGER,
      fontSize: 24,
      maxLines: Math.max(4, listText.split('\n').length * 4),
    });
    const desiredHeight = 20 + probe.lines.length * probe.lineHeight;
    height = Math.max(baseHeight, Math.min(canvasHeight * 0.5, desiredHeight));
  }

  return {
    x: Math.min(Math.max(0, item.layout.nx * canvasWidth), Math.max(0, canvasWidth - width)),
    y: Math.min(Math.max(0, item.layout.ny * canvasHeight), Math.max(0, canvasHeight - height)),
    width,
    height,
  };
}
