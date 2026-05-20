import type {
  Token, User, Vehicle, VehicleListItem, PaginatedResponse, DashboardStats,
  FinancingRequest, TradeIn, ServiceAppointment, Review,
  VehicleFilters, CreateVehiclePayload, FinancingStatus, ReviewStatus,
  TradeInStatus, AppointmentStatus,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let _token: string | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

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

export function getVehicle(id: string): Promise<Vehicle> {
  return req(`/api/vehicles/${id}`);
}

// ── Financing ─────────────────────────────────────────────────────────────────

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

// ── User profile ──────────────────────────────────────────────────────────────

export function updateMe(data: { name?: string; email?: string }): Promise<User> {
  return req('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) });
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

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE}${path}`;
}
