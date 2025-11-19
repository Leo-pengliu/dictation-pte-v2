// components/Navigation.tsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  Headphones,
  Home,
  Mic,
  Upload,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  padding: 0.75rem 0;
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;   // 关键：左右两端对齐
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;                        // Logo 和导航之间的间距
`;

const Logo = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e5e7eb;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.4rem;
  white-space: nowrap;

  &:hover {
    color: #10b981;
  }
`;

// 桌面端导航项（紧跟在 Logo 后面）
const DesktopNav = styled.div`
  display: none;
  align-items: center;
  gap: 1.8rem;

  @media (min-width: 900px) {        // 900px 以上显示横向导航
    display: flex;
  }
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: 12px;
  color: #cbd5e1;
  font-weight: 500;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.25s;

  &.active {
    background: rgba(16, 185, 129, 0.25);
    color: #10b981;
    font-weight: 600;
  }

  &:hover:not(.active) {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
`;

// 右侧用户信息（只在大屏显示）
const UserInfo = styled.div`
  display: none;
  align-items: center;
  gap: 1rem;
  color: #e5e7eb;
  font-size: 0.95rem;

  @media (min-width: 900px) {
    display: flex;
  }
`;

const LogoutBtn = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  &:hover {
    background: rgba(239, 68, 68, 0.35);
  }
`;

// 移动端汉堡按钮（900px 以下显示）
const MobileMenuBtn = styled.button`
  display: flex;
  background: none;
  border: none;
  color: #e5e7eb;
  cursor: pointer;
  padding: 0.5rem;

  @media (min-width: 900px) {
    display: none;
  }
`;

// 移动端抽屉
const MobileDrawer = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.98);
  backdrop-filter: blur(12px);
  z-index: 9999;
  padding: 5rem 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transform: translateY(${p => (p.$open ? 0 : '-100%')});
  opacity: ${p => (p.$open ? 1 : 0)};
  visibility: ${p => (p.$open ? 'visible' : 'hidden')};
  transition: all 0.3s ease;

  @media (min-width: 900px) {
    display: none;
  }
`;

export function Navigation() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const navLinks = user ? [
    { to: '/home', icon: Home, label: '主页' },
    { to: '/practice', icon: Headphones, label: '听写练习' },
    { to: '/rs', icon: Mic, label: '复述练习' },
    { to: '/upload', icon: Upload, label: '上传句子' },
  ] : [];

  return (
    <>
      <Nav>
        <Container>
          {/* 左侧：Logo + 导航（紧挨着） */}
          <LeftSection>
            <Logo to={user ? '/home' : '/login'}>
              <Headphones size={28} />
              Dictation Lab
            </Logo>

            {/* 桌面端导航紧跟在 Logo 后面 */}
            {user && (
              <DesktopNav>
                {navLinks.map(item => (
                  <NavItem key={item.to} to={item.to}>
                    <item.icon size={19} />
                    {item.label}
                  </NavItem>
                ))}
              </DesktopNav>
            )}
          </LeftSection>

          {/* 右侧：用户信息 + 退出（大屏） / 汉堡（小屏） */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {user ? (
              <>
                <UserInfo>
                  <User size={18} />
                  {user.name || user.email}
                </UserInfo>
                <LogoutBtn onClick={logout}>
                  <LogOut size={16} />
                  退出
                </LogoutBtn>
              </>
            ) : (
              <>
                <NavItem to="/login">登录</NavItem>
                <NavItem to="/register">注册</NavItem>
              </>
            )}

            {/* 移动端汉堡菜单按钮 */}
            <MobileMenuBtn onClick={() => setOpen(true)}>
              <Menu size={28} />
            </MobileMenuBtn>
          </div>
        </Container>
      </Nav>

      {/* 移动端抽屉菜单 */}
      <MobileDrawer $open={open}>
        <button
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#94a3b8' }}
          onClick={() => setOpen(false)}
        >
          <X size={32} />
        </button>

        {user && (
          <>
            <div style={{ padding: '1rem', color: '#e5e7eb', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={22} />
              {user.name || user.email}
            </div>

            {navLinks.map(item => (
              <NavItem key={item.to} to={item.to} onClick={() => setOpen(false)}>
                <item.icon size={22} />
                {item.label}
              </NavItem>
            ))}

            <LogoutBtn onClick={() => { logout(); setOpen(false); }} style={{ marginTop: '1rem' }}>
              <LogOut size={20} />
              退出登录
            </LogoutBtn>
          </>
        )}
      </MobileDrawer>
    </>
  );
}