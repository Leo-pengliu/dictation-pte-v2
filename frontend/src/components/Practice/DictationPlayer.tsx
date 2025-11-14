// src/components/Practice/DictationPlayer.tsx
import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCw, Loader2 } from 'lucide-react';

interface Props {
  audioUrl: string;
  onReplay?: () => void;
  autoPlay?: boolean;
}

export const DictationPlayer = forwardRef<HTMLAudioElement, Props>(
  ({ audioUrl, onReplay, autoPlay = false }, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

    // 暴露 ref（可选，外部可控制）
    useImperativeHandle(ref, () => audioRef.current!, [audioRef]);

    // 倒计时 + 自动播放
    useEffect(() => {
      if (!autoPlay || !audioRef.current) return;

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

      return () => clearInterval(interval);
    }, [audioUrl, autoPlay]);

    const triggerPlay = async () => {
      if (!audioRef.current || hasAutoPlayed) return;
      setIsPlaying(true);
      try {
        await audioRef.current.play();
        setHasAutoPlayed(true);
      } catch (err) {
        console.warn('自动播放被阻止（需用户交互）', err);
        // 可选：提示用户点击播放
      } finally {
        setIsPlaying(false);
      }
    };

    const handleReplay = () => {
      setCountdown(0);
      onReplay?.();
      audioRef.current?.play().catch(() => {});
    };

    return (
      <motion.div
        className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* 播放/重播按钮 */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleReplay}
          disabled={isPlaying}
          className="p-3 bg-emerald-500/20 rounded-full hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
        >
          {isPlaying ? (
            <Loader2 size={24} className="text-emerald-400 animate-spin" />
          ) : countdown === 0 ? (
            <RotateCw size={24} className="text-emerald-400" />
          ) : (
            <Play size={24} className="text-emerald-400" />
          )}
        </motion.button>

        {/* 进度条 */}
        <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            initial={{ width: '100%' }}
            animate={{ width: 0 }}
            transition={{ duration: 3, ease: 'linear' }}
            key={audioUrl}
          />
        </div>

        {/* 倒计时数字 */}
        <motion.span
          key={countdown}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-lg font-mono font-bold text-emerald-400 min-w-[2ch] text-right"
        >
          {countdown > 0 ? countdown : 'Play'}
        </motion.span>

        {/* 隐藏的 audio 标签 */}
        <audio ref={audioRef} src={audioUrl} preload="auto" />
      </motion.div>
    );
  }
);

DictationPlayer.displayName = 'DictationPlayer';