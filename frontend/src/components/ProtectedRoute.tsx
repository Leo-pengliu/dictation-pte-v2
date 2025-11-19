// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 正在加载登录态
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1.5rem',
        fontSize: '1.2rem'
      }}>
        <div style={{
          width: 70,
          height: 70,
          border: '6px solid #22d3ee',
          borderTop: '6px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div>正在唤醒服务器，请稍等...</div>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // loading 结束 → 再判断
  if (!user) {
    // 未登录 → 记住他想去哪，登录后回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登录 → 正常渲染
  return <>{children}</>;
};