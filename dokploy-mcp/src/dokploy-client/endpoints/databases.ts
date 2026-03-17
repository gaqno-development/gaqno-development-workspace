import type { DokployClient } from '../client.js';
import type { DokployMysql, DokployPostgres, DokployRedis, DokployMariadb, DokployMongo } from '../types.js';

export async function createMysql(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployMysql> {
  return client.request<DokployMysql>('/mysql.create', {
    method: 'POST',
    body: data,
  });
}

export async function getMysql(
  client: DokployClient,
  mysqlId: string
): Promise<DokployMysql> {
  return client.request<DokployMysql>('/mysql.one', {
    query: { mysqlId },
  });
}

export async function updateMysql(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployMysql> {
  return client.request<DokployMysql>('/mysql.update', {
    method: 'POST',
    body: data,
  });
}

export async function deployMysql(
  client: DokployClient,
  mysqlId: string
): Promise<unknown> {
  return client.request<unknown>('/mysql.deploy', {
    method: 'POST',
    body: { mysqlId },
  });
}

export async function startMysql(
  client: DokployClient,
  mysqlId: string
): Promise<unknown> {
  return client.request<unknown>('/mysql.start', {
    method: 'POST',
    body: { mysqlId },
  });
}

export async function stopMysql(
  client: DokployClient,
  mysqlId: string
): Promise<unknown> {
  return client.request<unknown>('/mysql.stop', {
    method: 'POST',
    body: { mysqlId },
  });
}

export async function removeMysql(
  client: DokployClient,
  mysqlId: string
): Promise<unknown> {
  return client.request<unknown>('/mysql.remove', {
    method: 'POST',
    body: { mysqlId },
  });
}

export async function createPostgres(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployPostgres> {
  return client.request<DokployPostgres>('/postgres.create', {
    method: 'POST',
    body: data,
  });
}

export async function getPostgres(
  client: DokployClient,
  postgresId: string
): Promise<DokployPostgres> {
  return client.request<DokployPostgres>('/postgres.one', {
    query: { postgresId },
  });
}

export async function updatePostgres(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployPostgres> {
  return client.request<DokployPostgres>('/postgres.update', {
    method: 'POST',
    body: data,
  });
}

export async function deployPostgres(
  client: DokployClient,
  postgresId: string
): Promise<unknown> {
  return client.request<unknown>('/postgres.deploy', {
    method: 'POST',
    body: { postgresId },
  });
}

export async function startPostgres(
  client: DokployClient,
  postgresId: string
): Promise<unknown> {
  return client.request<unknown>('/postgres.start', {
    method: 'POST',
    body: { postgresId },
  });
}

export async function stopPostgres(
  client: DokployClient,
  postgresId: string
): Promise<unknown> {
  return client.request<unknown>('/postgres.stop', {
    method: 'POST',
    body: { postgresId },
  });
}

export async function removePostgres(
  client: DokployClient,
  postgresId: string
): Promise<unknown> {
  return client.request<unknown>('/postgres.remove', {
    method: 'POST',
    body: { postgresId },
  });
}

export async function createRedis(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployRedis> {
  return client.request<DokployRedis>('/redis.create', {
    method: 'POST',
    body: data,
  });
}

export async function getRedis(
  client: DokployClient,
  redisId: string
): Promise<DokployRedis> {
  return client.request<DokployRedis>('/redis.one', {
    query: { redisId },
  });
}

export async function deployRedis(
  client: DokployClient,
  redisId: string
): Promise<unknown> {
  return client.request<unknown>('/redis.deploy', {
    method: 'POST',
    body: { redisId },
  });
}

export async function startRedis(
  client: DokployClient,
  redisId: string
): Promise<unknown> {
  return client.request<unknown>('/redis.start', {
    method: 'POST',
    body: { redisId },
  });
}

export async function stopRedis(
  client: DokployClient,
  redisId: string
): Promise<unknown> {
  return client.request<unknown>('/redis.stop', {
    method: 'POST',
    body: { redisId },
  });
}

export async function removeRedis(
  client: DokployClient,
  redisId: string
): Promise<unknown> {
  return client.request<unknown>('/redis.remove', {
    method: 'POST',
    body: { redisId },
  });
}

export async function createMariadb(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployMariadb> {
  return client.request<DokployMariadb>('/mariadb.create', {
    method: 'POST',
    body: data,
  });
}

export async function getMariadb(
  client: DokployClient,
  mariadbId: string
): Promise<DokployMariadb> {
  return client.request<DokployMariadb>('/mariadb.one', {
    query: { mariadbId },
  });
}

export async function deployMariadb(
  client: DokployClient,
  mariadbId: string
): Promise<unknown> {
  return client.request<unknown>('/mariadb.deploy', {
    method: 'POST',
    body: { mariadbId },
  });
}

export async function startMariadb(
  client: DokployClient,
  mariadbId: string
): Promise<unknown> {
  return client.request<unknown>('/mariadb.start', {
    method: 'POST',
    body: { mariadbId },
  });
}

export async function stopMariadb(
  client: DokployClient,
  mariadbId: string
): Promise<unknown> {
  return client.request<unknown>('/mariadb.stop', {
    method: 'POST',
    body: { mariadbId },
  });
}

export async function removeMariadb(
  client: DokployClient,
  mariadbId: string
): Promise<unknown> {
  return client.request<unknown>('/mariadb.remove', {
    method: 'POST',
    body: { mariadbId },
  });
}

export async function createMongo(
  client: DokployClient,
  data: Record<string, unknown>
): Promise<DokployMongo> {
  return client.request<DokployMongo>('/mongo.create', {
    method: 'POST',
    body: data,
  });
}

export async function getMongo(
  client: DokployClient,
  mongoId: string
): Promise<DokployMongo> {
  return client.request<DokployMongo>('/mongo.one', {
    query: { mongoId },
  });
}

export async function deployMongo(
  client: DokployClient,
  mongoId: string
): Promise<unknown> {
  return client.request<unknown>('/mongo.deploy', {
    method: 'POST',
    body: { mongoId },
  });
}

export async function startMongo(
  client: DokployClient,
  mongoId: string
): Promise<unknown> {
  return client.request<unknown>('/mongo.start', {
    method: 'POST',
    body: { mongoId },
  });
}

export async function stopMongo(
  client: DokployClient,
  mongoId: string
): Promise<unknown> {
  return client.request<unknown>('/mongo.stop', {
    method: 'POST',
    body: { mongoId },
  });
}

export async function removeMongo(
  client: DokployClient,
  mongoId: string
): Promise<unknown> {
  return client.request<unknown>('/mongo.remove', {
    method: 'POST',
    body: { mongoId },
  });
}
