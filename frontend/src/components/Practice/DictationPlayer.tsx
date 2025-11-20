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
  /** 新增：当音频加载失败时，用这个文本走浏览器 TTS 朗读 */
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
    const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
    const [hasError, setHasError] = useState(false);

    useImperativeHandle(ref, () => audioRef.current!, [audioRef]);

    // 监听 ended
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

    // 监听 error：这里做兜底（TTS）
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

        // 如果有兜底文本，并且浏览器支持 speechSynthesis，则朗读文本
        if (fallbackText && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(fallbackText);
            utter.lang = 'en-US';
            utter.rate = 0.95;
            utter.pitch = 1.0;
            // console.log('[Player] 使用浏览器 TTS 朗读 fallback 文本:', fallbackText);
            window.speechSynthesis.speak(utter);
          } catch (e) {
            console.warn('[Player] TTS 兜底失败:', e);
          }
        } else {
          console.warn('[Player] 无法使用 TTS 兜底（可能浏览器不支持或没有 fallbackText）');
        }
      };

      audio.addEventListener('error', handleError);
      return () => audio.removeEventListener('error', handleError);
    }, [fallbackText]);

    // audioUrl 变化时重置（包括筛选、翻页）
    useEffect(() => {
      const audio = audioRef.current;
      // console.log('[Player] audioUrl 变化:', {
      //   audioUrl,
      //   audioElementSrc: audio?.src,
      // });

      setHasError(false);
      setHasAutoPlayed(false);
      setIsPlaying(false);
      setCountdown(2);
    }, [audioUrl]);

    // 自动播放倒计时逻辑
    useEffect(() => {
      if (!autoPlay) return;
      const audio = audioRef.current;
      if (!audio) return;

      // console.log('[Player] 自动播放 useEffect 开始，当前 audio 状态:', {
      //   src: audio.src,
      //   readyState: audio.readyState,
      //   networkState: audio.networkState,
      //   error: audio.error,
      // });

      audio.pause();
      audio.currentTime = 0;

      let timer: number | undefined;

      timer = window.setInterval(() => {
        setCountdown((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            if (timer) window.clearInterval(timer);
            triggerPlay();
          }
          return next;
        });
      }, 1000);

      return () => {
        if (timer) window.clearInterval(timer);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl, autoPlay]);

    const triggerPlay = async () => {
      const audio = audioRef.current;
      if (!audio) return;

      // console.log('[Player] triggerPlay 尝试播放:', {
      //   src: audio.src,
      //   audioUrlProp: audioUrl,
      //   readyState: audio.readyState,
      //   networkState: audio.networkState,
      //   error: audio.error,
      // });

      // 如果之前已经出错了，就不再尝试播放，交给 TTS 兜底
      if (hasError || audio.error) {
        console.warn('[Player] 已经检测到 audio 出错，不再尝试 play()，交由 TTS 兜底');
        return;
      }

      if (hasAutoPlayed) return;
      setIsPlaying(true);
      try {
        await audio.play();
        setHasAutoPlayed(true);
      } catch (err) {
        console.warn('自动播放被阻止或音频不支持', err);
      } finally {
        setIsPlaying(false);
      }
    };

    const handleReplay = () => {
      setCountdown(0);
      onReplay?.();

      const audio = audioRef.current;
      if (!audio) return;

      // 如果有错误，直接用 TTS 重播文本
      if (hasError || audio.error) {
        // console.log('[Player] 手动重播，但 audio 已错误，走 TTS 朗读');
        if (fallbackText && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(fallbackText);
          utter.lang = 'en-US';
          utter.rate = 0.95;
          utter.pitch = 1.0;
          window.speechSynthesis.speak(utter);
        }
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
          ) : countdown === 0 ? (
            <RotateCw size={24} className="text-emerald-400" />
          ) : (
            <Play size={24} className="text-emerald-400" />
          )}
        </ControlButton>

        <ProgressTrack>
          <ProgressBar
            initial={{ width: '100%' }}
            animate={{ width: 0 }}
            transition={{ duration: 3, ease: 'linear' }}
            key={audioUrl}
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
