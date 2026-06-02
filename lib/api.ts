import type {
  Token, User, Vehicle, VehicleListItem, PaginatedResponse, DashboardStats,
  FinancingRequest, TradeIn, ServiceAppointment, Review,
  VehicleFilters, CreateVehiclePayload, FinancingStatus, ReviewStatus,
  TradeInStatus, AppointmentStatus,
  VehicleAIPreviewRequest, VehicleAIPreviewResponse,
  VehicleAIImageAnalysisResponse,
  ContactMessagePayload, ContactMessageOut,
  PublicReview, PublicReviewCreate,
  VehicleSearchResult,
  AgentEvent, AgentResult, AgentStepId, PhaseBRequest, PhaseCRequest,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  console.log("FETCH URL =", `${BASE}${path}`);
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  if (typeof window !== 'undefined') {
    const adminAuth = localStorage.getItem('adminAuthenticated');
    if (adminAuth) headers['x-admin-auth'] = adminAuth;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    // Disable Next.js Data Cache so every server-component render reaches
    // FastAPI instead of being served from the in-memory fetch cache.
    cache: 'no-store',
  });

  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json()).detail ?? detail; } catch {}
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function toQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<Token> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail || 'Login failed');
  }
  return res.json();
}

export function register(name: string, email: string, password: string): Promise<User> {
  return req('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export function getMe(): Promise<User> {
  return req('/api/auth/me');
}

// ── Vehicles (public) ─────────────────────────────────────────────────────────

export function getVehicles(filters: VehicleFilters = {}): Promise<PaginatedResponse<VehicleListItem>> {
  return req(`/api/vehicles${toQuery(filters as unknown as Record<string, unknown>)}`);
}

export type { VehicleFilters };

export function getFeaturedVehicles(limit = 6): Promise<VehicleListItem[]> {
  return req(`/api/vehicles/featured?limit=${limit}`);
}

export function getSimilarVehicles(vehicleId: string, limit = 4): Promise<VehicleListItem[]> {
  return req(`/api/vehicles/${vehicleId}/similar?limit=${limit}`);
}

export async function getVehicle(id: string): Promise<Vehicle> {
  console.log("GET VEHICLE CALLED", id);

  const result = await req<Vehicle>(`/api/vehicles/${id}`);

  console.log("API RESULT", result);
  return result;
}

export function applyFinancing(data: {
  vehicle_id?: string; phone: string; address: string; annual_income: string;
  employment_status: string; credit_score_range: string;
  down_payment?: string; employer_name?: string; years_employed?: number; monthly_budget?: string;
}): Promise<FinancingRequest> {
  return req('/api/financing', { method: 'POST', body: JSON.stringify(data) });
}

export function getMyFinancing(page = 1): Promise<PaginatedResponse<FinancingRequest>> {
  return req(`/api/financing/my?page=${page}`);
}

// ── Trade-In ──────────────────────────────────────────────────────────────────

export function submitTradeIn(data: {
  phone: string; make: string; model: string; year: number; mileage: number;
  condition: string; accident_history: boolean; color?: string; vin?: string;
  features?: string; additional_notes?: string; asking_price?: string;
}): Promise<TradeIn> {
  return req('/api/tradein', { method: 'POST', body: JSON.stringify(data) });
}

// ── Appointments ──────────────────────────────────────────────────────────────

export function bookAppointment(data: {
  vehicle_id?: string; service_type: string; appointment_date: string;
  phone: string; notes?: string;
}): Promise<ServiceAppointment> {
  return req('/api/appointments', { method: 'POST', body: JSON.stringify(data) });
}

export function getMyAppointments(page = 1): Promise<PaginatedResponse<ServiceAppointment>> {
  return req(`/api/appointments/my?page=${page}`);
}

export function cancelAppointment(id: string): Promise<void> {
  return req(`/api/appointments/${id}`, { method: 'DELETE' });
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export function getReviews(vehicleId?: string, page = 1): Promise<PaginatedResponse<Review>> {
  const q = toQuery({ ...(vehicleId ? { vehicle_id: vehicleId } : {}), page });
  return req(`/api/reviews${q}`);
}

export function submitReview(data: {
  vehicle_id?: string; rating: number; title: string; body: string;
}): Promise<Review> {
  return req('/api/reviews', { method: 'POST', body: JSON.stringify(data) });
}

// ── Vehicle search (typeahead) ────────────────────────────────────────────────

export function searchVehicles(q: string): Promise<VehicleSearchResult[]> {
  return req(`/api/vehicles/search${toQuery({ q })}`);
}

// ── Public Reviews (no-auth) ──────────────────────────────────────────────────
export function getPublicReviews(
  page = 1,
  page_size = 50
): Promise<PaginatedResponse<PublicReview>> {
  return req(`/api/reviews${toQuery({ page, page_size })}`);
}

export function submitPublicReview(
  data: PublicReviewCreate
): Promise<PublicReview> {
  return req('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


// ── User profile ──────────────────────────────────────────────────────────────

export function updateMe(data: { name?: string; email?: string }): Promise<User> {
  return req('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) });
}

// ── Admin Auth ────────────────────────────────────────────────────────────────

export function getAdminStatus(): Promise<{ configured: boolean }> {
  return req('/api/admin/status');
}

export function adminSetup(password: string): Promise<{ success: boolean }> {
  return req('/api/admin/setup', { method: 'POST', body: JSON.stringify({ password }) });
}

export function adminLogin(password: string): Promise<{ success: boolean }> {
  return req('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function getDashboardStats(): Promise<DashboardStats> {
  return req('/api/admin/dashboard');
}

export function adminListVehicles(page = 1, page_size = 20): Promise<PaginatedResponse<VehicleListItem>> {
  return req(`/api/vehicles?page=${page}&page_size=${page_size}`);
}

export function adminCreateVehicle(data: CreateVehiclePayload): Promise<Vehicle> {
  return req('/api/admin/vehicles', { method: 'POST', body: JSON.stringify(data) });
}

export function adminUpdateVehicle(id: string, data: Partial<CreateVehiclePayload>): Promise<Vehicle> {
  return req(`/api/admin/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function adminDeleteVehicle(id: string): Promise<void> {
  return req(`/api/admin/vehicles/${id}`, { method: 'DELETE' });
}

export function adminUploadImage(vehicleId: string, file: File): Promise<Vehicle> {
  const form = new FormData();
  form.append('file', file);
  return req(`/api/admin/vehicles/${vehicleId}/images`, { method: 'POST', body: form });
}

export function adminDeleteVehicleImage(vehicleId: string, imageUrl: string): Promise<Vehicle> {
  return req(`/api/admin/vehicles/${vehicleId}/images?image_url=${encodeURIComponent(imageUrl)}`, { method: 'DELETE' });
}

export function adminReorderImages(vehicleId: string, images: string[]): Promise<Vehicle> {
  return req(`/api/admin/vehicles/${vehicleId}/images/reorder`, { method: 'PUT', body: JSON.stringify({ images }) });
}

export function adminListUsers(page = 1): Promise<PaginatedResponse<User>> {
  return req(`/api/admin/users?page=${page}`);
}

export function adminListFinancing(
  status?: FinancingStatus, page = 1
): Promise<PaginatedResponse<FinancingRequest>> {
  return req(`/api/admin/financing${toQuery({ ...(status ? { financing_status: status } : {}), page })}`);
}

export function adminUpdateFinancing(
  id: string, data: { status?: FinancingStatus; admin_notes?: string }
): Promise<FinancingRequest> {
  return req(`/api/admin/financing/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function adminListTradeIns(
  status?: TradeInStatus, page = 1
): Promise<PaginatedResponse<TradeIn>> {
  return req(`/api/admin/tradein${toQuery({ ...(status ? { trade_status: status } : {}), page })}`);
}

export function adminListAppointments(
  status?: AppointmentStatus, page = 1
): Promise<PaginatedResponse<ServiceAppointment>> {
  return req(`/api/admin/appointments${toQuery({ ...(status ? { appt_status: status } : {}), page })}`);
}

export function adminUpdateAppointment(
  id: string, data: { status?: AppointmentStatus; admin_notes?: string }
): Promise<ServiceAppointment> {
  return req(`/api/admin/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function adminListReviews(
  status?: ReviewStatus, page = 1
): Promise<PaginatedResponse<Review>> {
  return req(`/api/admin/reviews${toQuery({ ...(status ? { review_status: status } : {}), page })}`);
}

export function adminUpdateReview(
  id: string, data: { status: ReviewStatus }
): Promise<Review> {
  return req(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function adminDeleteReview(id: string): Promise<void> {
  return req(`/api/admin/reviews/${id}`, { method: 'DELETE' });
}

// ── AI content generation ─────────────────────────────────────────────────────

export function adminGenerateAIContent(
  data: VehicleAIPreviewRequest,
): Promise<VehicleAIPreviewResponse> {
  return req('/api/admin/vehicles/ai-preview', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ── Contact ───────────────────────────────────────────────────────────────────

export function submitContact(data: ContactMessagePayload): Promise<ContactMessageOut> {
  return req('/api/contact', { method: 'POST', body: JSON.stringify(data) });
}

export function submitVehicleInquiry(
  vehicleId: string,
  data: { name: string; email: string; phone?: string; message: string },
): Promise<ContactMessageOut> {
  return req(`/api/vehicles/${vehicleId}/inquiry`, { method: 'POST', body: JSON.stringify(data) });
}

export function adminListContactMessages(page = 1): Promise<PaginatedResponse<ContactMessageOut>> {
  return req(`/api/admin/contact?page=${page}`);
}

export function adminMarkContactRead(id: string): Promise<{ ok: boolean }> {
  return req(`/api/admin/contact/${id}/read`, { method: 'PATCH' });
}

export function adminAnalyzeVehicleImage(
  file: File,
): Promise<VehicleAIImageAnalysisResponse> {
  const form = new FormData();
  form.append('file', file);
  return req('/api/admin/vehicles/ai-image-analyze', { method: 'POST', body: form });
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE}${path}`;
}

// ── AI Sales Agent (WebSocket streaming) ──────────────────────────────────────

const WS_BASE = BASE.replace(/^https?/, p => p === 'https' ? 'wss' : 'ws');

function _adminAuth(): string {
  if (typeof window === 'undefined') return 'true';
  return localStorage.getItem('adminAuthenticated') || 'true';
}

async function* _streamWS(payload: Record<string, unknown>): AsyncGenerator<AgentEvent> {
  const fullPayload = { ...payload, x_admin_auth: _adminAuth() };

  // Producer-consumer queue so WebSocket callbacks can feed the async generator.
  const queue: Array<AgentEvent | Error | null> = [];
  let notifyConsumer: (() => void) | null = null;

  function enqueue(item: AgentEvent | Error | null) {
    queue.push(item);
    notifyConsumer?.();
    notifyConsumer = null;
  }

  function waitForItem(): Promise<void> {
    return new Promise(resolve => { notifyConsumer = resolve; });
  }

  const wsRef = { current: null as WebSocket | null };
  let reconnects = 0;
  const maxReconnects = 3;

  function connect() {
    const socket = new WebSocket(`${WS_BASE}/ws/vehicle-processing`);
    wsRef.current = socket;

    socket.onopen = () => {
      reconnects = 0;
      socket.send(JSON.stringify(fullPayload));
    };

    socket.onmessage = (evt) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = JSON.parse(evt.data as string) as any;
        if (data.type === 'step_start') {
          enqueue({ type: 'step_start', step: data.step as AgentStepId, label: data.message as string });
        } else if (data.type === 'step_done') {
          enqueue({ type: 'step_done', step: data.step as AgentStepId });
        } else if (data.status === 'completed' || data.type === 'complete') {
          enqueue({ type: 'complete', result: data.result as AgentResult });
          enqueue(null); // signals done
        } else if (data.type === 'error' || data.status === 'error') {
          enqueue(new Error(data.message as string));
        }
      } catch { /* skip malformed frames */ }
    };

    socket.onclose = (evt) => {
      if (evt.code === 1000) return; // clean close — generator handles shutdown
      if (reconnects < maxReconnects) {
        reconnects++;
        setTimeout(connect, 500 * reconnects); // back-off: 500 ms, 1 s, 1.5 s
      } else {
        enqueue(new Error(`WebSocket disconnected (code ${evt.code}) after ${maxReconnects} reconnect attempts`));
      }
    };

    socket.onerror = () => { /* onclose always follows onerror */ };
  }

  connect();

  try {
    while (true) {
      while (queue.length === 0) await waitForItem();
      const item = queue.shift()!;
      if (item === null) return;           // completed sentinel
      if (item instanceof Error) throw item;
      yield item;
    }
  } finally {
    wsRef.current?.close(1000, 'generator-closed');
  }
}

/** Phase A — VIN decode + market research (WebSocket). */
export function streamVehicleIntelligence(vin: string): AsyncGenerator<AgentEvent> {
  return _streamWS({ phase: 'A', vin });
}

/** Phase B — listing generation with user review inputs (WebSocket). */
export function streamGenerateListing(data: PhaseBRequest): AsyncGenerator<AgentEvent> {
  return _streamWS({ phase: 'B', ...data });
}

/** Phase C — distribution (vehicle_id must be set) (WebSocket). */
export function streamDistribute(data: PhaseCRequest): AsyncGenerator<AgentEvent> {
  return _streamWS({ phase: 'C', ...data });
}

/** Legacy single-pass pipeline (kept for backward compat, WebSocket). */
export function streamAgentPipeline(vin: string, adminPrice?: number): AsyncGenerator<AgentEvent> {
  return _streamWS({ phase: 'legacy', vin, admin_price: adminPrice ?? null });
}
