// src/pages/PracticePage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { DictationPlayer } from '../components/Practice/DictationPlayer';
import { AnswerComparison } from '../components/Practice/AnswerComparison';
import { SentenceNavigator } from '../components/Practice/SentenceNavigator';
import { api, type Sentence } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { Volume2, Loader2 } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  padding: 6rem 1rem 2rem;
  max-width: 900px;
  margin: 0 auto;
`;

const Card = styled(motion.div)`
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.xl};
  padding: 2rem;
  box-shadow: ${p => p.theme.shadow.xl};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(to right, ${p => p.theme.colors.primaryLight}, ${p => p.theme.colors.accent});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.lg};
  color: ${p => p.theme.colors.text};
  font-family: ${p => p.theme.font.mono};
  font-size: 1.1rem;
  resize: none;
  height: 140px;
  outline: none;
  transition: all 0.3s;

  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }

  &::placeholder {
    color: ${p => p.theme.colors.textMuted};
  }
`;

const Button = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: ${p => p.theme.radius.lg};
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
  margin-top: 1rem;

  &.primary {
    background: linear-gradient(to right, ${p => p.theme.colors.primary}, ${p => p.theme.colors.accent});
    color: white;
  }
`;

// 骨架屏组件
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
  height: 140px;
  background: linear-gradient(90deg, #334155 25%, #1e293b 50%, #334155 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: ${p => p.theme.radius.lg};
  margin-bottom: 1rem;
`;

export default function PracticePage() {
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [nextSentence, setNextSentence] = useState<Sentence | null>(null);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false); // 切换中
  const audioRef = useRef<HTMLAudioElement>(null);
  const nextAudioRef = useRef<HTMLAudioElement>(null);

  // 加载句子（支持预加载）
  const loadSentence = useCallback(async (page: number, isPreload = false) => {
    if (!isPreload) setSwitching(true);
    try {
      const res = await api.getSentences(page);
      const newSentence = res.data?.[0];
      if (!newSentence) return;

      if (isPreload) {
        setNextSentence(newSentence);
        // 预加载音频
        const audio = new Audio(`https://dictation-pte-v2.vercel.app${newSentence.audioPath}`);
        audio.preload = 'auto';
        nextAudioRef.current = audio;
      } else {
        setSentence(newSentence);
        setTotalPages(res.pagination.totalPages || 1);
        setCurrentPage(page);
        setUserInput('');
        setShowResult(false);
        setNextSentence(null);
      }
    } catch (err) {
      console.error('[API] 加载失败:', err);
    } finally {
      if (!isPreload) {
        setLoading(false);
        setSwitching(false);
      }
    }
  }, []);

  // 初始化
  useEffect(() => {
    loadSentence(1);
  }, [loadSentence]);

  // 预加载下一句
  useEffect(() => {
    if (currentPage < totalPages && !nextSentence) {
      loadSentence(currentPage + 1, true);
    }
  }, [currentPage, totalPages, nextSentence, loadSentence]);

  // 自动播放（等音频就绪）
  useEffect(() => {
    if (!sentence || loading || switching) return;
    const audio = audioRef.current;
    if (!audio) return;

    const playWhenReady = () => {
      audio.play().catch(() => {});
    };

    if (audio.readyState >= 3) { // HAVE_FUTURE_DATA
      playWhenReady();
    } else {
      audio.addEventListener('canplaythrough', playWhenReady, { once: true });
    }

    return () => {
      audio.removeEventListener('canplaythrough', playWhenReady);
    };
  }, [sentence, loading, switching]);

  // 切换句子（使用预加载）
  const handleNext = () => {
    if (!nextSentence || currentPage >= totalPages) return;
    setSwitching(true);
    setSentence(nextSentence);
    setCurrentPage(currentPage + 1);
    setUserInput('');
    setShowResult(false);
    setNextSentence(null);
    // 切换音频
    audioRef.current = nextAudioRef.current;
    nextAudioRef.current = null;
    setSwitching(false);
  };

  // 加载中 UI
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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
          <Volume2 size={32} style={{ animation: 'pulse 2s infinite' }} />
        </Title>

        <AnimatePresence mode="wait">
          {sentence && (
            <motion.div
              key={sentence.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              

              {switching ? (
                // 骨架屏
                <>
                  <SkeletonLine style={{ width: '80%', height: '2rem', marginBottom: '1.5rem' }} />
                  <SkeletonTextarea />
                  <SkeletonLine style={{ width: '100%', height: '3rem' }} />
                </>
              ) : (
                <>
                  <DictationPlayer
                    key={sentence.id}
                    audioUrl={`https://dictation-pte-v2.vercel.app${sentence.audioPath}`}
                    onReplay={() => audioRef.current?.play()}
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
                      <Button
                        className="primary"
                        onClick={handleNext}
                        disabled={currentPage >= totalPages || switching}
                        whileHover={{ scale: currentPage < totalPages ? 1.02 : 1 }}
                        whileTap={{ scale: currentPage < totalPages ? 0.98 : 1 }}
                      >
                        {currentPage >= totalPages ? '已完成' : '下一句 →'}
                      </Button>
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <SentenceNavigator current={currentPage} total={totalPages} onJump={loadSentence} />
    </Container>
  );
}