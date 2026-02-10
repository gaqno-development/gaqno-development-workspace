# @gaqno-development/types

Shared TypeScript interfaces used across frontend and backend. Single source of truth for contracts. Source repository is private.

## Install

Configure npm for GitHub Packages (`.npmrc`):

```
@gaqno-development:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<GITHUB_TOKEN>
```

Then:

```bash
npm install @gaqno-development/types
```

Use as **devDependency** in apps and services.

## Usage

**Entry (all types):**

```ts
import { SessionContext, TransactionStatus } from '@gaqno-development/types';
```

**Subpaths (tree-shakeable):**

```ts
import { SessionContext } from '@gaqno-development/types/auth';
import { CampaignRecord, AttributionReport } from '@gaqno-development/types/attribution';
import { BillingSummary } from '@gaqno-development/types/billing';
import { VideoTemplate, VideoTemplateSummary } from '@gaqno-development/types/video-template';
import { TransactionStatus, TransactionType, RecurrenceType } from '@gaqno-development/types/finance';
import { NarratorResponse, ConnectedUser } from '@gaqno-development/types/rpg';
import { VideoModel, VideoGenerationResponse } from '@gaqno-development/types/video';
import { Product } from '@gaqno-development/types/product';
import { Customer } from '@gaqno-development/types/customer';
import { Sale } from '@gaqno-development/types/sale';
import { UserStatus } from '@gaqno-development/types/user';
import { OrgRecord, OrgStatus } from '@gaqno-development/types/org';
```

## Publish

From workspace root:

```bash
./publish-packages.sh
```

Or from this package: `npm run build && npm publish`. Requires auth to `https://npm.pkg.github.com/gaqno-development`.
