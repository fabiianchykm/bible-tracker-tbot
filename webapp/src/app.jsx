import React, { useState, useEffect, useMemo } from 'react';

// Українські абревіатури та кількість розділів
const booksData = [
  { name: 'Бут', chapters: 50 }, { name: 'Вих', chapters: 40 }, { name: 'Лев', chapters: 27 },
  { name: 'Чис', chapters: 36 }, { name: 'Втор', chapters: 34 }, { name: 'ІсНав', chapters: 24 },
  { name: 'Суд', chapters: 21 }, { name: 'Рут', chapters: 4 }, { name: '1Сам', chapters: 31 },
  { name: '2Сам', chapters: 24 }, { name: '1Цар', chapters: 22 }, { name: '2Цар', chapters: 25 },
  { name: '1Хр', chapters: 29 }, { name: '2Хр', chapters: 36 }, { name: 'Езд', chapters: 10 },
  { name: 'Неєм', chapters: 13 }, { name: 'Ест', chapters: 10 }, { name: 'Йов', chapters: 42 },
  { name: 'Пс', chapters: 150 }, { name: 'Прип', chapters: 31 }, { name: 'Екл', chapters: 12 },
  { name: 'Пісн', chapters: 8 }, { name: 'Іс', chapters: 66 }, { name: 'Єр', chapters: 52 },
  { name: 'Плач', chapters: 5 }, { name: 'Єз', chapters: 48 }, { name: 'Дан', chapters: 12 },
  { name: 'Ос', chapters: 14 }, { name: 'Йоіл', chapters: 3 }, { name: 'Ам', chapters: 9 },
  { name: 'Овд', chapters: 1 }, { name: 'Йона', chapters: 4 }, { name: 'Мих', chapters: 7 },
  { name: 'Наум', chapters: 3 }, { name: 'Ав', chapters: 3 }, { name: 'Соф', chapters: 3 },
  { name: 'Аг', chapters: 2 }, { name: 'Зах', chapters: 14 }, { name: 'Мал', chapters: 4 },
  { name: 'Мт', chapters: 28 }, { name: 'Мр', chapters: 16 }, { name: 'Лк', chapters: 24 },
  { name: 'Ів', chapters: 21 }, { name: 'Дії', chapters: 28 }, { name: 'Рим', chapters: 16 },
  { name: '1Кор', chapters: 16 }, { name: '2Кор', chapters: 13 }, { name: 'Гал', chapters: 6 },
  { name: 'Еф', chapters: 6 }, { name: 'Флп', chapters: 4 }, { name: 'Кол', chapters: 4 },
  { name: '1Сол', chapters: 5 }, { name: '2Сол', chapters: 3 }, { name: '1Тим', chapters: 6 },
  { name: '2Тим', chapters: 4 }, { name: 'Тит', chapters: 3 }, { name: 'Флм', chapters: 1 },
  { name: 'Євр', chapters: 13 }, { name: 'Як', chapters: 5 }, { name: '1Пет', chapters: 5 },
  { name: '2Пет', chapters: 3 }, { name: '1Ів', chapters: 5 }, { name: '2Ів', chapters: 1 },
  { name: '3Ів', chapters: 1 }, { name: 'Юд', chapters: 1 }, { name: 'Об', chapters: 22 }
];

const DAILY_GOAL = 4;

