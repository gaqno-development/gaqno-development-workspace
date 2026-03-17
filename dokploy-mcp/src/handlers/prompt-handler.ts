import { PROMPTS } from '../capabilities/prompts.js';

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: { type: 'text'; text: string };
}

export function handlePromptGet(
  promptName: string,
  args: Record<string, string>
): PromptMessage[] {
  const projectName = args.projectName ?? '';
  const applicationName = args.applicationName ?? '';
  const projectId = args.projectId ?? '';
  const dbType = args.dbType ?? '';
  const name = args.name ?? '';
  const filter = args.filter ?? '';
  const applicationId = args.applicationId ?? '';
  const memoryLimit = args.memoryLimit ?? '';
  const cpuLimit = args.cpuLimit ?? '';

  if (promptName === 'deploy-application') {
    const userText = projectName || applicationName
      ? `Deploy application${applicationName ? ` "${applicationName}"` : ''}${projectName ? ` in project "${projectName}"` : ''}.`
      : 'I want to deploy an application.';
    return [
      {
        role: 'user',
        content: { type: 'text', text: userText },
      },
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: "I'll help deploy. First, let me list projects using `project-list-all`, then find the application, verify settings, and deploy.",
        },
      },
    ];
  }

  if (promptName === 'provision-database') {
    const userText = `Create a ${dbType} database named ${name} in project ${projectId}`;
    const toolName = dbType === 'mysql' ? 'mysql' : dbType === 'postgres' ? 'postgres' : dbType === 'redis' ? 'redis' : dbType === 'mariadb' ? 'mariadb' : 'mongo';
    return [
      {
        role: 'user',
        content: { type: 'text', text: userText },
      },
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: `I'll provision the database. Steps: 1) Create using \`${toolName}-create\`, 2) Deploy with \`${toolName}-deploy\`, 3) Start with \`${toolName}-start\``,
        },
      },
    ];
  }

  if (promptName === 'list-and-manage-apps') {
    const userText = filter ? `List all applications (filter: ${filter})` : 'List all applications';
    return [
      {
        role: 'user',
        content: { type: 'text', text: userText },
      },
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: "I'll list all apps using `project-list-all` to get apps across projects, then you can select one to manage.",
        },
      },
    ];
  }

  if (promptName === 'scale-application') {
    const limits: string[] = [];
    if (memoryLimit) limits.push(`memory ${memoryLimit}`);
    if (cpuLimit) limits.push(`CPU ${cpuLimit}`);
    const userText = limits.length > 0
      ? `Scale application ${applicationId} with ${limits.join(', ')}`
      : `Scale application ${applicationId}`;
    return [
      {
        role: 'user',
        content: { type: 'text', text: userText },
      },
      {
        role: 'assistant',
        content: {
          type: 'text',
          text: "I'll update resources using `application-update` and then restart with `application-restart`.",
        },
      },
    ];
  }

  const validNames = PROMPTS.map((p) => p.name).join(', ');
  throw new Error(`Unknown prompt: ${promptName}. Valid: ${validNames}`);
}
