# frontend-page-structure agent memory

Source of truth: `.cursor/skills/frontend-page-structure/SKILL.md` and `.cursor/rules/good-practices.mdc` §3.

## Commands

- Workspace root: `npm run check:page-structure`
- Parent repo CI (`.github/workflows/ci.yml` `lint` job) runs the same script after `npm install`.
- Local pre-commit (`.husky/pre-commit`) runs it when `node_modules` exists at the repo root.

## PR review (manual)

Gates do not cover all of good-practices. On PRs that touch `src/pages/`, spot-check: no imports from `pages/<OtherDomain>/` (lift to `src/` or frontcore); hook placement matches widest consumer (scope ladder); child components get explicit named props, not `{...hookReturn}`; touched files respect function/file size limits where practical.

## Topic stubs

Add files here when recurring patterns emerge (e.g. `gaqno-ai-ui-studio-flow.md`). Link bullet entries below.

- (none yet)
