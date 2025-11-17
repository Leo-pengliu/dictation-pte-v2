// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../lib/auth';
import {
  fetchMe,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初次加载：尝试从后端获取当前登录用户
  useEffect(() => {
    (async () => {
      try {
        const me = await fetchMe();
        setUser(me);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
  };

  const handleRegister = async (email: string, password: string, name?: string) => {
    const u = await apiRegister(email, password, name);
    setUser(u);
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  };

  /**
   * 🔒 2 小时无操作自动登出（前端 idle timer）
   */
  useEffect(() => {
    // 没有登录用户时不需要监听
    if (!user) return;

    let timeoutId: number;

    const AUTO_LOGOUT_MS = 2 * 60 * 60 * 1000; // 2 小时

    const logoutWhenIdle = async () => {
      await handleLogout();
      // 强制跳回登录页，你也可以带个 query 提示 reason=timeout
      window.location.href = '/login';
    };

    const resetTimer = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(logoutWhenIdle, AUTO_LOGOUT_MS);
    };

    const events: (keyof WindowEventMap)[] = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ];

    // 只要有任何用户操作，重置计时器
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    // 初次进入（刚登录）时先启动计时
    resetTimer();

    // 清理：用户退出 / 组件卸载时移除监听 & 计时器
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [user]); // user 变化时重新挂载

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
