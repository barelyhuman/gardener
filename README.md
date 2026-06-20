# Gardener

Gardener is a [Flue](https://flueframework.com) agent that inspects a codebase and reports maintenance findings — stale dependencies, test gaps, documentation drift, performance anti-patterns, and other safe improvements.

It ships as a **composite GitHub Action** you can run in any repository.

## Quick start

Add a workflow to the repo you want maintained:

```yaml
name: Gardener

on:
  workflow_dispatch:
    inputs:
      focus:
        description: Focus area
        default: general maintenance
  schedule:
    - cron: '0 9 * * 1'

permissions:
  contents: write
  pull-requests: write

jobs:
  garden:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: YOUR_ORG/gardener@v1
        with:
          focus: ${{ inputs.focus }}
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_KEY: ${{ secrets.CLOUDFLARE_API_KEY }}
```

Replace `YOUR_ORG/gardener@v1` with your fork or organization. Pin to a specific commit SHA or create release tags rather than pointing to a branch.

## Secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare Workers AI account ID |
| `CLOUDFLARE_API_KEY` | Yes | Cloudflare API key with Workers AI access |

Add Cloudflare secrets under **Settings → Secrets and variables → Actions** in the consumer repository.

## Action inputs

| Input | Default | Description |
|-------|---------|-------------|
| `focus` | `general maintenance` | Area to inspect: `general maintenance`, `tests`, `dependencies`, `docs`, or `performance` |
| `node-version` | `22` | Node.js version used to build and run Gardener |
| `working-directory` | `.` | Subdirectory of the checkout to tend (for monorepos) |

## What happens on each run

1. Gardener installs and builds from the action checkout.
2. The agent inspects the **consumer repository** (not the Gardener source).
3. Findings are written to the GitHub Actions **job summary**.
4. If Gardener leaves file changes, a **pull request** is opened automatically. Read-only runs produce a summary only.

## Permissions

The workflow must grant the job token write access so Gardener can use `gh` and open pull requests. The action uses `${{ github.token }}` automatically — no PAT or `GH_TOKEN` secret is required:

```yaml
permissions:
  contents: write
  pull-requests: write
```

`contents: write` is required when Gardener applies fixes and a PR should be created.

`GITHUB_TOKEN` cannot push changes under `.github/workflows/` — GitHub requires a PAT with the `workflow` scope for that. Before opening a PR, the action discards any workflow file changes so PR creation succeeds with the default token. Workflow findings still appear in the job summary; apply those edits manually or supply a PAT with `workflow` scope if you need them in the PR.

## Local development

```bash
npm ci
npm run build

# Tend another repo
GARDENER_TARGET_ROOT=/path/to/target-repo npx flue run garden --target node \
  --payload '{"focus": "performance"}'
```

Copy `.env.example` to `.env` and fill in Cloudflare credentials for local runs.

## Project structure

The codebase is written in **TypeScript** and built with the Flue CLI (`npm run build`).

- `src/agents/` — Flue agent modules (auto-discovered by filename)
  - `gardener.ts` — Main agent that loads the `garden` skill
- `src/workflows/` — Workflows invoked via `flue run` or the GitHub Action
  - `garden.ts` — Entry-point workflow that validates payload and runs the agent
- `src/skills/` — Agent skill definitions
  - `garden/SKILL.md` — Prompt and instructions for the gardening inspection
- `action.yml` — Composite GitHub Action entry point
