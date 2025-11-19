// src/pages/WelcomePage.tsx
import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Sparkles, Headphones, Heart, BookOpen, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const waveAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  padding-top: 80px;
  background: 
    radial-gradient(circle at 20% 80%, rgba(45, 212, 191, 0.15), transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.15), transparent 50%),
    #020617;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const WaveDecor = styled.div`
  position: absolute;
  top: 12%;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 500px;
  opacity: 0.7;
`;

const WaveSVG = styled.svg`
  width: 100%;
  .wave1 { animation: ${waveAnimation} 4s ease-in-out infinite; }
  .wave2 { animation: ${waveAnimation} 4s ease-in-out 1s infinite; }
`;

const Content = styled.div`
  text-align: center;
  max-width: 800px;
  padding: 2rem;
  z-index: 10;
`;

const Title = styled.h1`
  font-size: 4.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, #22d3ee, #34d399);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  @media (max-width: 640px) { font-size: 3.4rem; }
`;

const Tagline = styled.p`
  font-size: 1.5rem;
  color: #94a3b8;
  margin-bottom: 3rem;
  font-weight: 500;
`;

const Features = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 4rem;
`;

const FeatureCard = styled.div`
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
  &:hover { transform: translateY(-8px); border-color: #34d399; }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled.button`
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #22c55e, #14b8a6);
  color: #0f172a;
  border: none;
  border-radius: 1rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  box-shadow: 0 10px 30px rgba(34,197,94,0.4);
  transition: all 0.3s;
  &:hover { transform: translateY(-4px); }
`;

const SecondaryButton = styled.button`
  padding: 1rem 2.5rem;
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  border: 1.5px solid rgba(148, 163, 184, 0.5);
  border-radius: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
  &:hover { border-color: #34d399; background: rgba(52,211,153,0.2); }
`;

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 已登录用户直接跳到听写练习页
  if (user) {
    return <Navigate to="/dp" replace />;
  }

  return (
    <PageWrapper>
      <WaveDecor>
        <WaveSVG viewBox="0 0 500 120">
          <path d="M0 60 Q 125 20, 250 60 T 500 60" stroke="#22d3ee" strokeWidth="8" fill="none" className="wave1" />
          <path d="M0 60 Q 125 100, 250 60 T 500 60" stroke="#34d399" strokeWidth="7" fill="none" className="wave2" />
        </WaveSVG>
      </WaveDecor>

      <Content>
        <Title>PTE Dictation Pro</Title>
        <Tagline>完全免费的听写练习工具，由考生为考生打造</Tagline>

        <Features>
          <FeatureCard>
            <Headphones size={36} color="#22d3ee" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>真实机经 + 最新真题</div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>每周更新，紧跟考试趋势</div>
            </div>
          </FeatureCard>
          <FeatureCard>
            <BookOpen size={36} color="#34d399" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>智能纠错 + 错题本</div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>自动收集易错词，针对性复盘</div>
            </div>
          </FeatureCard>
          <FeatureCard>
            <Heart size={36} color="#f472b6" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>纯免费 · 永久开源</div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>无广告 · 无套路 · 没有付费墙</div>
            </div>
          </FeatureCard>
        </Features>

        <ActionButtons>
          <PrimaryButton onClick={() => navigate('/login')}>
            <LogIn size={22} /> 立即登录
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/register')}>
            <UserPlus size={22} /> 注册使用（完全免费）<ArrowRight size={20} />
          </SecondaryButton>
        </ActionButtons>

        <p style={{ marginTop: '3rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} color="#34d399" />
          打开即用 · 无需等待 · 由全球考生共同维护
        </p>
      </Content>
    </PageWrapper>
  );
};

export default WelcomePage;