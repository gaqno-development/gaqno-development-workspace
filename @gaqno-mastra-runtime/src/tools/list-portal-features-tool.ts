import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { PORTAL_FEATURES } from '../constants/portal-features.js';

const featureActionSchema = z.object({
  label: z.string(),
  route: z.string(),
});

const featureSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  route: z.string(),
  aliases: z.array(z.string()),
  actions: z.array(featureActionSchema),
});

export const listPortalFeaturesTool = createTool({
  id: 'list-portal-features',
  description:
    'List the high-level features available in the gaqno portal (AI Studio, CRM, ERP, Finance, PDV, Omnichannel, Wellness, Intelligence/BI, Consumer, Admin, Shop Admin). Returns each feature label, description, default route, aliases, and quick action shortcuts. Call this when the user asks what they can do in the portal, or when they describe a need and you must map it to the right area.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    features: z.array(featureSchema),
  }),
  execute: async () => ({
    features: PORTAL_FEATURES.map((feature) => ({
      id: feature.id,
      label: feature.label,
      description: feature.description,
      route: feature.route,
      aliases: [...feature.aliases],
      actions: feature.actions.map((action) => ({ label: action.label, route: action.route })),
    })),
  }),
});
