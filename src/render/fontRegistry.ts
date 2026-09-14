/// <reference types="node" />
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GlobalFonts } from '@napi-rs/canvas';

export interface RegisteredFonts {
  /** Font family name registered for the regular (400/normal) weight. */
  regular: string;
  /** Font family name registered for the bold (700) weight. */
  bold: string;
}

let cached: RegisteredFonts | null = null;

/**
 * Resolve the project `assets/fonts` directory in a layout-agnostic way so the
 * same code works both when run directly from TypeScript sources and when run
 * from a bundled `dist` build. We try a handful of relative positions derived
 * from this module's own location plus the current working directory.
 */
function resolveAssetsFontsDir(): string {
  const here = typeof import.meta !== 'undefined' && import.meta.url
    ? dirname(fileURLToPath(import.meta.url))
    : process.cwd();
  const candidates = [
    resolve(here, '..', '..', 'assets', 'fonts'), // src/render -> <root>/assets/fonts
    resolve(here, '..', '..', '..', '..', 'assets', 'fonts'), // dist/src/render -> <root>/assets/fonts
    resolve(process.cwd(), 'assets', 'fonts'),
    resolve(process.cwd(), 'dist', 'assets', 'fonts'),
    resolve(process.cwd(), 'dist-server', 'assets', 'fonts'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  // Fall back to the source-layout path so the error message points somewhere sensible.
  return resolve(process.cwd(), 'assets', 'fonts');
}

/** Look up a font file via env override first, then the resolved assets dir. */
function findFontFile(envVar: string, baseNames: string[]): string | null {
  const envPath = process.env[envVar];
  if (envPath && existsSync(envPath)) return envPath;
  if (envPath) {
    // 已显式设置但文件不存在：继续回落，但绝不静默——否则部署时的路径写错会被藏起来。
    process.stderr.write(`[fontRegistry] 警告：${envVar} 指向的文件不存在（${envPath}），已忽略并回落到仓库/系统字体。\n`);
  }
  const dir = resolveAssetsFontsDir();
  for (const base of baseNames) {
    const candidate = join(dir, base);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Build the error thrown when no usable font can be resolved. Extracted as a pure
 * function so the "no font available" path is unit-testable without mocking `node:fs`
 * (mocking an ESM built-in does not reliably intercept `import { existsSync }`).
 */
export function buildMissingFontError(probedPaths: string[]): Error {
  return new Error(
    '[fontRegistry] 未找到任何可用字体，导出文字栅格化无法继续。' +
    '请确认 assets/fonts 下存在 NotoSansSC-Regular.otf / NotoSansSC-Bold.otf，' +
    '或通过 CUECUT_FONT_PATH / CUECUT_FONT_BOLD_PATH 指定字体文件。已探测路径：\n - ' +
    probedPaths.join('\n - '),
  );
}

/**
 * Idempotently register the bundled Noto Sans SC fonts (regular + bold) with
 * `@napi-rs/canvas`'s global font registry and return the family names to use
 * when rasterizing text in the Node export path.
 *
 * Resolution order:
 *   1. `CUECUT_FONT_PATH` / `CUECUT_FONT_BOLD_PATH` env overrides (deployment).
 *   2. The repo's `assets/fonts/` directory (works from source and from dist).
 *   3. System fallback on Windows (`msyh.ttc` / `simhei.ttf`).
 *
 * If no usable font can be found we throw with an explicit list of every path
 * that was probed, never silently degrading to fake bitmap glyphs.
 */
export function ensureFontsRegistered(): RegisteredFonts {
  if (cached) return cached;

  const regularCandidates = ['NotoSansSC-Regular.otf', 'NotoSansSC-Regular.ttf'];
  const boldCandidates = ['NotoSansSC-Bold.otf', 'NotoSansSC-Bold.ttf'];

  const regularPath = findFontFile('CUECUT_FONT_PATH', regularCandidates);
  const boldPath = findFontFile('CUECUT_FONT_BOLD_PATH', boldCandidates);

  // System fallbacks (Windows). `.ttc` is a collection; registerFromPath can
  // usually still resolve its first face, so we only fall back when the repo
  // fonts are missing.
  const systemRegular = existsSync('C:/Windows/Fonts/msyh.ttc') ? 'C:/Windows/Fonts/msyh.ttc' : null;
  const systemBold = existsSync('C:/Windows/Fonts/simhei.ttf') ? 'C:/Windows/Fonts/simhei.ttf' : null;

  const regularFinal = regularPath ?? systemRegular;
  const boldFinal = boldPath ?? systemBold;

  if (!regularFinal || !boldFinal) {
    const fontsDir = resolveAssetsFontsDir();
    const probed = [
      process.env.CUECUT_FONT_PATH ? `CUECUT_FONT_PATH=${process.env.CUECUT_FONT_PATH}` : null,
      process.env.CUECUT_FONT_BOLD_PATH ? `CUECUT_FONT_BOLD_PATH=${process.env.CUECUT_FONT_BOLD_PATH}` : null,
      join(fontsDir, 'NotoSansSC-Regular.otf'),
      join(fontsDir, 'NotoSansSC-Bold.otf'),
      'C:/Windows/Fonts/msyh.ttc',
      'C:/Windows/Fonts/simhei.ttf',
    ].filter((value): value is string => Boolean(value));
    throw buildMissingFontError(probed);
  }

  const regularFamily = 'NotoSansSC';
  const boldFamily = 'NotoSansSC-Bold';
  GlobalFonts.registerFromPath(regularFinal, regularFamily);
  GlobalFonts.registerFromPath(boldFinal, boldFamily);

  cached = { regular: regularFamily, bold: boldFamily };
  return cached;
}
