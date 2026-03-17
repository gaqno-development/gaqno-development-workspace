export interface DokployApplication {
  applicationId?: string;
  name?: string;
  appName?: string;
  description?: string;
  dockerImage?: string;
  applicationStatus?: string;
  createdAt?: string;
  projectId?: string;
  env?: string;
  memoryReservation?: number;
  memoryLimit?: number;
  cpuReservation?: number;
  cpuLimit?: number;
  autoDeploy?: boolean;
  sourceType?: string;
  repository?: string;
  branch?: string;
  buildPath?: string;
  owner?: string;
}

export interface DokployMysql {
  mysqlId?: string;
  name?: string;
  appName?: string;
  description?: string;
  databaseName?: string;
  databaseUser?: string;
  databasePassword?: string;
  databaseRootPassword?: string;
  dockerImage?: string;
  applicationStatus?: string;
  createdAt?: string;
  projectId?: string;
  externalPort?: number;
}

export interface DokployPostgres {
  postgresId?: string;
  name?: string;
  appName?: string;
  description?: string;
  databaseName?: string;
  databaseUser?: string;
  databasePassword?: string;
  dockerImage?: string;
  applicationStatus?: string;
  createdAt?: string;
  projectId?: string;
  externalPort?: number;
}

export interface DokployRedis {
  redisId?: string;
  name?: string;
  appName?: string;
  description?: string;
  databasePassword?: string;
  dockerImage?: string;
  applicationStatus?: string;
  createdAt?: string;
  projectId?: string;
  externalPort?: number;
}

export interface DokployMariadb {
  mariadbId?: string;
  name?: string;
  appName?: string;
  description?: string;
  databaseName?: string;
  databaseUser?: string;
  databasePassword?: string;
  databaseRootPassword?: string;
  dockerImage?: string;
  applicationStatus?: string;
  createdAt?: string;
  projectId?: string;
  externalPort?: number;
}

export interface DokployMongo {
  mongoId?: string;
  name?: string;
  appName?: string;
  description?: string;
  databaseUser?: string;
  databasePassword?: string;
  dockerImage?: string;
  applicationStatus?: string;
  createdAt?: string;
  projectId?: string;
  externalPort?: number;
}

export interface DokployCompose {
  composeId?: string;
  name?: string;
  appName?: string;
  description?: string;
  dockerImage?: string;
  applicationStatus?: string;
  createdAt?: string;
  projectId?: string;
  sourceType?: string;
}

export interface DokployProject {
  projectId?: string;
  name?: string;
  description?: string;
  createdAt?: string;
  adminId?: string;
  applications?: DokployApplication[];
  mysql?: DokployMysql[];
  postgres?: DokployPostgres[];
  redis?: DokployRedis[];
  mariadb?: DokployMariadb[];
  mongo?: DokployMongo[];
  compose?: DokployCompose[];
}

export interface DokployDomain {
  domainId?: string;
  host?: string;
  path?: string;
  port?: number;
  https?: boolean;
  certificateType?: string;
  applicationId?: string;
  createdAt?: string;
  uniqueConfigKey?: string;
}

export interface DokployApiErrorResponse {
  code?: string;
  message?: string;
  issues?: unknown[];
}
