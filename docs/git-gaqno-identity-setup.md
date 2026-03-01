# Git identity for gaqno-development (Coding folder)

When working inside this workspace (`gaqno-development-workspace` under Coding), Git uses your **personal identity** from `~/.gitconfig-personal` (same as `~/Coding/gaqno/`).

## Current setup

Your global `~/.gitconfig` includes:

- **`gitdir:~/Coding/gaqno/`** → `~/.gitconfig-personal`
- **`gitdir:~/Coding/gaqno-development-workspace/`** → `~/.gitconfig-personal`

So both the `gaqno` folder and this workspace use the same personal config.

## Verify

From inside this repo (or any submodule):

```bash
git config --show-origin user.name
git config --show-origin user.email
```

You should see `file:$HOME/.gitconfig-personal` and your personal name/email.

## Optional: separate gaqno-development config

If you want a different identity for gaqno-development than for `~/Coding/gaqno/`, use a dedicated file:

1. `cp docs/gitconfig-gaqno-development.example ~/.gitconfig-gaqno-development`
2. Edit name/email (and optional `core.sshCommand` for a dedicated SSH key).
3. In `~/.gitconfig`, change the `gaqno-development-workspace` include to:

   ```ini
   [includeIf "gitdir:~/Coding/gaqno-development-workspace/"]
       path = ~/.gitconfig-gaqno-development
   ```
