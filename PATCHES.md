# Wordgard Patch Log

This file tracks all source and build patches carried on top of upstream Wordgard. Changes to `PATCHES.md`, `AGENTS.md`, or `.github/workflows/ci.yml` do not take patch IDs.

To inspect the full live source diff between `main` and upstream Wordgard at any time:

```sh
git diff upstream/main main -- src/
```

## Statuses

- `pending`: Temporary fix for an upstream defect; restore the touched `src/` files to upstream once upstream provides an equivalent fix.
- `local`: Intentional behavior maintained for downstream applications; not intended for upstream.
- `absorbed`: Upstream now provides an equivalent fix, and the corresponding `src/` files on `main` have been restored to upstream.
- `reverted`: Removed via `git revert` without upstream absorption.

## Patches

| ID | Status | Commit | Summary | Paths | Upstream Issue | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| P-001 | `pending` | `ed790270456222c3ed77ff2eeb09a9170f030909` | Bind `moveByWord` to `Ctrl-ArrowLeft`/`Ctrl-ArrowRight` (`Alt-ArrowLeft`/`Alt-ArrowRight` on macOS) so `Cmd-ArrowLeft`/`Cmd-ArrowRight` runs `moveToLineSide` | `src/editor/keymap.ts`, `test/webtest-commands.ts` | https://code.haverbeke.berlin/wordgard/wordgard/issues/163 | |
