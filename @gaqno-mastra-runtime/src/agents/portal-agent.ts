import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { portalServiceFetchTool } from '../tools/portal-service-fetch-tool';

export const portalAgent = new Agent({
  id: 'portal-agent',
  name: 'Portal Agent',
  instructions: `You help operators inside the gaqno portal by reading live data from ERP, CRM, Omnichannel, and Shop backends when needed.
Always use portal-service-fetch for data about those systems instead of guessing.
Only request paths that are allowlisted; if a call fails or returns empty, explain what failed and what the user should check (env URLs, auth, or path).
Summarize JSON responses clearly; truncate long lists in natural language.
Never ask the user to paste secrets; auth must come from the gateway-injected request context.`,
  model: 'openai/gpt-5-mini',
  tools: { portalServiceFetchTool },
  memory: new Memory(),
});
