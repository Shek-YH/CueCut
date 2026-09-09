# Shiki Reference

Repository:
https://github.com/shikijs/shiki

License:
MIT

Usefulness:
- syntax highlighting
- tokenized HTML output
- broad language/theme coverage

Suggested CueCut architecture:
`raw code -> syntax tokenizer/highlighter -> CueCut token model -> frame-driven CodeBlock renderer`

Do not run expensive highlighting on every video frame.
Precompute tokenization when:
- user adds code
- code changes
- language/theme changes

Then store tokenized lines in effect parameters/cache.
