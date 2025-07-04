import React, { useState, useEffect, useMemo } from 'react';

import { booksData, quizData } from './data.js'; // Імпортуємо дані

export function App() {
  const [activeBook, setActiveBook] = useState(booksData[0]); 
  const [view, setView] = useState('books'); // 'books', 'chapters', 'settings', 'quiz'
  const [selections, setSelections] = useState({});
  const [dailyReads, setDailyReads] = useState(0);
  const [showDailyStats, setShowDailyStats] = useState(true);
  const [chaptersPerDay, setChaptersPerDay] = useState(4);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [isQuizEnabled, setIsQuizEnabled] = useState(true); // Новий стан для налаштувань тесту

  useEffect(() => {
    const intervalId = setInterval(() => setShowDailyStats(p => !p), 5000);
    return () => clearInterval(intervalId);
  }, []);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      const savedSelections = localStorage.getItem('bibleReadChapters');
      if (savedSelections) setSelections(JSON.parse(savedSelections));

      const savedChaptersPerDay = localStorage.getItem('chaptersPerDay');
      if (savedChaptersPerDay) setChaptersPerDay(Number(savedChaptersPerDay));
      
      const savedQuizEnabled = localStorage.getItem('isQuizEnabled');
      if (savedQuizEnabled !== null) setIsQuizEnabled(JSON.parse(savedQuizEnabled));

      const savedDailyProgress = localStorage.getItem('bibleDailyProgress');
      const today = getTodayDateString();
      if (savedDailyProgress) {
        const { date, count } = JSON.parse(savedDailyProgress);
        if (date === today) setDailyReads(count);
        else localStorage.setItem('bibleDailyProgress', JSON.stringify({ date: today, count: 0 }));
      } else {
        localStorage.setItem('bibleDailyProgress', JSON.stringify({ date: today, count: 0 }));
      }
    } catch (error) { console.error("Failed to parse from localStorage", error); }
    if (window.Telegram?.WebApp) window.Telegram.WebApp.ready();
  }, []);

  const handleBookClick = (book) => {
    setActiveBook(book);
    setView('chapters');
  };

  const handleChapterClick = (chapter) => {
    const quizKey = `${activeBook.name}-${chapter}`;
    const isAlreadyRead = selections[activeBook.name]?.includes(chapter);

    setSelections(currentSelections => {
      const readChapters = currentSelections[activeBook.name] || [];
      let newReadChapters;
      let dailyChange = 0;
      if (readChapters.includes(chapter)) {
        newReadChapters = readChapters.filter(c => c !== chapter);
        dailyChange = -1;
      } else {
        newReadChapters = [...readChapters, chapter].sort((a, b) => a - b);
        dailyChange = 1;
      }
      setDailyReads(currentDailyReads => {
          const newDailyCount = Math.max(0, currentDailyReads + dailyChange);
          localStorage.setItem('bibleDailyProgress', JSON.stringify({ date: getTodayDateString(), count: newDailyCount }));
          return newDailyCount;
      });
      const newSelections = { ...currentSelections };
      if (newReadChapters.length > 0) newSelections[activeBook.name] = newReadChapters;
      else delete newSelections[activeBook.name];
      try {
        localStorage.setItem('bibleReadChapters', JSON.stringify(newSelections));
      } catch (error) { console.error("Failed to save selections", error); }
      return newSelections;
    });

    if (isQuizEnabled && !isAlreadyRead && quizData[quizKey]) {
        setCurrentQuiz(quizData[quizKey]);
        setQuizAnswer(null); 
        setView('quiz');
    }
  };
  
  const handleBackToBooks = () => setView('books');
  
  const handleChaptersPerDayChange = (e) => {
      const value = e.target.value;
      setChaptersPerDay(value);
      const numValue = Number(value);
      if (numValue >= 1) localStorage.setItem('chaptersPerDay', numValue);
  };

  const updateChaptersPerDay = (newValue) => {
      const value = Math.max(1, newValue);
      setChaptersPerDay(value);
      localStorage.setItem('chaptersPerDay', value);
  };

  const handleQuizAnswer = (option) => {
    setQuizAnswer(option);
  };

  const handleToggleQuiz = () => {
    setIsQuizEnabled(currentValue => {
        const newValue = !currentValue;
        localStorage.setItem('isQuizEnabled', JSON.stringify(newValue));
        return newValue;
    });
  };

  const stats = useMemo(() => {
    const totalChapters = booksData.reduce((sum, book) => sum + book.chapters, 0);
    const totalReadChapters = Object.values(selections).reduce((sum, chapters) => sum + chapters.length, 0);
    const percentage = totalChapters > 0 ? (totalReadChapters / totalChapters) * 100 : 0;
    return { totalChapters, totalReadChapters, percentage };
  }, [selections]);

  const baseGridItemClasses = "aspect-square flex items-center justify-center rounded-lg border-2 bg-zinc-800 text-white cursor-pointer transition-all duration-200 hover:bg-zinc-700 active:scale-95";

  const renderBookView = () => (
    <>
      <div className="w-full max-w-md flex justify-between items-center text-white mb-2">
        <div className="h-5 relative w-48">
          <p className={`text-sm text-gray-400 absolute transition-opacity duration-500 ${showDailyStats ? 'opacity-100' : 'opacity-0'}`}>Сьогодні: {dailyReads} / {chaptersPerDay} {dailyReads >= chaptersPerDay && '✅'}</p>
          <p className={`text-sm text-gray-400 absolute transition-opacity duration-500 ${!showDailyStats ? 'opacity-100' : 'opacity-0'}`}>Всього: {stats.totalReadChapters} ({stats.percentage.toFixed(1)}%)</p>
        </div>
        <button onClick={() => setView('settings')} className="p-1"><svg className="w-6 h-6 text-gray-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></button>
      </div>
      <div className="grid grid-cols-6 gap-2 w-full max-w-md p-2">
        {booksData.map((book) => {
          const readChapters = selections[book.name] || [];
          const totalChapters = book.chapters;
          let borderColorClass = 'border-transparent';
          if (readChapters.length > 0) {
            if (readChapters.length === totalChapters) borderColorClass = 'border-green-500';
            else borderColorClass = 'border-orange-500';
          }
          return (<button key={book.name} className={`${baseGridItemClasses} ${borderColorClass}`} onClick={() => handleBookClick(book)}>{book.name}</button>);
        })}
      </div>
    </>
  );

  const renderChapterView = () => {
    const readChapters = selections[activeBook.name] || [];
    return (
      <>
        <div className="w-full max-w-md flex justify-between items-center text-white mb-4">
          <button className="bg-transparent border-none text-blue-500 text-lg font-bold cursor-pointer" onClick={() => setView('books')}>&lt; Назад</button>
          <h1 className="text-xl">{activeBook.name}</h1>
          <div className="w-12"></div>
        </div>
        <div className="grid grid-cols-6 gap-2 w-full max-w-md p-2">
          {Array.from({ length: activeBook.chapters }, (_, i) => i + 1).map((chapter) => {
            const isRead = readChapters.includes(chapter);
            return (<button key={chapter} className={`${baseGridItemClasses} border-transparent ${isRead ? 'bg-green-600' : 'bg-zinc-800'}`} onClick={() => handleChapterClick(chapter)}>{chapter}</button>);
          })}
        </div>
      </>
    );
  };

  const renderSettingsView = () => {
    const numChaptersPerDay = Number(chaptersPerDay) || 0;
    const totalDays = numChaptersPerDay > 0 ? stats.totalChapters / numChaptersPerDay : 0;
    const years = Math.floor(totalDays / 365);
    const months = Math.floor((totalDays % 365) / 30);
    const days = Math.floor((totalDays % 365) % 30);
    let resultString = '';
    if (years > 0) resultString += `${years} р. `;
    if (months > 0) resultString += `${months} міс. `;
    if (days > 0) resultString += `${days} д.`;
    return (
      <>
        <div className="w-full max-w-md flex justify-between items-center text-white mb-4">
          <button className="bg-transparent border-none text-blue-500 text-lg font-bold cursor-pointer" onClick={handleBackToBooks}>&lt; Назад</button>
          <h1 className="text-xl">Налаштування</h1>
          <div className="w-12"></div>
        </div>
        <div className="w-full max-w-md p-4 text-gray-300 bg-zinc-800 rounded-lg space-y-6">
            <div>
                <label className="block mb-4 text-sm font-medium text-center">Розділів на день:</label>
                <div className="flex items-center justify-center space-x-4">
                    <button onClick={() => updateChaptersPerDay(numChaptersPerDay - 1)} className="w-12 h-12 text-2xl font-bold text-white bg-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-600 transition-colors active:scale-95">-</button>
                    <input type="number" value={chaptersPerDay} onChange={handleChaptersPerDayChange} className="bg-transparent text-white text-4xl font-bold w-24 text-center focus:outline-none p-0" />
                    <button onClick={() => updateChaptersPerDay(numChaptersPerDay + 1)} className="w-12 h-12 text-2xl font-bold text-white bg-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-600 transition-colors active:scale-95">+</button>
                </div>
                <div className="mt-6 text-center">
                    <p className="text-gray-400">При такому темпі ви прочитаєте Біблію за:</p>
                    <p className="text-lg font-bold text-white mt-1">{resultString.trim() || 'Введіть кількість'}</p>
                </div>
            </div>
            <div className="border-t border-zinc-700"></div>
            <div className="flex items-center justify-between pt-2">
                <label htmlFor="quiz-toggle" className="text-sm font-medium">Контрольні питання</label>
                <button
                    id="quiz-toggle"
                    onClick={handleToggleQuiz}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out ${isQuizEnabled ? 'bg-green-500' : 'bg-zinc-600'}`}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${isQuizEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>
      </>
    );
  };

  const renderQuizView = () => {
    if (!currentQuiz) return null;
    const getButtonClass = (option) => {
        if (!quizAnswer) return 'bg-zinc-700/80 hover:bg-zinc-600/80';
        if (option === currentQuiz.correctAnswer) return 'bg-green-600';
        if (option === quizAnswer) return 'bg-red-600';
        return 'bg-zinc-700/50 opacity-70';
    };
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end z-50 p-4" onClick={() => setView('chapters')}>
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="w-full max-w-md mx-auto bg-zinc-900/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg slide-up-animation"
        >
          <h2 className="text-lg font-semibold mb-4 text-center text-white">{currentQuiz.question}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {currentQuiz.options.map(option => (
              <button 
                key={option}
                onClick={() => handleQuizAnswer(option)}
                disabled={!!quizAnswer}
                className={`p-4 rounded-lg text-center text-white transition-colors ${getButtonClass(option)}`}
              >
                {option}
              </button>
            ))}
          </div>
          {quizAnswer && (
            <button onClick={() => setView('chapters')} className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold transition-colors">
              Продовжити
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900 min-h-screen font-sans flex flex-col items-center p-4">
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { translateY(0); }
        }
        .slide-up-animation {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
      <div className="w-full max-w-md">
        {view === 'books' && renderBookView()}
        {view === 'chapters' && renderChapterView()}
        {view === 'settings' && renderSettingsView()}
      </div>
      {view === 'quiz' && renderQuizView()}
    </div>
  );
}