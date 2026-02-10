#!/usr/bin/env node

import fs from "fs";
import path from "path";
import crypto from "node:crypto";

function loadEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*$/);
    if (m)
      process.env[m[1]] = m[2]
        .trim()
        .replace(/^["']|["']+$/g, "")
        .trim();
  }
}
loadEnvFile(".env");

const BASE = (process.env.COOLIFY_BASE_URL || "").trim().replace(/\/$/, "");
const TOKEN = process.env.COOLIFY_ACCESS_TOKEN || "";
const PROJECT_UUID = process.env.COOLIFY_PROJECT_UUID || "";
const PRODUCTION_ENV_NAME =
  process.env.COOLIFY_PRODUCTION_ENV_NAME || "production";
const DEV_ENV_NAME = process.env.COOLIFY_DEV_ENV_NAME || "develop";
const DEV_PORTAL_DOMAIN =
  process.env.COOLIFY_DEV_PORTAL_DOMAIN || "portal.dev.gaqno.com";
const DEV_API_DOMAIN =
  process.env.COOLIFY_DEV_API_DOMAIN || "api.dev.gaqno.com";
const DEV_DESTINATION_UUID = process.env.COOLIFY_DEV_DESTINATION_UUID || "";
const SERVER_UUID_OVERRIDE = process.env.COOLIFY_SERVER_UUID || "";
const PROD_PORTAL = "portal.gaqno.com.br";
const PROD_API = "api.gaqno.com.br";
const PROD_LANDING = "gaqno.com.br";
const DEV_LANDING = "dev.gaqno.com";

const DEV_DB_PASSWORD =
  process.env.COOLIFY_DEV_DB_PASSWORD ||
  crypto
    .randomBytes(12)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 24);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyCreateEnv = args.includes("--only-create-env");
const skipEnvCreate = args.includes("--skip-env-create");
const noDeploy = args.includes("--no-deploy");
const noDatabases = args.includes("--no-databases");
const hardReset = args.includes("--hard-reset");

const API_BASE = `${BASE}/api/v1`;

async function coolifyFetch(method, pathname, body = undefined) {
  const url = `${API_BASE}${pathname}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok)
    throw new Error(`Coolify ${method} ${pathname}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

function applyDevOverrides(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(new RegExp(PROD_API.replace(/\./g, "\\."), "g"), DEV_API_DOMAIN)
    .replace(
      new RegExp(PROD_PORTAL.replace(/\./g, "\\."), "g"),
      DEV_PORTAL_DOMAIN
    )
    .replace(new RegExp(PROD_LANDING.replace(/\./g, "\\."), "g"), DEV_LANDING);
}

function buildAppName(baseName) {
  return baseName.endsWith("-dev") ? baseName : `${baseName}-dev`;
}

function buildDevDomains(prodDomains, appName) {
  if (!prodDomains || typeof prodDomains !== "string") return "";
  const parts = prodDomains
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  const out = parts.map((d) => {
    let domain = d;
    if (d.includes(PROD_PORTAL))
      domain = domain.replace(PROD_PORTAL, DEV_PORTAL_DOMAIN);
    if (d.includes(PROD_API)) domain = domain.replace(PROD_API, DEV_API_DOMAIN);
    if (d.includes(PROD_LANDING))
      domain = domain.replace(PROD_LANDING, DEV_LANDING);
    return domain;
  });
  return out.join(", ");
}

function normalizeGitRepository(value) {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (/^(https?|git):\/\//.test(s) || s.startsWith("git@")) return s;
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+\/[^/]+\/.+/.test(s))
    return `https://${s}${s.endsWith(".git") ? "" : ".git"}`;
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/[a-zA-Z0-9_.-]*)*$/.test(s)) {
    const withGit = s.endsWith(".git") ? s : `${s}.git`;
    return `https://github.com/${withGit}`;
  }
  return null;
}

