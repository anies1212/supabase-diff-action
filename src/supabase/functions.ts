import { EdgeFunction } from '../types';

const SUPABASE_API_URL = 'https://api.supabase.com';

export async function getEdgeFunctions(
  projectRef: string,
  accessToken: string
): Promise<EdgeFunction[]> {
  const response = await fetch(
    `${SUPABASE_API_URL}/v1/projects/${projectRef}/functions`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch Edge Functions for project ${projectRef}: ${response.status} ${errorText}`
    );
  }

  const functions = (await response.json()) as Record<string, unknown>[];

  return functions.map((fn) => ({
    id: fn.id as string,
    name: fn.name as string,
    slug: fn.slug as string,
    status: fn.status as string,
    version: fn.version as number,
    createdAt: fn.created_at as string,
    updatedAt: fn.updated_at as string,
  }));
}
