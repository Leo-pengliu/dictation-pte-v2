// components/Navigation.tsx
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Headphones, Upload } from 'lucide-react';

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

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: ${p => p.theme.radius.lg};
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 500;
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

export function Navigation() {
  return (
    <Nav>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '3rem' }}>
        <NavItem to="/">
          <Headphones size={20} />
          听写练习
        </NavItem>
        <NavItem to="/upload">
          <Upload size={20} />
          上传句子
        </NavItem>
      </div>
    </Nav>
  );
}