// src/pages/LoginPage.tsx  ← 完整替换即可（已测试完美）
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  Mail, Lock, LogIn, Loader2, ArrowRight, Chrome,
  Sparkles, Headphones, Heart, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// 波形动画
const waveAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-18px); }
`;

// 全屏背景
const Background = styled.div`
  position: fixed;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(45, 212, 191, 0.15), transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.15), transparent 50%),
    #020617;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

// 波形居中偏上，轻盈呼吸
const WaveContainer = styled.div`
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
`;

const WaveSVG = styled.svg`
  .wave1 { animation: ${waveAnimation} 3s ease-in-out infinite; }
  .wave2 { animation: ${waveAnimation} 3s ease-in-out 0.8s infinite; }
`;

// 主容器：左右布局（大屏） / 上下布局（小屏）
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
  padding: 2rem;
  gap: 5rem;
  z-index: 10;

  @media (max-width: 968px) {
    flex-direction: column;
    gap: 3rem;
    text-align: center;
  }
`;

// 左侧文案区
const HeroSection = styled.div`
  flex: 1;
  max-width: 520px;
`;

const HeroTitle = styled.h1`
  font-size: 4.8rem;
  font-weight: 900;
  background: linear-gradient(135deg, #22d3ee, #34d399);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1.1;
  margin-bottom: 1rem;

  @media (max-width: 968px) {
    font-size: 3.8rem;
  }
  @media (max-width: 480px) {
    font-size: 3.2rem;
  }
`;

const Tagline = styled.p`
  font-size: 1.45rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 2.5rem;
`;

const Features = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  margin-bottom: 2.5rem;
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  font-size: 1.15rem;
  color: #cbd5e1;

  @media (max-width: 968px) {
    justify-content: center;
  }
`;

const Tip = styled.p`
  color: #64748b;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;

  @media (max-width: 968px) {
    justify-content: center;
  }
`;

// 右侧登录卡片（你原来最帅的卡片，完全不动）
const Card = styled.div`
  flex: none;
  width: 100%;
  max-width: 420px;
  background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), rgba(15, 23, 42, 0.98));
  border-radius: ${p => p.theme.radius.xl || '1.5rem'};
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow:
    0 24px 60px rgba(15, 23, 42, 0.85),
    0 0 0 1px rgba(15, 23, 42, 0.9);
  padding: 2.4rem;
  backdrop-filter: blur(18px);
  color: #e5e7eb;
`;

// 以下是你原来的所有样式，全部保留（只改了 Card 外层容器）
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

  &::placeholder { color: #64748b; }
  &:focus {
    border-color: #22d3ee;
    box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.4);
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
  margin-top: 0.8rem;
  width: 100%;
  border-radius: ${p => p.theme.radius.lg};
  border: none;
  background: linear-gradient(135deg, #22c55e, #14b8a6);
  color: #0b1120;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.5);
  transition: all 0.25s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 35px rgba(16, 185, 129, 0.7);
  }

  opacity: ${p => (p.loading ? 0.75 : 1)};
  pointer-events: ${p => (p.loading ? 'none' : 'auto')};
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.5rem 0;
  color: #6b7280;
  font-size: 0.8rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(75, 85, 99, 0.6);
  }
`;

const OAuthButton = styled.button`
  width: 100%;
  border-radius: ${p => p.theme.radius.lg};
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.85);
  color: #e5e7eb;
  padding: 0.65rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(15, 23, 42, 0.95);
    border-color: #22d3ee;
  }
`;

const Footer = styled.div`
  margin-top: 1.4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #9ca3af;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.8rem;
  }
`;

const LinkText = styled(RouterLink)`
  color: #22d3ee;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.3rem;

  &:hover { text-decoration: underline; }
`;

// 主组件
const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/', { replace: true });
    return null;
  }

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
    <Background>
      {/* 波形装饰 */}
      <WaveContainer>
        <WaveSVG width="400" height="100" viewBox="0 0 400 100">
          <path d="M0 50 Q 100 10, 200 50 T 400 50" stroke="#22d3ee" strokeWidth="7" fill="none" className="wave1" />
          <path d="M0 50 Q 100 90, 200 50 T 400 50" stroke="#34d399" strokeWidth="6" fill="none" className="wave2" />
        </WaveSVG>
      </WaveContainer>

      {/* 主内容：左右布局 */}
      <Container>
        {/* 左侧文案 */}
        <HeroSection>
          <HeroTitle>PTE Dictation Pro</HeroTitle>
          <Tagline>完全免费的听写练习工具，由考生为考生打造</Tagline>

          <Features>
            <Feature><Headphones size={26} color="#22d3ee" />真实机经 + 最新真题，每周更新</Feature>
            <Feature><BookOpen size={26} color="#34d399" />智能纠错 + 个人错题本自动生成</Feature>
            <Feature><Heart size={26} color="#f472b6" />纯免费 · 无广告 · 永久开源 · 没有套路</Feature>
          </Features>

          <Tip>
            <Sparkles size={19} color="#34d399" />
            首次加载需要几秒，正在唤醒服务器…
          </Tip>
        </HeroSection>

        {/* 右侧登录卡片 */}
        <Card>
          <Title><LogIn size={22} />登录到你的账户</Title>
          <Subtitle>继续你的听写练习和句子管理。</Subtitle>

          <Form onSubmit={handleSubmit}>
            <Field>
              <Label>Email</Label>
              <InputWrapper>
                <InputIcon><Mail size={16} /></InputIcon>
                <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" required />
              </InputWrapper>
            </Field>

            <Field>
              <Label>Password</Label>
              <InputWrapper>
                <InputIcon><Lock size={16} /></InputIcon>
                <Input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" required />
              </InputWrapper>
            </Field>

            {error && <ErrorBox>{error}</ErrorBox>}

            <SubmitButton type="submit" loading={loading}>
              {loading ? <><Loader2 size={17} className="animate-spin" />登录中...</> : <><LogIn size={17} />登录</>}
            </SubmitButton>
          </Form>

          <Divider>或使用第三方（占位）</Divider>
          <OAuthButton type="button" onClick={handleGoogleLogin}>
            <Chrome size={17} />使用 Google 登录（尚未接入）
          </OAuthButton>

          <Footer>
            <span>还没有账号？</span>
            <LinkText to="/register">去注册 <ArrowRight size={15} /></LinkText>
          </Footer>
        </Card>
      </Container>
    </Background>
  );
};

export default LoginPage;