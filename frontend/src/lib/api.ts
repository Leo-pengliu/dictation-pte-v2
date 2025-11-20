const API = 'https://dictation-pte.onrender.com/api';

export interface Sentence {
  id: number;
  original: string;
  translation: string;
  explanation?: string;
  audioPath: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  /** ⭐ 新增：后端返回 0 / 1，这里转成 boolean */
  isFavorite?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const api = {
  /**
   * 获取句子列表
   * @param page       页码
   * @param limit      每页条数（默认 1）
   * @param difficulty 难度过滤（可选）
   * @param favoriteOnly 只看收藏（true/false）
   */
  getSentences: async (
    page: number,
    limit = 1,
    difficulty?: 'easy' | 'medium' | 'hard',
    favoriteOnly: boolean = false
  ) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (difficulty) params.set('difficulty', difficulty);
    if (favoriteOnly) params.set('favorite', '1');

    const url = `${API}/sentences?${params.toString()}`;

    try {
      const res = await fetch(url, {
        credentials: 'include', // ⭐ 带上登录 Cookie
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`JSON 解析失败: ${text}`);
      }

      const cleanData: Sentence[] = (data.data || []).map((s: any) => ({
        id: s.id,
        original: s.original,
        translation: s.translation,
        explanation: s.explanation,
        audioPath: s.audioPath,
        difficulty: (s.difficulty as any) || 'medium',
        isFavorite: !!s.isFavorite, // 0/1 → boolean
      }));

      return {
        data: cleanData,
        pagination: data.pagination || { page, limit, total: 0, totalPages: 1 },
      };
    } catch (err) {
      console.error('[API] 请求失败:', err);
      return {
        data: [] as Sentence[],
        pagination: { page, limit, total: 0, totalPages: 1 },
      };
    }
  },

  /** 获取单条句子 */
  getSentence: async (id: number) => {
    const res = await fetch(`${API}/sentences/${id}`, {
      credentials: 'include',
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { data: {} };
    }
    const s = data.data || {};

    const sentence: Sentence = {
      id: s.id,
      original: s.original,
      translation: s.translation,
      explanation: s.explanation,
      audioPath: s.audioPath,
      difficulty: (s.difficulty as any) || 'medium',
      isFavorite: !!(s.isFavorite),
    };

    return { data: sentence };
  },

  /** 上传句子 */
  uploadSentence: async (formData: FormData) => {
    const res = await fetch(`${API}/sentences`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    return res.json();
  },

  /** ⭐ 新增：收藏 / 取消收藏（后端会自动 toggle） */
  toggleFavorite: async (sentenceId: number) => {
    const res = await fetch(`${API}/sentences/${sentenceId}/favorite`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`收藏操作失败：${text}`);
    }

    const data = await res.json();
    return { isFavorite: !!data.isFavorite };
  },
};

/* ================== 下面是 auth.ts 原来的内容 ================== */

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
