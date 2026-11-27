import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './components/dashboard/DashboardPage';
import UploadPage from './components/upload/UploadPage';
import QuestionBankPage from './components/questions/QuestionBankPage';
import VideoLibraryPage from './components/videos/VideoLibraryPage';
import StudentSolvePage from './components/solve/StudentSolvePage';
import ProficiencyPage from './components/proficiency/ProficiencyPage';

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/questions" element={<QuestionBankPage />} />
          <Route path="/videos" element={<VideoLibraryPage />} />
          <Route path="/solve" element={<StudentSolvePage />} />
          <Route path="/solve/:questionId" element={<StudentSolvePage />} />
          <Route path="/proficiency" element={<ProficiencyPage />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
