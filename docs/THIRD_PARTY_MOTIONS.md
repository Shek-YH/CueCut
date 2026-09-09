# Third-party Motions｜WI-020 R06 License / IP Compliance Ledger

审阅状态：`READY_FOR_REVIEW`（owner evidence；不是 `VERIFIED` / `ACCEPTED`）。

本台账把「随本地 zip 保留的第三方来源证据」与「未来正式 adapter 映射预留」分开。WI-020 不新增下载、不修改第三方源码、不改生产 TS/TSX；`_import` 源码仍是 reference-only，正式 adapter 的实现与最终 UI 命名由 R01 负责。

## Provenance baseline

| Evidence | Value |
|---|---|
| Local pack | `src/motions/CueCut2_TalkingHead_Effects_Pack_v0.1.zip` |
| Local pack SHA-256 | `E30C8258FC14265269184C35FC6F8B6851F68AECFB35AB7586B9640C541115D0` |
| Zip file entries / extracted files | `16 / 16` |
| Zip entry → `_import` parity | `all_entry_files_equal=True` |
| Pack metadata | `src/motions/_import/CueCut2_TalkingHead_Effects_Pack_v0.1/SOURCE_METADATA.json`；未提供 upstream commit/tag |
| Canonical notices | `src/motions/licenses/motion-primitives-LICENCE.md`、`src/motions/licenses/magicui-LICENSE.md` |

`Modified` 在本台账中表示“相对于 WI-015 提供的 zip entry 是否被本地导入流程改写”。逐 entry hash/字节核对为 `False`（未改写）；由于 pack metadata 没有 upstream commit/tag，不把它推断成某个具体 upstream revision 的字节证明。

## Source, license and selected-file ledger

