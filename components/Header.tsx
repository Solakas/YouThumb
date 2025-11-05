import React from 'react';

type Page = 'home' | 'editor' | 'generator';

interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => {
    
    const navItems = [
        { id: 'editor', label: 'Editor' },
        { id: 'generator', label: 'Generator' },
    ];
    
    // Editor tab is also active on the home page
    const isEditorActive = currentPage === 'editor' || currentPage === 'home';

    return (
        <header className="bg-yt-neutral-bg-900 shadow-yt1 flex-shrink-0">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                       <h1 className="text-h4 font-bold text-yt-neutral-text">YouThumb</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        {navItems.map(item => (
                             <button 
                                key={item.id}
                                onClick={() => setCurrentPage(item.id as Page)}
                                className={`px-4 py-1.5 rounded-lg text-body-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-yt-accent-focus ${
                                    (item.id === 'editor' ? isEditorActive : currentPage === item.id)
                                    ? 'bg-yt-primary-500 text-black' 
                                    : 'text-yt-neutral-text3 hover:bg-yt-neutral-bg-800 hover:text-yt-neutral-text'
                                }`}
                                // Can't go to editor without an image first
                                disabled={item.id === 'editor' && currentPage === 'home'}
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