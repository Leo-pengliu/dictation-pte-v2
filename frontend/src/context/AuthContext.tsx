import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../lib/auth';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  fetchMe,
} from '../lib/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // 初次启动：尝试用 Cookie 载入登录态（如果你仍使用后端 Session）
  useEffect(() => {
    (async () => {
      // 如果 localStorage 里已经有 user，直接用就行（不用请求）
      if (user) {
        setLoading(false);
        return;
      }

      // 否则试试 fetchMe（如果你的后端有 Cookie 机制）
      try {
        const me = await fetchMe();
        if (me) {
          setUser(me);
          localStorage.setItem('user', JSON.stringify(me));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 登录
  const handleLogin = async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  // 注册
  const handleRegister = async (email: string, password: string, name?: string) => {
    const u = await apiRegister(email, password, name);
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
  };

  // 退出
  const handleLogout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  /**
   * 🔒 2 小时无操作自动登出（前端 idle timer）
   */
  useEffect(() => {
    if (!user) return;

    let timeoutId: number;
    const AUTO_LOGOUT_MS = 2 * 60 * 60 * 1000; // 2 小时

    const logoutWhenIdle = async () => {
      await handleLogout();
      window.location.href = '/login';
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(logoutWhenIdle, AUTO_LOGOUT_MS);
    };

    const events: (keyof WindowEventMap)[] = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
