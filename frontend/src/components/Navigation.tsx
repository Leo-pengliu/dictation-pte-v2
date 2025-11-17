// components/Navigation.tsx
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { Headphones, Upload, Home, LogIn, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid ${p => p.theme.colors.border};
  z-index: 1000;
  padding: 1rem 0;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Brand = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e5e7eb;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.03em;

  &:hover {
    color: ${p => p.theme.colors.primaryLight};
  }
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.1rem;
  border-radius: ${p => p.theme.radius.lg};
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.3s;

  &.active {
    background: rgba(16, 185, 129, 0.2);
    color: ${p => p.theme.colors.primaryLight};
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
  }

  &:hover:not(.active) {
    background: ${p => p.theme.colors.surfaceHover};
    color: ${p => p.theme.colors.primaryLight};
  }
`;

const UserName = styled.span`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #e5e7eb;
`;

const LogoutButton = styled.button`
  padding: 0.4rem 0.8rem;
  border-radius: ${p => p.theme.radius.md};
  border: 1px solid ${p => p.theme.colors.border};
  background: transparent;
  color: #e5e7eb;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.theme.colors.surfaceHover};
    border-color: ${p => p.theme.colors.primaryLight};
    color: ${p => p.theme.colors.primaryLight};
  }
`;

export function Navigation() {
  const { user, logout } = useAuth();

  return (
    <Nav>
      <Container>
        {/* 左侧：品牌 + 已登录时的导航 */}
        <LeftGroup>
          <Brand to={user ? '/home' : '/login'}>
            <Headphones size={20} />
            <span>Dictation Lab</span>
          </Brand>

          {user && (
            <>
              <NavItem to="/home">
                <Home size={18} />
                主页
              </NavItem>
              <NavItem to="/">
                <Headphones size={18} />
                听写练习
              </NavItem>
              <NavItem to="/upload">
                <Upload size={18} />
                上传句子
              </NavItem>
            </>
          )}
        </LeftGroup>

        {/* 右侧：登录/注册 或 用户信息 + 退出 */}
        <RightGroup>
          {user ? (
            <>
              <UserName>
                <User size={16} />
                {user.name || user.email}
              </UserName>
              <LogoutButton onClick={logout}>
                <LogOut size={14} />
                退出
              </LogoutButton>
            </>
          ) : (
            <>
              <NavItem to="/login">
                <LogIn size={18} />
                登录
              </NavItem>
              <NavItem to="/register">
                注册
              </NavItem>
            </>
          )}
        </RightGroup>
      </Container>
    </Nav>
  );
}
