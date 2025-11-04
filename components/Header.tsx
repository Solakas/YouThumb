import React from 'react';

type Page = 'upload' | 'editor' | 'generator' | 'chatbot';

interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => {
    
    const navItems = [
        { id: 'editor', label: 'Editor' },
        { id: 'generator', label: 'Generator' },
        { id: 'chatbot', label: 'Chatbot' }
    ];
    
    // Editor tab is also active on the upload page
    const isEditorActive = currentPage === 'editor' || currentPage === 'upload';

    return (
        <header className="bg-gray-800 shadow-md">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                       <h1 className="text-xl font-bold text-white">YouThumb</h1>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {navItems.map(item => (
                             <button 
                                key={item.id}
                                onClick={() => setCurrentPage(item.id as Page)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    (item.id === 'editor' ? isEditorActive : currentPage === item.id)
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                                // Can't go to editor without uploading first
                                disabled={item.id === 'editor' && currentPage === 'upload'}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>
        </header>
    );
}