# Desktop Release Runbook

## Purpose

Provide a repeatable process to build and publish ContentEngine desktop artifacts.

## Release Trigger

Use one of these:

- Push a tag in the format `vX.Y.Z`.
- Run `release-desktop` manually from GitHub Actions.

## Required Preconditions

- `quality-gates` is green.
- `desktop-ci` is green on all three platforms.
- Versions are synchronized across:
  - `package.json`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.toml`

## Automated Flow

`release-desktop.yml` performs:

1. Release validation (`verify.commands`, docs checks, version sync).
2. Matrix build on macOS, Windows, Linux (`pnpm tauri:build`).
3. Artifact collection and SHA256 generation.
4. Draft GitHub release creation with installers and `SHA256SUMS.txt`.

## Artifact Outputs

Artifacts are collected from `src-tauri/target/release/bundle/**` and published to the GitHub release.

## Signing/Notarization Status

Current workflow builds unsigned artifacts by default.

To move to signed production distribution later, add:

- Apple signing + notarization credentials
- Windows code-signing certificate
- Tauri updater signing keys (if updater is enabled)

## Rollback

- If release validation fails: fix on branch and re-tag.
- If artifact quality issue is found after draft creation: delete the draft release and rerun.
- If published release must be withdrawn: mark release as pre-release or remove release assets and issue a corrected tag.
