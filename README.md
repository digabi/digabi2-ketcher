# digabi2-ketcher

Customised [Ketcher](https://github.com/epam/ketcher) chemical structure editor for digabi2. Uses Ketcher npm packages with a thin wrapper for WebDAV integration.

## Prerequisites

- Node.js (see `.nvmrc`)
- [just](https://github.com/casey/just)
- Docker

## Commands

| Command | Description |
|---------|-------------|
| `just dev` | Start dev server on `localhost:5173`. Add `?filename=foo.ket` to URL to see save button  |
| `just build` | Build Docker image and tag for local digabi2 use. Run `just start` in digabi2 repo after to test. |
| `just test` | Run Playwright smoke test |
| `just lint` | Run ESLint and TypeScript checks |
| `just dev-release <patch|minor|major>` | Trigger a dev release to ECR |
| `just prod-release` | Promote to production ECR |
