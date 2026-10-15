const BASE = 'http://127.0.0.1:8000';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.json();
}
export const api = {
  dashboard: () => request<any>('/api/dashboard'),
  incidents: () => request<any[]>('/api/incidents'),
  resources: () => request<any[]>('/api/resources'),
  sample: () => request<any>('/api/sample-data', { method: 'POST' }),
  allocate: () => request<any>('/api/allocate', { method: 'POST' }),
  route: () => request<any>('/api/route-demo'),
  addIncident: (data: any) => request<any>('/api/incidents', { method: 'POST', body: JSON.stringify(data) }),
  addResource: (data: any) => request<any>('/api/resources', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) => request<any>(`/api/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
