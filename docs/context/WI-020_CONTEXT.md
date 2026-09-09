# Context Packet｜WI-020

**Role:** R06 License / IP Compliance  
**Work Item:** `WI-020` — License and IP compliance  
**Current GP:** GP-02/GP-03；依赖 WI-015。

## Goal

核对 Motion Primitives 与 Magic UI 的来源、MIT notice、选用文件和改动状态；确认生产 adapter 不引入 `motion/react`、CDN、在线字体或运行时网络。维护 `src/motions/licenses/**` 和 `docs/THIRD_PARTY_MOTIONS.md`，不改 TS/TSX 生产实现、不新增下载。

## Allowed / forbidden

允许 `src/motions/licenses/**`、`docs/THIRD_PARTY_MOTIONS.md`、本 WI context/handoff/evidence；禁止 `src/**/*.ts(x)`（许可证目录除外）、`package.json`、`pnpm-lock.yaml`、secret/media。

## Acceptance

文件来源 URL、MIT license、copyright、files used、modified=true/false 和 adapter mapping 可追溯；所有使用项和仅参考项分开。输出只区分静态/IP audit 与 runtime tests，不能自行标 VERIFIED/ACCEPTED。

## R06 execution notes (2026-09-08)

- Local provenance baseline is the WI-015 pack `src/motions/CueCut2_TalkingHead_Effects_Pack_v0.1.zip`, SHA-256 `E30C8258FC14265269184C35FC6F8B6851F68AECFB35AB7586B9640C541115D0`; 16 zip file entries and 16 extracted files were checked byte/hash equal.
- Both original notices remain unchanged and are byte-equal to canonical copies: Motion Primitives `E99C79B4...A65C2A18` (1064 bytes) and Magic UI `0147B8...27B34BA` (1060 bytes). `SOURCE_METADATA.json` has no upstream commit/tag, so the local pack—not current upstream `main`—is the exact provenance baseline.
- Read-only GitHub corroboration found both repositories reporting SPDX `MIT`, and all nine selected component paths present on current `main`. Current Motion Primitives notice content differs from the packed notice but remains MIT; the packed notice is intentionally retained.
- Formal mapping is reserved as internal `adapterId` keys (`text-morph`, `text-roll`, `text-scramble`, `text-shimmer`, `animated-shiny-text`, `animated-number`, `number-ticker`, `animated-list`, `animated-group`). WI-020 does not implement or rename adapters; `AnimatedList` remains a `ListMotion` primitive, not a final `Checklist` implementation.
- The production `src/motions` scan found no CDN, online-font, or runtime-network primitive. It found only R01 registry provenance URLs. Existing app/API/Alibaba network endpoints are outside the motion compliance claim; the claim is no new motion-runtime egress.
- R01 files were read-only during this audit. Because the R01 motion tree was observed changing concurrently, R90 should repeat the final static audit after R01 stops editing; R06 did not write any TS/TSX, package/lock, secret, media, `_import`, or R01 file.
