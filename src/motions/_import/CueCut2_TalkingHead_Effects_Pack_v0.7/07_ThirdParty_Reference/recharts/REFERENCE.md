# Recharts Reference

Repository:
https://github.com/recharts/recharts

License:
MIT

Why it matters to CueCut:
- mature React chart component ecosystem
- line / area / bar / pie / radial bar / radar / treemap etc.
- useful as editor-side or preview-side chart source

CueCut recommendation:
- do not rely on Recharts internal animation timing for final video export unless verified deterministic
- prefer either:
  1. disable Recharts animations and drive values/geometry from CueCut progress, or
  2. use CueCut-native SVG renderers for production export

v0.7's production candidates are CueCut-native, progress-driven SVG/HTML components.
