# ContentEngine

[![TypeScript](https://img.shields.io/badge/TypeScript-%233178c6?style=flat-square&logo=typescript)](#) [![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](#)

> Write once, distribute everywhere — transform any piece of content into 6 platform-ready formats with your brand voice, not a generic template.

ContentEngine is a privacy-first Tauri desktop app that uses Claude AI to repurpose written content into platform-specific formats. Paste an article or draft, select your brand voice profile, and get a Twitter thread, LinkedIn post, Instagram caption, newsletter excerpt, email sequence, and summary — all in one click. Your data never leaves your device except for the Claude API call.

## Features

- **6-Format Generation** — Twitter/X thread, LinkedIn post, Instagram caption, newsletter excerpt, 3-part email sequence, and summary from a single source piece
- **Brand Voice Profiles** — Analyze writing samples to extract and save custom voice profiles; apply them consistently across all generated formats
- **Local-First Storage** — All content, history, and profiles stored on your device — no cloud sync, no account, no tracking
- **Generation History** — Browse and re-export any past generation session; search by content or date
- **PDF Export** — Export all 6 formats for a piece into a single shareable PDF
- **Usage Tracking** — Monthly generation counts with configurable limits to keep Claude API spend predictable

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Rust toolchain (stable) + Tauri v2 prerequisites for your OS
- An Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

```bash
git clone https://github.com/saagpatel/ContentEngine.git
cd ContentEngine
pnpm install
cp .env.example .env
# Set ANTHROPIC_API_KEY in .env
```

### Run (development)

```bash
pnpm dev
```

### Build (desktop app)

```bash
pnpm tauri build
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | Tauri 2 + Rust |
| Frontend | React + TypeScript + Vite |
| AI generation | Anthropic Claude API |
| Storage | SQLite (local, via Tauri) |
| Styling | Tailwind CSS |
| Export | PDF generation (Rust) |

## Architecture

ContentEngine is a Tauri 2 app where the Rust backend manages all Claude API communication, SQLite persistence, and PDF generation. The React frontend is responsible purely for the editing interface and format preview. Brand voice profiles are stored as JSON blobs in SQLite alongside generation history. The usage tracker is a lightweight counter in the same database — there is no remote telemetry or sync.

## License

MIT
