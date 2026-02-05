#!/usr/bin/env node
/**
 * Creates a new gaqno project with UI and Service.
 *
 * Usage: node scripts/create-project.js <name> [--ui-port=3XXX] [--service-port=4XXX]
 *
 * Example: node scripts/create-project.js inventory --ui-port=3011 --service-port=4011
 *
 * Default ports: 3011 (UI), 4011 (Service)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function parseArgs() {
  const args = process.argv.slice(2);
  const name = args.find((a) => !a.startsWith("--"));
  const uiPort = parseInt(
    args.find((a) => a.startsWith("--ui-port="))?.split("=")[1] || "3011",
    10
  );
  const servicePort = parseInt(
    args.find((a) => a.startsWith("--service-port="))?.split("=")[1] || "4011",
    10
  );
  const install = args.includes("--install");
  if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error(
      "Usage: node scripts/create-project.js <name> [--ui-port=3XXX] [--service-port=4XXX] [--install]"
    );
    console.error(
      "  name: lowercase, alphanumeric and hyphens (e.g. inventory, my-module)"
    );
    console.error(
      "  --install: run npm install in each package after creation"
    );
    process.exit(1);
  }
  return { name, uiPort, servicePort, install };
}

function toPascalCase(str) {
  return str
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function createService({ name, servicePort }) {
  const dir = path.join(ROOT, `gaqno-${name}-service`);
  if (fs.existsSync(dir)) {
    console.error(`gaqno-${name}-service already exists`);
    process.exit(1);
  }

  const pascal = toPascalCase(name);
  const desc = `Gaqno ${pascal} - ${name} management service`;

  const files = {
    "package.json": JSON.stringify(
      {
        name: `gaqno-${name}-service`,
        version: "0.0.1",
        description: desc,
        private: true,
        license: "UNLICENSED",
        scripts: {
          prepare: "husky",
          build: "nest build",
          start: "nest start",
          "start:dev": "nest start --watch",
          "start:prod": "node dist/main.js",
          lint: 'eslint "{src,test}/**/*.ts" --fix',
          test: `echo "No tests in gaqno-${name}-service"`,
        },
        dependencies: {
          "@nestjs/common": "^11.0.1",
          "@nestjs/config": "^3.2.2",
          "@nestjs/core": "^11.0.1",
          "@nestjs/platform-express": "^11.0.1",
          "reflect-metadata": "^0.2.2",
          rxjs: "^7.8.1",
        },
        devDependencies: {
          "@nestjs/cli": "^11.0.0",
          "@types/express": "^5.0.0",
          "@types/node": "^22.10.7",
          eslint: "^9.18.0",
          typescript: "^5.7.3",
          husky: "^9.1.7",
          "@commitlint/cli": "^19.6.1",
          "@commitlint/config-conventional": "^19.6.0",
        },
      },
      null,
      2
    ),
    "nest-cli.json": JSON.stringify(
      {
        $schema: "https://json.schemastore.org/nest-cli",
        collection: "@nestjs/schematics",
        sourceRoot: "src",
        compilerOptions: { deleteOutDir: true },
      },
      null,
      2
    ),
    "tsconfig.json": JSON.stringify(
      {
        compilerOptions: {
          module: "nodenext",
          moduleResolution: "nodenext",
          declaration: true,
          removeComments: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          allowSyntheticDefaultImports: true,
          target: "ES2023",
          sourceMap: true,
          outDir: "./dist",
          baseUrl: "./",
          incremental: true,
          skipLibCheck: true,
          strictNullChecks: true,
          noImplicitAny: true,
          esModuleInterop: true,
          resolveJsonModule: true,
        },
      },
      null,
      2
    ),
    "tsconfig.build.json": JSON.stringify(
      {
        extends: "./tsconfig.json",
        exclude: ["node_modules", "test", "dist", "**/*spec.ts"],
      },
      null,
      2
    ),
    ".gitignore": "/dist\n/node_modules\n.env\n*.log\n",
    "commitlint.config.js": `/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'header-max-length': [2, 'always', 100],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
  },
};
`,
    "src/main.ts": `import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? ${servicePort};
  const corsOrigin = process.env.CORS_ORIGIN ?? "*";

  app.enableCors({
    origin:
      corsOrigin === "*" ? true : corsOrigin.split(",").map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.listen(port);
  console.log(\`${pascal} Service is running on: http://localhost:\${port}\`);
}

bootstrap();
`,
    "src/app.module.ts": `import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
`,
    Dockerfile: `FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY .npmrc* ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN --mount=type=cache,target=/root/.npm \\
    npm config set fetch-timeout 1200000 && \\
    npm config set fetch-retries 10 && \\
    npm install --legacy-peer-deps --include=dev

COPY src ./src

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.npmrc* ./
COPY --from=builder /app/dist ./dist

RUN --mount=type=cache,target=/root/.npm \\
    npm config set fetch-timeout 1200000 && \\
    npm config set fetch-retries 10 && \\
    npm install --omit=dev --legacy-peer-deps

ENV NODE_ENV=production
EXPOSE ${servicePort}
CMD ["node", "dist/main.js"]
`,
  };

  for (const [rel, content] of Object.entries(files)) {
    writeFile(path.join(dir, rel), content);
  }
  console.log(`Created gaqno-${name}-service (port ${servicePort})`);
}

