// src/pages/RSPage.tsx —— 带骨架加载 + 难度/收藏筛选 + 本地评分 + TTS 兜底
import { useState, useEffect, useRef, useCallback } from 'react';
import { DictationPlayer } from '../components/Practice/DictationPlayer';
import { SentenceNavigator } from '../components/Practice/SentenceNavigator';
import { api, type Sentence } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import { Mic, MicOff, RefreshCcw, Loader2, Volume2, Heart, Sparkles } from 'lucide-react';

// ====================== styled-components ======================
const Page = styled.div`
  min-height: 100vh;
  padding: 7rem 1.5rem 4rem;
  background: radial-gradient(circle at top, rgba(45,212,191,0.14), transparent 55%),
              radial-gradient(circle at bottom, rgba(56,189,248,0.18), #020617 60%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const Card = styled.div`
  width: 100%;
  max-width: 880px;
  border-radius: 1.5rem;
  border: 1px solid rgba(148,163,184,0.4);
  background:
    radial-gradient(circle at top left, rgba(56,189,248,0.26), transparent 55%),
    radial-gradient(circle at bottom right, rgba(16,185,129,0.18), rgba(15,23,42,0.98));
  padding: 2.4rem 2.1rem 2.6rem;
  color: #e5e7eb;
  box-shadow: 0 25px 80px rgba(0,0,0,0.75);
  backdrop-filter: blur(16px);

  @media (max-width: 640px) {
    padding: 2rem 1.5rem 2.4rem;
  }
`;

const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.25rem;
`;

const Title = styled.h1`
  font-size: 1.7rem;
  font-weight: 800;
  background: linear-gradient(to right, #22d3ee, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.div`
  font-size: 0.9rem;
  color: #a5f3fc;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  opacity: 0.9;
`;

const ModeTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.18rem 0.65rem;
  font-size: 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(56,189,248,0.7);
  background: radial-gradient(circle at 10% 0, rgba(56,189,248,0.35), rgba(15,23,42,0.9));
  color: #e0f2fe;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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
      ? 'linear-gradient(135deg, rgba(16,185,129,0.24), rgba(56,189,248,0.24))'
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
    transform: translateY(-1px);
  }
`;

// 右侧收藏开关
const FavoriteFilterBtn = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.34rem 0.9rem;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(251, 191, 36, 0.9)' : 'rgba(148,163,184,0.6)')};
  background: ${({ $active }) =>
    $active
      ? 'radial-gradient(circle at 20% 0, rgba(251,191,36,0.42), rgba(15,23,42,0.96))'
      : 'rgba(15,23,42,0.9)'};
  color: ${({ $active }) => ($active ? '#fde68a' : '#e5e7eb')};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.18s ease-out;

  svg {
    stroke-width: 2.2;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 26px rgba(15,23,42,0.85);
  }
`;

const Panel = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background: radial-gradient(circle at top, rgba(15,23,42,0.98), rgba(15,23,42,0.92));
  border: 1px solid rgba(51,65,85,0.9);
`;

const RecordingWrapper = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 420px;
  text-align: center;
`;

const Countdown = styled(motion.div)`
  font-size: 10rem;
  font-weight: 900;
  font-family: 'SF Mono', Menlo, monospace;
  color: #f87171;
  text-shadow: 0 0 60px rgba(248,113,113,0.9);
  line-height: 1;
`;

const StopBtn = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 2rem;
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  border-radius: 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 0 40px rgba(239,68,68,0.7);
`;

const ScoreBar = styled.div`
  flex: 1;
  height: 14px;
  border-radius: 999px;
  background: #020617;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(15,23,42,1);
`;

const ScoreFill = styled(motion.div)<{ value: number; color: string }>`
  height: 100%;
  width: ${p => p.value}%;
  background: ${p => p.color};
`;

const HighlightText = styled.div`
  font-size: 1.25rem;
  line-height: 2;
  padding: 1rem;
  background: rgba(0,0,0,0.35);
  border-radius: 0.8rem;
  margin-top: 1rem;
  word-break: break-word;
  span.correct { color: #34d399; font-weight: 600; }
  span.partial { color: #fbbf24; }
  span.wrong   { color: #ef4444; text-decoration: line-through; opacity: 0.8; }
  span.extra   { color: #94a3b8; opacity: 0.6; font-style: italic; }
`;

