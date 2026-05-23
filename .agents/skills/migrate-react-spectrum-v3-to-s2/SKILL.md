---
name: "migrate-react-spectrum-v3-to-s2"
description: "Upgrade React Spectrum v3 (Spectrum 1) codebases to React Spectrum S2. Use when developers mention migrating or upgrading from React Spectrum v3, Spectrum 1, S1, @adobe/react-spectrum, @react-spectrum/* packages, or codemod-assisted upgrades to @react-spectrum/s2."
license: "Apache-2.0"
compatibility: "Requires a React project currently using React Spectrum v3, @react-spectrum/* packages, or related React Spectrum v3 helpers."
metadata:
  author: "Adobe"
  website: "https://react-spectrum.adobe.com/"
---

# React Spectrum v3 to S2 migration

Upgrade React Spectrum v3 codebases to S2 by following these eight steps in order.

## Scope

This skill covers only the React Spectrum v3 (S1) to S2 migration. Do **not** perform major dependency upgrades such as React version bumps (e.g. React 16→17, 17→18, 18→19) as part of this migration. If the project needs a major dependency upgrade, note it as a recommended follow-up in the final report (Step 8) rather than attempting it during migration.

## Step 1: Inspect the codebase

- Search package manifests for `@adobe/react-spectrum`, `@react-spectrum/*`, and `@spectrum-icons/*`.
- Note the package manager (npm, yarn, pnpm) from the lockfile.
- Identify the bundler used by the migration target (Parcel, Vite, webpack, Next.js, Rollup, ESBuild).
- In monorepos, inspect the specific package or app being migrated rather than the workspace root.
- Find app entrypoints, root providers, shared test wrappers, toast setup, and any `defaultTheme` usage.

See [Prerequisites](references/focused-prerequisites.md) for the full inspection checklist and minimum tool versions.

## Step 2: Install @react-spectrum/s2

Install the S2 package with the project's package manager:

```bash
npm install @react-spectrum/s2
yarn add @react-spectrum/s2
pnpm add @react-spectrum/s2
```

If the bundler is not Parcel v2.12.0+, also install and configure `unplugin-parcel-macros` as a dev dependency. See [Getting started](references/docs-getting-started.md) for bundler-specific setup instructions.

## Step 3: Dry-run the codemod

Preview what the codemod will change before applying:

```bash
npx @react-spectrum/codemods s1-to-s2 --agent --dry
yarn dlx @react-spectrum/codemods s1-to-s2 --agent --dry
pnpm dlx @react-spectrum/codemods s1-to-s2 --agent --dry
```

Use `npx` for npm/Yarn 1, `yarn dlx` for Yarn Berry/PnP, `pnpm dlx` for pnpm.
Add `--path <dir>` for monorepos or partial rollouts.
Add `--components A,B` only when explicitly requested for incremental migration.

Review the dry-run output to understand the scope of changes.

## Step 4: Run the codemod

Execute the codemod to transform the source files:

```bash
npx @react-spectrum/codemods s1-to-s2 --agent
yarn dlx @react-spectrum/codemods s1-to-s2 --agent
pnpm dlx @react-spectrum/codemods s1-to-s2 --agent
```

Use the same `--path` and `--components` flags as the dry run if applicable.

## Step 5: Format with the project's formatter

If the project has a formatter (Prettier, ESLint, Biome, Oxfmt, etc.), run it on the changed files to remove extraneous formatting changes introduced by the codemod.

## Step 6: Fix remaining TODO(S2-upgrade) comments

Search the codebase for `TODO(S2-upgrade)` comments left by the codemod. Each one marks a change that requires manual review.

See [Focused manual fixes](references/focused-manual-fixes.md) for information on how to fix these.

Also reference the `react-spectrum-s2` skill (if available) for full S2 component documentation when needed.

## Step 7: Validate

Run the project's own toolchain to verify the migration is complete:

1. Install dependencies if package manifests changed.
2. Run the typecheck or compile step (e.g. `tsc --noEmit`, `tsc -b`).
3. Run tests covering the migrated code. Prefer the narrowest test scope that covers the changed files.
4. Run the build to confirm the output is intact.

In monorepos, validate the affected package first with its own scripts before running workspace-wide checks. Fix any failures before declaring the migration complete.

## Step 8: Generate final report

After the migration is complete, produce a final report for the user with the following sections:

### Summary of changes
- Packages added and removed.
- What the codemod changed (files affected, components migrated).
- Manual fixes applied (layout components, icons, dialogs, collections, toast, etc.).

### Remaining issues
- Any unresolved `TODO(S2-upgrade)` comments.
- Type errors, test failures, or known gaps that still need attention.

### Recommended follow-ups
- If the project is not on **React 19**, recommend upgrading. React 19 is recommended for S2. Include the relevant upgrade guide links:
  - React 17: https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html
  - React 18: https://react.dev/blog/2022/03/08/react-18-upgrade-guide
  - React 19: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- Any other major upgrades (e.g. React, bundler, etc.) that were out of scope for this migration.
- Any additional cleanup or improvements the user may want to address.

## Deep reference

Use these when you need more component-by-component or API-level detail:
- [Migration guide](references/docs-migrating.md): comprehensive component-by-component migration reference.
- [Getting started](references/docs-getting-started.md): framework setup and macro configuration.
- [Provider](references/docs-provider.md): locale, router, color-scheme, and SSR usage.
- [Styling](references/docs-styling.md): style macro overview including runtime conditions, CSS variables, CSS optimization, and CSS resets.
- [Style macro](references/docs-style-macro.md): exact style macro syntax and constraints.
- [Toast](references/docs-toast.md): full S2 toast API and examples.
