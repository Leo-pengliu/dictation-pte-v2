// src/pages/RSPage.tsx —— 2025 终极纯前端版（实时识别 + 高亮对比 + 本地评分）
import { useState, useEffect, useRef, useCallback } from 'react';
import { DictationPlayer } from '../components/Practice/DictationPlayer';
import { SentenceNavigator } from '../components/Practice/SentenceNavigator';
import { api, type Sentence } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { Mic, MicOff, RefreshCcw, Loader2, Volume2 } from 'lucide-react';

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
  max-width: 840px;
  border-radius: 1.5rem;
  border: 1px solid rgba(148,163,184,0.4);
  background: radial-gradient(circle at top left, rgba(56,189,248,0.16), rgba(15,23,42,0.96));
  padding: 2.5rem 2rem;
  color: #e5e7eb;
  box-shadow: 0 25px 80px rgba(0,0,0,0.7);
  backdrop-filter: blur(16px);
`;

const Title = styled.h1`
  font-size: 1.7rem;
  font-weight: 800;
  text-align: center;
  background: linear-gradient(to right, #22d3ee, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2rem;
`;

const Panel = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 1rem;
  background: rgba(15,23,42,0.92);
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
  background: #1f2937;
  overflow: hidden;
  box-shadow: inset 0 0 2px 6px rgba(0,0,0,0.4);
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
  background: rgba(0,0,0,0.3);
  border-radius: 0.8rem;
  margin-top: 1rem;
  word-break: break-word;
  span.correct { color: #34d399; font-weight: 600; }
  span.partial { color: #fbbf24; }
  span.wrong   { color: #ef4444; text-decoration: line-through; opacity: 0.8; }
  span.extra   { color: #94a3b8; opacity: 0.6; font-style: italic; }
`;

// ====================== 工具函数 ======================
// 常见弱读音容错表
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

// Levenshtein 距离
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

// 单词对齐高亮
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
        // 尝试跳过缺失或多余
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const countdownRef = useRef<number | null>(null);

  const loadSentence = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api.getSentences(page);
      const s = res.data?.[0];
      if (s) {
        setSentence(s);
        setTotalPages(res.pagination?.totalPages || 1);
        setCurrentPage(page);
        setRedoKey(k => k + 1);
        resetAll();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const resetAll = () => {
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
  };

  useEffect(() => { loadSentence(1); }, [loadSentence]);

  const startRecordingAfterBeep = async () => {
    const beep = new Audio("/beep.wav");
    beep.volume = 0.5;
    await beep.play();

    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true, 
            autoGainControl: true 
          } 
        });
        streamRef.current = stream;

        // 1. 录音（用于回放）
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setUserAudioUrl(URL.createObjectURL(blob));
        };
        recorder.start();

        // 2. 实时语音识别（关键！）
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

        // UI 状态
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
      if (origWords.includes(w) || Object.keys(PHONETIC_MAP).some(k => PHONETIC_MAP[k].includes(w) || k === w)) correct++;
    });
    const pronunciation = userWords.length ? Math.round((correct / userWords.length) * 100) : 0;
    const fluency = Math.max(0, 100 - Math.abs(origWords.length - userWords.length) * 8);
    const overall = Math.round(content * 0.5 + fluency * 0.25 + pronunciation * 0.25);

    setScore({ content, fluency, pronunciation, overall });
    setAlignedWords(alignWords(original, user));
  };

  if (loading || !sentence) {
    return (
      <Page style={{ display: 'grid', placeItems: 'center' }}>
        <Loader2 size={64} className="animate-spin" color="#22d3ee" />
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <Title>Repeat Sentence 复述练习（纯本地实时识别）</Title>

        <DictationPlayer
          key={`orig-${sentence.id}-${redoKey}`}
          audioUrl={`https://dictation-pte.onrender.com${sentence.audioPath}`}
          autoPlay
          onEnded={startRecordingAfterBeep}
        />

        <AnimatePresence mode="wait">
          {isRecording && (
            <RecordingWrapper
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Mic size={96} color="#f87171" style={{ filter: 'drop-shadow(0 0 30px #f87171)' }} />
              <Countdown key={recordingSeconds}>
                {recordingSeconds}
              </Countdown>
              <p style={{ fontSize: '1.7rem', color: '#fca5a5', margin: '1.5rem 0 2rem' }}>
                秒后自动停止
              </p>
              <StopBtn whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }} onClick={stopEverything}>
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
              <div style={{ color: '#67e8f9', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <div style={{ padding: '1rem', background: 'rgba(15,23,42,0.8)', borderRadius: '0.8rem', fontSize: '1.2rem' }}>
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
              isPlayingUserAudio ? userAudioRef.current.pause() : userAudioRef.current.play();
              setIsPlayingUserAudio(!isPlayingUserAudio);
            }}
          >
            {isPlayingUserAudio ? <MicOff size={34} color="#22d3ee" /> : <Mic size={34} color="#22d3ee" />}
            <div>
              <div style={{ fontWeight: '600', color: '#22d3ee' }}>你的录音（点击播放）</div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>点击可播放 / 暂停</div>
            </div>
            <audio ref={userAudioRef} src={userAudioUrl} onEnded={() => setIsPlayingUserAudio(false)} />
          </Panel>
        )}

        {score && (
          <Panel>
            <div style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 'bold', color: '#22d3ee', marginBottom: '2rem' }}>
              评分结果（纯本地算法）
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
              {[
                { label: '内容 Content', value: score.content, color: 'linear-gradient(90deg,#10b981,#34d399)' },
                { label: '流利度 Fluency', value: score.fluency, color: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
                { label: '发音 Pronunciation', value: score.pronunciation, color: 'linear-gradient(90deg,#ec4899,#f472b6)' },
                { label: '综合 Overall', value: score.overall, color: 'linear-gradient(90deg,#22d3ee,#06b6d4)', big: true },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <div style={{
                    width: item.big ? '200px' : '170px',
                    textAlign: 'right',
                    fontSize: item.big ? '1.4rem' : '1.1rem',
                    fontWeight: item.big ? 'bold' : 'normal',
                    color: item.big ? '#a5f3fc' : '#94a3b8'
                  }}>
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
                  <div style={{
                    width: item.big ? '110px' : '90px',
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    fontSize: item.big ? '3.2rem' : '2.2rem',
                    color: item.big ? '#22d3ee' : '#e2e8f0'
                  }}>
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
            onClick={() => { setRedoKey(k => k + 1); resetAll(); }}
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
              gap: '12px'
            }}
          >
            <RefreshCcw size={30} />
            重新练习这句
          </motion.button>
        )}

        <SentenceNavigator current={currentPage} total={totalPages} onJump={loadSentence} />
      </Card>
    </Page>
  );
}