function createUI({ name, uiPort }) {
  const dir = path.join(ROOT, `gaqno-${name}-ui`);
  if (fs.existsSync(dir)) {
    console.error(`gaqno-${name}-ui already exists`);
    process.exit(1);
  }

  const pascal = toPascalCase(name);
  const basePath = `/${name}/`;

  const files = {
    "package.json": JSON.stringify(
      {
        name: name,
        version: "0.0.0",
        private: true,
        scripts: {
          prepare: "husky",
          dev: `nodemon --watch ./src --ext js,ts,jsx,tsx,json --exec "vite build && vite preview --port ${uiPort} --strictPort --host 0.0.0.0"`,
          build: "vite build",
          preview: `vite preview --port ${uiPort} --host 0.0.0.0`,
          start: `vite preview --port ${uiPort} --host 0.0.0.0`,
          lint: "eslint . --ext .ts,.tsx",
          test: `echo "No tests in gaqno-${name}-ui"`,
        },
        dependencies: {
          "@gaqno-development/frontcore": "^1.0.27",
          "@tanstack/react-query": "^5.90.12",
          "lucide-react": "^0.468.0",
          react: "^18",
          "react-dom": "^18",
          "react-router-dom": "^6.26.0",
          zod: "^3.25.76",
        },
        devDependencies: {
          "@module-federation/vite": "^1.0.0",
          "@originjs/vite-plugin-federation": "^1.4.1",
          "@tailwindcss/vite": "^4.1.18",
          "@types/react": "^18.3.27",
          "@types/react-dom": "^18.3.7",
          "@vitejs/plugin-react": "^4.3.1",
          eslint: "^8.57.0",
          nodemon: "^3.1.11",
          tailwindcss: "^4.1.18",
          "tailwindcss-animate": "^1.0.7",
          typescript: "5.9.3",
          vite: "^5.4.0",
          husky: "^9.1.7",
          "@commitlint/cli": "^19.6.1",
          "@commitlint/config-conventional": "^19.6.0",
        },
        overrides: {
          "@gaqno-development/core": "npm:@gaqno-development/frontcore@^1.0.27",
        },
      },
      null,
      2
    ),
    "vite.config.ts": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import path from "path";

export default defineConfig(async () => {
  const tailwindcss = (await import("@tailwindcss/vite")).default;

  return {
    base: "${basePath}",
    server: {
      port: ${uiPort},
      origin: "http://localhost:${uiPort}",
      fs: {
        allow: [".", "../shared"],
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      federation({
        name: "${name}",
        filename: "remoteEntry.js",
        exposes: {
          "./App": "./src/App.tsx",
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: "^18.0.0",
            eager: true,
          },
          "react-dom": {
            singleton: true,
            requiredVersion: "^18.0.0",
            eager: true,
          },
          "react-router-dom": {
            singleton: true,
            requiredVersion: "^6.0.0",
          },
          "@tanstack/react-query": {
            singleton: true,
            requiredVersion: "^5.0.0",
          },
          zustand: {
            singleton: true,
            requiredVersion: "^4.0.0",
          },
        } as Record<string, unknown>,
      }),
    ],
    build: {
      modulePreload: false,
      target: "esnext",
      minify: false,
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          format: "es",
          assetFileNames: "assets/[name].[ext]",
        },
      },
    },
    optimizeDeps: {
      include: ["@gaqno-development/frontcore/styles/globals.css"],
    },
  };
});
`,
    "tsconfig.json": JSON.stringify(
      {
        extends: "@gaqno-development/frontcore/config/tsconfig.base.json",
        compilerOptions: {
          baseUrl: ".",
          paths: { "@/*": ["./src/*"] },
          jsx: "react-jsx",
          skipLibCheck: true,
          types: ["vite/client"],
        },
        include: ["src/vite-env.d.ts", "src/**/*.ts", "src/**/*.tsx"],
        exclude: ["node_modules"],
      },
      null,
      2
    ),
    "index.html": `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pascal} - Gaqno</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    "nodemon.json": JSON.stringify(
      {
        watch: ["src"],
        ext: "js,ts,jsx,tsx,json",
        exec: `vite build && vite preview --port ${uiPort} --strictPort --host 0.0.0.0`,
      },
      null,
      2
    ),
    ".gitignore": "/dist\n/node_modules\n.env\n*.log\n",
    "commitlint.config.js": `/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'header-max-length': [2, 'always', 100],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
  },
};
`,
    "src/main.tsx": `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "@gaqno-development/frontcore/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`,
    "src/App.tsx": `import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  QueryProvider,
  AuthProvider,
  TenantProvider,
} from "@gaqno-development/frontcore";

function ${pascal}Page() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">${pascal} Module</h1>
      <p className="text-muted-foreground mt-2">
        ${pascal} functionality coming soon...
      </p>
    </div>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            <Route path="/${name}" element={<${pascal}Page />} />
            <Route path="*" element={<Navigate to="/${name}" replace />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
`,
    "src/vite-env.d.ts": `/// <reference types="vite/client" />

declare module "*.svg" {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}
`,
    "src/config/environment.ts": `export default {};
`,
    "src/components/.gitkeep": "",
    "src/hooks/index.ts": `export {};
`,
    "src/lib/.gitkeep": "",
    "src/pages/.gitkeep": "",
    "src/types/.gitkeep": "",
    "src/utils/.gitkeep": "",
    Dockerfile: `FROM node:20-alpine AS base
RUN apk add --no-cache git libc6-compat

FROM base AS builder
WORKDIR /app

COPY package.json ./
COPY .npmrc* ./
RUN --mount=type=cache,target=/root/.npm \\
    npm config set fetch-timeout 1200000 && \\
    npm config set fetch-retries 10 && \\
    npm install --legacy-peer-deps --include=dev

COPY . .
RUN mkdir -p public
RUN npm run build

FROM nginx:alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/public /usr/share/nginx/html/public

RUN echo 'server { listen ${uiPort}; server_name _; root /usr/share/nginx/html; index index.html; absolute_redirect off; \\
    location ${basePath}assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; } \\
    location /assets/ { alias /usr/share/nginx/html/assets/; add_header Cache-Control "public, immutable"; add_header Access-Control-Allow-Origin "*"; } \\
    location ${basePath} { try_files $uri $uri/ /index.html; } \\
    location / { return 302 ${basePath}; } }' > /etc/nginx/conf.d/default.conf

EXPOSE ${uiPort}
CMD ["nginx", "-g", "daemon off;"]
`,
  };

  for (const [rel, content] of Object.entries(files)) {
    writeFile(path.join(dir, rel), content);
  }
  console.log(`Created gaqno-${name}-ui (port ${uiPort})`);
}

