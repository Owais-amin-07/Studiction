// src/services/chatApi.ts
// Shared between the patient and doctor sides of a live chat — unlike
// api.ts/doctorApi.ts, every function here takes an explicit token rather
// than reading one fixed localStorage key, since the same LiveChat
// component is used by both roles with different sessions.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data as T;
}

export interface ChatMessageRecord {
  id:         string;
  senderType: 'patient' | 'doctor';
  senderName: string;
  content:    string;
  createdAt:  string;
}

export interface ChatRoomInfo {
  request: {
    id: string;
    status: 'accepted' | 'completed';
    sessionEndsAt: string | null;
    report?: {
      mainConcern: string; keyDetails: string; urgency: 'low' | 'moderate' | 'high'; summary: string;
    };
    patientName?: string; // present for the doctor-facing shape
    doctor?: { name: string; specialization: string; expertise: string; experience: string; bio: string } | null; // present for the patient-facing shape
  };
  messages: ChatMessageRecord[];
  sessionEnded: boolean;
}

export async function getChatRoom(requestId: string, token: string): Promise<ChatRoomInfo> {
  return request<ChatRoomInfo>(`/chat/${requestId}`, token);
}

export async function sendChatMessage(requestId: string, token: string, content: string): Promise<ChatMessageRecord> {
  const data = await request<{ message: ChatMessageRecord }>(`/chat/${requestId}/messages`, token, {
    method: 'POST',
    body:   JSON.stringify({ content }),
  });
  return data.message;
}

export async function extendSession(requestId: string, token: string): Promise<{ sessionEndsAt: string }> {
  return request<{ sessionEndsAt: string }>(`/chat/${requestId}/extend`, token, { method: 'POST' });
}

export async function endSession(requestId: string, token: string): Promise<void> {
  await request(`/chat/${requestId}/end`, token, { method: 'POST' });
}

export async function getAiTip(requestId: string, token: string): Promise<string> {
  const data = await request<{ tip: string }>(`/chat/${requestId}/ai-tip`, token, { method: 'POST' });
  return data.tip;
}
