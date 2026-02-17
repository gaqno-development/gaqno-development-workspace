const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

function maskUrl(url) {
  try {
    return url.replace(/:[^:@]+@/, ":****@");
  } catch {
    return "(hidden)";
  }
}

function parseDbName(url) {
  try {
    return url.split("/").pop()?.split("?")[0] || "unknown";
  } catch {
    return "unknown";
  }
}

function timeSince(date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function formatRows(n) {
  if (n < 0) return "err";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

class PushDbReporter {
  constructor(serviceName, client, connectionUrl) {
    this.serviceName = serviceName;
    this.client = client;
    this.connectionUrl = connectionUrl;
    this.globalStart = Date.now();
    this.steps = [];
  }

  async init() {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        id SERIAL PRIMARY KEY,
        service VARCHAR(255) NOT NULL,
        step VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        duration_ms INTEGER
      );
    `);
  }

  async printHeader() {
    const dbName = parseDbName(this.connectionUrl);
    let pgVer = "";
    try {
      const r = await this.client.query("SELECT version()");
      pgVer = r.rows[0].version.split(",")[0];
    } catch {}

    const title = `${this.serviceName} — push-db`;
    const pad = Math.max(0, 40 - title.length);

    console.log();
    console.log(
      `${BOLD}${"═".repeat(44)}${RESET}`
    );
    console.log(`${BOLD}  ${title}${" ".repeat(pad)}${RESET}`);
    console.log(
      `${BOLD}${"═".repeat(44)}${RESET}`
    );
    console.log();
    console.log(`  ${BOLD}Database:${RESET}   ${dbName}`);
    console.log(`  ${BOLD}Server:${RESET}     ${DIM}${pgVer}${RESET}`);
    console.log(
      `  ${BOLD}Connection:${RESET} ${DIM}${maskUrl(this.connectionUrl)}${RESET}`
    );
    console.log();
  }

  async printExistingTables(prefixFilter) {
    const prefixes = Array.isArray(prefixFilter)
      ? prefixFilter
      : prefixFilter
        ? [prefixFilter]
        : [];

    let whereClause = "";
    if (prefixes.length > 0) {
      const conditions = prefixes
        .map((p) => `table_name LIKE '${p}%'`)
        .join(" OR ");
      whereClause = `AND (${conditions})`;
    }

    const r = await this.client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ${whereClause}
      ORDER BY table_name
    `);
    const tables = r.rows.map((row) => row.table_name);

    if (tables.length === 0) {
      console.log(`  ${DIM}(no tables found)${RESET}`);
      return tables;
    }

    const maxLen = Math.max(...tables.map((t) => t.length));

    for (const t of tables) {
      let rowCount = -1;
      try {
        const cr = await this.client.query(
          `SELECT COUNT(*)::int AS c FROM "${t}"`
        );
        rowCount = cr.rows[0].c;
      } catch {}
      const rowStr = formatRows(rowCount);
      console.log(
        `  ${CYAN}${t.padEnd(maxLen + 2)}${RESET}${DIM}${rowStr.padStart(8)} rows${RESET}`
      );
    }

    return tables;
  }

  async printLastMigration() {
    try {
      const r = await this.client.query(
        `SELECT step, applied_at, duration_ms
         FROM _schema_migrations
         WHERE service = $1
         ORDER BY applied_at DESC LIMIT 1`,
        [this.serviceName]
      );
      if (r.rows[0]) {
        const m = r.rows[0];
        const d = new Date(m.applied_at);
        const ago = timeSince(d);
        console.log(
          `  ${BOLD}Last run:${RESET} ${m.step} ${DIM}(${ago} ago, ${m.duration_ms ?? "?"}ms)${RESET}`
        );
      } else {
        console.log(`  ${BOLD}Last run:${RESET} ${DIM}(first time)${RESET}`);
      }
    } catch {
      console.log(
        `  ${BOLD}Last run:${RESET} ${DIM}(tracking table not found)${RESET}`
      );
    }
    console.log();
  }

  async step(name, fn) {
    const start = Date.now();
    process.stdout.write(`  ${YELLOW}⟳${RESET} ${name}...`);
    try {
      await fn();
      const ms = Date.now() - start;
      process.stdout.write(
        `\r  ${GREEN}✓${RESET} ${name} ${DIM}(${ms}ms)${RESET}\n`
      );
      this.steps.push({ name, ms, ok: true });
      try {
        await this.client.query(
          "INSERT INTO _schema_migrations (service, step, duration_ms) VALUES ($1, $2, $3)",
          [this.serviceName, name, ms]
        );
      } catch {}
    } catch (err) {
      const ms = Date.now() - start;
      process.stdout.write(
        `\r  ${RED}✗${RESET} ${name} ${DIM}(${ms}ms)${RESET}\n`
      );
      this.steps.push({ name, ms, ok: false });
      throw err;
    }
  }

  async printSummary(prefixFilter) {
    const total = Date.now() - this.globalStart;
    const passed = this.steps.filter((s) => s.ok).length;

    console.log();
    console.log(`  ${BOLD}Tables after migration:${RESET}`);
    await this.printExistingTables(prefixFilter);

    console.log();
    console.log(
      `  ${BOLD}Steps:${RESET} ${passed}/${this.steps.length} completed in ${total}ms`
    );
    if (passed === this.steps.length) {
      console.log(`  ${GREEN}${BOLD}Schema ensured successfully!${RESET}`);
    } else {
      console.log(`  ${RED}${BOLD}Some steps failed.${RESET}`);
    }
    console.log();
  }
}

module.exports = { PushDbReporter, maskUrl, parseDbName };
