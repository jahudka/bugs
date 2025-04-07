import { toAbortable } from '$/framework/library/iterables';
import { HttpResponse } from '../httpResponse';

export type ServerSentEvent = {
  id?: string;
  event?: string;
  data?: any;
  retry?: number;
};

export class SSEResponse extends HttpResponse {
  constructor(events: AsyncIterable<ServerSentEvent>, init?: ResponseInit) {
    super(toStream(events), init);
    this.headers.set('x-accel-buffering', 'no');
    this.headers.set('content-type', 'text/event-stream');
    this.headers.set('cache-control', 'no-cache');
  }
}

function toStream(events: AsyncIterable<ServerSentEvent>): ReadableStream {
  const abortable = toAbortable(events);

  return new ReadableStream({
    type: 'direct',
    async pull(controller: ReadableStreamDirectController) {
      for await (const event of abortable) {
        await controller.write(serializeEvent(event) ?? ':\n\n');
        await controller.flush();
      }
    },
    cancel() {
      abortable.abort();
    },
  } as Bun.DirectUnderlyingSource as any);
}

function serializeEvent(evt: ServerSentEvent): string | undefined {
  const lines: string[] = [];
  evt.event !== undefined && lines.push(`event: ${evt.event}`);
  evt.data !== undefined && lines.push(`data: ${JSON.stringify(evt.data)}`);
  evt.id !== undefined && lines.push(`id: ${evt.id}`);
  evt.retry !== undefined && lines.push(`retry: ${evt.retry}`);
  return lines.length ? `${lines.join('\n')}\n\n` : undefined;
}
