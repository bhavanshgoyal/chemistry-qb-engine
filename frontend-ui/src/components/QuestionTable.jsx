import { useState, useEffect } from 'react';
import api from '../services/api';

const QuestionTable = ({ refreshTrigger }) => {
  const [questions, setQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/questions');
      const data = response.data.content || response.data || [];
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch questions. The server might be cold-starting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [refreshTrigger]);

  const filteredQuestions = questions.filter((q) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (q.topic && q.topic.toLowerCase().includes(searchLower)) ||
      (q.subTopic && q.subTopic.toLowerCase().includes(searchLower)) ||
      (q.bloomsLevel && q.bloomsLevel.toLowerCase().includes(searchLower)) ||
      (q.questionText && q.questionText.toLowerCase().includes(searchLower))
    );
  });

  const getBloomBadgeStyle = (level) => {
    switch (level) {
      case 'Remembering':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Understanding':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Applying':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Analyzing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Evaluating':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'Creating':
        return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col transition-all">
      <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Question Bank</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm">Review, filter, and manage your AI-generated questions.</p>
        </div>
        <div className="relative w-full sm:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50/50 placeholder-slate-400 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white sm:text-sm transition-all shadow-sm"
            placeholder="Search topics, questions, or taxonomy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200 border-b border-slate-200">
          <thead className="bg-slate-50/90 backdrop-blur-md sticky top-0 z-10 shadow-sm">
            <tr>
              <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Topic & Sub-topic
              </th>
              <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Bloom's Level
              </th>
              <th scope="col" className="px-8 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Question Text
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="3" className="px-8 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="animate-spin h-10 w-10 text-indigo-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-slate-500 font-medium">Loading questions... (Waking up the server)</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="3" className="px-8 py-16 text-center text-rose-500 font-medium">
                  {error}
                </td>
              </tr>
            ) : filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-8 py-16 text-center">
                  <div className="text-slate-400 font-medium text-lg">
                    {searchTerm ? 'No questions match your search criteria.' : 'No questions found. Upload a document to generate some!'}
                  </div>
                </td>
              </tr>
            ) : (
              filteredQuestions.map((question, index) => (
                <tr key={question.id || index} className="even:bg-slate-50/50 hover:bg-slate-100/70 transition-colors duration-150">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-800">{question.topic}</div>
                    <div className="text-sm font-medium text-slate-500 mt-0.5">{question.subTopic}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border ${getBloomBadgeStyle(question.bloomsLevel)} shadow-sm`}>
                      {question.bloomsLevel || 'N/A'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-600 font-medium max-w-2xl truncate hover:whitespace-normal hover:break-words leading-relaxed">
                    {question.questionText}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer Status */}
      {!loading && !error && filteredQuestions.length > 0 && (
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 text-xs font-medium text-slate-500 flex justify-between items-center">
          <span>Showing <span className="font-bold text-slate-700">{filteredQuestions.length}</span> question{filteredQuestions.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};

export default QuestionTable;
