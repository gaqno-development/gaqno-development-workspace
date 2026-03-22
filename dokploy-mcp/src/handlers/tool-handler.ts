import type { DokployClient } from '../dokploy-client/client.js';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  removeProject,
  duplicateProject,
} from '../dokploy-client/endpoints/projects.js';
import {
  createApplication,
  getApplication,
  updateApplication,
  deployApplication,
  redeployApplication,
  startApplication,
  stopApplication,
  deleteApplication,
  saveEnvironment,
  restartApplication,
} from '../dokploy-client/endpoints/applications.js';
import {
  createMysql,
  getMysql,
  updateMysql,
  deployMysql,
  startMysql,
  stopMysql,
  removeMysql,
  createPostgres,
  getPostgres,
  updatePostgres,
  deployPostgres,
  startPostgres,
  stopPostgres,
  removePostgres,
  createRedis,
  getRedis,
  deployRedis,
  startRedis,
  stopRedis,
  removeRedis,
  createMariadb,
  getMariadb,
  deployMariadb,
  startMariadb,
  stopMariadb,
  removeMariadb,
  createMongo,
  getMongo,
  deployMongo,
  startMongo,
  stopMongo,
  removeMongo,
} from '../dokploy-client/endpoints/databases.js';
import {
  createDomain,
  getDomain,
  updateDomain,
  deleteDomain,
  getDomainsByApplicationId,
  generateDomain,
} from '../dokploy-client/endpoints/domains.js';
import {
  listAi,
  getAi,
  createAi,
  updateAi,
  deleteAi,
} from '../dokploy-client/endpoints/ai.js';
import {
  listDeployments,
  listDeploymentsByType,
  killDeploymentProcess,
  removeDeployment,
} from '../dokploy-client/endpoints/deployments.js';
import {
  getContainers,
  getContainersByAppNameMatch,
  getServiceContainersByAppName,
  restartContainer,
  getDockerConfig,
} from '../dokploy-client/endpoints/docker.js';
import {
  getHealth,
  getIp,
  cleanDockerPrune,
  cleanUnusedImages,
  cleanDockerBuilder,
  cleanStoppedContainers,
  readTraefikConfig,
  getWebServerSettings,
} from '../dokploy-client/endpoints/settings.js';
import {
  readDeploymentLog,
  readLatestDeploymentLog,
} from '../dokploy-client/endpoints/logs.js';

type ToolHandler = (
  client: DokployClient,
  args: Record<string, unknown>
) => Promise<unknown>;

