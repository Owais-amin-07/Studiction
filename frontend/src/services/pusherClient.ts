import Pusher, { type Channel } from 'pusher-js';

let client: Pusher | null = null;

function getClient(): Pusher {
  if (client) return client;
  const key     = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER;
  if (!key || !cluster) {
    throw new Error('VITE_PUSHER_KEY and VITE_PUSHER_CLUSTER must be set in the frontend .env for live chat.');
  }
  client = new Pusher(key, { cluster });
  return client;
}

export function subscribeToRequest(requestId: string): Channel {
  return getClient().subscribe(`request-${requestId}`);
}

export function unsubscribeFromRequest(requestId: string): void {
  getClient().unsubscribe(`request-${requestId}`);
}
