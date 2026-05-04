import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  findPortalFeatureForRoute,
  isAllowedPortalRoute,
  PORTAL_FEATURE_ROUTE_PREFIXES,
} from '../constants/portal-features.js';

export const navigateToTool = createTool({
  id: 'navigate-to',
  description:
    'Suggest navigating the user to a route inside the gaqno portal. The chat UI will render this as a clickable button; the user remains in control. Use it whenever the answer is "open page X" or when guiding the user to the area where they can complete their task. Always pair the tool call with a short text explanation.',
  inputSchema: z.object({
    route: z
      .string()
      .min(2)
      .describe(
        `Absolute portal route, must start with one of: ${PORTAL_FEATURE_ROUTE_PREFIXES.join(', ')}.`,
      ),
    reason: z.string().min(3).describe('Why this page helps the user (one short sentence in pt-BR).'),
  }),
  outputSchema: z.object({
    route: z.string(),
    label: z.string(),
    reason: z.string(),
    suggestedActions: z.array(
      z.object({
        label: z.string(),
        route: z.string(),
      }),
    ),
  }),
  execute: async (input) => {
    if (!isAllowedPortalRoute(input.route)) {
      throw new Error(
        `Route "${input.route}" is not an allowed portal route. Allowed prefixes: ${PORTAL_FEATURE_ROUTE_PREFIXES.join(', ')}.`,
      );
    }
    const feature = findPortalFeatureForRoute(input.route);
    return {
      route: input.route,
      label: feature?.label ?? input.route,
      reason: input.reason,
      suggestedActions: feature
        ? feature.actions.map((action) => ({ label: action.label, route: action.route }))
        : [],
    };
  },
});
