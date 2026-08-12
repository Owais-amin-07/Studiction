// src/services/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Centralized API layer for Studiction backend.
// All components go through these functions — never raw fetch().
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token management ──────────────────────────────────────────────────────────
// JWT is stored in localStorage under 'studiction_token'.
// (User data and result are still cached there too for instant UI restore on refresh.)

export const getToken = (): string | null =>
  localStorage.getItem('studiction_token');

export const setToken = (token: string): void =>
  localStorage.setItem('studiction_token', token);

export const removeToken = (): void =>
  localStorage.removeItem('studiction_token');

// ── Base fetch wrapper ────────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    // Throw the error message from the backend so the UI can display it
    throw new Error(data.error || 'Something went wrong');
  }

  return data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types — mirror App.tsx's UserData and DiagResult
// ─────────────────────────────────────────────────────────────────────────────

export interface UserData {
  name:       string;
  email:      string;
  username:   string;
  joinedDate: string;
  goal?:      string;
  isPremium?:        boolean;
  premiumPlan?:       'monthly' | 'yearly' | null;
  premiumExpiresAt?:  string | null;
}

export interface DiagResult {
  tier:    'low' | 'moderate' | 'high';
  stage:   'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
  score:   number;
  summary: string;
  addictionType?: 'digital' | 'nicotine' | 'both';
}

interface AuthResponse {
  token: string;
  user:  UserData;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 1 of signup: creates the account in an UNVERIFIED state and emails a
 * 6-digit OTP. No token is issued yet — call verifyOtp() to finish signing up.
 */
export async function signup(payload: {
  name:     string;
  email:    string;
  password: string;
}): Promise<{ message: string; email: string }> {
  return request<{ message: string; email: string }>('/auth/signup', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

/**
 * Step 2 of signup: submits the OTP the user received by email.
 * On success, stores the JWT and returns the now-verified user — this is
 * the point the account actually becomes usable.
 */
export async function verifyOtp(payload: {
  email: string;
  otp:   string;
}): Promise<UserData> {
  const data = await request<AuthResponse>('/auth/verify-otp', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
  setToken(data.token);
  return data.user;
}

/**
 * Requests a new OTP for a pending (unverified) signup, invalidating the
 * previous code. Subject to the backend's cooldown/resend-limit rules.
 */
export async function resendOtp(payload: { email: string }): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/resend-otp', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

/**
 * Log in to an existing account.
 * Stores JWT in localStorage. Returns user data.
 */
export async function login(payload: {
  email:    string;
  password: string;
}): Promise<UserData> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
  setToken(data.token);
  return data.user;
}

/**
 * Verify the stored JWT and fetch current user data from DB.
 * Call this on app startup to restore auth state.
 * Returns null if token is missing or invalid (user needs to log in).
 */
export async function getMe(): Promise<UserData | null> {
  if (!getToken()) return null;
  try {
    const data = await request<{ user: UserData }>('/auth/me');
    return data.user;
  } catch {
    // Token expired or invalid — clean up
    removeToken();
    return null;
  }
}

/**
 * Update the logged-in user's profile (name and/or username).
 */
export async function updateMe(payload: {
  name?:     string;
  username?: string;
  goal?:     string;
}): Promise<UserData> {
  const data = await request<{ user: UserData }>('/auth/me', {
    method: 'PATCH',
    body:   JSON.stringify(payload),
  });
  return data.user;
}

// ─────────────────────────────────────────────────────────────────────────────
// Results API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Save (or update) the diagnostic result for the logged-in user.
 * Called in App.tsx's DiagnosticChat onComplete handler.
 */
export async function saveResult(result: DiagResult): Promise<DiagResult> {
  const data = await request<{ result: DiagResult }>('/results', {
    method: 'POST',
    body:   JSON.stringify(result),
  });
  return data.result;
}

/**
 * Load the stored result for the logged-in user.
 * Returns null if no assessment has been completed yet.
 * Called on app startup after verifying auth, and after login.
 */
export async function getResult(): Promise<DiagResult | null> {
  const data = await request<{ result: DiagResult | null }>('/results/me');
  return data.result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostic AI API — proxies Groq calls through backend, no key on frontend
// ─────────────────────────────────────────────────────────────────────────────

export async function callAI(payload: {
  model:       string;
  messages:    { role: string; content: string }[];
  max_tokens?: number;
  temperature?: number;
}): Promise<any> {
  return request<any>('/diagnostic/chat', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium API — simulated payment layer (see backend/models/Payment.js)
// ─────────────────────────────────────────────────────────────────────────────

export interface PremiumPlan {
  id:       'monthly' | 'yearly';
  name:     string;
  amount:   number;
  currency: string;
  days:     number;
}

export interface PaymentRecord {
  id:             string;
  planId:         string;
  planName:       string;
  amount:         number;
  currency:       string;
  status:         'succeeded' | 'failed';
  simulatedTxnId: string;
  createdAt:      string;
}

export async function getPremiumPlans(): Promise<PremiumPlan[]> {
  const data = await request<{ plans: PremiumPlan[] }>('/premium/plans');
  return data.plans;
}

/**
 * simulateFailure is an explicit, deliberate test flag — never random —
 * so the failure UI can be demoed on purpose without risking an
 * unpredictable failure during a real demo.
 *
 * Doesn't use the shared request() helper: a "failed" simulated payment is
 * a valid 402 response with a real payment record attached (so the UI can
 * still show the simulated transaction id on a failure), not just an error
 * string — request() would discard everything but the message on a non-2xx
 * response.
 */
export async function purchasePremium(payload: {
  planId: 'monthly' | 'yearly';
  simulateFailure?: boolean;
}): Promise<{ payment: PaymentRecord; user: UserData | null; error: string | null }> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/premium/purchase`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (res.status === 402 && data.payment) {
    // Expected simulated failure — not a thrown error.
    return { payment: data.payment, user: null, error: data.error || 'Payment failed' };
  }
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return { payment: data.payment, user: data.user, error: null };
}

export async function getPaymentHistory(): Promise<PaymentRecord[]> {
  const data = await request<{ payments: PaymentRecord[] }>('/premium/history');
  return data.payments;
}


