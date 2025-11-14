// src/components/Upload/SentenceForm.tsx
import { useState, useRef, useEffect } from 'react';
import { api } from '../../lib/api';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';

const Form = styled.form`
  display: grid;
  gap: 1.75rem;
  max-width: 680px;
  margin: 0 auto;
  font-size: 1rem;
  line-height: 1.6;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: ${p => p.theme.colors.primaryLight};
  font-weight: 600;
  font-size: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.lg};
  color: ${p => p.theme.colors.text};
  font-family: ${p => p.theme.font.sans};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.lg};
  color: ${p => p.theme.colors.text};
  font-family: ${p => p.theme.font.mono};
  resize: vertical;
  min-height: 110px;
  font-size: 1rem;
  line-height: 1.7;

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
`;

const Select = styled.select`
  padding: 0.875rem 1rem;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.radius.lg};
  color: ${p => p.theme.colors.text};
  font-size: 1rem;
`;

const Button = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: ${p => p.theme.radius.lg};
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const ToggleSwitch = styled.label`
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;
  color: ${p => p.theme.colors.text};

  input { display: none; }
  .slider {
    position: relative;
    width: 48px;
    height: 26px;
    background: #475569;
    border-radius: 26px;
    transition: 0.3s;
    &::before {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      left: 3px;
      top: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }
  }
  input:checked + .slider { background: #10b981; }
  input:checked + .slider::before { transform: translateX(22px); }
`;

const AudioSection = styled(motion.div)`
  padding: 1rem;
  background: rgba(30, 41, 59, 0.4);
  border-radius: ${p => p.theme.radius.lg};
  border: 1px solid ${p => p.theme.colors.border};
`;

const AudioPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.6);
  border-radius: ${p => p.theme.radius.md};
  margin-top: 0.75rem;
`;

const Waveform = styled.canvas`
  width: 100%;
  height: 60px;
  background: rgba(15, 23, 42, 0.8);
  border-radius: ${p => p.theme.radius.md};
`;

const Duration = styled.div`
  font-family: ${p => p.theme.font.mono};
  font-size: 1.1rem;
  font-weight: 600;
  color: ${p => p.theme.colors.primaryLight};
  text-align: center;
  margin-top: 0.5rem;
`;

const Toast = styled(motion.div)<{ type: 'success' | 'error' | 'warning' }>`
  padding: 1rem 1.5rem;
  border-radius: ${p => p.theme.radius.lg};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  box-shadow: ${p => p.theme.shadow.lg};
  z-index: 1000;
  font-size: 1rem;

  ${p => {
    switch (p.type) {
      case 'success': return `background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399;`;
      case 'error': return `background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5;`;
      case 'warning': return `background: rgba(251, 146, 60, 0.15); border: 1px solid #fb923c; color: #fdba74;`;
    }
  }}
