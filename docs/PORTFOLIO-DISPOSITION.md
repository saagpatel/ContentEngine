# ContentEngine — Portfolio Disposition

**Status:** Release Frozen — unsigned desktop pipeline complete, awaiting
operator-only signing/notarization setup. Closeout work merged. Do not
surface for routine review until unblock trigger fires.

---

## Why this file exists

The portfolio operating system was tracking a "closeout completion"
packet on ContentEngine. The closeout pull request (PR #4) merged on
2026-03-24, so the literal closeout work is done — but the row has
kept cycling because the disposition is unclear: the artifact is
release-ready but unsigned, and there's been no portfolio-OS signal
of what to do with that.

This file is that signal.

---

## Closeout receipt

Closeout was tracked on branch `codex/feat/release-closeout`, which
merged via PR #4 (`feat(app): harden export flow and release gates`,
2026-03-24). The branch is safe to delete locally — there is nothing
on it that is not on `main`.

What landed in that closeout:

- ADR 0001 (export contract + quality-gate truth alignment) — drift
  between docs / verify scripts / behavior was eliminated by
  standardizing on `export_pdf` as the supported export surface.
- Guarded desktop release workflow (`docs/release/desktop-release.md`)
  — tag-triggered, three-platform matrix build, draft release with
  installers + SHA256SUMS.
- CI hardening for the tauri smoke flag and quality gates.

What remains open after closeout (from the docs themselves):

- Apple Developer ID signing + notarization wiring (currently builds
  are unsigned by default).
- Windows code-signing cert wiring (also unsigned by default).
- ~10 stale dependabot PRs (open since 2026-03-29) — none are
  blocking; they need a triage pass when the row becomes active again.

---

## Current state in one paragraph

ContentEngine is a Tauri desktop app for repurposing written content
into 6 platform formats via Claude API, with brand-voice profiles and
local-first SQLite storage. Quality gates pass, the export contract is
truth-aligned to behavior, and the release runbook is documented. The
desktop release workflow can produce unsigned installers for macOS /
Windows / Linux on a tag push. The only gates between "tag a release"
and "ship publicly" are platform signing credentials.

For the full detail, see:

- `docs/release/desktop-release.md`
- `docs/adr/0001-export-contract-and-quality-gates.md`
- `README.md`

---

## Portfolio operating system instructions

| Aspect               | Posture                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portfolio status     | `Release Frozen`                                                                                                                                                                         |
| Closeout packet      | **Resolved** — PR #4 merged 2026-03-24                                                                                                                                                   |
| Review cadence       | Suspend overdue counting                                                                                                                                                                 |
| Resurface conditions | (a) signing credentials wired in CI, (b) operator decides to ship unsigned (not currently planned), or (c) operator triggers a dependency-refresh sprint to clear the dependabot backlog |

---

## Unblock trigger (operator)

When the operator is ready to ship:

1. Add `APPLE_CERTIFICATE_BASE64`, `APPLE_CERTIFICATE_PASSWORD`,
   `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` repo secrets per the
   future signing section in `docs/release/desktop-release.md`.
2. (Optional) Add `WINDOWS_CERTIFICATE_BASE64` +
   `WINDOWS_CERTIFICATE_PASSWORD` for Windows code signing.
3. Bump version across `package.json`, `src-tauri/tauri.conf.json`,
   `src-tauri/Cargo.toml`. Tag `vX.Y.Z`.
4. Verify the auto-generated draft release contains signed installers
   and a valid `SHA256SUMS.txt`.
5. Publish.

Estimated operator time once credentials are in hand: ~3 hours
including a fresh notarization round-trip on macOS.

---

## Reactivation procedure (for the next code session)

When portfolio operating system flips this row to `Active`:

1. Delete stale `codex/*` branches that pre-date the closeout merge —
   they are merged-history artifacts and clutter `git branch -a`.
2. Triage the open dependabot PRs (#12–#21). Some have been open
   since 2026-03-29; pick the safe security-relevant ones and close
   the rest with a "deferred" label.
3. Re-run `pnpm install && pnpm verify` to confirm the toolchain is
   still healthy after the freeze.
4. Only then proceed to signing — do not assume the 2026-03-24 build
   evidence is still valid after a long pause.

---

## Why "Release Frozen" instead of other dispositions

- **Active** — wrong. The product surface is complete for v1; pushing
  more features now competes with the unblock work.
- **Cold Storage** — wrong. The product is tested, packaged, and has a
  working release workflow. Calling it "cold" misrepresents the
  state.
- **Archived / Wind-down** — wrong. The author has not decided to
  stop; only the credentialing work is paused.
- **Release Frozen** — correct, and the same posture as DesktopPEt.
  Two repos in the same posture is fine; the portfolio OS should
  surface them together when signing capacity opens.

---

## Last known reference

| Field                            | Value                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Last meaningful commit on `main` | `b694af7` fix(ci): use valid tauri no-bundle smoke flag (PR #4 closeout)                                                                                                   |
| Date                             | 2026-03-24                                                                                                                                                                 |
| Closeout PR                      | #4 (merged)                                                                                                                                                                |
| Build verification status        | green                                                                                                                                                                      |
| Open dependabot PRs              | #12 – #21, all opened ~2026-03-29                                                                                                                                          |
| Blocker                          | Apple + Windows signing (operator-only)                                                                                                                                    |
| Local stale branches             | `codex/feat/release-closeout` (already merged), `codex/bootstrap-tests-docs-v1`, `codex/chore/bootstrap-codex-os`, `codex/lean-dev-mode`, `codex/prune-bloat-ci-stabilize` |
