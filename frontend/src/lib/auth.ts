export interface User {
  id: number;
  email: string;
  name?: string | null;
}

const BASE_URL = 'https://dictation-pte.onrender.com';

export async function register(email: string, password: string, name?: string) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    credentials: 'include', // 携带 Cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '注册失败');
  }

  const data = await res.json();
  return data.user as User;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '登录失败');
  }

  const data = await res.json();
  return data.user as User;
}

export async function fetchMe() {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.user as User;
}

export async function logout() {
  await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
