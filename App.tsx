import React, { useState } from 'react';
import { ThumbnailEditor } from './components/ThumbnailEditor';
import { ImageGenerator } from './components/ImageGenerator';
import { HomePage } from './components/HomePage';
import { Header } from './components/Header';
import { HistoryPreview } from './components/HistoryPage';

type Page = 'home' | 'editor' | 'generator';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [initialImageData, setInitialImageData] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const handleHistoryUpdate = () => {
    setHistoryKey(prev => prev + 1);
  };

  const handleImageReadyForEditor = (imageDataUrl: string) => {
    setInitialImageData(imageDataUrl);
    setCurrentPage('editor');
  };
  
  const handleReEdit = (imageDataUrl: string) => {
    setInitialImageData(imageDataUrl);
    setCurrentPage('editor');
    window.scrollTo(0, 0);
  }

  const handleStartOver = () => {
      setInitialImageData(null);
      setCurrentPage('home');
  }
  
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onImageReadyForEditor={handleImageReadyForEditor} />;
      case 'editor':
        if (initialImageData) {
          return <ThumbnailEditor initialImageData={initialImageData} onStartOver={handleStartOver} onHistoryUpdate={handleHistoryUpdate} />;
        }
        // Fallback if state is inconsistent
        setCurrentPage('home');
        return <HomePage onImageReadyForEditor={handleImageReadyForEditor} />;
      case 'generator':
        return <ImageGenerator onHistoryUpdate={handleHistoryUpdate} />;
      default:
        return <HomePage onImageReadyForEditor={handleImageReadyForEditor} />;
    }
  };

  const showHistory = currentPage === 'editor' || currentPage === 'generator';

  return (
    <div className="min-h-screen bg-yt-neutral-bg-950 text-yt-neutral-text flex flex-col">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-grow container mx-auto p-8 flex flex-col">
        {renderPage()}
      </main>
      {showHistory && (
        <div className="w-full border-t-thick border-yt-neutral-bg-800 py-8">
            <div className="container mx-auto px-6">
                <HistoryPreview onReEdit={handleReEdit} historyKey={historyKey} />
            </div>
        </div>
      )}
       <footer className="w-full text-center p-6 text-yt-neutral-text3 text-body-sm">
        Vibe coded with love by <a href="https://solakidis.notion.site/Solakidis-Panagiotis-b0cb7b286fae481191b0d0a3814afc9b" target="_blank" rel="noopener noreferrer" className="text-yt-primary-400 hover:text-yt-neutral-text transition-colors underline focus:outline-none focus:ring-2 focus:ring-yt-accent-focus rounded-sm">Solakidis Panagiotis</a>
      </footer>
    </div>
  );
};

export default App;
