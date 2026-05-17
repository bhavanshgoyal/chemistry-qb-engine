import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const StudentSolve = () => {
  const { questionId } = useParams();
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // Dummy question data for now
  const questionContext = {
    topic: "Chemical Kinetics",
    text: "Explain the effect of a catalyst on the activation energy and the rate of a chemical reaction. Provide a real-world example."
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim().length > 10) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* Mobile-optimized Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md">
            CQ
          </div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 tracking-tight">
            Solve Q-{questionId || '101'}
          </h1>
        </div>
        <Link to="/" className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
          Exit
        </Link>
      </header>

      {/* Main Content Container - Mobile First */}
      <main className="flex-1 w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col space-y-6 animate-fade-in-up mt-4">
        
        {/* Question Card */}
        <section className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold mb-4">
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            {questionContext.topic}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
            {questionContext.text}
          </h2>
        </section>

        {/* Interaction Area */}
        <section className="flex-1 flex flex-col">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
              <label htmlFor="answer" className="text-sm font-bold text-slate-600 ml-2">
                Your Answer
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your thought process here to unlock the solution video..."
                className="flex-1 min-h-[200px] w-full p-5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-[1.5rem] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none shadow-inner"
                required
              />
              
              <button
                type="submit"
                disabled={answer.trim().length < 10}
                className={`w-full py-4 rounded-[1.25rem] font-bold text-lg transition-all duration-300 ${
                  answer.trim().length >= 10 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-0.5' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Submit to Unlock Solution
              </button>
            </form>
          ) : (
            <div className="flex flex-col space-y-6 animate-fade-in-up">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 items-start">
                <div className="bg-emerald-100 text-emerald-600 rounded-full p-1 mt-0.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div>
                  <h3 className="font-bold text-emerald-800">Answer Submitted!</h3>
                  <p className="text-sm text-emerald-600 font-medium mt-1">Great job. Now, watch the solution below to verify your understanding.</p>
                </div>
              </div>

              {/* Responsive 16:9 Video Embed */}
              <div className="w-full bg-slate-900 rounded-[1.5rem] overflow-hidden shadow-xl shadow-slate-300/50 border border-slate-200 relative aspect-video">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&showinfo=0&modestbranding=1" 
                  title="Video Solution" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>

              <button 
                onClick={() => setSubmitted(false)}
                className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-[1.25rem] font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Revise My Answer
              </button>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default StudentSolve;
