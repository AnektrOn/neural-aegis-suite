/** Cleanup must never turn an accepted email into a failed send or hide its error. */
export async function sendAndClose(client: { send: () => Promise<unknown>; close: () => unknown }) {
  try {
    await client.send();
  } finally {
    try { await client.close(); } catch { /* A failed handshake can leave no connection to close. */ }
  }
}