import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FileUploader from './components/FileUploader';
import QuestionTable from './components/QuestionTable';
import StudentSolve from './components/StudentSolve';

function TeacherDashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Sticky Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200/60 shadow-sm shadow-slate-200/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center transition-all">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
              CQ
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight hidden sm:block">
              Chemistry QB Engine
            </h1>
          </div>
          
          <button
            onClick={triggerRefresh}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500 ease-in-out" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Intro Section */}
        <section className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
            AI-Powered <span className="text-indigo-600">Question Bank</span> Generation
          </h2>
          <p className="mt-4 text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto font-light leading-relaxed">
            Upload your Chemistry syllabus or academic material, and our Gemini-powered engine will intelligently extract topics and synthesize a structured question bank.
          </p>
        </section>

        {/* Upload Section */}
        <section className="flex justify-center">
          <FileUploader onUploadSuccess={triggerRefresh} />
        </section>

        {/* Data Table Section */}
        <section>
          <QuestionTable refreshTrigger={refreshTrigger} />
        </section>
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200/60 bg-slate-50/50">
        <p className="font-medium tracking-wide">Chemistry QB Engine &copy; {new Date().getFullYear()} - CBSE Class 12 • <span className="text-slate-500">Premium EdTech Platform</span></p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TeacherDashboard />} />
        <Route path="/solve/:questionId" element={<StudentSolve />} />
      </Routes>
    </Router>
  );
}

export default App;
