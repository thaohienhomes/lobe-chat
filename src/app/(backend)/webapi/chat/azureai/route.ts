import { POST as UniverseRoute } from '../[provider]/route';

// NOTE: Removed edge runtime because checkAuth middleware requires Node.js runtime
// for database access (subscription validation)
// export const runtime = 'edge';

export const POST = async (req: Request) =>
  UniverseRoute(req, { params: Promise.resolve({ provider: 'azureai' }) });
