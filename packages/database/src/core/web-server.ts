import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as nodeDrizzle } from 'drizzle-orm/node-postgres';
import { Pool as NodePool } from 'pg';
import ws from 'ws';

import { serverDBEnv } from '@/config/db';

import * as schema from '../schemas';
import { LobeChatDatabase } from '../type';

export const getDBInstance = (): LobeChatDatabase => {
  if (!(process.env.NEXT_PUBLIC_SERVICE_MODE === 'server')) return {} as any;

  if (!serverDBEnv.KEY_VAULTS_SECRET) {
    throw new Error(
      ` \`KEY_VAULTS_SECRET\` is not set, please set it in your environment variables.

If you don't have it, please run \`openssl rand -base64 32\` to create one.
`,
    );
  }

  let connectionString = serverDBEnv.DATABASE_URL;

  // Resolve: [TRPCError]: Failed query: select count("id") from "sessions" where "sessions"."user_id" = $1
  // This error occurs when the user copies the full psql command into the DATABASE_URL environment variable.
  // We sanitize the string to ensure it is a valid URL.
  if (connectionString?.startsWith('psql')) {
    connectionString = connectionString.replace(/^psql\s+/, '').replaceAll(/^["']|["']$/g, '');
  }

  if (!connectionString) {
    throw new Error(`You are try to use database, but "DATABASE_URL" is not set correctly`);
  }

  if (serverDBEnv.DATABASE_DRIVER === 'node') {
    const client = new NodePool({ connectionString });
    return nodeDrizzle(client, { schema });
  }

  if (process.env.MIGRATION_DB === '1') {
    // https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined
    neonConfig.webSocketConstructor = ws;
  }

  const client = new NeonPool({ connectionString });
  return neonDrizzle(client, { schema });
};
