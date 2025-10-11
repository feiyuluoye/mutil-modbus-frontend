export type PointMsg = {
  server_id: string
  device_id: string
  name: string
  value: number
  timestamp: string
}

export function subscribePoints(onMessage: (m: PointMsg) => void): () => void {
  const es = new EventSource('/api/v1/stream/points')
  es.onmessage = (evt) => {
    try { onMessage(JSON.parse(evt.data)) } catch {}
  }
  es.onerror = () => {
    // optional: add simple backoff/reconnect outside
  }
  return () => es.close()
}
