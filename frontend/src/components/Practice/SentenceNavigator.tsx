// src/components/Practice/SentenceNavigator.tsx
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

const NavBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 2rem;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.3);
  border-radius: ${p => p.theme.radius.lg};
  border: 1px solid ${p => p.theme.colors.border};
  flex-wrap: wrap;
`;

const Input = styled.input`
  width: 72px;
  padding: 0.5rem;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.md};
  color: ${p => p.theme.colors.text};
  text-align: center;
  font-family: ${p => p.theme.font.mono};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
`;

const NavButton = styled(motion.button)<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${p => (p.disabled ? 'rgba(71, 85, 105, 0.3)' : 'rgba(16, 185, 129, 0.2)')};
  color: ${p => (p.disabled ? p.theme.colors.textMuted : p.theme.colors.primaryLight)};
  border: 1px solid ${p => (p.disabled ? 'transparent' : p.theme.colors.border)};
  border-radius: ${p => p.theme.radius.md};
  font-weight: 600;
  font-size: 0.95rem;
  cursor: ${p => (p.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.disabled ? 0.5 : 1)};
  transition: all 0.2s;

  &:hover {
    background: ${p => !p.disabled && 'rgba(16, 185, 129, 0.3)'};
  }
`;

interface Props {
  current: number;
  total: number;
  onJump: (page: number) => void;
}

export function SentenceNavigator({ current, total, onJump }: Props) {
  const [input, setInput] = useState(String(current));

  // 同步外部 current 变化（如提交答案后自动跳页）
  useEffect(() => {
    setInput(String(current));
  }, [current]);

  const handleJump = () => {
    let page = parseInt(input, 10);
    if (isNaN(page)) return;
    page = Math.max(1, Math.min(total, page)); // 限制范围
    if (page !== current) onJump(page);
  };

  const goPrev = () => current > 1 && onJump(current - 1);
  const goNext = () => current < total && onJump(current + 1);

  return (
    <NavBar>
      {/* 上一页 */}
      <NavButton
        onClick={goPrev}
        disabled={current <= 1}
        whileHover={{ scale: current > 1 ? 1.05 : 1 }}
        whileTap={{ scale: current > 1 ? 0.95 : 1 }}
      >
        <ChevronLeft size={18} />
        上一句
      </NavButton>

      {/* 当前页显示 */}
      <span className="text-slate-400 font-medium">
        第 <strong className="text-emerald-400">{current}</strong> / {total} 句
      </span>

      {/* 下一页 */}
      <NavButton
        onClick={goNext}
        disabled={current >= total}
        whileHover={{ scale: current < total ? 1.05 : 1 }}
        whileTap={{ scale: current < total ? 0.95 : 1 }}
      >
        下一句
        <ChevronRight size={18} />
      </NavButton>

      {/* 分隔线（可选） */}
      <div className="hidden sm:block w-px bg-slate-600" />

      {/* 跳转输入框 */}
      <div className="flex items-center gap-3">
        <Input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setInput(value.replace(/\D/g, '') || '1');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleJump()}
          placeholder="1"
          className="w-20" // 明确宽度，更可控
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleJump}
          className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors flex items-center justify-center"
          title="跳转到该页"
        >
          <ChevronsRight size={18} />
        </motion.button>
      </div>
    </NavBar>
  );
}