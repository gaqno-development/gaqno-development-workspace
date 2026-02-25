const fs = require('fs');
const path = require('path');

const workspacePath = process.cwd();
const targetVersion = "^1.0.68";

const directories = fs.readdirSync(workspacePath).filter(dir => {
  return dir.startsWith('gaqno-') && dir.endsWith('-ui') && fs.statSync(path.join(workspacePath, dir)).isDirectory();
});

console.log(`Found ${directories.length} microfrontend UIs to update.`);

directories.forEach(dir => {
  const mfePath = path.join(workspacePath, dir);
  console.log(`\nProcessing ${dir}...`);

  // 1. Update package.json
  const pkgPath = path.join(mfePath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    let pkgContent = fs.readFileSync(pkgPath, 'utf-8');
    let pkgModified = false;
    
    if (pkgContent.match(/"@gaqno-development\/frontcore":\s*"[^"]+"/)) {
      pkgContent = pkgContent.replace(
        /"@gaqno-development\/frontcore":\s*"[^"]+"/,
        `"@gaqno-development/frontcore": "${targetVersion}"`
      );
      pkgModified = true;
    }
    
    if (pkgContent.match(/npm:@gaqno-development\/frontcore@[^"]+"/)) {
      pkgContent = pkgContent.replace(
        /npm:@gaqno-development\/frontcore@[^"]+"/,
        `npm:@gaqno-development/frontcore@${targetVersion}"`
      );
      pkgModified = true;
    }

    if (pkgModified) {
      fs.writeFileSync(pkgPath, pkgContent);
      console.log(`  Updated package.json to frontcore version ${targetVersion}`);
    }
  }

  // 2. Remove tailwind configs
  ['tailwind.config.js', 'tailwind.config.ts'].forEach(file => {
    const configPath = path.join(mfePath, file);
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      console.log(`  Removed obsolete ${file}`);
    }
  });

  // 3. Ensure src/styles/index.css
  const stylesDir = path.join(mfePath, 'src', 'styles');
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true });
  }
  const indexCssPath = path.join(stylesDir, 'index.css');
  
  // Custom for shell-ui since we added scrollbar plugin earlier
  const isShell = dir === 'gaqno-shell-ui';
  const additionalPlugins = isShell ? '\n@plugin "tailwind-scrollbar";\n' : '';
  
  const cssContent = `@import "@gaqno-development/frontcore/styles/globals.css";${additionalPlugins}\n@source "../**/*.{js,ts,jsx,tsx}";\n@source "../../index.html";\n`;
  fs.writeFileSync(indexCssPath, cssContent);
  console.log(`  Ensured src/styles/index.css is provisioned for Tailwind V4`);

  // 4. Update main.tsx / App.tsx imports
  const possibleEntryFiles = ['src/main.tsx', 'src/App.tsx', 'src/index.tsx', 'src/main.ts'];
  let entryFound = false;

  possibleEntryFiles.forEach(entryFile => {
    const entryPath = path.join(mfePath, entryFile);
    if (fs.existsSync(entryPath)) {
      entryFound = true;
      let entryContent = fs.readFileSync(entryPath, 'utf-8');
      let modified = false;

      // Replace frontcore import
      if (entryContent.includes("@gaqno-development/frontcore/styles/globals.css")) {
        entryContent = entryContent.replace(
          /import\s+['"]@gaqno-development\/frontcore\/styles\/globals\.css['"];?/g,
          `import "./styles/index.css";`
        );
        modified = true;
      }
      
      // Replace old local index.css import if they existed outside of styles/
      if (entryContent.match(/import\s+['"]\.\/index\.css['"];?/g)) {
         entryContent = entryContent.replace(
           /import\s+['"]\.\/index\.css['"];?/g, 
           `import "./styles/index.css";`
         );
         modified = true;
         // remove obsolete src/index.css if it exists
         const oldCssPath = path.join(mfePath, 'src', 'index.css');
         if (fs.existsSync(oldCssPath)) {
             fs.unlinkSync(oldCssPath);
             console.log(`  Cleaned up old src/index.css`);
         }
      }

      if (modified) {
        fs.writeFileSync(entryPath, entryContent);
        console.log(`  Updated CSS imports in ${entryFile}`);
      }
    }
  });

  if (!entryFound) {
    console.log(`  WARNING: Did not find a standard entry file to update imports for ${dir}`);
  }
});

console.log("\nStandardization script complete.");
