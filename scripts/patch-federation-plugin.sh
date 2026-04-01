#!/usr/bin/env bash
set -euo pipefail

# Patch @originjs/vite-plugin-federation to fix React hooks null error.
# Replaces Object.assign snapshot in flattenModule with a Proxy that
# preserves live mutable bindings (ReactCurrentDispatcher).
# See: https://github.com/originjs/vite-plugin-federation/issues/534
# Fix:  https://github.com/originjs/vite-plugin-federation/pull/743

PLUGIN_DIR="node_modules/@originjs/vite-plugin-federation/dist"
OLD='if (module.default) module = Object.assign({}, module.default, module)\\n  moduleCache[name] = module\\n  return module\\n}'
NEW='if (module.default) {\\n    const orig = module\\n    module = new Proxy({}, {\\n      get(_, p) { return p in orig ? orig[p] : orig.default ? orig.default[p] : undefined },\\n      has(_, p) { return p in orig || (orig.default ? p in orig.default : false) },\\n      ownKeys() { const s = new Set(Object.keys(orig)); if (orig.default) Object.keys(orig.default).forEach(k => s.add(k)); return [...s] },\\n      getOwnPropertyDescriptor(_, p) { if (p in orig) return { configurable: true, enumerable: true, value: orig[p] }; if (orig.default && p in orig.default) return { configurable: true, enumerable: true, value: orig.default[p] }; return undefined }\\n    })\\n  }\\n  moduleCache[name] = module\\n  return module\\n}'

for f in "$PLUGIN_DIR/index.mjs" "$PLUGIN_DIR/index.js"; do
  if [ -f "$f" ] && grep -q 'Object.assign({}, module.default, module)' "$f"; then
    sed -i.bak "s|$OLD|$NEW|g" "$f" && rm -f "$f.bak"
    echo "  Patched $f"
  fi
done

echo "  federation-plugin patch complete"
