import WebSocket from 'ws';
import type { DokployClient } from '../client.js';

function deriveWsUrl(httpBaseUrl: string): string {
  const parsed = new URL(httpBaseUrl);
  const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  const origin = `${wsProtocol}//${parsed.host}`;
  return origin;
}

export async function readDeploymentLog(
  client: DokployClient,
  logPath: string,
  timeoutMs = 10000,
): Promise<string> {
  const { baseUrl, apiKey } = client.getConnectionInfo();
  const wsOrigin = deriveWsUrl(baseUrl);
  const wsUrl = `${wsOrigin}/listen-deployment?logPath=${encodeURIComponent(logPath)}`;

  return new Promise<string>((resolve, reject) => {
    const chunks: string[] = [];
    let settled = false;

    const ws = new WebSocket(wsUrl, {
      headers: { 'x-api-key': apiKey },
    });

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        ws.close();
        resolve(chunks.join(''));
      }
    }, timeoutMs);

    ws.on('message', (data: WebSocket.Data) => {
      chunks.push(data.toString());
    });

    ws.on('error', (err: Error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`WebSocket error: ${err.message}`));
      }
    });

    ws.on('close', () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(chunks.join(''));
      }
    });
  });
}

export async function readLatestDeploymentLog(
  client: DokployClient,
  applicationId: string,
  timeoutMs = 10000,
): Promise<{ deploymentId: string; status: string; title: string; log: string }> {
  const deployments = await client.request<Array<{
    deploymentId: string;
    status: string;
    title: string;
    logPath: string;
    createdAt: string;
  }>>('/deployment.all', { query: { applicationId } });

  if (!deployments || deployments.length === 0) {
    throw new Error('No deployments found for this application');
  }

  const sorted = [...deployments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const latest = sorted[0];

  if (!latest.logPath) {
    throw new Error(`Latest deployment ${latest.deploymentId} has no log path`);
  }

  const log = await readDeploymentLog(client, latest.logPath, timeoutMs);

  return {
    deploymentId: latest.deploymentId,
    status: latest.status,
    title: latest.title,
    log,
  };
}
