import React, { useState, useEffect, useMemo } from 'react';

import { booksData, quizData } from './data.js'; // Імпортуємо дані

export function App() {
  const [activeBook, setActiveBook] = useState(booksData[0]); 
  const [view, setView] = useState('books'); // 'books', 'chapters', 'quiz', 'dailyGoal', 'quizHome', 'quizBookSelection', 'quizList'
  const [selections, setSelections] = useState({});
  const [todaysReadChapters, setTodaysReadChapters] = useState([]);
  const [chaptersPerDay, setChaptersPerDay] = useState(4);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizList, setQuizList] = useState([]);
  const [quizListTitle, setQuizListTitle] = useState('');

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      const savedSelections = localStorage.getItem('bibleReadChapters');
      if (savedSelections) setSelections(JSON.parse(savedSelections));
      const savedChaptersPerDay = localStorage.getItem('chaptersPerDay');
      if (savedChaptersPerDay) setChaptersPerDay(Number(savedChaptersPerDay));
      const savedDailyProgress = localStorage.getItem('bibleDailyProgress');
      const today = getTodayDateString();
      if (savedDailyProgress) {
        const { date, chapters } = JSON.parse(savedDailyProgress);
        if (date === today) {
          setTodaysReadChapters(chapters || []);
        } else {
          localStorage.setItem('bibleDailyProgress', JSON.stringify({ date: today, chapters: [] }));
        }
      } else {
        localStorage.setItem('bibleDailyProgress', JSON.stringify({ date: today, chapters: [] }));
      }
    } catch (error) { console.error("Failed to parse from localStorage", error); }
    if (window.Telegram?.WebApp) window.Telegram.WebApp.ready();
  }, []);

  const handleBookClick = (book) => {
    setActiveBook(book);
    setView('chapters');
  };

  const handleChapterClick = (chapter) => {
    const chapterKey = `${activeBook.name}-${chapter}`;
    setSelections(currentSelections => {
      const readChapters = currentSelections[activeBook.name] || [];
      let newReadChapters;
      if (readChapters.includes(chapter)) {
        newReadChapters = readChapters.filter(c => c !== chapter);
        setTodaysReadChapters(prev => {
            const updated = prev.filter(key => key !== chapterKey);
            localStorage.setItem('bibleDailyProgress', JSON.stringify({ date: getTodayDateString(), chapters: updated }));
            return updated;
        });
      } else {
        newReadChapters = [...readChapters, chapter].sort((a, b) => a - b);
        setTodaysReadChapters(prev => {
            const updated = [...new Set([...prev, chapterKey])];
            localStorage.setItem('bibleDailyProgress', JSON.stringify({ date: getTodayDateString(), chapters: updated }));
            return updated;
        });
      }
      const newSelections = { ...currentSelections };
      if (newReadChapters.length > 0) newSelections[activeBook.name] = newReadChapters;
      else delete newSelections[activeBook.name];
      try {
        localStorage.setItem('bibleReadChapters', JSON.stringify(newSelections));
      } catch (error) { console.error("Failed to save selections", error); }
      return newSelections;
    });
  };
  
  const handleBackToBooks = () => setView('books');
  
  const updateChaptersPerDay = (newValue) => {
      const value = Math.max(1, newValue);
      setChaptersPerDay(value);
      localStorage.setItem('chaptersPerDay', value);
  };

  const handleQuizAnswer = (option) => {
    setQuizAnswer(option);
  };

  const handleStartSpecificQuiz = (quizKey) => {
    if (quizData[quizKey]) {
        setCurrentQuiz(quizData[quizKey]);
        setQuizAnswer(null);
        setView('quiz');
    }
  };

  const handleShowQuizzesForBook = (bookName) => {
    const quizzesForBook = Object.entries(quizData).filter(([key]) => key.startsWith(`${bookName}-`));
    setQuizList(quizzesForBook);
    setQuizListTitle(`Питання по книзі: ${bookName}`);
    setView('quizList');
  };

  const handleShowTodaysQuizzes = () => {
    const todaysQuizzes = Object.entries(quizData).filter(([key]) => todaysReadChapters.includes(key));
    if (todaysQuizzes.length === 0) {
        alert("Ви ще не прочитали розділи, по яких є питання, за сьогодні.");
        return;
    }
    setQuizList(todaysQuizzes);
    setQuizListTitle('Питання по прочитаному');
    setView('quizList');
  };

  const handleShowRandomQuiz = () => {
    const allQuizKeys = Object.keys(quizData);
    if (allQuizKeys.length === 0) {
        alert("Наразі немає доступних питань.");
        return;
    }
    const randomKey = allQuizKeys[Math.floor(Math.random() * allQuizKeys.length)];
    handleStartSpecificQuiz(randomKey);
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
      <div className="w-full max-w-md flex justify-between items-center text-white mb-4">
        <button onClick={() => setView('dailyGoal')} className="h-5 relative w-48 text-left">
          <p className="text-sm text-gray-400">Сьогодні: {todaysReadChapters.length} / {chaptersPerDay} {todaysReadChapters.length >= chaptersPerDay && '✅'}</p>
        </button>
        <button onClick={() => setView('quizHome')} className="p-1">
            <svg className="w-6 h-6 text-gray-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
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
            const isRead = selections[activeBook.name]?.includes(chapter);
            return (<button key={chapter} className={`${baseGridItemClasses} border-transparent ${isRead ? 'bg-green-600' : 'bg-zinc-800'}`} onClick={() => handleChapterClick(chapter)}>{chapter}</button>);
          })}
        </div>
      </>
    );
  };

  const renderDailyGoalView = () => {
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
          <h1 className="text-xl">Статистика та ціль</h1>
          <div className="w-12"></div>
        </div>
        <div className="w-full max-w-md p-4 text-gray-300 bg-zinc-800 rounded-lg space-y-6">
            <div>
              <p className="text-center text-gray-400">Загальний прогрес: <span className="font-bold text-white">{stats.totalReadChapters} / {stats.totalChapters} ({stats.percentage.toFixed(1)}%)</span></p>
            </div>
            <div className="border-t border-zinc-700"></div>
            <label className="block mb-4 text-sm font-medium text-center">Змінити денну ціль:</label>
            <div className="flex items-center justify-center space-x-4">
                <button onClick={() => updateChaptersPerDay(Number(chaptersPerDay) - 1)} className="w-12 h-12 text-2xl font-bold text-white bg-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-600 transition-colors active:scale-95">-</button>
                <input type="number" value={chaptersPerDay} onChange={(e) => setChaptersPerDay(e.target.value)} onBlur={(e) => updateChaptersPerDay(Number(e.target.value))} className="bg-transparent text-white text-4xl font-bold w-24 text-center focus:outline-none p-0" />
                <button onClick={() => updateChaptersPerDay(Number(chaptersPerDay) + 1)} className="w-12 h-12 text-2xl font-bold text-white bg-zinc-700 rounded-full flex items-center justify-center hover:bg-zinc-600 transition-colors active:scale-95">+</button>
            </div>
            <div className="mt-6 text-center">
                <p className="text-gray-400">При такому темпі ви прочитаєте Біблію за:</p>
                <p className="text-lg font-bold text-white mt-1">{resultString.trim() || 'Введіть кількість'}</p>
            </div>
        </div>
      </>
    );
  };

  const renderQuizHomeView = () => (
    <>
        <div className="w-full max-w-md flex justify-between items-center text-white mb-4">
          <button className="bg-transparent border-none text-blue-500 text-lg font-bold cursor-pointer" onClick={handleBackToBooks}>&lt; Назад</button>
          <h1 className="text-xl">Питання по Біблії</h1>
          <div className="w-12"></div>
        </div>
        <div className="w-full max-w-md p-4 text-gray-300 bg-zinc-800 rounded-lg space-y-4">
            <button onClick={() => setView('quizBookSelection')} className="w-full text-left p-3 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors">По книгах</button>
            <button onClick={handleShowRandomQuiz} className="w-full text-left p-3 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors">Рандомні питання</button>
            <button onClick={handleShowTodaysQuizzes} className="w-full text-left p-3 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors">Із прочитаного сьогодні</button>
        </div>
    </>
  );

  const renderQuizBookSelectionView = () => {
    const booksWithQuizzes = [...new Set(Object.keys(quizData).map(key => key.split('-')[0]))];
    return (
        <>
            <div className="w-full max-w-md flex justify-between items-center text-white mb-4">
              <button className="bg-transparent border-none text-blue-500 text-lg font-bold cursor-pointer" onClick={() => setView('quizHome')}>&lt; Назад</button>
              <h1 className="text-xl">Вибір книги</h1>
              <div className="w-12"></div>
            </div>
            <div className="w-full max-w-md p-4 text-gray-300 bg-zinc-800 rounded-lg space-y-2">
              {booksWithQuizzes.length > 0 ? booksWithQuizzes.map(bookName => (
                  <button key={bookName} onClick={() => handleShowQuizzesForBook(bookName)} className="w-full text-left p-3 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors">
                      {bookName}
                  </button>
              )) : <p className="text-center text-gray-500">Немає доступних питань.</p>}
            </div>
        </>
    );
  };

  const renderQuizListView = () => (
    <>
      <div className="w-full max-w-md flex justify-between items-center text-white mb-4">
        <button className="bg-transparent border-none text-blue-500 text-lg font-bold cursor-pointer" onClick={() => setView('quizHome')}>&lt; Назад</button>
        <h1 className="text-xl">{quizListTitle}</h1>
        <div className="w-12"></div>
      </div>
      <div className="w-full max-w-md p-4 text-gray-300 bg-zinc-800 rounded-lg space-y-2">
        {quizList.length > 0 ? quizList.map(([key, value]) => (
            <button key={key} onClick={() => handleStartSpecificQuiz(key)} className="w-full text-left p-3 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors">
                {value.title}
            </button>
        )) : <p className="text-center text-gray-500">Немає доступних питань.</p>}
      </div>
    </>
  );
  
  const renderQuizView = () => {
    if (!currentQuiz) return null;
    const getButtonClass = (option) => {
        if (!quizAnswer) return 'bg-zinc-700/80 hover:bg-zinc-600/80';
        if (option === currentQuiz.correctAnswer) return 'bg-green-600';
        if (option === quizAnswer) return 'bg-red-600';
        return 'bg-zinc-700/50 opacity-70';
    };
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end z-50 p-4" onClick={() => setView('quizList')}>
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md mx-auto bg-zinc-900/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg slide-up-animation">
          <h2 className="text-lg font-semibold mb-4 text-center text-white">{currentQuiz.question}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {currentQuiz.options.map(option => (
              <button key={option} onClick={() => handleQuizAnswer(option)} disabled={!!quizAnswer} className={`p-4 rounded-lg text-center text-white transition-colors ${getButtonClass(option)}`}>
                {option}
              </button>
            ))}
          </div>
          {quizAnswer && (
            <button onClick={() => setView('quizList')} className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold transition-colors">
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
        {view === 'dailyGoal' && renderDailyGoalView()}
        {view === 'quizHome' && renderQuizHomeView()}
        {view === 'quizBookSelection' && renderQuizBookSelectionView()}
        {view === 'quizList' && renderQuizListView()}
      </div>
      {view === 'quiz' && renderQuizView()}
    </div>
  );
}