// components/Practice/AnswerComparison.tsx
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { diffWords } from 'diff';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ResultCard = styled(motion.div)`
  background: rgba(51, 65, 85, 0.3);
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.lg};
  padding: 1.5rem;
  margin-top: 1.5rem;
  font-family: 'Courier New', monospace;
  line-height: 1.8;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
 22  margin-bottom: 1rem;
`;

const Legend = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: ${p => p.theme.colors.textMuted};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LegendDot = styled.span<{ color: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${p => p.color};
`;

const DiffLine = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Label = styled.strong`
  min-width: 4ch;
  color: ${p => p.theme.colors.primaryLight};
`;

const DiffText = styled.span`
  flex: 1;
`;

const Added = styled.span`
  background: #bbf7d0;
  color: #166534;
  padding: 0 4px;
  border-radius: 4px;
`;

const Removed = styled.span`
  background: #fecaca;
  color: #dc2626;
  text-decoration: line-through;
  padding: 0 4px;
  border-radius: 4px;
`;

const ExplanationSection = styled(motion.div)`
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: ${p => p.theme.radius.md};
  border-left: 4px solid ${p => p.theme.colors.primary};
  font-size: 0.95rem;
  line-height: 1.7;
  color: ${p => p.theme.colors.text};

  h1, h2, h3, h4 { 
    margin: 0.75rem 0 0.5rem; 
    color: ${p => p.theme.colors.primaryLight}; 
  }
  ul, ol { margin: 0.5rem 0; padding-left: 1.5rem; }
  strong { color: ${p => p.theme.colors.accent}; }
  code {
    background: rgba(15, 23, 42, 0.6);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${p => p.theme.colors.primaryLight};
  font-weight: 600;
  font-size: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover { color: ${p => p.theme.colors.accent}; }
`;

interface Props {
  original: string;
  userInput: string;
  explanation?: string;
}

export function AnswerComparison({ original, userInput, explanation }: Props) {
  const [showExplanation, setShowExplanation] = useState(false);
  const diffResult = diffWords(original, userInput);

  // 计算准确率：原句中未被删除的部分
  const removedCount = diffResult.filter(p => p.removed).reduce((a, p) => a + p.value.split(/\s+/).length, 0);
  const totalWords = original.split(/\s+/).length;
  const accuracy = totalWords > 0 ? Math.round(((totalWords - removedCount) / totalWords) * 100) : 0;

  const hasExplanation = explanation && explanation.trim().length > 0;

  const speak = () => {
    if (!explanation) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(explanation.replace(/[#*`]/g, '').replace(/\n/g, '。'));
    utter.lang = 'zh-CN';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  return (
    <ResultCard
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Header>
        <h3 style={{ color: '#34d399', fontSize: '1.25rem' }}>答案对比</h3>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>
          {accuracy}%
        </div>
      </Header>

      {/* 图例 */}
      <Legend>
        <LegendItem>
          <LegendDot color="#bbf7d0" />
          正确
        </LegendItem>
        <LegendItem>
          <LegendDot color="#fecaca" />
          错误/多余
        </LegendItem>
      </Legend>

      {/* 答案对比 */}
      <DiffLine>
        <Label>原文：</Label>
        <DiffText>
          {diffResult.map((part, i) => (
            <span key={i}>
              {part.added ? (
                <Added>{part.value}</Added>
              ) : part.removed ? (
                <Removed>{part.value}</Removed>
              ) : (
                <span>{part.value}</span>
              )}
            </span>
          ))}
        </DiffText>
      </DiffLine>

      <DiffLine>
        <Label>你写：</Label>
        <DiffText>{userInput || <i style={{ color: '#64748b' }}>未填写</i>}</DiffText>
      </DiffLine>

      {/* 解释区 */}
      {hasExplanation && (
        <>
          <ToggleButton onClick={() => setShowExplanation(!showExplanation)}>
            {showExplanation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            句子解释
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); speak(); }}
              className="ml-2 p-1"
              title="朗读解释"
            >
              <Volume2 size={16} />
            </motion.button>
          </ToggleButton>

          <ExplanationSection
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: showExplanation ? 'auto' : 0, opacity: showExplanation ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            {showExplanation && (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {explanation}
              </ReactMarkdown>
            )}
          </ExplanationSection>
        </>
      )}
    </ResultCard>
  );
}