function updateWorkspaces(name) {
  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const workspaces = pkg.workspaces || [];
  const ui = `gaqno-${name}-ui`;
  const svc = `gaqno-${name}-service`;
  if (!workspaces.includes(ui)) workspaces.push(ui);
  if (!workspaces.includes(svc)) workspaces.push(svc);
  workspaces.sort();
  pkg.workspaces = workspaces;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
  console.log("Updated root package.json workspaces");
}

function setupHusky(name) {
  const addHusky = path.join(ROOT, "scripts", "add-husky-to-package.js");
  if (!fs.existsSync(addHusky)) return;
  const uiPkg = path.join(ROOT, `gaqno-${name}-ui`, "package.json");
  const svcPkg = path.join(ROOT, `gaqno-${name}-service`, "package.json");
  try {
    require("child_process").execSync(`node "${addHusky}" "${uiPkg}"`, {
      stdio: "inherit",
    });
    require("child_process").execSync(`node "${addHusky}" "${svcPkg}"`, {
      stdio: "inherit",
    });
  } catch (_) {
    console.warn("Husky setup skipped (run manually if needed)");
  }
}

function runInstall(name) {
  const { execSync } = require("child_process");
  const uiDir = path.join(ROOT, `gaqno-${name}-ui`);
  const svcDir = path.join(ROOT, `gaqno-${name}-service`);
  console.log("\nInstalling dependencies...");
  try {
    execSync("npm install --legacy-peer-deps", {
      cwd: uiDir,
      stdio: "inherit",
    });
    execSync("npm install --legacy-peer-deps", {
      cwd: svcDir,
      stdio: "inherit",
    });
  } catch (e) {
    console.warn(
      "Install failed - run manually: npm install --legacy-peer-deps in each package"
    );
  }
}

function main() {
  const { name, uiPort, servicePort, install } = parseArgs();
  console.log(
    `Creating project: ${name} (UI: ${uiPort}, Service: ${servicePort})\n`
  );
  createService({ name, servicePort });
  createUI({ name, uiPort });
  updateWorkspaces(name);
  setupHusky(name);
  if (install) runInstall(name);
  console.log("\nDone! Next steps:");
  if (!install)
    console.log(
      `  1. npm install (from workspace root) or install in each package`
    );
  console.log(
    `  ${install ? "1" : "2"}. Add MFE_${name.toUpperCase()}_URL to gaqno-shell-ui vite.config.ts`
  );
  console.log(
    `  ${install ? "2" : "3"}. Add /${name} routes to gaqno-shell-ui App.tsx`
  );
  console.log(
    `  ${install ? "3" : "4"}. Add VITE_SERVICE_${name.toUpperCase()}_URL to frontend env`
  );
  console.log(
    `  ${install ? "4" : "5"}. Add dev:${name} and dev:${name}-service to root package.json scripts`
  );
}

main();
