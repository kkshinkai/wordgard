# Repository Maintenance Rules

Read this file and `PATCHES.md` before inspecting, editing, merging, reverting, or tagging anything in this repository.

## Language Policy

All repository files, code comments, commit messages, branch names, and tag annotations must be written in English only. Non-English text is strictly prohibited in both repository files and Git history.

## 1. Remotes and Branches

- `origin`: https://github.com/kkshinkai/wordgard.git
- `upstream`: https://code.haverbeke.berlin/wordgard/wordgard.git

Strict boundaries:

1. Only run anonymous read-only `git fetch upstream main --tags` against `upstream`. Never push to `upstream`, and never send automated HTTP or API requests to `code.haverbeke.berlin`. Upstream bug reports and discussions are filed manually by the maintainer.
2. Keep two long-lived branches on `origin`:
   - `main`: Default branch containing upstream code, the three maintenance files (`PATCHES.md`, `AGENTS.md`, `.github/workflows/ci.yml`), and all active patches. Never force-push `main`; advance it only via new commits and `git merge --no-ff`.
   - `upstream`: Read-only mirror of `upstream/main`, updated only by fast-forward pushes during upstream syncs. Never commit directly to `upstream`.

## 2. Build and Test Commands

Run the full build, unit tests, and headless browser tests after every patch, upstream merge, or revert:

```sh
npm install --ignore-scripts
npm run prepare
npm test
npm run test-headless
```

On macOS when Chrome is not on `PATH`, pass the browser binary path explicitly:

```sh
npm run test-headless -- --binary "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

## 3. Adding a Patch (Two-Commit Rule)

Assign sequential IDs (`P-001`, `P-002`, ...) in `PATCHES.md` for source or build changes. Record every patch as two consecutive commits:

1. **Commit 1 (code and tests only)**:
   - Touch only `src/` and `test/` (and `bin/` when a build fix requires it). Never modify `PATCHES.md` in this commit.
   - Format the commit subject as `P-xxx: <concise summary>` and explain the root cause in the commit body.
   - Every `pending` patch that changes runtime logic or editor behavior must include a regression test in `test/test-*.ts` or `test/webtest-*.ts` that fails without the `src/` fix and passes with it.
   - Verify the build and both test suites pass, then create Commit 1 and record its 40-character SHA.
2. **Commit 2 (`PATCHES.md` update only)**:
   - Modify only `PATCHES.md` to add the new row with the ID, status (`pending` or `local`), full 40-character SHA from Commit 1, summary, touched file paths, upstream issue URL (`unfiled` if not yet filed, `n/a` for `local`), and notes.
   - Use subject `docs: record P-xxx in PATCHES.md`.

When the maintainer wants an isolated diff link against pure upstream for an upstream issue discussion, branch `patch/<slug>` from `upstream/main`, create Commit 1 there and push it to `origin`, merge it into `main` with `git merge --no-ff patch/<slug>`, and then create Commit 2 on `main`.

## 4. Syncing Upstream and Handling Absorption

When asked to sync with upstream, follow these five steps in order:

1. **Fetch and fast-forward the mirror branch**: Run `git fetch upstream main --tags`, then run `git push origin upstream/main:refs/heads/upstream --tags`. If `git merge-base --is-ancestor upstream/main main` succeeds, `main` is already up to date; stop here.
2. **Probe `pending` patches against pure upstream**: Inspect every `pending` row in `PATCHES.md`. Create a temporary `git worktree` detached at `upstream/main`. For each `pending` patch, check out only its `test/` changes (without its `src/` changes) onto `upstream/main` and run `npm run prepare`, `npm test`, and headless browser tests:
   - If the regression test passes on pure `upstream/main`, upstream has absorbed the fix (`absorbed`).
   - If the regression test still fails, upstream has not yet fixed the issue; keep the patch.
   - For rare configuration or styling patches without test assertions, inspect `git log` on `upstream/main` for the touched files and confirm with the maintainer.
   Remove the temporary `git worktree` once probing finishes.
3. **Merge into `main`**: On `main`, run `git merge --no-ff upstream/main`:
   - For every patch confirmed as `absorbed` in step 2 (whether or not Git reports a conflict), run `git checkout upstream/main -- <src-paths>` so `src/` matches upstream exactly, while keeping the regression test in `test/`.
   - For remaining patches that conflict with upstream changes, resolve the conflicts while preserving the intended behavior.
4. **Verify and update `PATCHES.md`**: Run `npm run prepare`, `npm test`, and headless browser tests before completing the merge commit. If any patches transitioned to `absorbed`, create a separate follow-up commit updating `PATCHES.md` to set their status to `absorbed` and record the upstream commit SHA in `Notes`.
5. **Audit live `src/` diff and push**: Run `git diff upstream/main main -- src/` and verify that every remaining `src/` difference belongs to a `pending` or `local` entry in `PATCHES.md`, then push `main` to `origin`.

## 5. Reverting a Patch

To drop a patch that upstream has not absorbed:

1. On `main`, run `git revert --no-edit <commit-sha>` using the code commit SHA recorded in `PATCHES.md`.
2. Run `npm run prepare`, `npm test`, and headless browser tests.
3. Create a separate commit updating `PATCHES.md` to set the patch status to `reverted` and note the reason in `Notes`, then push `main` to `origin`.

## 6. Tagging and Downstream Consumption

- Never modify the `version` field in `package.json`; keep it identical to upstream to prevent merge conflicts when upstream cuts new releases.
- To cut an immutable tag for downstream projects from a tested `main` commit, read the current upstream `version` from `package.json` (for example `0.7.0`), find the highest existing `kk-v<version>-<n>` tag suffix on `origin`, create an annotated tag `kk-v<version>-<next>` (resetting `<next>` to `1` when `<version>` advances):

```sh
git tag -a kk-v0.7.0-1 -m "kk-v0.7.0-1"
git push origin refs/tags/kk-v0.7.0-1
```

- Reference the tag (or `#main` during active development) in downstream `package.json` files; the package manager runs `prepare` automatically on install to build `dist/`:

```json
{
  "dependencies": {
    "wordgard": "git+https://github.com/kkshinkai/wordgard.git#kk-v0.7.0-1"
  }
}
```