const HANDLER_MAP: Record<string, ToolHandler> = {
  'project-list-all': (c) => listProjects(c),
  'project-get-one': (c, a) => getProject(c, a.projectId as string),
  'project-create': (c, a) => createProject(c, a as any),
  'project-update': (c, a) => updateProject(c, a as any),
  'project-delete': (c, a) => removeProject(c, a.projectId as string),
  'project-duplicate': (c, a) => duplicateProject(c, a.projectId as string),
  'application-create': (c, a) => createApplication(c, a),
  'application-get-one': (c, a) => getApplication(c, a.applicationId as string),
  'application-update': (c, a) => updateApplication(c, a),
  'application-deploy': (c, a) => deployApplication(c, a.applicationId as string),
  'application-redeploy': (c, a) => redeployApplication(c, a.applicationId as string),
  'application-start': (c, a) => startApplication(c, a.applicationId as string),
  'application-stop': (c, a) => stopApplication(c, a.applicationId as string),
  'application-delete': (c, a) => deleteApplication(c, a.applicationId as string),
  'application-save-environment': (c, a) => saveEnvironment(c, a as any),
  'application-restart': (c, a) => restartApplication(c, a.applicationId as string),
  'mysql-create': (c, a) => createMysql(c, a),
  'mysql-get-one': (c, a) => getMysql(c, a.mysqlId as string),
  'mysql-update': (c, a) => updateMysql(c, a),
  'mysql-deploy': (c, a) => deployMysql(c, a.mysqlId as string),
  'mysql-start': (c, a) => startMysql(c, a.mysqlId as string),
  'mysql-stop': (c, a) => stopMysql(c, a.mysqlId as string),
  'mysql-remove': (c, a) => removeMysql(c, a.mysqlId as string),
  'postgres-create': (c, a) => createPostgres(c, a),
  'postgres-get-one': (c, a) => getPostgres(c, a.postgresId as string),
  'postgres-update': (c, a) => updatePostgres(c, a),
  'postgres-deploy': (c, a) => deployPostgres(c, a.postgresId as string),
  'postgres-start': (c, a) => startPostgres(c, a.postgresId as string),
  'postgres-stop': (c, a) => stopPostgres(c, a.postgresId as string),
  'postgres-remove': (c, a) => removePostgres(c, a.postgresId as string),
  'redis-create': (c, a) => createRedis(c, a),
  'redis-get-one': (c, a) => getRedis(c, a.redisId as string),
  'redis-deploy': (c, a) => deployRedis(c, a.redisId as string),
  'redis-start': (c, a) => startRedis(c, a.redisId as string),
  'redis-stop': (c, a) => stopRedis(c, a.redisId as string),
  'redis-remove': (c, a) => removeRedis(c, a.redisId as string),
  'mariadb-create': (c, a) => createMariadb(c, a),
  'mariadb-get-one': (c, a) => getMariadb(c, a.mariadbId as string),
  'mariadb-deploy': (c, a) => deployMariadb(c, a.mariadbId as string),
  'mariadb-start': (c, a) => startMariadb(c, a.mariadbId as string),
  'mariadb-stop': (c, a) => stopMariadb(c, a.mariadbId as string),
  'mariadb-remove': (c, a) => removeMariadb(c, a.mariadbId as string),
  'mongo-create': (c, a) => createMongo(c, a),
  'mongo-get-one': (c, a) => getMongo(c, a.mongoId as string),
  'mongo-deploy': (c, a) => deployMongo(c, a.mongoId as string),
  'mongo-start': (c, a) => startMongo(c, a.mongoId as string),
  'mongo-stop': (c, a) => stopMongo(c, a.mongoId as string),
  'mongo-remove': (c, a) => removeMongo(c, a.mongoId as string),
  'domain-create': (c, a) => createDomain(c, a),
  'domain-get-one': (c, a) => getDomain(c, a.domainId as string),
  'domain-update': (c, a) => updateDomain(c, a),
  'domain-delete': (c, a) => deleteDomain(c, a.domainId as string),
  'domain-list-by-app': (c, a) =>
    getDomainsByApplicationId(c, a.applicationId as string),
  'domain-generate': (c, a) => generateDomain(c, a),
  'ai-list-all': (c) => listAi(c),
  'ai-get-one': (c, a) => getAi(c, a.aiId as string),
  'ai-create': (c, a) => createAi(c, a),
  'ai-update': (c, a) => updateAi(c, a),
  'ai-delete': (c, a) => deleteAi(c, a.aiId as string),
  'deployment-list': (c, a) => listDeployments(c, a.applicationId as string),
  'deployment-list-by-type': (c, a) =>
    listDeploymentsByType(c, a.id as string, a.type as string),
  'deployment-kill': (c, a) =>
    killDeploymentProcess(c, a.deploymentId as string),
  'deployment-remove': (c, a) =>
    removeDeployment(c, a.deploymentId as string),
  'docker-get-containers': (c) => getContainers(c),
  'docker-get-containers-by-app': (c, a) =>
    getContainersByAppNameMatch(c, a.appName as string),
  'docker-get-service-containers': (c, a) =>
    getServiceContainersByAppName(c, a.appName as string),
  'docker-restart-container': (c, a) =>
    restartContainer(c, a.containerId as string),
  'docker-get-config': (c) => getDockerConfig(c),
  'settings-health': (c) => getHealth(c),
  'settings-get-ip': (c) => getIp(c),
  'settings-clean-docker-prune': (c) => cleanDockerPrune(c),
  'settings-clean-unused-images': (c) => cleanUnusedImages(c),
  'settings-clean-docker-builder': (c) => cleanDockerBuilder(c),
  'settings-clean-stopped-containers': (c) => cleanStoppedContainers(c),
  'settings-read-traefik-config': (c) => readTraefikConfig(c),
  'settings-get-web-server': (c) => getWebServerSettings(c),
  'deployment-read-log': (c, a) =>
    readDeploymentLog(c, a.logPath as string, (a.timeoutMs as number) ?? 10000),
  'deployment-read-latest-log': (c, a) =>
    readLatestDeploymentLog(c, a.applicationId as string, (a.timeoutMs as number) ?? 10000),
};

export async function handleToolCall(
  client: DokployClient,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const handler = HANDLER_MAP[toolName];
  if (!handler) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  return handler(client, args);
}
