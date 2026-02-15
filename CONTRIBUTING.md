# Contributing to ContentEngine

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- **Node.js** 20+ with **pnpm** 8+
- **Rust** 1.70+ ([rustup.rs](https://rustup.rs))
- **Tauri prerequisites** for your OS:
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools, WebView2
  - Linux: webkit2gtk, libappindicator

Full guide: [tauri.app/v1/guides/getting-started/prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ContentEngine.git
cd ContentEngine

# Install frontend dependencies
pnpm install

# Run development server
pnpm tauri:dev
```

## Project Structure

```
ContentEngine/
├── src/                    # Frontend (React/TypeScript)
│   ├── components/        # UI components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── stores/           # Zustand state
│   ├── types/            # TypeScript types
│   └── lib/              # Utilities
├── src-tauri/             # Backend (Rust)
│   ├── src/
│   │   ├── commands/     # Tauri command handlers
│   │   ├── services/     # Business logic
│   │   ├── db/           # Database layer
│   │   └── models/       # Data models
│   └── Cargo.toml
└── tests/                 # Test files
```

## Development Workflow

### Running Tests

```bash
# Frontend tests
pnpm test                # Run once
pnpm test:watch         # Watch mode
pnpm test:coverage      # With coverage

# Backend tests
cd src-tauri
cargo test
```

### Linting & Formatting

```bash
# Check code
pnpm lint               # ESLint
pnpm format:check       # Prettier

# Auto-fix
pnpm lint:fix
pnpm format

# Rust formatting
cd src-tauri
cargo fmt
cargo clippy
```

### Type Checking

```bash
pnpm type-check         # TypeScript
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Write Code

- Follow existing code style (enforced by ESLint/Prettier)
- Add tests for new features
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run all tests
pnpm test
cd src-tauri && cargo test

# Test the app
pnpm tauri:dev
```

### 4. Commit

We use conventional commits:

```
feat: add dark mode toggle
fix: resolve API key validation bug
docs: update installation guide
test: add tests for TwitterThread component
refactor: simplify error handling logic
```

### 5. Push & Create PR

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub.

## Code Guidelines

### TypeScript/React

- Use functional components with hooks
- Prefer `const` over `let`
- Use TypeScript types (avoid `any`)
- Extract reusable logic into custom hooks
- Keep components small and focused

### Rust

- Use `Result<T, AppError>` for error handling
- Add tracing spans for operations
- Write integration tests for commands
- Document public functions with rustdoc

### Testing

- Write tests for new features
- Test error cases, not just happy paths
- Use descriptive test names
- Mock external dependencies (Tauri API, Claude API)

## Pull Request Process

1. **Ensure tests pass**: All tests must pass
2. **Update documentation**: If you change user-facing features
3. **Add changelog entry**: Note your changes
4. **Request review**: Tag maintainers
5. **Address feedback**: Respond to review comments

## Reporting Issues

### Bugs

Include:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment (OS, version)

### Feature Requests

Include:
- Use case / problem to solve
- Proposed solution
- Alternative approaches considered

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Questions?

- Open a GitHub Issue
- Check existing documentation in `/docs`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
