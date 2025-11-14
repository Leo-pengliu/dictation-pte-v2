// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PracticePage from './pages/PracticePage';
import UploadPage from './pages/UploadPage';
import { Navigation } from './components/Navigation';

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<PracticePage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </BrowserRouter>
  );
}