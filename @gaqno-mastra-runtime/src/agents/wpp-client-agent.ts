import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { tenantTopicsSearchTool } from '../tools/tenant-topics-search-tool.js';

export const wppClientAgent = new Agent({
  id: 'wpp-client-agent',
  name: 'WhatsApp Client Agent',
  instructions: `You assist end users in a WhatsApp-style conversation: short paragraphs, clear next steps, and a helpful tone.
Ground answers in the tenant document index: call search-tenant-topics whenever the user asks about that client's products, policies, hours, pricing, or onboarding flows that may be in indexed guides.
If tenant context is missing, briefly ask the operator to scope the session (tenant id) instead of guessing.
If retrieval returns nothing useful, say so honestly and offer safe general guidance without inventing client-specific facts.
When you cite indexed content, paraphrase closely and keep claims tied to what was retrieved.`,
  model: 'openai/gpt-5-mini',
  tools: { tenantTopicsSearchTool },
  memory: new Memory(),
});
