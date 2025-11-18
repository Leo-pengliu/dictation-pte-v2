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

// 圆形控制按钮
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
    /* 让图标更细腻一点 */
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
  ({ audioUrl, onReplay, autoPlay = false, onEnded }, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

    // 暴露 ref（可选）
    useImperativeHandle(ref, () => audioRef.current!, [audioRef]);

    // 新增：监听音频自然结束
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;

      const handleEnded = () => {
        setIsPlaying(false);
        onEnded?.(); // 关键：播放完后触发外部回调
      };

      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }, [onEnded]);

    // 倒计时 + 自动播放
    useEffect(() => {
      if (!autoPlay || !audioRef.current) return;

      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;

      setCountdown(2);
      setHasAutoPlayed(false);
      setIsPlaying(false);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(interval);
            triggerPlay();
          }
          return next;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl, autoPlay]);

    const triggerPlay = async () => {
      if (!audioRef.current || hasAutoPlayed) return;
      setIsPlaying(true);
      try {
        await audioRef.current.play();
        setHasAutoPlayed(true);
      } catch (err) {
        console.warn('自动播放被阻止（需用户交互）', err);
      } finally {
        setIsPlaying(false);
      }
    };

    const handleReplay = () => {
      setCountdown(0);
      onReplay?.();
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    };

    return (
      <Wrapper
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        {/* 播放/重播按钮 */}
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

        {/* 进度条动画（视觉倒计时） */}
        <ProgressTrack>
          <ProgressBar
            initial={{ width: '100%' }}
            animate={{ width: 0 }}
            transition={{ duration: 3, ease: 'linear' }}
            key={audioUrl}
          />
        </ProgressTrack>

        {/* 倒计时数字 */}
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
