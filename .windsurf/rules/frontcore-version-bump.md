---
trigger: model_decision
description: Bump frontcore package version when changing @gaqno-frontcore
globs: "@gaqno-frontcore/**"
---

# Frontcore version bump

When you change any file under **@gaqno-frontcore** (the shared frontend package):

1. **Bump the version** in `@gaqno-frontcore/package.json` using semantic versioning:
   - **Patch** (e.g. 1.0.55 → 1.0.56): bug fixes, small tweaks, no API changes.
   - **Minor** (e.g. 1.0.55 → 1.1.0): new exports, new optional props, backward-compatible.
   - **Major** (e.g. 1.0.55 → 2.0.0): breaking API or export changes.

2. Prefer **patch** bumps for typical UI/component fixes and non-breaking changes.

Consumers (shell, MFEs) use `^x.y.z`, so they will pick up the new version after publish or workspace install.
