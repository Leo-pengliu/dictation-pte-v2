// src/pages/PracticePage.tsx
import { useState, useEffect, useCallback } from 'react';
import { DictationPlayer } from '../components/Practice/DictationPlayer';
import { AnswerComparison } from '../components/Practice/AnswerComparison';
import { SentenceNavigator } from '../components/Practice/SentenceNavigator';
import { api, type Sentence } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { Volume2, Loader2 } from 'lucide-react';

// 容器
const Container = styled.div`
  min-height: 100vh;
  padding: 4rem 1rem 2rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
`;

// 卡片
const Card = styled(motion.div)`
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.xl};
  padding: 1.5rem;
  box-shadow: ${p => p.theme.shadow.xl};

  @media (min-width: 640px) {
    padding: 2rem;
  }
`;

// 标题
const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  background: linear-gradient(to right, ${p => p.theme.colors.primaryLight}, ${p => p.theme.colors.accent});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;

  @media (min-width: 640px) {
    font-size: 2.5rem;
    gap: 1rem;
  }
`;

// 输入框
const Textarea = styled.textarea`
  width: 100%;
  padding: 0.875rem;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.lg};
  color: ${p => p.theme.colors.text};
  font-family: ${p => p.theme.font.mono};
  font-size: 1rem;
  resize: none;
  height: 120px;
  outline: none;
  transition: all 0.3s;

  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }

  &::placeholder {
    color: ${p => p.theme.colors.textMuted};
    font-size: 0.9375rem;
  }

  @media (min-width: 640px) {
    padding: 1rem;
    font-size: 1.1rem;
    height: 140px;
  }
`;

// 按钮
const Button = styled(motion.button)`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: ${p => p.theme.radius.lg};
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9375rem;
  width: 100%;
  margin-top: 1rem;

  &.primary {
    background: linear-gradient(to right, ${p => p.theme.colors.primary}, ${p => p.theme.colors.accent});
    color: white;
  }

  &.secondary {
    background: transparent;
    border: 1px solid ${p => p.theme.colors.border};
    color: ${p => p.theme.colors.text};
  }

  @media (min-width: 640px) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }
`;

// ⭐ 新增：按钮行（用来并排）
const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

// ⭐ 新增：行内按钮，让它们 1:1 平分宽度
const InlineButton = styled(Button)`
  flex: 1;
  width: auto;
  margin-top: 0;  // 行上统一控制 margin
`;

// 骨架屏
const SkeletonLine = styled.div`
  height: 1.5rem;
  background: linear-gradient(90deg, #334155 25%, #1e293b 50%, #334155 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: ${p => p.theme.radius.md};
  margin-bottom: 1rem;

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const SkeletonTextarea = styled.div`
  height: 120px;
  background: linear-gradient(90deg, #334155 25%, #1e293b 50%, #334155 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: ${p => p.theme.radius.lg};
  margin-bottom: 1rem;

  @media (min-width: 640px) {
    height: 140px;
  }
`;

export default function PracticePage() {
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [redoKey, setRedoKey] = useState(0);

  // ⭐ 统一的翻页 / 加载函数
  const loadSentence = useCallback(
    async (page: number) => {
      // 防止越界
      if (page < 1) page = 1;
      if (totalPages > 0 && page > totalPages) page = totalPages;

      setSwitching(true);

      try {
        const res = await api.getSentences(page);
        const newSentence = res.data?.[0];
        if (!newSentence) return;

        setSentence(newSentence);
        setTotalPages(res.pagination.totalPages || 1);
        setCurrentPage(page);
        setUserInput('');
        setShowResult(false);
      } catch (err) {
        console.error('[API] 加载失败:', err);
      } finally {
        setLoading(false);
        setSwitching(false);
      }
    },
    [totalPages]
  );

  // 初次加载
  useEffect(() => {
    loadSentence(1);
  }, [loadSentence]);

  // 对比答案后的“下一句”
  const handleNext = () => {
    if (currentPage >= totalPages) return;
    loadSentence(currentPage + 1);
  };

  // 页码导航跳转
  const handleJump = (page: number) => {
    if (page === currentPage) return;
    loadSentence(page);
  };

  const handleRedoCurrent = () => {
    setUserInput('');      // 清空输入
    setShowResult(false);  // 回到“提交答案”状态
    setRedoKey(k => k + 1); // 强制 DictationPlayer 重新开始播放
  };

  if (loading || !sentence) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={48} color="#10b981" className="animate-spin" />
      </div>
    );
  }

  return (
    <Container>
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>
          听写练习
          <Volume2 size={32} className="animate-pulse" />
        </Title>

        <AnimatePresence mode="wait">
          {sentence && (
            <motion.div
              key={sentence.id} // ⭐ 每次换句，整个块重新挂载
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {switching ? (
                <>
                  <SkeletonLine style={{ width: '80%', height: '2rem', marginBottom: '1.5rem' }} />
                  <SkeletonTextarea />
                  <SkeletonLine style={{ width: '100%', height: '3rem' }} />
                </>
              ) : (
                <>
                  <DictationPlayer
                    key={`${sentence.id}-${redoKey}`} // ⭐ 保证音频播放器跟随句子重置
                    audioUrl={`https://dictation-pte.onrender.com${sentence.audioPath}`}
                    autoPlay
                  />

                  <Textarea
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    placeholder="请听音频后在此输入句子..."
                    disabled={showResult}
                  />

                  {!showResult ? (
                    <Button
                      className="primary"
                      onClick={() => setShowResult(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      提交答案
                    </Button>
                  ) : (
                    <>
                      <AnswerComparison
                        original={sentence.original}
                        userInput={userInput}
                        explanation={sentence.explanation}
                      />

                      <ButtonRow>
                        {/* 左边：重做当前这句 */}
                        <InlineButton
                          className="secondary"
                          onClick={handleRedoCurrent}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          重做本句
                        </InlineButton>

                        {/* 右边：下一句 / 已完成（保留你原来的逻辑） */}
                        <InlineButton
                          className="primary"
                          onClick={handleNext}
                          disabled={currentPage >= totalPages || switching}
                          whileHover={{ scale: currentPage < totalPages && !switching ? 1.02 : 1 }}
                          whileTap={{ scale: currentPage < totalPages && !switching ? 0.98 : 1 }}
                        >
                          {currentPage >= totalPages ? '已完成' : '下一句 →'}
                        </InlineButton>
                      </ButtonRow>
                    </>

                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <SentenceNavigator
        current={currentPage}
        total={totalPages}
        onJump={handleJump} // ⭐ 不再直接把 loadSentence 传进去
      />
    </Container>
  );
}
