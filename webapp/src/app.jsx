import React, { useState, useEffect, useMemo } from 'react';

import { booksData, quizData } from './data.js'; // Імпортуємо дані
const ActivityCalendar = ({ history, goal, startDate: startDateString }) => {
    if (!startDateString) {
        return <p className="text-center text-gray-500 text-xs">Історія читання порожня.</p>;
    }

    const endDate = new Date();
    const startDate = new Date(startDateString);
    
    const days = [];
    let currentDate = new Date(startDate);

    const dayOfWeek = startDate.getDay(); 
    for (let i = 0; i < dayOfWeek; i++) {
        days.push({ key: `pad-start-${i}`, type: 'pad' });
    }

    while (currentDate <= endDate) {
        days.push({ key: currentDate.toISOString().split('T')[0], type: 'day', date: new Date(currentDate) });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const weekdays = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    return (
        <div className="w-full">
            <div className="grid grid-cols-7 gap-1.5 mb-1">
                {weekdays.map(wd => <div key={wd} className="text-xs text-center text-gray-500">{wd}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
                {days.map(dayInfo => {
                    if (dayInfo.type === 'pad') {
                        return <div key={dayInfo.key} className="w-3.5 h-3.5 rounded-sm"></div>;
                    }
                    
                    const dateString = dayInfo.key;
                    const count = history[dateString] || 0;
                    let colorClass = 'bg-zinc-700';
                    if (count > 0) {
                        colorClass = count >= goal ? 'bg-green-500' : 'bg-red-500';
                    }
                    return (
                        <div 
                            key={dateString} 
                            className={`w-3.5 h-3.5 rounded-sm ${colorClass}`}
                            title={`${dateString}: ${count} розділів`}
                        ></div>
                    );
                })}
            </div>
        </div>
    );
};
export function App() {
  const [activeBook, setActiveBook] = useState(booksData[0]); 
  const [view, setView] = useState('books');
  const [selections, setSelections] = useState({});
  const [readingHistory, setReadingHistory] = useState({});
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

      const savedHistory = localStorage.getItem('bibleReadingHistory');
      if (savedHistory) setReadingHistory(JSON.parse(savedHistory));

    } catch (error) { console.error("Failed to parse from localStorage", error); }
    if (window.Telegram?.WebApp) window.Telegram.WebApp.ready();
  }, []);

  const handleBookClick = (book) => {
    setActiveBook(book);
    setView('chapters');
  };

  const handleChapterClick = (chapter) => {
    setSelections(currentSelections => {
      const readChapters = currentSelections[activeBook.name] || [];
      const isAlreadyRead = readChapters.includes(chapter);
      let newReadChapters;
      
      const today = getTodayDateString();
      setReadingHistory(currentHistory => {
          const todayCount = currentHistory[today] || 0;
          const newCount = isAlreadyRead ? todayCount - 1 : todayCount + 1;
          const newHistory = { ...currentHistory, [today]: Math.max(0, newCount) };
          localStorage.setItem('bibleReadingHistory', JSON.stringify(newHistory));
          return newHistory;
      });

      if (isAlreadyRead) {
        newReadChapters = readChapters.filter(c => c !== chapter);
      } else {
        newReadChapters = [...readChapters, chapter].sort((a, b) => a - b);
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

  const handleShowAllQuizzes = () => {
    const allQuizzes = Object.entries(quizData);
    if (allQuizzes.length === 0) {
        alert("Наразі немає доступних питань.");
        return;
    }
    setQuizList(allQuizzes);
    setQuizListTitle('Усі питання');
    setView('quizList');
  };

  const handleShowTodaysQuizzes = () => {
    const today = getTodayDateString();
    const todaysChaptersKeys = Object.keys(readingHistory[today] || {});
    const todaysQuizzes = Object.entries(quizData).filter(([key]) => todaysChaptersKeys.includes(key));

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

  const firstReadingDate = useMemo(() => {
    const dates = Object.keys(readingHistory);
    if (dates.length === 0) return null;
    return dates.sort()[0];
  }, [readingHistory]);

  const baseGridItemClasses = "aspect-square flex items-center justify-center rounded-lg border-2 bg-zinc-800 text-white cursor-pointer transition-all duration-200 hover:bg-zinc-700 active:scale-95";

  const BackButton = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-1 bg-zinc-800 rounded-full px-3 py-1.5 text-sm font-medium border border-zinc-700 hover:bg-zinc-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        <span>Назад</span>
    </button>
  );

  const renderBookView = () => (
    <>
      <div className="w-full flex justify-between items-center text-white mb-4">
        <button 
            onClick={() => setView('dailyGoal')} 
            className="flex items-center space-x-2 bg-zinc-800 rounded-full px-4 py-2 text-sm font-medium border border-zinc-700 hover:bg-zinc-700 transition-colors"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            <span>Статистика</span>
        </button>
        <button 
            onClick={() => setView('quizHome')} 
            className="flex items-center space-x-2 bg-zinc-800 rounded-full px-4 py-2 text-sm font-medium border border-zinc-700 hover:bg-zinc-700 transition-colors"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Питання</span>
        </button>
      </div>
      <div className="grid grid-cols-6 gap-2 w-full">
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
        <div className="w-full flex justify-between items-center text-white mb-4">
          <BackButton onClick={() => setView('books')} />
          <h1 className="text-xl">{activeBook.name}</h1>
          <div className="w-24"></div>
        </div>
        <div className="grid grid-cols-6 gap-2 w-full">
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
        <div className="w-full flex justify-between items-center text-white mb-4">
          <BackButton onClick={handleBackToBooks} />
          <h1 className="text-xl">Статистика та ціль</h1>
          <div className="w-24"></div>
        </div>
        <div className="w-full space-y-4">
            <div className="p-4 text-gray-300 bg-zinc-800 rounded-lg space-y-6">
                <div>
                  <p className="text-center text-gray-400">Сьогодні прочитано: <span className="font-bold text-white">{readingHistory[getTodayDateString()] || 0} / {chaptersPerDay}</span> {(readingHistory[getTodayDateString()] || 0) >= chaptersPerDay && '✅'}</p>
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
            <div className="p-4 text-gray-300 bg-zinc-800 rounded-lg">
                <h3 className="text-center text-sm font-medium mb-2">Активність читання</h3>
                <ActivityCalendar history={readingHistory} goal={chaptersPerDay} startDate={firstReadingDate} />
            </div>
        </div>
      </>
    );
  };

  const renderQuizHomeView = () => (
    <>
        <div className="w-full flex justify-between items-center text-white mb-4">
          <BackButton onClick={handleBackToBooks} />
          <h1 className="text-xl">Питання по Біблії</h1>
          <div className="w-24"></div>
        </div>
        <div className="w-full text-gray-300 space-y-4">
            <button onClick={handleShowTodaysQuizzes} className="w-full text-left p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">Із прочитаного сьогодні</button>
            <button onClick={handleShowRandomQuiz} className="w-full text-left p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">Рандомні питання</button>
            <div className="flex space-x-4">
                <button onClick={() => setView('quizBookSelection')} className="w-1/2 text-center p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">По книгах</button>
                <button onClick={handleShowAllQuizzes} className="w-1/2 text-center p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">По розділах</button>
            </div>
        </div>
    </>
  );

  const renderQuizBookSelectionView = () => {
    const booksWithQuizzes = [...new Set(Object.keys(quizData).map(key => key.split('-')[0]))];
    return (
        <>
            <div className="w-full flex justify-between items-center text-white mb-4">
              <BackButton onClick={() => setView('quizHome')} />
              <h1 className="text-xl">Вибір книги</h1>
              <div className="w-24"></div>
            </div>
            <div className="w-full p-4 text-gray-300 bg-zinc-800 rounded-lg space-y-2">
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
      <div className="w-full flex justify-between items-center text-white mb-4">
        <BackButton onClick={() => setView('quizHome')} />
        <h1 className="text-xl">{quizListTitle}</h1>
        <div className="w-24"></div>
      </div>
      <div className="w-full p-4 text-gray-300 bg-zinc-800 rounded-lg space-y-2">
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
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg,rgba(13, 119, 228, 1) 0%, rgba(79, 161, 233, 1) 11%, rgba(255, 255, 255, 1) 100%)'}}>
        <div className="pt-28">
            <div className="bg-zinc-900 rounded-t-[2.5rem] min-h-[calc(100vh-7rem)] p-4">
                <div className="w-full max-w-md mx-auto">
                    {view === 'books' && renderBookView()}
                    {view === 'chapters' && renderChapterView()}
                    {view === 'dailyGoal' && renderDailyGoalView()}
                    {view === 'quizHome' && renderQuizHomeView()}
                    {view === 'quizBookSelection' && renderQuizBookSelectionView()}
                    {view === 'quizList' && renderQuizListView()}
                </div>
                {view === 'quiz' && renderQuizView()}
            </div>
        </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { translateY(0); }
        }
        .slide-up-animation {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}