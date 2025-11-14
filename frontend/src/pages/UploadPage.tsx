// src/pages/UploadPage.tsx
import { SentenceForm } from '../components/Upload/SentenceForm';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Upload } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  padding: 6rem 1rem 2rem;
  max-width: 800px;
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
  margin-bottom: 0.5rem;
`;

export default function UploadPage() {
  return (
    <Container>
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            padding: '0.75rem',
            background: 'linear-gradient(to right, #10b981, #14b8a6)',
            borderRadius: '1rem',
            display: 'flex',
          }}>
            <Upload size={28} color="white" />
          </div>
          <div>
            <Title>上传句子</Title>
            <p style={{ color: '#94a3b8' }}>支持上传音频文件或现场录音</p>
          </div>
        </div>

        <SentenceForm />
      </Card>
    </Container>
  );
}