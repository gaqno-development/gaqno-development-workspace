import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { knowledgeSearchTool } from '../tools/knowledge-search-tool';

export const knowledgeAgent = new Agent({
  id: 'knowledge-agent',
  name: 'Knowledge Agent',
  instructions: `You answer questions using the internal knowledge base when it helps.
Always call search-knowledge-base first when the user asks about policies, runbooks, product facts, or anything that may live in indexed documents.
If the tool returns empty context, say you found no matching documents and answer only from general knowledge if appropriate.
Keep answers concise and grounded in the retrieved context when context is present.`,
  model: 'openai/gpt-5-mini',
  tools: { knowledgeSearchTool },
  memory: new Memory(),
});
