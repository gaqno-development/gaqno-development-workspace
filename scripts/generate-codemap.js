#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class CodemapGenerator {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.packages = [];
    this.dependencies = new Map();
    this.devDependencies = new Map();
    this.workspaceDependencies = new Map();
    this.servicePorts = new Map();
    this.mfeMappings = new Map();
  }

  async generateCodemap() {
    console.log("🔍 Analyzing Gaqno Development Workspace...");

    await this.analyzeWorkspace();
    await this.analyzePackageDependencies();
    await this.detectServicePorts();
    await this.detectMFEMappings();

    const codemap = {
      metadata: {
        generated: new Date().toISOString(),
        workspaceRoot: this.workspaceRoot,
        totalPackages: this.packages.length,
        generator: "gaqno-codemap-generator",
      },
      packages: this.packages,
      dependencies: Object.fromEntries(this.dependencies),
      devDependencies: Object.fromEntries(this.devDependencies),
      workspaceDependencies: Object.fromEntries(this.workspaceDependencies),
      servicePorts: Object.fromEntries(this.servicePorts),
      mfeMappings: Object.fromEntries(this.mfeMappings),
      architecture: this.generateArchitectureMap(),
      visualizations: this.generateVisualizations(),
    };

    await this.saveCodemap(codemap);
    await this.generateHTMLViewer(codemap);

    console.log("✅ Codemap generation complete!");
    console.log(
      `📊 Codemap saved to: ${path.join(this.workspaceRoot, "codemap.json")}`,
    );
    console.log(
      `🌐 HTML viewer: ${path.join(this.workspaceRoot, "codemap-viewer.html")}`,
    );
  }

  async analyzeWorkspace() {
    const packageJsonPath = path.join(this.workspaceRoot, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    this.packages = packageJson.workspaces || [];

    // Categorize packages
    this.sharedPackages = this.packages.filter((pkg) => pkg.startsWith("@"));
    this.services = this.packages.filter(
      (pkg) => pkg.includes("service") && !pkg.startsWith("@"),
    );
    this.uiPackages = this.packages.filter(
      (pkg) => pkg.includes("-ui") && !pkg.startsWith("@"),
    );

    console.log(`📦 Found ${this.packages.length} packages:`);
    console.log(`   • Shared: ${this.sharedPackages.length}`);
    console.log(`   • Services: ${this.services.length}`);
    console.log(`   • UIs: ${this.uiPackages.length}`);
  }

  async analyzePackageDependencies() {
    console.log("🔗 Analyzing dependencies...");

    for (const pkg of this.packages) {
      const pkgPath = path.join(this.workspaceRoot, pkg);
      const packageJsonPath = path.join(pkgPath, "package.json");

      if (!fs.existsSync(packageJsonPath)) continue;

      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8"),
        );

        // Analyze dependencies
        const deps = packageJson.dependencies || {};
        const devDeps = packageJson.devDependencies || {};

        // Filter for workspace dependencies
        const workspaceDeps = {};
        const externalDeps = {};

        Object.entries(deps).forEach(([name, version]) => {
          if (this.isWorkspaceDependency(name, version)) {
            workspaceDeps[name] = version;
          } else {
            externalDeps[name] = version;
          }
        });

        this.dependencies.set(pkg, externalDeps);
        this.workspaceDependencies.set(pkg, workspaceDeps);

        // Store dev dependencies separately
        this.devDependencies.set(pkg, devDeps);
      } catch (error) {
        console.warn(`⚠️  Could not analyze ${pkg}: ${error.message}`);
      }
    }
  }

  isWorkspaceDependency(name, version) {
    // Check if it's a workspace package
    if (name.startsWith("@gaqno-development/")) return true;
    if (this.packages.includes(name)) return true;
    if (version.startsWith("workspace:")) return true;
    if (version === "*") return true;
    return false;
  }

  async detectServicePorts() {
    console.log("🚪 Detecting service ports...");

    // Default port mappings based on package.json scripts
    const defaultPorts = {
      "gaqno-sso-service": 4001,
      "gaqno-admin-service": 4010,
      "gaqno-saas-service": 4009,
      "gaqno-ai-service": 4002,
      "gaqno-finance-service": 4003,
      "gaqno-pdv-service": 4004,
      "gaqno-rpg-service": 4005,
      "gaqno-wellness-service": 4006,
      "gaqno-omnichannel-service": 4007,
      "gaqno-lead-enrichment-service": 4008,
    };

    // UI ports
    const defaultUIPorts = {
      "gaqno-shell-ui": 3000,
      "gaqno-sso-ui": 3001,
      "gaqno-ai-ui": 3002,
      "gaqno-crm-ui": 3003,
      "gaqno-erp-ui": 3004,
      "gaqno-finance-ui": 3005,
      "gaqno-pdv-ui": 3006,
      "gaqno-rpg-ui": 3007,
      "gaqno-wellness-ui": 3008,
      "gaqno-admin-ui": 3009,
      "gaqno-saas-ui": 3010,
      "gaqno-omnichannel-ui": 3011,
      "gaqno-landing-ui": 3012,
      "gaqno-lenin-ui": 3013,
    };

    this.servicePorts = new Map(
      Object.entries({ ...defaultPorts, ...defaultUIPorts }),
    );
  }

  async detectMFEMappings() {
    console.log("🔗 Detecting MFE mappings...");

    // Shell UI is the host
    this.mfeMappings.set("gaqno-shell-ui", { type: "host", remotes: [] });

    // Other UIs are remotes
    this.uiPackages.forEach((uiPkg) => {
      if (uiPkg !== "gaqno-shell-ui") {
        const serviceName = uiPkg.replace("-ui", "");
        this.mfeMappings.set(uiPkg, {
          type: "remote",
          service: `gaqno-${serviceName}-service`,
          port: this.servicePorts.get(uiPkg),
        });

        // Add to shell's remotes
        const shell = this.mfeMappings.get("gaqno-shell-ui");
        if (shell) {
          shell.remotes.push(uiPkg);
        }
      }
    });
  }

  generateArchitectureMap() {
    return {
      layers: {
        shared: {
          packages: this.sharedPackages,
          description: "Shared libraries and utilities",
          dependencies: [],
        },
        services: {
          packages: this.services,
          description: "NestJS backend services",
          dependencies: this.sharedPackages,
        },
        ui: {
          packages: this.uiPackages,
          description: "React frontend micro-applications",
          dependencies: this.sharedPackages,
        },
      },
      dataFlow: this.generateDataFlow(),
      buildOrder: this.generateBuildOrder(),
    };
  }

  generateDataFlow() {
    const flow = [];

    // Shared packages build first
    flow.push({
      stage: 1,
      description: "Build shared packages",
      packages: [
        "@gaqno-types",
        "@gaqno-backcore",
        "@gaqno-frontcore",
        "@gaqno-agent",
      ],
    });

    // Services build next
    flow.push({
      stage: 2,
      description: "Build backend services",
      packages: this.services,
    });

    // UI packages build last
    flow.push({
      stage: 3,
      description: "Build frontend applications",
      packages: this.uiPackages,
    });

    return flow;
  }

  generateBuildOrder() {
    // Based on turbo.json dependencies
    return {
      shared: [
        "@gaqno-types",
        "@gaqno-backcore",
        "@gaqno-frontcore",
        "@gaqno-agent",
      ],
      services: this.services.sort(),
      ui: this.uiPackages.sort(),
    };
  }

  generateVisualizations() {
    return {
      mermaid: {
        architecture: this.generateMermaidArchitecture(),
        dependencyGraph: this.generateMermaidDependencies(),
        dataFlow: this.generateMermaidDataFlow(),
      },
    };
  }

  generateMermaidArchitecture() {
    let mermaid = "graph TB\n";

    // Add shared packages
    mermaid += '  subgraph Shared["Shared Packages"]\n';
    this.sharedPackages.forEach((pkg) => {
      mermaid += `    ${pkg.replace(/[@/-]/g, "_")}["${pkg}"]\n`;
    });
    mermaid += "  end\n\n";

    // Add services
    mermaid += '  subgraph Services["Backend Services"]\n';
    this.services.forEach((service) => {
      const port = this.servicePorts.get(service) || "4xxx";
      mermaid += `    ${service.replace(/[@/-]/g, "_")}["${service}<br/>:${port}"]\n`;
    });
    mermaid += "  end\n\n";

    // Add UI packages
    mermaid += '  subgraph UI["Frontend Applications"]\n';
    this.uiPackages.forEach((ui) => {
      const port = this.servicePorts.get(ui) || "3xxx";
      const isHost = ui === "gaqno-shell-ui";
      mermaid += `    ${ui.replace(/[@/-]/g, "_")}["${ui}<br/>:${port}${isHost ? " (host)" : ""}"]\n`;
    });
    mermaid += "  end\n\n";

    // Add dependencies
    this.workspaceDependencies.forEach((deps, pkg) => {
      const fromId = pkg.replace(/[@/-]/g, "_");
      Object.keys(deps).forEach((dep) => {
        const toId = dep.replace(/[@/-]/g, "_");
        mermaid += `  ${fromId} --> ${toId}\n`;
      });
    });

    return mermaid;
  }

  generateMermaidDependencies() {
    let mermaid = "graph LR\n";

    this.packages.forEach((pkg) => {
      const pkgId = pkg.replace(/[@/-]/g, "_");
      const deps = this.workspaceDependencies.get(pkg) || {};

      Object.keys(deps).forEach((dep) => {
        const depId = dep.replace(/[@/-]/g, "_");
        mermaid += `  ${pkgId}["${pkg}"] --> ${depId}["${dep}"]\n`;
      });
    });

    return mermaid;
  }

  generateMermaidDataFlow() {
    let mermaid = "flowchart TD\n";

    mermaid += '  subgraph "Build Pipeline"\n';
    mermaid += "    A[Types] --> B[Backcore & Frontcore]\n";
    mermaid += "    B --> C[Services]\n";
    mermaid += "    B --> D[UI Applications]\n";
    mermaid += "  end\n\n";

    mermaid += '  subgraph "Runtime Flow"\n';
    mermaid += "    E[Users] --> F[Shell UI]\n";
    mermaid += "    F --> G[MFE Remotes]\n";
    mermaid += "    G --> H[Backend Services]\n";
    mermaid += "  end\n";

    return mermaid;
  }

  async saveCodemap(codemap) {
    const outputPath = path.join(this.workspaceRoot, "codemap.json");
    fs.writeFileSync(outputPath, JSON.stringify(codemap, null, 2));
  }

  async generateHTMLViewer(codemap) {
    const html = this.generateHTMLContent(codemap);
    const outputPath = path.join(this.workspaceRoot, "codemap-viewer.html");
    fs.writeFileSync(outputPath, html);
  }

  generateHTMLContent(codemap) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gaqno Development Workspace - Codemap</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        .mermaid { 
            background: white; 
            border-radius: 8px; 
            padding: 16px; 
            margin: 16px 0;
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .package-card {
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .package-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen p-8">
        <header class="mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">Gaqno Development Workspace</h1>
            <p class="text-gray-600">Interactive Codemap & Architecture Visualization</p>
            <div class="mt-4 text-sm text-gray-500">
                Generated: ${new Date(codemap.metadata.generated).toLocaleString()}
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Packages</h3>
                <p class="text-3xl font-bold text-blue-600">${codemap.metadata.totalPackages}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Shared Libraries</h3>
                <p class="text-3xl font-bold text-green-600">${codemap.architecture.layers.shared.packages.length}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Services</h3>
                <p class="text-3xl font-bold text-purple-600">${codemap.architecture.layers.services.packages.length}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">UI Applications</h3>
                <p class="text-3xl font-bold text-orange-600">${codemap.architecture.layers.ui.packages.length}</p>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow">
            <div class="border-b border-gray-200">
                <nav class="flex space-x-8 px-6" aria-label="Tabs">
                    <button onclick="showTab('architecture')" class="tab-button py-4 px-1 border-b-2 font-medium text-sm border-blue-500 text-blue-600" data-tab="architecture">
                        Architecture
                    </button>
                    <button onclick="showTab('dependencies')" class="tab-button py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-tab="dependencies">
                        Dependencies
                    </button>
                    <button onclick="showTab('packages')" class="tab-button py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-tab="packages">
                        Packages
                    </button>
                    <button onclick="showTab('data')" class="tab-button py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-tab="data">
                        Data Flow
                    </button>
                </nav>
            </div>

            <div class="p-6">
                <div id="architecture" class="tab-content active">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">System Architecture</h2>
                    <div class="mermaid">${codemap.visualizations.mermaid.architecture}</div>
                </div>

                <div id="dependencies" class="tab-content">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">Dependency Graph</h2>
                    <div class="mermaid">${codemap.visualizations.mermaid.dependencyGraph}</div>
                </div>

                <div id="packages" class="tab-content">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">Package Details</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.generatePackageCards(codemap)}
                    </div>
                </div>

                <div id="data" class="tab-content">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">Data Flow & Build Pipeline</h2>
                    <div class="mermaid">${codemap.visualizations.mermaid.dataFlow}</div>
                    
                    <h3 class="text-xl font-semibold text-gray-900 mt-8 mb-4">Build Order</h3>
                    <div class="space-y-4">
                        ${
                          codemap.architecture.buildOrder.shared.length > 0
                            ? `
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 class="font-semibold text-green-900 mb-2">Stage 1: Shared Packages</h4>
                            <div class="flex flex-wrap gap-2">
                                ${codemap.architecture.buildOrder.shared
                                  .map(
                                    (pkg) =>
                                      `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">${pkg}</span>`,
                                  )
                                  .join("")}
                            </div>
                        </div>
                        `
                            : ""
                        }
                        
                        ${
                          codemap.architecture.buildOrder.services.length > 0
                            ? `
                        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <h4 class="font-semibold text-purple-900 mb-2">Stage 2: Backend Services</h4>
                            <div class="flex flex-wrap gap-2">
                                ${codemap.architecture.buildOrder.services
                                  .map(
                                    (pkg) =>
                                      `<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">${pkg}</span>`,
                                  )
                                  .join("")}
                            </div>
                        </div>
                        `
                            : ""
                        }
                        
                        ${
                          codemap.architecture.buildOrder.ui.length > 0
                            ? `
                        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <h4 class="font-semibold text-orange-900 mb-2">Stage 3: Frontend Applications</h4>
                            <div class="flex flex-wrap gap-2">
                                ${codemap.architecture.buildOrder.ui
                                  .map(
                                    (pkg) =>
                                      `<span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">${pkg}</span>`,
                                  )
                                  .join("")}
                            </div>
                        </div>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        mermaid.initialize({ startOnLoad: true });
        
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active state from all buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('border-blue-500', 'text-blue-600');
                btn.classList.add('border-transparent', 'text-gray-500');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            
            // Add active state to clicked button
            const activeBtn = document.querySelector(\`[data-tab="\${tabName}"]\`);
            activeBtn.classList.remove('border-transparent', 'text-gray-500');
            activeBtn.classList.add('border-blue-500', 'text-blue-600');
        }
    </script>
</body>
</html>`;
  }

  generatePackageCards(codemap) {
    const cards = [];

    codemap.packages.forEach((pkg) => {
      const deps = codemap.workspaceDependencies[pkg] || {};
      const port = codemap.servicePorts[pkg];
      const mfeInfo = codemap.mfeMappings[pkg];

      let type = "package";
      let color = "blue";

      if (pkg.startsWith("@")) {
        type = "shared";
        color = "green";
      } else if (pkg.includes("service")) {
        type = "service";
        color = "purple";
      } else if (pkg.includes("-ui")) {
        type = "ui";
        color = "orange";
      }

      const depCount = Object.keys(deps).length;

      cards.push(`
        <div class="package-card bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold text-gray-900">${pkg}</h3>
                <span class="bg-${color}-100 text-${color}-800 px-2 py-1 rounded text-xs">${type}</span>
            </div>
            ${port ? `<p class="text-sm text-gray-600 mb-2">Port: ${port}</p>` : ""}
            ${mfeInfo ? `<p class="text-sm text-gray-600 mb-2">MFE: ${mfeInfo.type}</p>` : ""}
            <div class="text-sm text-gray-500">
                Dependencies: ${depCount}
            </div>
            ${
              depCount > 0
                ? `
            <div class="mt-2 text-xs text-gray-400">
                ${Object.keys(deps).slice(0, 3).join(", ")}${depCount > 3 ? "..." : ""}
            </div>
            `
                : ""
            }
        </div>
      `);
    });

    return cards.join("");
  }
}

// Run the generator
if (require.main === module) {
  const workspaceRoot = process.cwd();
  const generator = new CodemapGenerator(workspaceRoot);
  generator.generateCodemap().catch(console.error);
}

module.exports = CodemapGenerator;
