
import React, { useState } from 'react';
import { ThumbnailEditor } from './components/ThumbnailEditor';
import { ImageGenerator } from './components/ImageGenerator';
import { Chatbot } from './components/Chatbot';
import { ImageUploader } from './components/ImageUploader';
import { Header } from './components/Header';
import { GithubIcon } from './components/Icons';
import { HistoryPreview } from './components/HistoryPage';

type Page = 'upload' | 'editor' | 'generator' | 'chatbot';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('upload');
  const [initialImageData, setInitialImageData] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const handleHistoryUpdate = () => {
    setHistoryKey(prev => prev + 1);
  };

  const handleImageUpload = (imageDataUrl: string) => {
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
      setCurrentPage('upload');
  }
  
  const renderPage = () => {
    switch (currentPage) {
      case 'upload':
        return <ImageUploader onImageUpload={handleImageUpload} />;
      case 'editor':
        if (initialImageData) {
          return <ThumbnailEditor initialImageData={initialImageData} onStartOver={handleStartOver} onHistoryUpdate={handleHistoryUpdate} />;
        }
        // Fallback if state is inconsistent
        setCurrentPage('upload');
        return <ImageUploader onImageUpload={handleImageUpload} />;
      case 'generator':
        return <ImageGenerator onHistoryUpdate={handleHistoryUpdate} />;
      case 'chatbot':
        return <Chatbot />;
      default:
        return <ImageUploader onImageUpload={handleImageUpload} />;
    }
  };

  const showHistory = currentPage === 'editor' || currentPage === 'generator';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {renderPage()}
      </main>
      {showHistory && (
        <div className="w-full border-t-2 border-gray-800 pt-6 pb-2">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <HistoryPreview onReEdit={handleReEdit} historyKey={historyKey} />
            </div>
        </div>
      )}
       <footer className="w-full text-center p-4 text-gray-500 text-sm">
        Vibe coded with love by <a href="https://solakidis.notion.site/Solakidis-Panagiotis-b0cb7b286fae481191b0d0a3814afc9b" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-white transition-colors underline">Solakidis Panagiotis</a>
      </footer>
    </div>
  );
};

export default App;