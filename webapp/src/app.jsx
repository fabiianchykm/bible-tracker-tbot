// File: src/App.jsx
// Додано функціонал для позначення прочитаних розділів

import React, { useState, useEffect } from 'react';

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

export function App() {
  const [activeBook, setActiveBook] = useState(booksData[0]); 
  const [view, setView] = useState('books'); // 'books' або 'chapters'
  
  // Нова структура даних: { 'Бут': [1, 5, 10], 'Вих': [3], ... }
  const [selections, setSelections] = useState({});

  // Завантажуємо збережені дані при першому запуску
  useEffect(() => {
    try {
      const savedSelections = localStorage.getItem('bibleReadChapters');
      if (savedSelections) {
        setSelections(JSON.parse(savedSelections));
      }
    } catch (error) {
      console.error("Failed to parse selections from localStorage", error);
    }

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  // Обробник кліку на книгу
  const handleBookClick = (book) => {
    setActiveBook(book);
    setView('chapters');
  };

  // Обробник кліку на розділ (перемикач "прочитано")
  const handleChapterClick = (chapter) => {
    const readChapters = selections[activeBook.name] || [];
    let newReadChapters;

    if (readChapters.includes(chapter)) {
      // Якщо розділ вже прочитаний, знімаємо позначку
      newReadChapters = readChapters.filter(c => c !== chapter);
    } else {
      // Якщо не прочитаний, додаємо позначку
      newReadChapters = [...readChapters, chapter].sort((a, b) => a - b);
    }

    const newSelections = { ...selections };
    if (newReadChapters.length > 0) {
      newSelections[activeBook.name] = newReadChapters;
    } else {
      // Якщо в книзі не залишилось прочитаних розділів, видаляємо ключ
      delete newSelections[activeBook.name];
    }
    
    setSelections(newSelections);
    try {
      localStorage.setItem('bibleReadChapters', JSON.stringify(newSelections));
    } catch (error) {
      console.error("Failed to save selections to localStorage", error);
    }
  };
  
  // Повернення до вибору книг
  const handleBackToBooks = () => {
      setView('books');
  };

  // Рендеринг сітки з книгами
  const renderBookView = () => (
    <>
      <div className="header">
        <h1>Книги</h1>
        <div style={{width: '50px'}}></div>
      </div>
      <div className="gridContainer">
        {booksData.map((book) => {
          const isStarted = selections[book.name] && selections[book.name].length > 0;
          return (
            <button
              key={book.name}
              className={`gridItem ${isStarted ? 'started' : ''}`}
              onClick={() => handleBookClick(book)}
            >
              {book.name}
            </button>
          );
        })}
      </div>
    </>
  );

  // Рендеринг сітки з розділами
  const renderChapterView = () => {
    const readChapters = selections[activeBook.name] || [];
    return (
      <>
        <div className="header">
          <button className="backButton" onClick={handleBackToBooks}>&lt; Назад</button>
          <h1>{activeBook.name}</h1>
          <div style={{width: '50px'}}></div>
        </div>
        <div className="gridContainer">
          {Array.from({ length: activeBook.chapters }, (_, i) => i + 1).map((chapter) => {
            const isRead = readChapters.includes(chapter);
            return (
              <button
                key={chapter}
                className={`gridItem ${isRead ? 'read' : ''}`}
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
    <div>
      <style>{`
        body { background-color: #1c1c1e; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .appContainer { display: flex; flex-direction: column; align-items: center; padding: 1rem; }
        .header { width: 100%; max-width: 400px; display: flex; justify-content: space-between; align-items: center; color: white; margin-bottom: 1rem; }
        .header h1 { font-size: 1.2rem; margin: 0; }
        .goButton, .backButton { background: none; border: none; color: #007aff; font-size: 1.1rem; cursor: pointer; font-weight: bold; }
        .gridContainer { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; width: 100%; max-width: 400px; padding: 10px; box-sizing: border-box; }
        .gridItem { background-color: #3a3a3c; border: 2px solid transparent; border-radius: 8px; padding: 12px 5px; text-align: center; font-size: 16px; color: #fff; cursor: pointer; transition: background-color 0.2s, transform 0.1s, border-color 0.2s; aspect-ratio: 1 / 1; display: flex; justify-content: center; align-items: center; }
        .gridItem:hover { background-color: #5a5a5c; }
        .gridItem:active { transform: scale(0.95); }
        
        /* Стиль для книги, в якій є прочитані розділи */
        .gridItem.started {
          border-color: #34c759; /* Зелена рамка */
        }

        /* Стиль для прочитаного розділу */
        .gridItem.read {
          background-color: #34c759; /* Зелений фон */
          color: white;
        }
      `}</style>
      
      <div className="appContainer">
        {view === 'books' ? renderBookView() : renderChapterView()}
      </div>
    </div>
  );
}