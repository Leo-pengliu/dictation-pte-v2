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
  margin-top: 1.75rem; /* 比原来 2rem 略小一点，更紧凑 */
  padding: 1rem 1.25rem;
  background: rgba(15, 23, 42, 0.85);
  border-radius: ${(p) => p.theme.radius.xl};
  border: 1px solid ${p => p.theme.colors.border};
  flex-wrap: wrap;
`;

// 页码输入
const Input = styled.input`
  width: 72px;
  padding: 0.5rem 0.75rem;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.6);
  border-radius: 999px;
  color: ${p => p.theme.colors.text};
  text-align: center;
  font-family: ${p => p.theme.font.mono};
  font-size: 1rem;
  outline: none;
  transition: all 0.2s ease-out;

  &:focus {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.8), 0 0 25px rgba(16, 185, 129, 0.35);
  }

  &::placeholder {
    color: ${p => p.theme.colors.textMuted};
  }
`;

// 上一/下一句按钮
const NavButton = styled(motion.button)<{ disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.4rem;
  background: ${p => (p.disabled
    ? 'rgba(15, 23, 42, 0.9)'
    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.35))'
  )};
  color: ${p => (p.disabled ? p.theme.colors.textMuted : p.theme.colors.primaryLight)};
  border: 1px solid ${p => (p.disabled ? 'rgba(51,65,85,0.7)' : 'rgba(45, 212, 191, 0.6)')};
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: ${p => (p.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${p => (p.disabled ? 0.5 : 1)};
  transition: all 0.2s ease-out;
  box-shadow: ${p =>
    p.disabled
      ? 'none'
      : '0 12px 30px rgba(15,118,110,0.45)'};

  svg {
    stroke-width: 2.3;
  }

  &:hover {
    background: ${p =>
      !p.disabled &&
      'linear-gradient(135deg, rgba(16, 185, 129, 0.45), rgba(5, 150, 105, 0.55))'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${p =>
      !p.disabled &&
      '0 8px 20px rgba(15,118,110,0.5)'};
  }
`;

// “跳转”小按钮
const IconButton = styled(motion.button)`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: radial-gradient(circle at 25% 20%, rgba(52, 211, 153, 0.25), transparent),
    rgba(15, 23, 42, 0.95);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.theme.colors.primaryLight};
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.85);
  transition: all 0.2s ease-out;

  svg {
    stroke-width: 2.3;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 30px rgba(15, 118, 110, 0.65);
    border-color: rgba(45, 212, 191, 0.7);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 8px 18px rgba(15, 118, 110, 0.6);
  }
`;

// 新增：控制“页码输入 + 跳转按钮”的间距
const JumpGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem; /* 就是你看到的两个控件之间的距离 */
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
    page = Math.max(1, Math.min(total, page));
    if (page !== current) onJump(page);
  };

  const goPrev = () => current > 1 && onJump(current - 1);
  const goNext = () => current < total && onJump(current + 1);

  return (
    <NavBar>
      {/* 上一句 */}
      <NavButton
        onClick={goPrev}
        disabled={current <= 1}
        whileHover={{ scale: current > 1 ? 1.04 : 1 }}
        whileTap={{ scale: current > 1 ? 0.96 : 1 }}
      >
        <ChevronLeft size={18} />
        上一句
      </NavButton>

      {/* 当前页显示 */}
      <span className="text-slate-400 font-medium">
        第 <strong className="text-emerald-400">{current}</strong> / {total} 句
      </span>

      {/* 下一句 */}
      <NavButton
        onClick={goNext}
        disabled={current >= total}
        whileHover={{ scale: current < total ? 1.04 : 1 }}
        whileTap={{ scale: current < total ? 0.96 : 1 }}
      >
        下一句
        <ChevronRight size={18} />
      </NavButton>

      {/* 分隔线（可选） */}
      <div className="hidden sm:block w-px bg-slate-600" />

      {/* 跳转输入 + 按钮 */}
      <JumpGroup>
        <Input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const digits = value.replace(/\D/g, '');
            setInput(digits);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleJump()}
          placeholder="1"
        />
        <IconButton
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleJump}
          title="跳转到该句"
        >
          <ChevronsRight size={18} />
        </IconButton>
      </JumpGroup>
    </NavBar>
  );
}
