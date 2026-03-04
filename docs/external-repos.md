# Repositories outside the workspace

Repos that are part of the Gaqno ecosystem but **are not** submodules of `gaqno-development-workspace`. They live in separate GitHub repositories and are deployed independently (e.g. via Coolify).

| Repo | Purpose | In workspace? | Coolify |
|------|---------|----------------|---------|
| **gaqno-consumer-service** | External repo; event/Kafka consumer or shared consumer logic. Not cloned as a submodule in this workspace. | No (outside) | Yes — uuid `wkgskow8wcgcgwock8csgsss`, FQDN `http://api.gaqno.com.br/consumer`. |
| **gaqno-consumer-ui** | Frontend dashboard for visual reference of consumer/event activity (status, throughput, recent events). Separate repo; may exist as a sibling folder in workspace but is not a submodule. | No (outside) | Yes — uuid `m0wwwoosgoo0ow84wowo0ssw`, FQDN `http://portal.gaqno.com.br/consumer`. |

This document certifies that **gaqno-consumer-service** and **gaqno-consumer-ui** are outside repos, not submodules of the workspace. Repos created via GitHub CLI; Coolify applications added.
