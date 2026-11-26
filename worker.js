// The Cloudflare server. Cloudflare hands out the public folder by itself
// (see wrangler.jsonc), so this file only does the shared collage.
import { DurableObject } from 'cloudflare:workers';

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname !== '/ws') return new Response('Not found', { status: 404 });
    // Everyone connects to the same room, called "collage".
    return env.ROOM.get(env.ROOM.idFromName('collage')).fetch(request);
  },
};

// The room remembers the collage (even when the server restarts),
// and passes every change on to everyone else.
export class Room extends DurableObject {
  async fetch() {
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server);
    // Someone arrives: send them the current collage (or null if there is none yet)
    server.send(JSON.stringify({ type: 'layout', data: await this.ctx.storage.get('layout') ?? null }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    const { type, data } = JSON.parse(message);
    let layout = await this.ctx.storage.get('layout') ?? null;

    if (type === 'layout') layout = data;                                         // new collage (Space)
    if (type === 'add' && layout) data.solo ? layout.push(data) : layout.unshift(data);   // pasted from the gallery
    if (type === 'move' && layout) {                                              // moved a piece
      const p = layout.find(p => p.id === data.id);
      if (p) { p.x = data.x; p.y = data.y; }
    }
    if (type === 'remove' && layout) layout = layout.filter(p => p.id !== data);  // binned a piece

    await this.ctx.storage.put('layout', layout);
    for (const other of this.ctx.getWebSockets()) if (other !== ws) other.send(message);
  }
}
