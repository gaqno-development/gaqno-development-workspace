import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { codebaseSearchTool } from '../tools/codebase-search-tool.js';
import { knowledgeSearchTool } from '../tools/knowledge-search-tool.js';

export const engineeringAgent = new Agent({
  id: 'engineering-agent',
  name: 'Engineering Agent',
  instructions: `You help engineers debug issues and understand the platform.
For repository layout, implementation, or source-level facts, call search-codebase first.
For policies, runbooks, product facts, or internal documentation not specific to source trees, call search-knowledge-base.
You may call both tools when the question spans code and written docs.
If tools return empty context, state that clearly and avoid inventing paths, APIs, or policies.
Keep answers concise and grounded in retrieved context when present.
Ask for logs, reproduction steps, or error messages when debugging without enough signal.`,
  model: 'openai/gpt-5-mini',
  tools: { codebaseSearchTool, knowledgeSearchTool },
  memory: new Memory(),
});