`;

export function SentenceForm() {
  const [form, setForm] = useState({
    original: '',
    translation: '',
    explanation: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSource, setAudioSource] = useState<'upload' | 'record'>('upload');
  const [recordDuration, setRecordDuration] = useState(0); // 录音时长（秒）
  const [finalDuration, setFinalDuration] = useState<string | null>(null); // 最终时长

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentAudioUrl = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationId = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const source = useRef<MediaStreamAudioSourceNode | null>(null);
  const startTime = useRef<number | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Toast 自动消失
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 音频 URL 管理
  useEffect(() => {
    if (currentAudioUrl.current) {
      URL.revokeObjectURL(currentAudioUrl.current);
      currentAudioUrl.current = null;
    }

    let newUrl: string | null = null;
    if (audioFile) {
      newUrl = URL.createObjectURL(audioFile);
    } else if (audioBlob) {
      newUrl = URL.createObjectURL(audioBlob);
    }

    if (newUrl && audioRef.current) {
      currentAudioUrl.current = newUrl;
      audioRef.current.src = newUrl;
      audioRef.current.load();
      setIsPlaying(false);
    }

    return () => {
      if (currentAudioUrl.current) URL.revokeObjectURL(currentAudioUrl.current);
    };
  }, [audioFile, audioBlob]);

  // 实时波形
  const drawWaveform = () => {
    if (!canvasRef.current || !analyser.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyser.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId.current = requestAnimationFrame(draw);
      analyser.current!.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 初始化 AudioContext 和 Analyser
      audioContext.current = new AudioContext();
      analyser.current = audioContext.current.createAnalyser();
      source.current = audioContext.current.createMediaStreamSource(stream);
      source.current.connect(analyser.current);
      analyser.current.fftSize = 2048;

      // 开始波形 + 时长计时
      drawWaveform();
      startTime.current = Date.now();
      setRecordDuration(0);
      durationInterval.current = setInterval(() => {
        if (startTime.current) {
          setRecordDuration(Math.floor((Date.now() - startTime.current) / 1000));
        }
      }, 100);

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioFile(null);
        setAudioSource('record');

        // 最终时长
        const duration = Math.floor((Date.now() - (startTime.current || 0)) / 1000);
        setFinalDuration(formatDuration(duration));

        // 清理
        stream.getTracks().forEach(t => t.stop());
        if (animationId.current) cancelAnimationFrame(animationId.current);
        if (durationInterval.current) clearInterval(durationInterval.current);
        if (audioContext.current) audioContext.current.close();
      };

      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
    } catch (err) {
      setToast({ type: 'error', text: '无法访问麦克风，请检查权限' });
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  // 彻底删除音频
  const deleteAudio = () => {
    setAudioFile(null);
    setAudioBlob(null);
    setIsPlaying(false);
    setFinalDuration(null);
    setRecordDuration(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    if (currentAudioUrl.current) {
      URL.revokeObjectURL(currentAudioUrl.current);
      currentAudioUrl.current = null;
    }
    if (animationId.current) cancelAnimationFrame(animationId.current);
    if (durationInterval.current) clearInterval(durationInterval.current);
  };

  const clearAll = () => {
    setForm({ original: '', translation: '', explanation: '', difficulty: 'medium' });
    deleteAudio();
    setAudioSource('upload');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.original.trim() || !form.translation.trim() || (!audioFile && !audioBlob)) {
      setToast({ type: 'error', text: '请填写原文、翻译并提供音频' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('original', form.original.trim());
    formData.append('translation', form.translation.trim());
    formData.append('explanation', form.explanation);
    formData.append('difficulty', form.difficulty);

    if (audioFile) {
      formData.append('audio', audioFile);
    } else if (audioBlob) {
      formData.append('audio', audioBlob, `recording_${Date.now()}.wav`);
    }

    try {
      const res = await api.uploadSentence(formData);
      if (res.error) {
        if (res.error.includes('已存在')) {
          setToast({ type: 'warning', text: '该句子已存在，请添加其他句子' });
        } else {
          setToast({ type: 'error', text: res.error });
        }
      } else {
        setToast({ type: 'success', text: '上传成功！已加入题库' });
        clearAll();
      }
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || '上传失败，请检查网络' });
    } finally {
      setUploading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setToast({ type: 'error', text: '播放失败' });
      });
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <Toast
            type={toast.type}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}
          >
            {toast.type === 'success' && <CheckCircle size={22} />}
            {toast.type === 'error' && <XCircle size={22} />}
            {toast.type === 'warning' && <AlertCircle size={22} />}
            {toast.text}
          </Toast>
        )}
      </AnimatePresence>

      <Form onSubmit={handleSubmit}>
        {/* 原文、翻译、解析、难度 */}
        <div>
          <Label>原文（英文）</Label>
          <Textarea
            value={form.original}
            onChange={e => setForm({ ...form, original: e.target.value })}
            placeholder="Enter the original sentence..."
            required
          />
        </div>

        <div>
          <Label>翻译（中文）</Label>
          <Textarea
            value={form.translation}
            onChange={e => setForm({ ...form, translation: e.target.value })}
            placeholder="请输入中文翻译..."
            required
          />
        </div>

        <div>
          <Label>解析（可选）</Label>
          <Textarea
            value={form.explanation}
            onChange={e => setForm({ ...form, explanation: e.target.value })}
            placeholder="语法点、难点说明..."
          />
        </div>

        <div>
          <Label>难度</Label>
          <Select
            value={form.difficulty}
            onChange={e => setForm({ ...form, difficulty: e.target.value as any })}
          >
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </Select>
        </div>

        {/* 音频来源切换 */}
        <div>
          <Label>音频来源</Label>
          <ToggleSwitch>
            <input
              type="checkbox"
              checked={audioSource === 'record'}
              onChange={e => {
                const isRecord = e.target.checked;
                setAudioSource(isRecord ? 'record' : 'upload');
                deleteAudio();
              }}
            />
            <span className="slider" />
            <span>{audioSource === 'record' ? '录音模式' : '上传文件'}</span>
          </ToggleSwitch>
        </div>

        {/* 上传模式 */}
        {audioSource === 'upload' && (
          <AudioSection>
            <Label>上传音频文件</Label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  setAudioFile(file);
                  setAudioBlob(null);
                  setIsPlaying(false);
                  setFinalDuration(null);
                }}
                style={{ flex: 1 }}
              />
              {audioFile && (
                <Button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={deleteAudio}
                  style={{ background: '#475569', color: 'white', padding: '0.75rem' }}
                >
                  <Trash2 size={18} />
                </Button>
              )}
            </div>
          </AudioSection>
        )}

        {/* 录音模式 */}
        {audioSource === 'record' && (
          <AudioSection>
            <Label>录音</Label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={recording ? stopRecording : startRecording}
                style={{
                  background: recording ? '#ef4444' : '#10b981',
                  color: 'white',
                  flex: 1,
                }}
              >
                <Mic size={18} />
                {recording ? '停止录音' : '开始录音'}
              </Button>
              {audioBlob && (
                <Button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={deleteAudio}
                  style={{ background: '#475569', color: 'white', padding: '0.75rem' }}
                >
                  <Trash2 size={18} />
                </Button>
              )}
            </div>

            {/* 实时波形 + 时长 */}
            {recording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ marginTop: '1rem' }}
              >
                <Waveform ref={canvasRef} />
                <Duration>{formatDuration(recordDuration)}</Duration>
              </motion.div>
            )}

            {/* 录音完成后显示总时长 */}
            {!recording && finalDuration && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', marginTop: '0.5rem', color: '#34d399', fontWeight: 500 }}
              >
                已录制 {finalDuration}
              </motion.div>
            )}
          </AudioSection>
        )}

        {/* 音频预览 */}
        {(audioFile || audioBlob) && (
          <AudioPreview>
            <Button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              style={{ background: '#334155', color: 'white', padding: '0.5rem' }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </Button>
            <div style={{ flex: 1, fontSize: '0.95rem', color: '#94a3b8' }}>
              {audioFile?.name || '录制音频.wav'}
            </div>
            <Volume2 size={16} style={{ color: '#64748b' }} />
            <audio
              ref={audioRef}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />
          </AudioPreview>
        )}

        {/* 提交按钮 */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            type="submit"
            disabled={uploading}
            whileHover={{ scale: !uploading ? 1.02 : 1 }}
            whileTap={{ scale: !uploading ? 0.98 : 1 }}
            style={{
              flex: 1,
              background: uploading ? '#64748b' : 'linear-gradient(to right, #10b981, #14b8a6)',
              color: 'white',
            }}
          >
            {uploading ? '上传中...' : '提交上传'}
          </Button>
          <Button
            type="button"
            onClick={clearAll}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ background: '#475569', color: 'white' }}
          >
            清空
          </Button>
        </div>
      </Form>
    </>
  );
}