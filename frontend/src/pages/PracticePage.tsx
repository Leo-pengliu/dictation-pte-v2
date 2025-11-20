import { useState, useEffect, useCallback } from 'react';
import { DictationPlayer } from '../components/Practice/DictationPlayer';
import { AnswerComparison } from '../components/Practice/AnswerComparison';
import { SentenceNavigator } from '../components/Practice/SentenceNavigator';
import { api, type Sentence } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { Volume2, Loader2, Heart } from 'lucide-react';

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
  margin-bottom: 1.25rem;
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

// 顶部筛选条
const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
`;

// 左侧难度筛选组
const DifficultyGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

// 难度 Chip
const DifficultyChip = styled.button<{ $active?: boolean }>`
  padding: 0.28rem 0.9rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.primary : 'rgba(148, 163, 184, 0.5)'};
  background: ${({ $active }) =>
    $active
      ? 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(56,189,248,0.22))'
      : 'rgba(15,23,42,0.7)'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primaryLight : theme.colors.textMuted};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.18s ease-out;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primaryLight};
  }
`;

// 右侧收藏开关
const FavoriteFilterBtn = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.32rem 0.9rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(251, 191, 36, 0.85)' : 'rgba(148,163,184,0.6)')};
  background: ${({ $active }) =>
    $active
      ? 'radial-gradient(circle at 20% 0, rgba(251,191,36,0.4), rgba(15,23,42,0.96))'
      : 'rgba(15,23,42,0.85)'};
  color: ${({ $active }) => ($active ? '#fde68a' : '#e5e7eb')};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.18s ease-out;

  svg {
    stroke-width: 2.2;
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

// 按钮行（并排）
const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

// 行内按钮
const InlineButton = styled(Button)`
  flex: 1;
  width: auto;
  margin-top: 0;
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

// 句子 meta 信息行：难度 + 收藏本句
const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

