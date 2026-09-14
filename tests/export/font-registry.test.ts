/// <reference types="node" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GlobalFonts } from '@napi-rs/canvas';
import { buildMissingFontError } from '../../src/render/fontRegistry';
import { resolve } from 'node:path';

// 捕获 fontRegistry 实际注册的字体文件路径。
// 说明：不能用 `vi.mock('node:fs')` 来模拟「字体全缺」——ESM 内置模块的
// `import { existsSync }` 不会被该 mock 可靠拦截（实测真实文件系统仍被访问，
// 于是字体被找到、不抛错，测试变成假测量）。因此错误信息改为对纯函数断言，
// 字体探测链则用 registerFromPath 的包装来观测真实命中的文件。
const registeredPaths: string[] = [];
{
  const target = GlobalFonts as unknown as { registerFromPath: (path: string, family: string) => unknown };
  const realRegister = target.registerFromPath.bind(GlobalFonts);
  target.registerFromPath = (path: string, family: string) => {
    registeredPaths.push(path);
    return realRegister(path, family);
  };
}

const normalize = (value: string) => value.replace(/\\/g, '/').toLowerCase();

async function freshRegistry(tag: string) {
  vi.resetModules();
  return import(`../../src/render/fontRegistry?case=${tag}`);
}

afterEach(() => {
  delete process.env.CUECUT_FONT_PATH;
  delete process.env.CUECUT_FONT_BOLD_PATH;
  vi.restoreAllMocks();
});

describe('fontRegistry · 无字体可用时的错误信息（纯函数）', () => {
  it('message 含「已探测路径」与全部具体候选路径', () => {
    const probed = [
      'F:/CCPJ/CueCut3/assets/fonts/NotoSansSC-Regular.otf',
      'F:/CCPJ/CueCut3/assets/fonts/NotoSansSC-Bold.otf',
      'C:/Windows/Fonts/msyh.ttc',
      'C:/Windows/Fonts/simhei.ttf',
    ];
    const err = buildMissingFontError(probed);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('已探测路径');
    for (const path of probed) expect(err.message).toContain(path);
    // 必须给出可操作的修复指引，而不是只报「找不到」
    expect(err.message).toContain('CUECUT_FONT_PATH');
  });
});

describe('fontRegistry · 探测链命中仓库字体（不落系统字体）', () => {
  it('源码布局下注册的是 assets/fonts/NotoSansSC-Regular.otf 与 -Bold.otf', async () => {
    registeredPaths.length = 0;
    const mod = await freshRegistry('good');
    const fonts = mod.ensureFontsRegistered();

    expect(registeredPaths.length).toBeGreaterThanOrEqual(2);
    expect(normalize(registeredPaths[0]!)).toContain('assets/fonts/notosanssc-regular.otf');
    expect(normalize(registeredPaths[registeredPaths.length - 1]!)).toContain('assets/fonts/notosanssc-bold.otf');
    // 明确排除系统字体兜底被误用
    expect(normalize(registeredPaths.join('|'))).not.toContain('msyh.ttc');
    expect(normalize(registeredPaths.join('|'))).not.toContain('simhei.ttf');

    expect(fonts.regular).toBe('NotoSansSC');
    expect(GlobalFonts.has(fonts.regular)).toBe(true);
    expect(GlobalFonts.has(fonts.bold)).toBe(true);
  });

  it('仓库字体路径落在项目根下的 assets/fonts（确认不是 cwd 漂移出来的路径）', async () => {
    registeredPaths.length = 0;
    await freshRegistry('path-shape').then((mod) => mod.ensureFontsRegistered());
    const first = normalize(registeredPaths[0]!);
    expect(first.endsWith('/assets/fonts/notosanssc-regular.otf')).toBe(true);
    expect(first).toContain('cuecut3');
  });
});

describe('fontRegistry · 无效的 env 覆盖不应致命，但不得静默', () => {
  it('CUECUT_FONT_PATH 指向不存在文件：不抛错、向 stderr 告警、回落仓库字体而非系统字体', async () => {
    process.env.CUECUT_FONT_PATH = resolve('no', 'such', 'font', 'NotoSansSC-Regular.otf');
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    registeredPaths.length = 0;

    const mod = await freshRegistry('bad-env');
    let threw = false;
    try {
      mod.ensureFontsRegistered();
    } catch {
      threw = true;
    }

    // 1) 配置错误不致命
    expect(threw).toBe(false);
    // 2) 但必须告警，含变量名与实际路径（否则部署写错路径会被静默吞掉）
    const warnings = stderr.mock.calls.map((call) => String(call[0])).join('');
    expect(warnings).toContain('CUECUT_FONT_PATH');
    expect(warnings).toContain('NotoSansSC-Regular.otf');
    // 3) 回落到仓库字体，而不是系统 msyh/simhei
    expect(registeredPaths.length).toBeGreaterThan(0);
    const joined = normalize(registeredPaths.join('|'));
    expect(joined).toContain('assets/fonts/notosanssc-regular.otf');
    expect(joined).not.toContain('msyh.ttc');
    expect(joined).not.toContain('simhei.ttf');
  });
});
