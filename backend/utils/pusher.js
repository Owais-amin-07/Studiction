const Pusher = require('pusher');

// Built lazily so a missing env var only errors when a message is actually
// sent, not at server boot — same pattern as utils/mailer.js.
let pusher = null;
function getPusher() {
  if (pusher) return pusher;

  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    throw new Error(
      'PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, and PUSHER_CLUSTER must be set to use live chat.'
    );
  }

  pusher = new Pusher({
    appId:   PUSHER_APP_ID,
    key:     PUSHER_KEY,
    secret:  PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS:  true,
  });
  return pusher;
}

// Each PremiumRequest gets its own channel — the Mongo ObjectId is
// unguessable enough that a plain public channel is a reasonable
// simplification here (a production system would use a private channel
// with a real auth endpoint; not needed at this project's scope).
function channelForRequest(requestId) {
  return `request-${requestId}`;
}

async function triggerEvent(requestId, eventName, payload) {
  const client = getPusher();
  await client.trigger(channelForRequest(requestId), eventName, payload);
}

module.exports = { channelForRequest, triggerEvent };