// 难度 Badge
const DifficultyBadge = styled.div<{ $level: 'easy' | 'medium' | 'hard' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.24rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;

  ${({ $level }) => {
    if ($level === 'easy') {
      return `
        background: rgba(22, 163, 74, 0.16);
        color: #4ade80;
        border: 1px solid rgba(74, 222, 128, 0.4);
      `;
    }
    if ($level === 'hard') {
      return `
        background: rgba(239, 68, 68, 0.16);
        color: #fb7185;
        border: 1px solid rgba(248, 113, 113, 0.5);
      `;
    }
    return `
      background: rgba(59, 130, 246, 0.16);
      color: #93c5fd;
      border: 1px solid rgba(129, 140, 248, 0.5);
    `;
  }}
`;

// 收藏本句按钮
const FavoriteBtn = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.8rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(251, 113, 133, 0.9)' : 'rgba(148,163,184,0.7)')};
  background: ${({ $active }) =>
    $active
      ? 'radial-gradient(circle at 15% 0, rgba(251, 113, 133, 0.55), rgba(15,23,42,0.94))'
      : 'rgba(15,23,42,0.8)'};
  color: ${({ $active }) => ($active ? '#fecaca' : '#e5e7eb')};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.16s ease-out;
`;

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

export default function PracticePage() {
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [redoKey, setRedoKey] = useState(0);

  // ⭐ 筛选条件
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  // 统一的翻页 / 加载函数（携带筛选条件）
  const loadSentence = useCallback(
    async (page: number) => {
      if (page < 1) page = 1;
      if (totalPages > 0 && page > totalPages) page = totalPages;

      setSwitching(true);

      try {
        const effectiveDifficulty =
          difficultyFilter === 'all' ? undefined : (difficultyFilter as 'easy' | 'medium' | 'hard');

        const res = await api.getSentences(page, 1, effectiveDifficulty, favoriteOnly);
        const newSentence = res.data?.[0];

        if (!newSentence) {
          // 没有数据（比如筛选后已经超出页码）
          setSentence(null);
          setTotalPages(res.pagination.totalPages || 1);
          setCurrentPage(1);
          setUserInput('');
          setShowResult(false);
          return;
        }

        setSentence(newSentence);
        setTotalPages(res.pagination.totalPages || 1);
        setCurrentPage(res.pagination.page || page);
        setUserInput('');
        setShowResult(false);
        setRedoKey(k => k + 1);
      } catch (err) {
        console.error('[API] 加载失败:', err);
      } finally {
        setLoading(false);
        setSwitching(false);
      }
    },
    [totalPages, difficultyFilter, favoriteOnly]
  );

  // 初次加载 & 筛选条件变化时重新加载第一页
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

  // 重做当前句
  const handleRedoCurrent = () => {
    setUserInput('');
    setShowResult(false);
    setRedoKey(k => k + 1);
  };

  // 收藏 / 取消收藏当前句子
  const handleToggleFavorite = async () => {
    if (!sentence || switching) return;
    try {
      const result = await api.toggleFavorite(sentence.id);
      setSentence(prev =>
        prev ? { ...prev, isFavorite: result.isFavorite } : prev
      );
    } catch (err) {
      console.error('[Favorite] 操作失败:', err);
    }
  };

  if (loading || !sentence) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={48} color="#10b981" className="animate-spin" />
      </div>
    );
  }

  const currentLevel: 'easy' | 'medium' | 'hard' =
    (sentence.difficulty as any) || 'medium';

  const difficultyLabelMap: Record<'easy' | 'medium' | 'hard', string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

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

        {/* 顶部筛选条：难度 + 只看收藏 */}
        <FilterBar>
          <DifficultyGroup>
            <DifficultyChip
              $active={difficultyFilter === 'all'}
              onClick={() => setDifficultyFilter('all')}
            >
              全部
            </DifficultyChip>
            <DifficultyChip
              $active={difficultyFilter === 'easy'}
              onClick={() => setDifficultyFilter('easy')}
            >
              简单
            </DifficultyChip>
            <DifficultyChip
              $active={difficultyFilter === 'medium'}
              onClick={() => setDifficultyFilter('medium')}
            >
              中等
            </DifficultyChip>
            <DifficultyChip
              $active={difficultyFilter === 'hard'}
              onClick={() => setDifficultyFilter('hard')}
            >
              困难
            </DifficultyChip>
          </DifficultyGroup>

          <FavoriteFilterBtn
            $active={favoriteOnly}
            onClick={() => setFavoriteOnly(v => !v)}
          >
            <Heart
              size={16}
              fill={favoriteOnly ? '#facc15' : 'none'}
              color={favoriteOnly ? '#facc15' : '#e5e7eb'}
            />
            只看收藏
          </FavoriteFilterBtn>
        </FilterBar>

        {/* 当前句子的 meta：难度 + 收藏本句 */}
        <MetaRow>
          <DifficultyBadge $level={currentLevel}>
            难度 · {difficultyLabelMap[currentLevel]}
          </DifficultyBadge>

          <FavoriteBtn
            $active={!!sentence.isFavorite}
            onClick={handleToggleFavorite}
          >
            <Heart
              size={16}
              fill={sentence.isFavorite ? '#fb7185' : 'none'}
              color={sentence.isFavorite ? '#fecaca' : '#e5e7eb'}
            />
            {sentence.isFavorite ? '已收藏本句' : '收藏本句'}
          </FavoriteBtn>
        </MetaRow>

        <AnimatePresence mode="wait">
          {sentence && (
            <motion.div
              key={sentence.id} // 每次换句，整个块重新挂载
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {switching ? (
                <>
                  <SkeletonLine
                    style={{ width: '80%', height: '2rem', marginBottom: '1.5rem' }}
                  />
                  <SkeletonTextarea />
                  <SkeletonLine style={{ width: '100%', height: '3rem' }} />
                </>
              ) : (
                <>
                  <DictationPlayer
                    key={`${sentence.id}-${redoKey}`}
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

                        {/* 右边：下一句 / 已完成 */}
                        <InlineButton
                          className="primary"
                          onClick={handleNext}
                          disabled={currentPage >= totalPages || switching}
                          whileHover={{
                            scale:
                              currentPage < totalPages && !switching ? 1.02 : 1,
                          }}
                          whileTap={{
                            scale:
                              currentPage < totalPages && !switching ? 0.98 : 1,
                          }}
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
        onJump={handleJump}
      />
    </Container>
  );
}
