export type PointMsg = {
  server_id: string
  device_id: string
  name: string
  value: number
  timestamp: string
  data_type: string
  unit: string
  address: string 
}

type SSEEvent<T> = {
  type: string
  data: T
  server_id?: string
  device_id?: string
  name?: string
  timestamp: string
  data_type: string
  unit: string
  address: string 
}

type Filter = { server_id?: string; device_id?: string; name?: string }

export function subscribePoints(
  onMessage: (m: PointMsg) => void,
  filter?: Filter
): () => void {
  let stopped = false
  let es: EventSource | null = null
  let retry = 1000
  let timer: any = null

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (filter?.server_id) params.set('server_id', filter.server_id)
    if (filter?.device_id) params.set('device_id', filter.device_id)
    if (filter?.name) params.set('name', filter.name)
    const qs = params.toString()
    return `/api/v1/stream/points${qs ? `?${qs}` : ''}`
  }

  const open = () => {
    if (stopped) return
    try {
      es = new EventSource(buildUrl())
      es.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data) as SSEEvent<any> | PointMsg
          // Flatten to PointMsg regardless of wrapper
          const m: PointMsg = ((): PointMsg => {
            const anyp: any = parsed as any
            if ('data' in anyp) {
              const ev = anyp as SSEEvent<any>
              const d: any = ev.data ?? {}
              return {
                server_id: ev.server_id ?? d.server_id ?? d.ServerID ?? '',
                device_id: ev.device_id ?? d.device_id ?? d.DeviceID ?? '',
                name: ev.name ?? d.name ?? d.Name ?? '',
                value: d.value ?? d.Value ?? 0,
                timestamp: ev.timestamp ?? d.timestamp ?? d.Timestamp ?? '',
                address: ev.address ?? d.address ?? d.Address ?? '',
                unit: ev.unit ?? d.unit ?? d.Unit ?? '',
                data_type: ev.data_type ?? d.data_type ?? d.DataType ?? '',
              }
            }
            // Already PointMsg shape
            const pm = anyp as PointMsg
            return pm
          })()
          onMessage(m)
        } catch {}
      }
      es.onerror = () => {
        if (stopped) return
        es?.close()
        es = null
        // exponential backoff up to 30s
        retry = Math.min(retry * 2, 30000)
        timer = setTimeout(() => {
          open()
        }, retry)
      }
      // reset retry on open
      retry = 1000
    } catch {
      if (stopped) return
      retry = Math.min(retry * 2, 30000)
      timer = setTimeout(open, retry)
    }
  }

  open()
  return () => {
    stopped = true
    if (timer) clearTimeout(timer)
    es?.close()
  }
}
