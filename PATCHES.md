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