// 句子 meta 信息行：难度 + 收藏本句
const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.9rem;
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
        background: rgba(22, 163, 74, 0.18);
        color: #4ade80;
        border: 1px solid rgba(74, 222, 128, 0.5);
      `;
    }
    if ($level === 'hard') {
      return `
        background: rgba(239, 68, 68, 0.18);
        color: #fb7185;
        border: 1px solid rgba(248, 113, 113, 0.6);
      `;
    }
    return `
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
      border: 1px solid rgba(129, 140, 248, 0.6);
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
      ? 'radial-gradient(circle at 15% 0, rgba(251, 113, 133, 0.55), rgba(15,23,42,0.96))'
      : 'rgba(15,23,42,0.9)'};
  color: ${({ $active }) => ($active ? '#fecaca' : '#e5e7eb')};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.16s ease-out;

  &:hover {
    transform: translateY(-1px);
  }
`;

// ====================== 骨架屏 ======================
const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const SkeletonBlock = styled.div<{ height: number }>`
  width: 100%;
  height: ${({ height }) => height}px;
  border-radius: 0.9rem;
  background: linear-gradient(90deg, #1f2937 25%, #020617 50%, #1f2937 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s infinite;
  opacity: 0.85;
`;

const SkeletonLine = styled.div<{ width?: string; height?: number }>`
  width: ${({ width }) => width || '100%'};
  height: ${({ height }) => height || 18}px;
  border-radius: 999px;
  background: linear-gradient(90deg, #1f2937 25%, #020617 50%, #1f2937 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s infinite;
  opacity: 0.9;
`;

// ====================== 工具函数 ======================
const PHONETIC_MAP: Record<string, string[]> = {
  the: ['da', 'de', 'thee'],
  a: ['uh', 'ah'],
  to: ['ta', 'tu', 'tuh'],
  of: ['ov', 'uhv'],
  and: ['an', 'n', 'nd'],
  in: ['en', 'n'],
  for: ['fer', 'fr'],
  you: ['ya', 'yuh'],
};

function levenshtein(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

function alignWords(original: string, recognized: string) {
  const oWords = original.toLowerCase().split(/\s+/).filter(Boolean);
  const rWords = recognized.toLowerCase().split(/\s+/).filter(Boolean);
  const result: { word: string; type: 'correct' | 'partial' | 'wrong' | 'extra' }[] = [];

  let i = 0, j = 0;
  while (i < oWords.length || j < rWords.length) {
    if (i < oWords.length && j < rWords.length) {
      const ow = oWords[i];
      const rw = rWords[j];

      if (ow === rw || PHONETIC_MAP[ow]?.includes(rw) || PHONETIC_MAP[rw]?.includes(ow)) {
        result.push({ word: rWords[j], type: 'correct' });
        i++; j++;
      } else if (levenshtein(ow, rw) <= 2 && Math.abs(ow.length - rw.length) <= 2) {
        result.push({ word: rWords[j], type: 'partial' });
        i++; j++;
      } else {
        const skipOrig = i + 1 < oWords.length ? levenshtein(oWords.slice(i + 1).join(' '), rWords.slice(j).join(' ')) : Infinity;
        const skipReco = j + 1 < rWords.length ? levenshtein(oWords.slice(i).join(' '), rWords.slice(j + 1).join(' ')) : Infinity;
        if (skipOrig < skipReco) {
          result.push({ word: oWords[i], type: 'wrong' });
          i++;
        } else {
          result.push({ word: rWords[j], type: 'extra' });
          j++;
        }
      }
    } else if (i < oWords.length) {
      result.push({ word: oWords[i], type: 'wrong' });
      i++;
    } else {
      result.push({ word: rWords[j], type: 'extra' });
      j++;
    }
  }
  return result;
}

// ====================== 主组件 ======================
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

export default function RSPage() {
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(15);
  const [userAudioUrl, setUserAudioUrl] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [score, setScore] = useState<any>(null);
  const [alignedWords, setAlignedWords] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [redoKey, setRedoKey] = useState(0);

  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const countdownRef = useRef<number | null>(null);

  // 重置当前题目的录音/评分状态
  const resetAll = useCallback(() => {
    setUserAudioUrl('');
    setTranscribedText('');
    setScore(null);
    setAlignedWords([]);
    setIsRecording(false);
    setRecordingSeconds(15);
    setIsProcessing(false);
    if (recognitionRef.current) recognitionRef.current.abort();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (userAudioRef.current) userAudioRef.current.pause();
    setIsPlayingUserAudio(false);
  }, []);

  // ✅ 和 PracticePage 对齐的 loadSentence：分页 + 难度 + 收藏
  const loadSentence = useCallback(
    async (page: number) => {
      // 和 PracticePage 一样，先做页码保护
      if (page < 1) page = 1;
      if (totalPages > 0 && page > totalPages) page = totalPages;

      setLoading(true);

      try {
        const effectiveDifficulty =
          difficultyFilter === 'all'
            ? undefined
            : (difficultyFilter as 'easy' | 'medium' | 'hard');

        const res = await api.getSentences(page, 1, effectiveDifficulty, favoriteOnly);

        const s = res.data?.[0];

        if (!s) {
          console.warn('[RSPage] 当前筛选条件下没有句子数据');
          setSentence(null);
          setTotalPages(res.pagination?.totalPages || 1);
          setCurrentPage(1);
          resetAll();
          return;
        }

        setSentence(s);
        setTotalPages(res.pagination?.totalPages || 1);
        setCurrentPage(res.pagination?.page || page);
        setRedoKey(k => k + 1);
        resetAll();
      } catch (err) {
        console.error('[RSPage] 加载句子失败:', err);
      } finally {
        setLoading(false);
      }
    },
    [totalPages, difficultyFilter, favoriteOnly, resetAll]
  );

  // ✅ 初次加载 & 筛选变化时，回到第一页
  useEffect(() => {
    loadSentence(1);
  }, [loadSentence]);

  const startRecordingAfterBeep = async () => {
    const beep = new Audio('/beep.wav');
    beep.volume = 0.5;
    await beep.play();

    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setUserAudioUrl(URL.createObjectURL(blob));
        };
        recorder.start();

        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
          alert('浏览器不支持语音识别，请使用 Chrome/Edge/Safari');
          return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        let finalTranscript = '';

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interim += transcript;
            }
          }
          setTranscribedText(finalTranscript.trim() + ' ' + interim.trim());
        };

        recognition.onend = () => {
          const result = finalTranscript.trim();
          if (result) {
            setTranscribedText(result);
            calculateScore(result);
          } else {
            setTranscribedText('未检测到语音，请大声清晰复述');
          }
          setIsProcessing(false);
        };

        recognition.onerror = (e: any) => {
          console.log('Speech error:', e.error);
          setTranscribedText('识别出错（请检查麦克风权限）');
          setIsProcessing(false);
        };

        recognition.start();

        setIsRecording(true);
        setIsProcessing(true);
        setRecordingSeconds(15);

        countdownRef.current = window.setInterval(() => {
          setRecordingSeconds(prev => {
            if (prev <= 1) {
              stopEverything();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setTimeout(stopEverything, 15000);
      } catch (err) {
        alert('请允许麦克风权限');
      }
    }, 400);
  };

  const stopEverything = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsRecording(false);
  };

  const calculateScore = (userText: string) => {
    if (!sentence?.original) return;

    const original = sentence.original.trim();
    const user = userText.trim();

    const distance = levenshtein(original.toLowerCase(), user.toLowerCase());
    const content = Math.round(((original.length - distance) / original.length) * 100);

    const origWords = original.toLowerCase().split(/\s+/);
    const userWords = user.toLowerCase().split(/\s+/);
    let correct = 0;
    userWords.forEach(w => {
      if (
        origWords.includes(w) ||
        Object.keys(PHONETIC_MAP).some(k => PHONETIC_MAP[k].includes(w) || k === w)
      )
        correct++;
    });
    const pronunciation = userWords.length ? Math.round((correct / userWords.length) * 100) : 0;
    const fluency = Math.max(0, 100 - Math.abs(origWords.length - userWords.length) * 8);
    const overall = Math.round(content * 0.5 + fluency * 0.25 + pronunciation * 0.25);

    setScore({ content, fluency, pronunciation, overall });
    setAlignedWords(alignWords(original, user));
  };

  // 收藏 / 取消收藏当前句子
  const handleToggleFavorite = async () => {
    if (!sentence) return;
    try {
      const result = await api.toggleFavorite(sentence.id);
      setSentence(prev =>
        prev ? { ...prev, isFavorite: result.isFavorite } : prev
      );
    } catch (err) {
      console.error('[RSPage] 收藏操作失败:', err);
    }
  };

  const currentLevel: 'easy' | 'medium' | 'hard' =
    (sentence?.difficulty as any) || 'medium';

  const difficultyLabelMap: Record<'easy' | 'medium' | 'hard', string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  const audioUrl = sentence
    ? `https://dictation-pte.onrender.com${sentence.audioPath}`
    : '';

  return (
    <Page>
      <Card>
        <TitleRow>
          <div>
            <Title>Repeat Sentence 复述练习</Title>
            <Subtitle>
              <Sparkles size={16} />
              听一句 &nbsp;→&nbsp; 复述一句 &nbsp;→&nbsp; 本地即时评分
            </Subtitle>
          </div>
          <ModeTag>
            <Volume2 size={14} />
            REALTIME · LOCAL
          </ModeTag>
        </TitleRow>

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

        {/* 骨架 or 实际内容 */}
        {loading || !sentence ? (
          <>
            <MetaRow>
              <SkeletonLine width="120px" height={20} />
              <SkeletonLine width="110px" height={20} />
            </MetaRow>
            <div style={{ marginBottom: '1.4rem' }}>
              <SkeletonBlock height={80} />
            </div>
            <SkeletonBlock height={220} />
          </>
        ) : (
          <>
            {/* 当前句子的 meta：难度 + 收藏本句 */}
            <MetaRow>
              <DifficultyBadge $level={currentLevel}>
                难度 · {difficultyLabelMap[currentLevel]}
              </DifficultyBadge>

              <FavoriteBtn
                $active={!!(sentence as any).isFavorite}
                onClick={handleToggleFavorite}
              >
                <Heart
                  size={16}
                  fill={(sentence as any).isFavorite ? '#fb7185' : 'none'}
                  color={(sentence as any).isFavorite ? '#fecaca' : '#e5e7eb'}
                />
                {(sentence as any).isFavorite ? '已收藏本句' : '收藏本句'}
              </FavoriteBtn>
            </MetaRow>

            {/* ✅ 加上 fallbackText，音频坏了会触发 TTS */}
            <DictationPlayer
              key={`orig-${sentence.id}-${redoKey}`}
              audioUrl={audioUrl}
              autoPlay
              onEnded={startRecordingAfterBeep}
              fallbackText={sentence.original}
            />

            <AnimatePresence mode="wait">
              {isRecording && (
                <RecordingWrapper
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Mic
                    size={96}
                    color="#f87171"
                    style={{ filter: 'drop-shadow(0 0 30px #f87171)' }}
                  />
                  <Countdown key={recordingSeconds}>
                    {recordingSeconds}
                  </Countdown>
                  <p style={{ fontSize: '1.7rem', color: '#fca5a5', margin: '1.5rem 0 2rem' }}>
                    秒后自动停止
                  </p>
                  <StopBtn
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.93 }}
                    onClick={stopEverything}
                  >
                    <MicOff size={30} />
                    停止录音（我说完了）
                  </StopBtn>
                </RecordingWrapper>
              )}
            </AnimatePresence>

            {isProcessing && !isRecording && (
              <Panel style={{ textAlign: 'center', padding: '3rem 0' }}>
                <Loader2 size={64} className="animate-spin" color="#22d3ee" />
                <p style={{ marginTop: '1.5rem', fontSize: '1.3rem', color: '#67e8f9' }}>
                  正在分析你的发音…
                </p>
              </Panel>
            )}

            {transcribedText && (
              <>
                <Panel>
                  <div
                    style={{
                      color: '#67e8f9',
                      marginBottom: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Volume2 size={20} />
                    系统听到的句子
                  </div>
                  <HighlightText>
                    {alignedWords.map((item, i) => (
                      <span key={i} className={item.type}>
                        {item.word}{' '}
                      </span>
                    ))}
                  </HighlightText>
                </Panel>

                <Panel>
                  <div style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>原文参考</div>
                  <div
                    style={{
                      padding: '1rem',
                      background: 'rgba(15,23,42,0.9)',
                      borderRadius: '0.8rem',
                      fontSize: '1.2rem',
                    }}
                  >
                    {sentence.original}
                  </div>
                </Panel>
              </>
            )}

            {userAudioUrl && (
              <Panel
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                onClick={() => {
                  if (!userAudioRef.current) return;
                  isPlayingUserAudio
                    ? userAudioRef.current.pause()
                    : userAudioRef.current.play();
                  setIsPlayingUserAudio(!isPlayingUserAudio);
                }}
              >
                {isPlayingUserAudio ? (
                  <MicOff size={34} color="#22d3ee" />
                ) : (
                  <Mic size={34} color="#22d3ee" />
                )}
                <div>
                  <div style={{ fontWeight: 600, color: '#22d3ee' }}>你的录音（点击播放）</div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>点击可播放 / 暂停</div>
                </div>
                <audio
                  ref={userAudioRef}
                  src={userAudioUrl}
                  onEnded={() => setIsPlayingUserAudio(false)}
                />
              </Panel>
            )}

            {score && (
              <Panel>
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '1.6rem',
                    fontWeight: 'bold',
                    color: '#22d3ee',
                    marginBottom: '2rem',
                  }}
                >
                  评分结果（纯本地算法）
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                  {[
                    {
                      label: '内容 Content',
                      value: score.content,
                      color: 'linear-gradient(90deg,#10b981,#34d399)',
                    },
                    {
                      label: '流利度 Fluency',
                      value: score.fluency,
                      color: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
                    },
                    {
                      label: '发音 Pronunciation',
                      value: score.pronunciation,
                      color: 'linear-gradient(90deg,#ec4899,#f472b6)',
                    },
                    {
                      label: '综合 Overall',
                      value: score.overall,
                      color: 'linear-gradient(90deg,#22d3ee,#06b6d4)',
                      big: true,
                    },
                  ].map((item: any) => (
                    <div
                      key={item.label}
                      style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}
                    >
                      <div
                        style={{
                          width: item.big ? '200px' : '170px',
                          textAlign: 'right',
                          fontSize: item.big ? '1.4rem' : '1.1rem',
                          fontWeight: item.big ? 'bold' : 'normal',
                          color: item.big ? '#a5f3fc' : '#94a3b8',
                        }}
                      >
                        {item.label}
                      </div>
                      <ScoreBar>
                        <ScoreFill
                          value={item.value}
                          color={item.color}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 1.6, ease: 'easeOut' }}
                        />
                      </ScoreBar>
                      <div
                        style={{
                          width: item.big ? '110px' : '90px',
                          textAlign: 'right',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          fontSize: item.big ? '3.2rem' : '2.2rem',
                          color: item.big ? '#22d3ee' : '#e2e8f0',
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {score && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setRedoKey(k => k + 1);
                  resetAll();
                }}
                style={{
                  width: '100%',
                  marginTop: '2.5rem',
                  padding: '1.3rem',
                  background: 'linear-gradient(to right, #0891b2, #06b6d4)',
                  border: 'none',
                  borderRadius: '1.5rem',
                  color: 'white',
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 12px 30px rgba(6,182,212,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}
              >
                <RefreshCcw size={30} />
                再练一次这句
              </motion.button>
            )}
          </>
        )}

        <SentenceNavigator
          current={currentPage}
          total={totalPages}
          onJump={loadSentence}
        />
      </Card>
    </Page>
  );
}
