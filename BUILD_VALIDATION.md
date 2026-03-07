# Build Validation System

This repository includes an automated build validation system that ensures all code changes can be built successfully both locally and with Docker before allowing pushes.

## 🚀 How It Works

### Automatic Validation (Git Hooks)
Every time you run `git push`, the system automatically:
1. **Detects changed directories** in your commit
2. **Runs npm build** for any directory with `package.json`
3. **Runs Docker build** for any directory with `Dockerfile`
4. **Validates NPM token** for private packages
5. **Blocks push** if any validation fails

### Manual Validation
You can also run validation manually without pushing:
```bash
./scripts/validate-build.sh
```

## 📋 Requirements

### NPM Token
For Docker builds with private packages, ensure NPM token is available:
```bash
# Check if token exists
cat .npmrc | grep "_authToken"
# or
cat ~/.npmrc.personal | grep "_authToken"
```

### Docker
Ensure Docker is running and you have permissions to build images.

## 🔧 Configuration

### Services with Dockerfiles
- `gaqno-erp-ui/` - ERP UI application
- `gaqno-crm-ui/` - CRM UI application  
- `gaqno-pdv-ui/` - PDV UI application

### Build Commands
The system automatically runs these commands for changed directories:

#### npm build
```bash
cd <directory>
npm run build
```

#### Docker build
```bash
docker build -f <directory>/Dockerfile \
  --build-arg NPM_TOKEN=$NPM_TOKEN \
  -t <image-name>:test \
  <directory>/
```

## 🛠️ Troubleshooting

### Bypass Validation (Emergency Only)
```bash
git push --no-verify
```
⚠️ **Not recommended** - This skips all build checks and may break CI/CD

### Common Issues

#### NPM Token Not Found
```bash
# Add token to workspace .npmrc
echo "@gaqno-development:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=ghp_your_token_here" >> .npmrc

# Or add to user config
echo "@gaqno-development:registry=https://npm.pkg.github.com" >> ~/.npmrc.personal
echo "//npm.pkg.github.com/:_authToken=ghp_your_token_here" >> ~/.npmrc.personal
```

#### Docker Build Fails
1. Check if Docker is running: `docker --version`
2. Verify NPM token is valid
3. Check Dockerfile syntax
4. Ensure all dependencies are in package.json

#### npm Build Fails
1. Check for TypeScript errors: `npm run type-check`
2. Verify all dependencies are installed: `npm install`
3. Check for linting errors: `npm run lint`

## 📁 File Structure

```
scripts/
├── pre-push-validation.sh    # Main validation script
├── validate-build.sh         # Manual validation script
└── setup-build-hooks.sh      # Installation script

.git/hooks/
└── pre-push                  # Git hook (auto-generated)

.cursor/rules/
└── build-before-push.mdc     # Build validation rules
```

## 🔄 Workflow

### Normal Development Flow
1. Make code changes
2. Stage changes: `git add .`
3. Commit: `git commit -m "feat: add new feature"`
4. Push: `git push` ← **Automatic validation runs here**

### If Validation Fails
1. Fix build errors
2. Stage and commit fixes
3. Push again

### Manual Testing Before Push
```bash
# Test builds without pushing
./scripts/validate-build.sh

# Or test specific service
cd gaqno-erp-ui && npm run build
cd .. && docker build -f gaqno-erp-ui/Dockerfile --build-arg NPM_TOKEN=$NPM_TOKEN -t test gaqno-erp-ui/
```

## 🎯 Benefits

- **Prevents broken builds** from reaching production
- **Ensures Docker compatibility** with CI/CD environment
- **Catches issues early** in development cycle
- **Maintains code quality** across the team
- **Reduces CI/CD failures** and deployment delays

## 📊 Validation Output

The system provides colored output:
- 🔍 **Yellow**: Processing information
- ✅ **Green**: Successful operations
- ❌ **Red**: Failed operations
- ⚠️ **Yellow**: Warnings and skipped operations

Example output:
```
🔍 Running pre-push validation...

🔍 Processing gaqno-erp-ui...
📦 Building gaqno-erp-ui...
✅ npm build successful for gaqno-erp-ui
🐳 Building Docker image for gaqno-erp-ui...
✅ Docker build successful for gaqno-erp-ui

📋 Pre-push validation complete
✅ All validations passed! Ready to push.
```

## 🔄 Reinstallation

If hooks get corrupted or need updating:
```bash
./scripts/setup-build-hooks.sh
```

This will reinstall all scripts and git hooks with the latest configuration.
