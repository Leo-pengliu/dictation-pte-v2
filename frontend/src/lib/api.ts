// src/lib/api.ts
const API = 'https://dictation-pte-v2.vercel.app/api';

export interface Sentence {
  id: number;
  original: string;
  translation: string;
  explanation?: string;
  audioPath: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const api = {
  getSentences: async (page: number, limit = 1) => {
    const url = `${API}/sentences?page=${page}&limit=${limit}`;
    console.log('[API] 请求:', url);

    try {
      const res = await fetch(url);
      const text = await res.text(); // 先读文本，防止 JSON 解析失败
      console.log('[API] 原始响应文本:', text);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`JSON 解析失败: ${text}`);
      }

      // 强行过滤字段，只保留我们需要的
      const cleanData = (data.data || []).map((s: any) => ({
        id: s.id,
        original: s.original,
        translation: s.translation,
        explanation: s.explanation,
        audioPath: s.audioPath,
        difficulty: s.difficulty || 'medium'
      }));

      return {
        data: cleanData,
        pagination: data.pagination || { page, limit, total: 0, totalPages: 1 }
      };
    } catch (err: any) {
      console.error('[API] 请求失败:', err);
      // 即使后端 500，前端也返回空数据，不卡 loading
      return {
        data: [],
        pagination: { page, limit, total: 0, totalPages: 1 }
      };
    }
  },

  // 其他 API 同理
  getSentence: async (id: number) => {
    const res = await fetch(`${API}/sentences/${id}`);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { data: {} };
    }
    const s = data.data || {};
    return {
      data: {
        id: s.id,
        original: s.original,
        translation: s.translation,
        explanation: s.explanation,
        audioPath: s.audioPath,
        difficulty: s.difficulty || 'medium'
      }
    };
  },

  uploadSentence: async (formData: FormData) => {
    const res = await fetch(`${API}/sentences`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },
};