| Source | Canonical source URL | License / copyright | Selected files retained under `_import` | Local notice | Modified relative to supplied pack | Production status |
|---|---|---|---|---|---|---|
| Motion Primitives | [repository](https://github.com/ibelick/motion-primitives)；[demo](https://motion-primitives.com) | MIT；`Copyright (c) 2024 ibelick` | `01_Text_Emphasis/motion-primitives/text-morph.tsx`, `text-roll.tsx`, `text-scramble.tsx`, `text-shimmer.tsx`; `02_Numbers_Metrics/motion-primitives/animated-number.tsx`; `04_Motion_Presets/motion-primitives/animated-group.tsx` | Original: `.../05_Licenses/motion-primitives-LICENCE.md`; distribution copy: `src/motions/licenses/motion-primitives-LICENCE.md` | `False`；local selected files match their zip entries | Reference-only in this WI; no R06 production implementation |
| Magic UI | [repository](https://github.com/magicuidesign/magicui)；[demo](https://magicui.design) | MIT；`Copyright (c) Magic UI` | `01_Text_Emphasis/magicui/animated-shiny-text.tsx`; `02_Numbers_Metrics/magicui/number-ticker.tsx`; `03_List_Steps/magicui/animated-list.tsx` | Original: `.../05_Licenses/magicui-LICENSE.md`; distribution copy: `src/motions/licenses/magicui-LICENSE.md` | `False`；local selected files match their zip entries | Reference-only in this WI; no R06 production implementation |

### Notice hashes

| Notice | Zip/original SHA-256 | Canonical copy SHA-256 | Bytes | Byte equal |
|---|---|---|---:|---|
| `motion-primitives-LICENCE.md` | `E99C79B4B7FDC4927F44E5956A3D3193AB9BF2BFFDDD2F2817A1FF07A65C2A18` | `E99C79B4B7FDC4927F44E5956A3D3193AB9BF2BFFDDD2F2817A1FF07A65C2A18` | `1064` | `True` |
| `magicui-LICENSE.md` | `0147B84235ED916B8B4E89C1F80655351C5AFE7D211B629BE61F553A227B34BA` | `0147B84235ED916B8B4E89C1F80655351C5AFE7D211B629BE61F553A227B34BA` | `1060` | `True` |

## Read-only upstream corroboration (2026-09-08)

`gh api repos/{owner}/{repo}` reports `default_branch=main` and SPDX `MIT` for both repositories. The selected paths were present in the current `main` tree with these Git blob IDs:

| Source | Current `main` selected path → Git blob SHA |
|---|---|
| Motion Primitives | `components/core/text-morph.tsx` → `f8ea5f7f9b5b65f66ec3e8373553b1923a910e2f`; `components/core/text-roll.tsx` → `b4718536d6c2f6fd1545e11478fd7ca0e01dd7f7`; `components/core/text-scramble.tsx` → `93104ead82aa9cb7961bc52dc1a13d092d1ec965`; `components/core/text-shimmer.tsx` → `8a91eae1d73ecbc48a264214475e05db61db796e`; `components/core/animated-number.tsx` → `d962410dea49542e6668928469c62af4bebfd890`; `components/core/animated-group.tsx` → `ba1cc085c32228e73508917bfc2df1cd6f97a8ec` |
| Magic UI | `apps/www/registry/magicui/animated-shiny-text.tsx` → `02b24c1934efc0d0071a9d4e6cdba306cf2a8ff2`; `apps/www/registry/magicui/number-ticker.tsx` → `99ef26e27af2989b1951248cd942a488e5de0feb`; `apps/www/registry/magicui/animated-list.tsx` → `56028f0446caa9d320e63b5b4c7ed0ceea5a1093` |

Current upstream notice checks: Motion Primitives `LICENCE.md` is MIT/copyright-bearing, raw SHA-256 `F668F5EF3635EB906F10B1EEA9A32E449EB6E1A183AB6879EF6D56C0980DD2F3`; Magic UI `LICENSE.md` is MIT/copyright-bearing, raw SHA-256 `0147B84235ED916B8B4E89C1F80655351C5AFE7D211B629BE61F553A227B34BA`. The local Motion Primitives notice is intentionally kept at the zip/original hash because the pack is the provenance baseline; no exact-current-main claim is made.

## Formal adapter mapping reservation (R01 handoff)

These are reserved internal mapping keys only. They are not new implementation, not a final public effect naming decision, and not evidence that a production adapter is complete. The mapping follows PRD §8–11 and the IDs currently exposed by the read-only R01 registry snapshot.

| Upstream component | Reserved CueCut `adapterId` | Intended semantic surface | Compliance note |
|---|---|---|---|
| Motion Primitives / `text-morph.tsx` | `text-morph` | Text primitive → `KeyPoint`, `Keyword`, `Quote`, `Definition`, `Conclusion` | Must retain Motion Primitives notice when adapted |
| Motion Primitives / `text-roll.tsx` | `text-roll` | Same text primitive surface | Must retain Motion Primitives notice when adapted |
| Motion Primitives / `text-scramble.tsx` | `text-scramble` | Same text primitive surface | Must retain Motion Primitives notice when adapted |
| Motion Primitives / `text-shimmer.tsx` | `text-shimmer` | Text primitive; may serve multiple semantic cards | Must retain Motion Primitives notice when adapted |
| Magic UI / `animated-shiny-text.tsx` | `animated-shiny-text` | Text primitive; semantic effect remains CueCut-owned | Must retain Magic UI notice when adapted |
| Motion Primitives / `animated-number.tsx` | `animated-number` | Number primitive → `BigNumber`, `Percentage`, `Delta`, `Price`, `Progress`, `Metric` | Must retain Motion Primitives notice when adapted |
| Magic UI / `number-ticker.tsx` | `number-ticker` | Same number primitive surface | Must retain Magic UI notice when adapted |
| Magic UI / `animated-list.tsx` | `animated-list` | `ListMotion` primitive → `BulletList`, `Steps`, `Checklist`, `FeatureList`, `Tips` | Must not be exposed as a direct final `Checklist` implementation |
| Motion Primitives / `animated-group.tsx` | `animated-group` | Reusable list/group or Motion Layer primitive | Exact R01 category/contract remains to be verified |

The ten PRD Motion Layer presets (`fade`, `slide`, `scale`, `blur`, `blur-slide`, `zoom`, `flip`, `bounce`, `rotate`, `swing`) are CueCut motion-layer mappings, not additional third-party source files. Their implementation/license treatment must remain separate from the nine selected upstream components above.

## Remote dependency boundary

- The imported reference files visibly contain `motion/react` and, in some Magic UI files, `@/lib/utils`; this is expected source evidence and is not a production dependency claim. `tsconfig.app.json` excludes `src/motions/_import`.
- The production `src/motions` scan excluding `_import` and `licenses` found no `motion/react`, `framer-motion`, CDN, online-font, `fetch`, XHR, WebSocket, or equivalent runtime-network marker. It did find the two HTTPS source URLs in the R01 registry metadata; those strings are provenance fields, not fetch/import URLs.
- The application has pre-existing out-of-scope network boundaries (`/api/generate-effects` and Alibaba endpoints). Therefore this ledger asserts **no new motion-runtime network/CDN/online-font dependency**, not repository-wide offline behavior.
- No new package/lock entry for Motion Runtime, CDN, or online font was added by WI-020; the exact marker scan of `package.json` and `pnpm-lock.yaml` returned `NO_MATCHES`.

Canonical local notice pointers remain in `src/motions/_import/licenses/README.md`. Any future R01 adapter modification must keep the applicable notice and add an explicit modified/provenance record before review.