// Повернено до звичайного оголошення функції
export function App() {
  const [activeBook, setActiveBook] = useState(booksData[0]); 
  const [view, setView] = useState('books');
  const [selections, setSelections] = useState({});
  const [dailyReads, setDailyReads] = useState(0);

  // Функція для отримання сьогоднішньої дати у форматі YYYY-MM-DD
  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Завантаження загального прогресу
    try {
      const savedSelections = localStorage.getItem('bibleReadChapters');
      if (savedSelections) {
        setSelections(JSON.parse(savedSelections));
      }
    } catch (error) {
      console.error("Failed to parse selections from localStorage", error);
    }
    
    // Завантаження щоденного прогресу
    try {
      const savedDailyProgress = localStorage.getItem('bibleDailyProgress');
      const today = getTodayDateString();
      if (savedDailyProgress) {
        const { date, count } = JSON.parse(savedDailyProgress);
        if (date === today) {
          setDailyReads(count);
        } else {
          // Якщо дата не сьогоднішня, скидаємо лічильник
          localStorage.setItem('bibleDailyProgress', JSON.stringify({ date: today, count: 0 }));
        }
      } else {
        localStorage.setItem('bibleDailyProgress', JSON.stringify({ date: today, count: 0 }));
      }
    } catch (error) {
      console.error("Failed to parse daily progress from localStorage", error);
    }

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const handleBookClick = (book) => {
    setActiveBook(book);
    setView('chapters');
  };

  const handleChapterClick = (chapter) => {
    setSelections(currentSelections => {
      const readChapters = currentSelections[activeBook.name] || [];
      let newReadChapters;
      let dailyChange = 0;

      if (readChapters.includes(chapter)) {
        newReadChapters = readChapters.filter(c => c !== chapter);
        dailyChange = -1; // Зменшуємо денний лічильник
      } else {
        newReadChapters = [...readChapters, chapter].sort((a, b) => a - b);
        dailyChange = 1; // Збільшуємо денний лічильник
      }
      
      // Оновлюємо щоденний прогрес
      setDailyReads(currentDailyReads => {
          const newDailyCount = Math.max(0, currentDailyReads + dailyChange);
          const today = getTodayDateString();
          localStorage.setItem('bibleDailyProgress', JSON.stringify({ date: today, count: newDailyCount }));
          return newDailyCount;
      });

      const newSelections = { ...currentSelections };
      if (newReadChapters.length > 0) {
        newSelections[activeBook.name] = newReadChapters;
      } else {
        delete newSelections[activeBook.name];
      }
      
      try {
        localStorage.setItem('bibleReadChapters', JSON.stringify(newSelections));
      } catch (error) {
        console.error("Failed to save selections to localStorage", error);
      }

      return newSelections;
    });
  };
  
  const handleBackToBooks = () => {
    setView('books');
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
        {/* Оновлений заголовок з денною статистикою */}
        <p className="text-sm text-gray-400">
          Сьогодні прочитано: {dailyReads} / {DAILY_GOAL} {dailyReads >= DAILY_GOAL && '✅'}
        </p>
        {/* Загальна статистика */}
        <div className="text-right">
          <p className="text-sm text-gray-400">
            Всього: {stats.totalReadChapters} ({stats.percentage.toFixed(1)}%)
          </p>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2 w-full max-w-md p-2">
        {booksData.map((book) => {
          const readChapters = selections[book.name] || [];
          const totalChapters = book.chapters;
          let borderColorClass = 'border-transparent';

          if (readChapters.length > 0) {
            if (readChapters.length === totalChapters) {
              borderColorClass = 'border-green-500'; // Завершено
            } else {
              borderColorClass = 'border-orange-500'; // У процесі
            }
          }

          return (
            <button
              key={book.name}
              className={`${baseGridItemClasses} ${borderColorClass}`}
              onClick={() => handleBookClick(book)}
            >
              {book.name}
            </button>
          );
        })}
      </div>
    </>
  );

  const renderChapterView = () => {
    const readChapters = selections[activeBook.name] || [];
    return (
      <>
        <div className="w-full max-w-md flex justify-between items-center text-white mb-4">
          <button className="bg-transparent border-none text-blue-500 text-lg font-bold cursor-pointer" onClick={handleBackToBooks}>&lt; Назад</button>
          <h1 className="text-xl">{activeBook.name}</h1>
          <div className="w-12"></div>
        </div>
        <div className="grid grid-cols-6 gap-2 w-full max-w-md p-2">
          {Array.from({ length: activeBook.chapters }, (_, i) => i + 1).map((chapter) => {
            const isRead = readChapters.includes(chapter);
            return (
              <button
                key={chapter}
                className={`${baseGridItemClasses} border-transparent ${isRead ? 'bg-green-600' : 'bg-zinc-800'}`}
                onClick={() => handleChapterClick(chapter)}
              >
                {chapter}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="bg-zinc-900 min-h-screen font-sans flex flex-col items-center p-4">
      {view === 'books' ? renderBookView() : renderChapterView()}
    </div>
  );
}