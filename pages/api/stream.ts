import type { NextApiRequest, NextApiResponse } from 'next';
import { subscribe, LiveMsg } from '@/lib/liveFeed';

// Server-Sent Events stream: the browser opens this once and receives pushes
// the instant a new quake is detected. No client polling required.
export const config = { api: { responseLimit: false, bodyParser: false } };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 5000\n\n');

  const send = (msg: LiveMsg) => {
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
  };
  const unsubscribe = subscribe(send);

  const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 20_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
}