function parsePostgresDbName(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url.replace(/^postgres:/, "postgresql:"));
    const pathname = u.pathname?.replace(/^\//, "") || "";
    return pathname || null;
  } catch {
    return null;
  }
}

function applyDbReplacements(value, dbReplacements) {
  if (typeof value !== "string" || !dbReplacements) return value;
  let out = value;
  if (dbReplacements.postgres) {
    const dbName = parsePostgresDbName(out);
    if (dbName && dbReplacements.postgres[dbName])
      out = dbReplacements.postgres[dbName];
  }
  if (dbReplacements.redis && /^redis:\/\//.test(out))
    out = dbReplacements.redis;
  return out;
}

function envVarsToDev(envs, dbReplacements = null) {
  if (!Array.isArray(envs)) return [];
  return envs.map((e) => {
    let value = applyDevOverrides(e.real_value ?? e.value ?? "");
    value = applyDbReplacements(value, dbReplacements);
    return {
      key: e.key,
      value,
      is_preview: e.is_preview ?? false,
      is_literal: e.is_literal ?? true,
      is_multiline: e.is_multiline ?? false,
      is_shown_once: e.is_shown_once ?? false,
    };
  });
}

async function main() {
  if (!BASE || !TOKEN) {
    console.error(
      "Set COOLIFY_BASE_URL and COOLIFY_ACCESS_TOKEN (e.g. in .env)"
    );
    process.exit(1);
  }

  const projects = await coolifyFetch("GET", "/projects");
  const projectList = Array.isArray(projects)
    ? projects
    : (projects?.data ?? []);
  const project = PROJECT_UUID
    ? projectList.find((p) => p.uuid === PROJECT_UUID)
    : projectList[0];
  if (!project) {
    console.error(
      "No project found. Set COOLIFY_PROJECT_UUID or ensure Coolify has at least one project."
    );
    process.exit(1);
  }
  const projectUuid = project.uuid;
  console.log("Project:", project.name ?? projectUuid);

  const envsRes = await coolifyFetch(
    "GET",
    `/projects/${projectUuid}/environments`
  );
  const envList = Array.isArray(envsRes) ? envsRes : (envsRes?.data ?? []);
  const prodEnv = envList.find(
    (e) =>
      (e.name || "").toLowerCase() === PRODUCTION_ENV_NAME.toLowerCase() ||
      e.name === PRODUCTION_ENV_NAME
  );
  if (!prodEnv) {
    console.error(
      `Production environment "${PRODUCTION_ENV_NAME}" not found. Available: ${envList.map((e) => e.name).join(", ")}`
    );
    process.exit(1);
  }
  const prodEnvId = prodEnv.id ?? prodEnv.uuid;

  let devEnv = envList.find(
    (e) =>
      (e.name || "").toLowerCase() === DEV_ENV_NAME.toLowerCase() ||
      e.name === DEV_ENV_NAME
  );
  let devEnvUuid = devEnv?.uuid;

  if (!skipEnvCreate && !devEnvUuid) {
    if (dryRun) {
      console.log("[dry-run] Would POST create environment:", DEV_ENV_NAME);
      if (onlyCreateEnv) process.exit(0);
      devEnvUuid = "<new-develop-uuid>";
    } else {
      const created = await coolifyFetch(
        "POST",
        `/projects/${projectUuid}/environments`,
        { name: DEV_ENV_NAME }
      );
      devEnvUuid = created?.uuid ?? created?.data?.uuid;
      if (!devEnvUuid) {
        console.error("Create environment response missing uuid:", created);
        process.exit(1);
      }
      console.log("Created environment:", DEV_ENV_NAME, devEnvUuid);
    }
  } else if (devEnvUuid) {
    console.log("Using existing environment:", DEV_ENV_NAME, devEnvUuid);
  } else {
    console.error(
      `Develop environment "${DEV_ENV_NAME}" not found. Create it or run without --skip-env-create.`
    );
    process.exit(1);
  }

  if (onlyCreateEnv) {
    console.log(
      "Done (--only-create-env). Set COOLIFY_DEV_DESTINATION_UUID from Coolify Destinations for the new env if needed, then re-run to clone applications."
    );
    process.exit(0);
  }

  const devEnvId = devEnv?.id ?? devEnv?.uuid;

  if (hardReset && devEnvUuid && !dryRun) {
    console.log("Hard reset: removing all apps and databases in develop...");
    const appsRes = await coolifyFetch("GET", "/applications");
    const appList = Array.isArray(appsRes) ? appsRes : (appsRes?.data ?? []);
    const devApps = appList.filter(
      (a) => String(a.environment_id) === String(devEnvId)
    );
    for (const app of devApps) {
      await coolifyFetch("DELETE", `/applications/${app.uuid}`);
      console.log("  Deleted app:", app.name || app.uuid);
    }
    const dbsRes = await coolifyFetch("GET", "/databases");
    const dbList = Array.isArray(dbsRes) ? dbsRes : (dbsRes?.data ?? []);
    const devDbs = dbList.filter(
      (d) => String(d.environment_id) === String(devEnvId)
    );
    for (const db of devDbs) {
      await coolifyFetch("DELETE", `/databases/${db.uuid}`);
      console.log("  Deleted database:", db.name || db.uuid);
    }
    console.log("Hard reset done. Recreating...");
  } else if (hardReset && dryRun) {
    console.log(
      "[dry-run] Would hard-reset: delete all apps and databases in develop, then recreate."
    );
  }

  const appsRes = await coolifyFetch("GET", "/applications");
  const appList = Array.isArray(appsRes) ? appsRes : (appsRes?.data ?? []);
  const prodApps = appList.filter(
    (a) => String(a.environment_id) === String(prodEnvId)
  );
  console.log("Production applications:", prodApps.length);

  let serverUuid =
    SERVER_UUID_OVERRIDE ||
    (prodApps[0]?.server?.uuid ??
      prodApps[0]?.server_uuid ??
      prodApps[0]?.destination?.server?.uuid);
  if (!serverUuid && prodApps.length) {
    const firstFull = await coolifyFetch(
      "GET",
      `/applications/${prodApps[0].uuid}`
    );
    serverUuid =
      firstFull?.server?.uuid ??
      firstFull?.server_uuid ??
      firstFull?.destination?.server?.uuid ??
      firstFull?.destination?.server_uuid;
  }
  if (!serverUuid) {
    const servers = await coolifyFetch("GET", "/servers");
    const serverList = Array.isArray(servers) ? servers : (servers?.data ?? []);
    serverUuid = serverList[0]?.uuid;
  }
  if (!serverUuid && !dryRun) {
    console.error(
      "Could not determine server_uuid. Ensure applications have a server or set COOLIFY_SERVER_UUID in .env"
    );
    process.exit(1);
  }

  const defaultDestUuid =
    DEV_DESTINATION_UUID ||
    prodApps[0]?.destination_uuid ||
    prodApps[0]?.destination?.uuid;

  const dbReplacements = { postgres: {}, redis: null };
  const devDbConnectionStrings = [];

  if (!noDatabases && !dryRun) {
    const dbsRes = await coolifyFetch("GET", "/databases");
    const dbList = Array.isArray(dbsRes) ? dbsRes : (dbsRes?.data ?? []);
    const prodDbs = dbList.filter(
      (d) => String(d.environment_id) === String(prodEnvId)
    );
    console.log("Production databases:", prodDbs.length);

    for (const db of prodDbs) {
      const fullDb = await coolifyFetch("GET", `/databases/${db.uuid}`);
      const type = (fullDb?.type ?? fullDb?.database_type ?? "").toLowerCase();
      const destUuidDb =
        DEV_DESTINATION_UUID ||
        fullDb.destination_uuid ||
        fullDb.destination?.uuid ||
        defaultDestUuid;
      const serverUuidDb =
        fullDb.server?.uuid ?? fullDb.server_uuid ?? serverUuid;
      const devNameDb = buildAppName(fullDb.name || db.name || "db");

      if (type === "postgresql") {
        const postgresDb =
          fullDb.postgres_db ?? fullDb.postgres_database ?? "postgres";
        const postgresUser = fullDb.postgres_user ?? "postgres";
        const created = await coolifyFetch("POST", "/databases/postgresql", {
          server_uuid: serverUuidDb,
          project_uuid: projectUuid,
          environment_uuid: devEnvUuid,
          environment_name: DEV_ENV_NAME,
          destination_uuid: destUuidDb,
          name: devNameDb,
          postgres_user: postgresUser,
          postgres_password: DEV_DB_PASSWORD,
          postgres_db: postgresDb,
          instant_deploy: true,
        });
        const newDbUuid = created?.uuid ?? created?.data?.uuid;
        if (newDbUuid) {
          const devUrl = `postgresql://${postgresUser}:${encodeURIComponent(DEV_DB_PASSWORD)}@${newDbUuid}:5432/${postgresDb}`;
          dbReplacements.postgres[postgresDb] = devUrl;
          devDbConnectionStrings.push({
            name: devNameDb,
            type: "postgresql",
            url: devUrl,
            uuid: newDbUuid,
          });
          console.log("Created database:", devNameDb, newDbUuid);
        }
      } else if (type === "redis" || type === "standalone-redis") {
        const redisPassword = fullDb.redis_password ?? DEV_DB_PASSWORD;
        const created = await coolifyFetch("POST", "/databases/redis", {
          server_uuid: serverUuidDb,
          project_uuid: projectUuid,
          environment_uuid: devEnvUuid,
          environment_name: DEV_ENV_NAME,
          destination_uuid: destUuidDb,
          name: devNameDb,
          redis_password: redisPassword,
          instant_deploy: true,
        });
        const newDbUuid = created?.uuid ?? created?.data?.uuid;
        if (newDbUuid) {
          const devUrl = redisPassword
            ? `redis://:${encodeURIComponent(redisPassword)}@${newDbUuid}:6379`
            : `redis://${newDbUuid}:6379`;
          dbReplacements.redis = devUrl;
          devDbConnectionStrings.push({
            name: devNameDb,
            type: "redis",
            url: devUrl,
            uuid: newDbUuid,
          });
          console.log("Created database:", devNameDb, newDbUuid);
        }
      } else {
        console.warn(
          `[${fullDb.name || db.uuid}] Unsupported database type: ${type}; skip.`
        );
      }
    }
  } else if (!noDatabases && dryRun) {
    const dbsRes = await coolifyFetch("GET", "/databases");
    const dbList = Array.isArray(dbsRes) ? dbsRes : (dbsRes?.data ?? []);
    const prodDbs = dbList.filter(
      (d) => String(d.environment_id) === String(prodEnvId)
    );
    console.log("[dry-run] Would clone", prodDbs.length, "databases");
  }

  for (const app of prodApps) {
    const name = app.name || app.uuid;
    const full = await coolifyFetch("GET", `/applications/${app.uuid}`);
    const envsResApp = await coolifyFetch(
      "GET",
      `/applications/${app.uuid}/envs`
    );
    const envs = Array.isArray(envsResApp)
      ? envsResApp
      : (envsResApp?.envs ?? envsResApp?.data ?? []);

    const destUuid =
      DEV_DESTINATION_UUID ||
      full.destination_uuid ||
      full.destination?.uuid ||
      defaultDestUuid;
    if (!destUuid && !dryRun) {
      console.error(
        `[${name}] No destination UUID. Set COOLIFY_DEV_DESTINATION_UUID or ensure app has destination.`
      );
      continue;
    }

    const devName = buildAppName(full.name || name);
    const devDomains = buildDevDomains(
      full.fqdn ?? full.domains ?? full.public_domain,
      devName
    );

    if (dryRun) {
      console.log(
        "[dry-run] Would create app:",
        devName,
        "domains:",
        devDomains || "(same pattern as prod)"
      );
      continue;
    }

    const appServerUuid =
      full.server?.uuid ??
      full.server_uuid ??
      full.destination?.server?.uuid ??
      full.destination?.server_uuid ??
      serverUuid;
    if (!appServerUuid && !dryRun) {
      console.error(
        `[${name}] Missing server_uuid for application. Set COOLIFY_SERVER_UUID in .env`
      );
      continue;
    }
    const payload = {
      project_uuid: projectUuid,
      server_uuid: appServerUuid,
      environment_uuid: devEnvUuid,
      destination_uuid: destUuid,
      name: devName,
      domains: devDomains || undefined,
      force_domain_override: true,
    };

    let newUuid;
    const hasImage =
      full.docker_registry_image_name || full.docker_registry_image_tag;
    if (hasImage) {
      Object.assign(payload, {
        docker_registry_image_name:
          full.docker_registry_image_name ||
          full.docker_registry_image_tag ||
          "",
        docker_registry_image_tag:
          full.docker_registry_image_tag || full.docker_registry_image_name
            ? "latest"
            : "latest",
        ports_exposes: full.ports_exposes ?? full.ports_mappings ?? "",
        ports_mappings: full.ports_mappings ?? "",
        health_check_enabled: full.health_check_enabled ?? false,
        health_check_path: full.health_check_path,
        health_check_port: full.health_check_port,
      });
      const created = await coolifyFetch(
        "POST",
        "/applications/dockerimage",
        payload
      );
      newUuid = created?.uuid ?? created?.data?.uuid;
    } else {
      const gitRepo = normalizeGitRepository(
        full.git_repository ?? full.git_full_url ?? ""
      );
      if (!gitRepo) {
        console.warn(
          `[${name}] Skipping: git_repository invalid or missing (must start with https://, http://, git://, or git@). Got: ${(full.git_repository ?? full.git_full_url ?? "").slice(0, 60)}`
        );
        continue;
      }
      Object.assign(payload, {
        git_repository: gitRepo,
        git_branch: full.git_branch ?? "main",
        build_pack: full.build_pack ?? "nixpacks",
        ports_exposes: full.ports_exposes ?? full.ports_mappings ?? "",
        base_directory: full.base_directory,
        publish_directory: full.publish_directory,
        install_command: full.install_command,
        build_command: full.build_command,
        start_command: full.start_command,
        dockerfile_location: full.dockerfile_location,
        dockerfile: full.dockerfile,
        health_check_enabled: full.health_check_enabled ?? false,
        health_check_path: full.health_check_path,
        health_check_port: full.health_check_port,
      });
      const created = await coolifyFetch(
        "POST",
        "/applications/public",
        payload
      );
      newUuid = created?.uuid ?? created?.data?.uuid;
    }

    if (!newUuid) {
      console.error(`[${name}] Create failed, response missing uuid`);
      continue;
    }
    console.log("Created app:", devName, newUuid);

    const devEnvs = envVarsToDev(envs, dbReplacements);
    if (devEnvs.length) {
      await coolifyFetch("PATCH", `/applications/${newUuid}/envs/bulk`, {
        data: devEnvs,
      });
      console.log("  env vars:", devEnvs.length);
    }

    if (!noDeploy) {
      await coolifyFetch(
        "GET",
        `/deploy?uuid=${encodeURIComponent(newUuid)}&force=false`
      );
      console.log("  deploy triggered");
    }
  }

  if (devDbConnectionStrings.length) {
    console.log(
      "\n--- Dev database connection strings (for pgAdmin or app env) ---"
    );
    devDbConnectionStrings.forEach(({ name, type, url, uuid }) => {
      const safe = url.replace(/:[^:@]+@/, ":****@");
      console.log(`  ${name} (${type}) [${uuid}]: ${safe}`);
    });
    console.log(
      "  Add these as servers in pgAdmin (Host = UUID, Port = 5432, password from COOLIFY_DEV_DB_PASSWORD or above)."
    );
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
