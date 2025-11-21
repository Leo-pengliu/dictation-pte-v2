// src/components/Practice/DictationPlayer.tsx
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Play, RotateCw, Loader2 } from 'lucide-react';

interface Props {
  audioUrl: string;
  onReplay?: () => void;
  autoPlay?: boolean;
  onEnded?: () => void;
  /** 当音频损坏时，用这个英文句子走浏览器 TTS 兜底 */
  fallbackText?: string;
}

const Wrapper = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: radial-gradient(circle at top left, rgba(34, 197, 94, 0.08), transparent),
    rgba(30, 41, 59, 0.85);
  border-radius: ${(p) => p.theme.radius.xl};
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.75);
  margin-bottom: 1.25rem;
`;

const ControlButton = styled(motion.button)<{ disabled?: boolean }>`
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.4);
  background: radial-gradient(circle at 30% 20%, rgba(45, 212, 191, 0.35), transparent),
    rgba(15, 23, 42, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: ${(p) => (p.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.disabled ? 0.6 : 1)};
  transition: all 0.2s ease-out;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.8), 0 15px 30px rgba(6, 95, 70, 0.5);

  svg {
    stroke-width: 2.2;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.7), 0 18px 35px rgba(5, 150, 105, 0.7);
    background: radial-gradient(circle at 30% 20%, rgba(45, 212, 191, 0.5), transparent),
      rgba(15, 23, 42, 0.95);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.6), 0 10px 20px rgba(5, 150, 105, 0.6);
  }
`;

const ProgressTrack = styled.div`
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(90deg, #1f2937, #020617);
  overflow: hidden;
`;

const ProgressBar = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #0ea5e9);
`;

const CountdownText = styled(motion.span)`
  min-width: 3ch;
  text-align: right;
  font-family: ${(p) => p.theme.font.mono};
  font-size: 1rem;
  font-weight: 700;
  color: #6ee7b7;
`;

export const DictationPlayer = forwardRef<HTMLAudioElement, Props>(
  ({ audioUrl, onReplay, autoPlay = false, onEnded, fallbackText }, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [hasError, setHasError] = useState(false);

    // 用 ref 保证：自动播放 & TTS 只触发一次（解决 StrictMode 下的双执行）
    const hasAutoPlayedRef = useRef(false);
    const ttsStartedRef = useRef(false);

    useImperativeHandle(ref, () => audioRef.current!, [audioRef]);

    // ====== audio 结束：正常音频播放完后触发 onEnded ======
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleEnded = () => {
        setIsPlaying(false);
        onEnded?.();
      };

      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }, [onEnded]);

    // ====== audio 出错：走 TTS 兜底，并在 TTS 播放完后触发 onEnded ======
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleError = () => {
        setIsPlaying(false);
        setHasError(true);

        console.warn('[Player] audio error 事件:', {
          src: audio.src,
          error: audio.error,
          code: audio.error?.code,
          networkState: audio.networkState,
          readyState: audio.readyState,
        });

        if (!fallbackText) {
          console.warn('[Player] audio 不可用且无 fallbackText，无法 TTS 兜底');
          // 没有 fallback 的情况下，也要给上层一个机会开始录音
          onEnded?.();
          return;
        }

        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          console.warn('[Player] 浏览器不支持 speechSynthesis');
          onEnded?.();
          return;
        }

        // 避免多次触发 TTS
        if (ttsStartedRef.current) return;
        ttsStartedRef.current = true;

        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(fallbackText);
          utter.lang = 'en-US';
          utter.rate = 0.95;
          utter.pitch = 1.0;

          utter.onend = () => {
            onEnded?.();
          };

          window.speechSynthesis.speak(utter);
        } catch (e) {
          console.warn('[Player] TTS 兜底失败:', e);
          onEnded?.();
        }
      };

      audio.addEventListener('error', handleError);
      return () => audio.removeEventListener('error', handleError);
    }, [fallbackText, onEnded]);

    // ====== audioUrl 变化时重置状态 ======
    useEffect(() => {
      setHasError(false);
      setIsPlaying(false);
      setCountdown(3);
      hasAutoPlayedRef.current = false;
      ttsStartedRef.current = false;

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }, [audioUrl]);

    // ====== 自动播放倒计时逻辑（3,2,1 后触发一次 triggerPlay）======
    useEffect(() => {
      if (!autoPlay) return;
      const audio = audioRef.current;
      if (!audio) return;

      let timer: number | undefined;
      let left = 3;

      setCountdown(left);

      timer = window.setInterval(() => {
        left -= 1;
        setCountdown(left);
        if (left <= 0) {
          if (timer) window.clearInterval(timer);
          triggerPlay();
        }
      }, 1000);

      return () => {
        if (timer) window.clearInterval(timer);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl, autoPlay]);

    // 真正的播放函数：用 ref 保证只执行一次
    const triggerPlay = async () => {
      const audio = audioRef.current;
      if (!audio) return;

      // 已经出错 → 不再尝试 play，由 error 事件里的 TTS 兜底负责
      if (hasError || audio.error) {
        console.warn('[Player] audio 不可用或已出错，直接使用 TTS 兜底');
        return;
      }

      if (hasAutoPlayedRef.current) return;
      hasAutoPlayedRef.current = true;

      setIsPlaying(true);
      try {
        await audio.play();
      } catch (err) {
        console.warn('自动播放被阻止或音频不支持', err);
      } finally {
        setIsPlaying(false);
      }
    };

    // 手动重播：如果 audio 坏了，走 TTS；否则正常 replay
    const handleReplay = () => {
      setCountdown(0);
      onReplay?.();

      const audio = audioRef.current;
      if (!audio) return;

      if (hasError || audio.error) {
        if (!fallbackText || typeof window === 'undefined' || !('speechSynthesis' in window)) {
          return;
        }

        if (ttsStartedRef.current) {
          window.speechSynthesis.cancel();
        }
        ttsStartedRef.current = true;

        const utter = new SpeechSynthesisUtterance(fallbackText);
        utter.lang = 'en-US';
        utter.rate = 0.95;
        utter.pitch = 1.0;
        window.speechSynthesis.speak(utter);
        return;
      }

      audio.currentTime = 0;
      audio
        .play()
        .then(() => setIsPlaying(false))
        .catch((e) => {
          console.warn('[Player] 手动播放失败', e);
        });
    };

    return (
      <Wrapper
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <ControlButton
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReplay}
          disabled={isPlaying}
        >
          {isPlaying ? (
            <Loader2 size={24} className="text-emerald-400 animate-spin" />
          ) : countdown > 0 ? (
            <Play size={24} className="text-emerald-400" />
          ) : (
            <RotateCw size={24} className="text-emerald-400" />
          )}
        </ControlButton>

        <ProgressTrack>
          <ProgressBar
            key={audioUrl}
            initial={{ width: '100%' }}
            animate={{ width: 0 }}
            transition={{ duration: 3, ease: 'linear' }}
          />
        </ProgressTrack>

        <CountdownText
          key={countdown}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {countdown > 0 ? countdown : 'Play'}
        </CountdownText>

        {/* 隐藏的 audio 标签 */}
        <audio ref={audioRef} src={audioUrl} preload="auto" />
      </Wrapper>
    );
  }
);

DictationPlayer.displayName = 'DictationPlayer';
