export type UserRole = 'admin' | 'customer';
export type VehicleStatus = 'available' | 'sold' | 'reserved' | 'pending';
export type TransmissionType = 'automatic' | 'manual' | 'cvt' | 'dct';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'plug_in_hybrid';
export type FinancingStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled';
export type TradeInStatus = 'pending' | 'under_review' | 'appraised' | 'accepted' | 'rejected';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type ServiceType =
  | 'oil_change' | 'tire_rotation' | 'brake_service' | 'engine_diagnostic'
  | 'transmission_service' | 'ac_service' | 'general_inspection' | 'test_drive' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Vehicle {
  id: string;

  title: string;

  make: string;

  model: string;

  year: number;

  mileage: number;

  price: string;

  transmission: TransmissionType;

  fuel_type: FuelType;

  vin: string;

  images: string[];

  status: VehicleStatus;

  featured: boolean;

  price_on_call: boolean;

  description: string | null;

  color: string | null;

  body_type: string | null;

  stock_number: string | null;

  engine: string | null;

  drive: string | null;

  fuel_economy: string | null;

  features: string[] | null;

  created_at: string;

  updated_at: string;
}

export interface VehicleListItem {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: string;
  transmission: TransmissionType;
  fuel_type: FuelType;
  images: string[];
  status: VehicleStatus;
  featured: boolean;
  price_on_call: boolean;
  color: string | null;
  stock_number?: string | null;
  engine?: string | null;
  drive?: string | null;
  fuel_economy?: string | null;
  features?: string[] | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface DashboardStats {
  vehicles: { total: number; available: number; sold: number };
  users: { total: number };
  financing: { total: number; pending: number };
  trade_ins: { total: number };
  appointments: { total: number };
  reviews: { total: number; pending: number };
}

export interface FinancingRequest {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  phone: string;
  address: string;
  annual_income: string;
  employment_status: string;
  employer_name: string | null;
  years_employed: number | null;
  credit_score_range: string;
  down_payment: string;
  monthly_budget: string | null;
  status: FinancingStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeIn {
  id: string;
  customer_id: string;
  phone: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  color: string | null;
  vin: string | null;
  condition: string;
  accident_history: boolean;
  features: string | null;
  additional_notes: string | null;
  asking_price: string | null;
  valuation_notes: string | null;
  appraised_value: string | null;
  status: TradeInStatus;
  created_at: string;
  updated_at: string;
}

export interface ServiceAppointment {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  service_type: ServiceType;
  appointment_date: string;
  phone: string;
  notes: string | null;
  status: AppointmentStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  year_min?: number;
  year_max?: number;
  price_min?: number;
  price_max?: number;
  mileage_max?: number;
  transmission?: TransmissionType;
  fuel_type?: FuelType;
  status?: VehicleStatus;
  featured?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

// ── AI content generation ─────────────────────────────────────────────────────

export interface VehicleAIPreviewRequest {
  title: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  drive: string;
  fuel_economy: string;
  mileage: number;
  color?: string;
  body_type?: string;
  transmission?: string;
  features: string[];
}

export interface VehicleAIPreviewResponse {
  description: string;
  highlights: string[];
  seo_title: string;
  meta_description: string;
}

export interface VehicleAIImageAnalysisResponse {
  make:            string | null;
  model:           string | null;
  year:            number | null;
  color:           string | null;
  body_type:       string | null;
  title:           string | null;
  confidence_note: string | null;
}

export interface CreateVehiclePayload {

  title: string;

  make: string;

  model: string;

  year: number;

  mileage: number;

  price: string;

  transmission: TransmissionType;

  fuel_type: FuelType;

  vin: string;

  description?: string;

  color?: string;

  body_type?: string;

  stock_number?: string;

  engine?: string;

  drive?: string;

  fuel_economy?: string;

  features?: string[];

  featured: boolean;

  price_on_call?: boolean;

  status: VehicleStatus;
}