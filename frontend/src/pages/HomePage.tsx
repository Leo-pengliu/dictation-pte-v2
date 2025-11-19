// src/pages/HomePage.tsx
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import styled from 'styled-components';
import { Headphones, Upload, ArrowRight, Sparkles, BookOpen, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Page = styled.div`
  min-height: 100vh;
  padding: 7rem 1.8rem 2.5rem; /* 顶部给 Navigation 腾空间 */
  background: radial-gradient(circle at top, rgba(45, 212, 191, 0.14), transparent 55%),
    radial-gradient(circle at bottom, rgba(56, 189, 248, 0.18), #020617 60%);
  display: flex;
  justify-content: center;
`;

const Content = styled.div`
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.2fr);
  gap: 2rem;

  @media (max-width: 880px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Hero = styled.section`
  padding: 1.5rem 1.2rem 1.6rem;
  border-radius: ${p => p.theme.radius.xl};
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: radial-gradient(circle at top left, rgba(34, 197, 94, 0.18), rgba(15, 23, 42, 0.96));
  color: #e5e7eb;
  box-shadow:
    0 24px 60px rgba(15, 23, 42, 0.85),
    0 0 0 1px rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(16px);
`;

const GreetingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.7rem;
`;

const Greeting = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.18);
  color: #a7f3d0;
  border: 1px solid rgba(34, 197, 94, 0.5);
`;

const Subtext = styled.p`
  font-size: 0.92rem;
  color: #cbd5e1;
  max-width: 460px;
  line-height: 1.5;
  margin-bottom: 1.5rem;
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin-bottom: 1.25rem;
`;

const PrimaryButton = styled(RouterLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.2rem;
  border-radius: ${p => p.theme.radius.lg};
  border: none;
  background: linear-gradient(135deg, #22c55e, #14b8a6);
  color: #0b1120;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  box-shadow:
    0 0 25px rgba(16, 185, 129, 0.5),
    0 14px 30px rgba(15, 23, 42, 0.9);
  transition: all 0.18s;

  &:hover {
    transform: translateY(-1px);
    box-shadow:
      0 0 30px rgba(16, 185, 129, 0.7),
      0 18px 36px rgba(15, 23, 42, 0.95);
  }
`;

const SecondaryButton = styled(RouterLink)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  border-radius: ${p => p.theme.radius.lg};
  border: 1px solid rgba(148, 163, 184, 0.6);
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  font-weight: 500;
  font-size: 0.86rem;
  text-decoration: none;
  transition: all 0.18s;

  &:hover {
    border-color: ${p => p.theme.colors.primaryLight};
    background: rgba(15, 23, 42, 0.97);
  }
`;

const MetaRow = styled.div`
  display: flex;
  gap: 1.2rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
`;

const MetaItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #a1a1aa;
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SmallCard = styled.div`
  border-radius: ${p => p.theme.radius.lg};
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(15, 23, 42, 0.9);
  padding: 1rem 1rem 0.9rem;
  color: #e5e7eb;
  backdrop-filter: blur(14px);
`;

const SmallTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const SmallText = styled.p`
  font-size: 0.78rem;
  color: #9ca3af;
  line-height: 1.5;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.7rem;
`;

const Tag = styled.span`
  font-size: 0.74rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  color: #cbd5e1;
`;

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const displayName = user?.name || user?.email || '同学';

  return (
    <Page>
      <Content>
        <Hero>
          <GreetingRow>
            <Greeting>欢迎回来，{displayName}</Greeting>
            <Badge>
              <Sparkles size={14} />
              Ready to practice
            </Badge>
          </GreetingRow>

          <Subtext>
            这里是你的听写练习控制台。你可以继续练习现有句子，也可以上传新的听写材料，把练习和资源都放在一个地方。
          </Subtext>

          <ActionsRow>
            <PrimaryButton to="/practice">
              <Headphones size={18} />
              开始听写练习
              <ArrowRight size={16} />
            </PrimaryButton>

            <SecondaryButton to="/upload">
              <Upload size={17} />
              上传新句子
            </SecondaryButton>
          </ActionsRow>

          <MetaRow>
            <MetaItem>
              <Clock size={14} />
              建议：今天练习 10–15 分钟
            </MetaItem>
            <MetaItem>
              <BookOpen size={14} />
              小贴士：可以按难度分批练习
            </MetaItem>
          </MetaRow>
        </Hero>

        <Sidebar>
          <SmallCard>
            <SmallTitle>
              <Headphones size={16} />
              如何高效利用听写练习？
            </SmallTitle>
            <SmallText>
              从难度较低的句子开始，逐渐增加难度。每次练习时先听一遍整体，再分句回放，重点关注自己容易出错的单词和连读。
            </SmallText>
            <TagRow>
              <Tag>分级难度</Tag>
              <Tag>反复听</Tag>
              <Tag>错误单词复盘</Tag>
            </TagRow>
          </SmallCard>

          <SmallCard>
            <SmallTitle>
              <Upload size={16} />
              上传句子的小建议
            </SmallTitle>
            <SmallText>
              上传时可以给句子添加简要解释和难度等级，比如「考试真题 / NAATI 高频 / 生活口语」，方便后面按场景或难度快速筛选。
            </SmallText>
            <TagRow>
              <Tag>标记来源</Tag>
              <Tag>添加解释</Tag>
              <Tag>难度管理</Tag>
            </TagRow>
          </SmallCard>
        </Sidebar>
      </Content>
    </Page>
  );
};

export default HomePage;
