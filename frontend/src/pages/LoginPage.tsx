// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import styled from 'styled-components';
import { Mail, Lock, LogIn, Loader2, ArrowRight, Chrome } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Page = styled.div`
  min-height: 100vh;
  padding: 7rem 1.5rem 2rem; /* 顶部给 Navigation 腾空间 */
  background: radial-gradient(circle at top, rgba(45, 212, 191, 0.12), transparent 55%),
    radial-gradient(circle at bottom, rgba(56, 189, 248, 0.15), #020617 60%);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Card = styled.div`
  width: 100%;
  max-width: 420px;
  background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.98));
  border-radius: ${p => p.theme.radius.xl || '1.5rem'};
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow:
    0 24px 60px rgba(15, 23, 42, 0.85),
    0 0 0 1px rgba(15, 23, 42, 0.9);
  padding: 2.2rem 2.4rem 2rem;
  backdrop-filter: blur(18px);
  color: #e5e7eb;
`;

const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: #9ca3af;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const Label = styled.label`
  font-size: 0.85rem;
  color: #cbd5e1;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  display: flex;
  align-items: center;
  color: #64748b;
`;

const Input = styled.input`
  width: 100%;
  border-radius: ${p => p.theme.radius.lg};
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  padding: 0.7rem 0.9rem 0.7rem 2.4rem;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;

  &::placeholder {
    color: #64748b;
  }

  &:focus {
    border-color: ${p => p.theme.colors.primaryLight};
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.4);
    background: rgba(15, 23, 42, 0.95);
  }
`;

const ErrorBox = styled.div`
  margin-top: 0.4rem;
  padding: 0.55rem 0.75rem;
  border-radius: ${p => p.theme.radius.md};
  background: rgba(248, 113, 113, 0.18);
  border: 1px solid rgba(248, 113, 113, 0.45);
  color: #fecaca;
  font-size: 0.8rem;
`;

const SubmitButton = styled.button<{ loading?: boolean }>`
  margin-top: 0.6rem;
  width: 100%;
  border-radius: ${p => p.theme.radius.lg};
  border: none;
  background: linear-gradient(135deg, #22c55e, #14b8a6);
  color: #0b1120;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.7rem 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  box-shadow:
    0 0 25px rgba(16, 185, 129, 0.5),
    0 14px 30px rgba(15, 23, 42, 0.9);
  transition: all 0.2s;
  opacity: ${p => (p.loading ? 0.8 : 1)};
  pointer-events: ${p => (p.loading ? 'none' : 'auto')};

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      0 0 30px rgba(16, 185, 129, 0.7),
      0 18px 36px rgba(15, 23, 42, 0.95);
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.4rem 0 1rem;
  color: #6b7280;
  font-size: 0.8rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(75, 85, 99, 0.8), transparent);
  }
`;

const OAuthButton = styled.button`
  width: 100%;
  border-radius: ${p => p.theme.radius.lg};
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.85);
  color: #e5e7eb;
  font-size: 0.85rem;
  padding: 0.6rem 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(15, 23, 42, 0.95);
    border-color: ${p => p.theme.colors.primaryLight};
  }
`;

const Footer = styled.div`
  margin-top: 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #9ca3af;
  gap: 0.75rem;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const LinkText = styled(RouterLink)`
  color: ${p => p.theme.colors.primaryLight};
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    text-decoration: underline;
  }
`;

const HintText = styled.span`
  font-size: 0.78rem;
  color: #6b7280;
`;

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    window.location.href = `${base}/api/auth/google`;
  };

  return (
    <Page>
      <Card>
        <Title>
          <LogIn size={22} />
          登录到你的账户
        </Title>
        <Subtitle>继续你的听写练习和句子管理。</Subtitle>

        <Form onSubmit={handleSubmit}>
          <Field>
            <Label>Email</Label>
            <InputWrapper>
              <InputIcon>
                <Mail size={16} />
              </InputIcon>
              <Input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </InputWrapper>
          </Field>

          <Field>
            <Label>Password</Label>
            <InputWrapper>
              <InputIcon>
                <Lock size={16} />
              </InputIcon>
              <Input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </InputWrapper>
          </Field>

          {error && <ErrorBox>{error}</ErrorBox>}

          <SubmitButton type="submit" loading={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                登录中...
              </>
            ) : (
              <>
                <LogIn size={16} />
                登录
              </>
            )}
          </SubmitButton>
        </Form>

        <Divider>或使用第三方（占位）</Divider>

        <OAuthButton type="button" onClick={handleGoogleLogin}>
          <Chrome size={16} />
          使用 Google 登录（尚未接入）
        </OAuthButton>

        <Footer>
          <HintText>还没有账号？</HintText>
          <LinkText to="/register">
            去注册
            <ArrowRight size={14} />
          </LinkText>
        </Footer>
      </Card>
    </Page>
  );
};

export default LoginPage;
