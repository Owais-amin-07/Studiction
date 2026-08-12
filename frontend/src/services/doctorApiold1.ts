// src/services/doctorApi.ts
// ─────────────────────────────────────────────────────────────────────────────
// Doctor-portal API layer. Deliberately separate from services/api.ts —
// doctor and patient sessions are different roles with different tokens,
// stored under a different localStorage key so a doctor and a patient
// session can't collide or leak into each other.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getDoctorToken = (): string | null =>
  localStorage.getItem('studiction_doctor_token');

export const setDoctorToken = (token: string): void =>
  localStorage.setItem('studiction_doctor_token', token);

export const removeDoctorToken = (): void =>
  localStorage.removeItem('studiction_doctor_token');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getDoctorToken();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data as T;
}

export interface DoctorData {
  id:              string;
  name:            string;
  email:           string;
  specialization:  string;
  expertise:       string;
  experience:      string;
  bio:             string;
  profileComplete: boolean;
}

interface DoctorAuthResponse {
  token:  string;
  doctor: DoctorData;
}

export async function doctorLogin(payload: { email: string; password: string }): Promise<DoctorData> {
  const data = await request<DoctorAuthResponse>('/doctor-auth/login', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
  setDoctorToken(data.token);
  return data.doctor;
}

export async function getCurrentDoctor(): Promise<DoctorData | null> {
  if (!getDoctorToken()) return null;
  try {
    const data = await request<{ doctor: DoctorData }>('/doctor-auth/me');
    return data.doctor;
  } catch {
    removeDoctorToken();
    return null;
  }
}

export async function updateDoctorProfile(payload: {
  specialization?: string;
  expertise?:      string;
  experience?:     string;
  bio?:            string;
}): Promise<DoctorData> {
  const data = await request<{ doctor: DoctorData }>('/doctor-auth/profile', {
    method: 'PATCH',
    body:   JSON.stringify(payload),
  });
  return data.doctor;
}

export function doctorLogout(): void {
  removeDoctorToken();
}
