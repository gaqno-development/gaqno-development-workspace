const path = require('path');
const fs = require('fs');

const findWorkspaceRoot = (startPath) => {
  let currentPath = startPath;
  while (currentPath !== path.dirname(currentPath)) {
    const packageJsonPath = path.join(currentPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.workspaces) {
          return currentPath;
        }
      } catch (e) {}
    }
    currentPath = path.dirname(currentPath);
  }
  return null;
};

const createBaseNextConfig = (options = {}) => {
  const { assetPrefix, ...customConfig } = options;

  return {
    reactStrictMode: true,
    output: 'standalone',
    transpilePackages: ["@gaqno-development/frontcore", "@gaqno-development/core"],
    ...(assetPrefix && { assetPrefix }),
    experimental: {
      missingSuspenseWithCSRBailout: false,
    },
    webpack: (config, { dir }) => {
      const workspaceRoot = findWorkspaceRoot(dir);
      const nodeModulesPath = workspaceRoot 
        ? path.join(workspaceRoot, 'node_modules')
        : path.join(dir, 'node_modules');

      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(dir, './src'),
        'react-hook-form': path.resolve(nodeModulesPath, 'react-hook-form'),
        '@hookform/resolvers': path.resolve(nodeModulesPath, '@hookform/resolvers'),
        '@tanstack/react-query': path.resolve(nodeModulesPath, '@tanstack/react-query'),
        'zod': path.resolve(nodeModulesPath, 'zod'),
      };
      return config;
    },
    ...customConfig,
  };
};

module.exports = createBaseNextConfig;

