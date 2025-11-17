// components/Practice/AnswerComparison.tsx
import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { diffWords } from 'diff';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ResultCard = styled(motion.div)`
  background: rgba(51, 65, 85, 0.3);
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radius.lg};
  padding: 1.5rem;
  margin-top: 1.5rem;
  font-family: 'Courier New', monospace;
  line-height: 1.8;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Legend = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: ${(p) => p.theme.colors.textMuted};
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
  background: ${(p) => p.color};
`;

const DiffLine = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Label = styled.strong`
  min-width: 4ch;
  color: ${(p) => p.theme.colors.primaryLight};
`;

const DiffText = styled.span`
  flex: 1;
`;

// 缺失的词/短语：括号 + 红色  (traditional)
const Missing = styled.span`
  color: #dc2626;
`;

// 写错 / 多写的词/短语：浅灰 + 删除线  has / blue collar
const Wrong = styled.span`
  color: #9ca3af;
  text-decoration: line-through;
`;

// 正确答案提示：放在前面括号里 (have) / (blue-collar)
const Suggest = styled.span`
  color: #dc2626;
`;

const ExplanationSection = styled(motion.div)`
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.5);
  border-radius: ${(p) => p.theme.radius.md};
  border-left: 4px solid ${(p) => p.theme.colors.primary};
  font-size: 0.95rem;
  line-height: 1.7;
  color: ${(p) => p.theme.colors.text};

  h1,
  h2,
  h3,
  h4 {
    margin: 0.75rem 0 0.5rem;
    color: ${(p) => p.theme.colors.primaryLight};
  }
  ul,
  ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  strong {
    color: ${(p) => p.theme.colors.accent};
  }
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
  color: ${(p) => p.theme.colors.primaryLight};
  font-weight: 600;
  font-size: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${(p) => p.theme.colors.accent};
  }
`;

interface Props {
  original: string;
  userInput: string;
  explanation?: string;
}

export function AnswerComparison({ original, userInput, explanation }: Props) {
  const [showExplanation, setShowExplanation] = useState(false);

  // 统一 diff 计算
  const diffResult = useMemo(
    () => diffWords(original.trim(), userInput.trim()),
    [original, userInput]
  );

  // 准确率：仍然按 removed（原文中你没写正确的部分）来算
  const accuracy = useMemo(() => {
    const removedCount = diffResult
      .filter((p) => p.removed)
      .reduce(
        (a, p) => a + p.value.split(/\s+/).filter(Boolean).length,
        0
      );
    const totalWords = original.split(/\s+/).filter(Boolean).length;

    return totalWords > 0
      ? Math.round(((totalWords - removedCount) / totalWords) * 100)
      : 0;
  }, [diffResult, original]);

  const hasExplanation = !!explanation && explanation.trim().length > 0;

  // “你写”这一行的标记逻辑
  const renderUserDiff = () => {
    if (!userInput) {
      return <i style={{ color: '#64748b' }}>未填写</i>;
    }

    const parts = diffResult;
    const result: React.ReactNode[] = [];

    let i = 0;
    while (i < parts.length) {
      const part = parts[i];

      // 情况 1：替换错误 —— removed 后紧跟 added
      // 这里按「短语」整体处理，能很好兼容连字符和短语差异
      if (part.removed) {
        const next = parts[i + 1];

        if (next && next.added) {
          const expectedPhrase = part.value.trim(); // 原短语，可能包含 - / 空格
          const actualPhrase = next.value.trim();   // 你写的短语

          if (expectedPhrase && actualPhrase) {
            // 显示：(expectedPhrase)actualPhrase
            result.push(
              <span key={`replace-${i}`}>
                <Suggest>({expectedPhrase})</Suggest>
                <Wrong>{actualPhrase}</Wrong>{' '}
              </span>
            );
          } else if (expectedPhrase && !actualPhrase) {
            // 理论上很少见，但兜一层
            result.push(
              <Missing key={`missing-${i}`}>
                ({expectedPhrase}){' '}
              </Missing>
            );
          } else if (!expectedPhrase && actualPhrase) {
            result.push(
              <Wrong key={`extra-${i}`}>
                {actualPhrase}{' '}
              </Wrong>
            );
          }

          i += 2;
          continue;
        }

        // 情况 2：只有 removed —— 纯缺失（可以按词拆分）
        const words = part.value.split(/\s+/).filter(Boolean);
        for (let j = 0; j < words.length; j++) {
          result.push(
            <Missing key={`missing-${i}-${j}`}>
              ({words[j]}){' '}
            </Missing>
          );
        }
        i++;
        continue;
      }

      // 情况 3：只有 added —— 纯多写
      if (part.added) {
        const words = part.value.split(/\s+/).filter(Boolean);
        for (let j = 0; j < words.length; j++) {
          result.push(
            <Wrong key={`extra-${i}-${j}`}>
              {words[j]}{' '}
            </Wrong>
          );
        }
        i++;
        continue;
      }

      // 情况 4：正确部分（既不是 added 也不是 removed）
      // 保留原本的空格和标点
      result.push(
        <span key={`equal-${i}`}>
          {part.value}
        </span>
      );
      i++;
    }

    return result;
  };

  const speak = () => {
    if (!explanation) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const cleanText = explanation
      .replace(/[#*`]/g, '')
      .replace(/\n+/g, '。')
      .trim();

    if (!cleanText) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(cleanText);
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
        <div
          style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}
        >
          {accuracy}%
        </div>
      </Header>

      {/* 图例：大致对应颜色含义 */}
      <Legend>
        <LegendItem>
          <LegendDot color="#e5e7eb" />
          正确
        </LegendItem>
        <LegendItem>
          <LegendDot color="#dc2626" />
          正确答案 / 缺失（括号）
        </LegendItem>
        <LegendItem>
          <LegendDot color="#9ca3af" />
          写错 / 多余（删除线）
        </LegendItem>
      </Legend>

      {/* 原文：只显示正确答案 */}
      <DiffLine>
        <Label>原文：</Label>
        <DiffText>{original}</DiffText>
      </DiffLine>

      {/* 你写：按图片逻辑标注 (have)has、(traditional)、以及连字符短语 */}
      <DiffLine>
        <Label>你写：</Label>
        <DiffText>{renderUserDiff()}</DiffText>
      </DiffLine>

      {/* 解释区 */}
      {hasExplanation && (
        <>
          <ToggleButton onClick={() => setShowExplanation((prev) => !prev)}>
            {showExplanation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            句子解释
            <motion.span
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                speak();
              }}
              className="ml-2 p-1"
              title="朗读解释"
            >
              <Volume2 size={16} />
            </motion.span>
          </ToggleButton>

          <ExplanationSection
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: showExplanation ? 'auto' : 0,
              opacity: showExplanation ? 1 : 0,
            }}
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
