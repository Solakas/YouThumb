import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { historyService } from '../services/historyService';
import { Thumbnail, Folder } from '../types';

interface HistoryPreviewProps {
  onReEdit: (imageDataUrl: string) => void;
  historyKey: number;
}

const ThumbnailCard: React.FC<{
    thumbnail: Thumbnail;
    onDelete: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onReEdit: (imageData: string) => void;
    onOpenMoveModal: (thumbnail: Thumbnail) => void;
}> = ({ thumbnail, onDelete, onRename, onReEdit, onOpenMoveModal }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

    // State for modals
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [newName, setNewName] = useState(thumbnail.name);

    useEffect(() => {
      if (isMenuOpen && menuButtonRef.current) {
        const rect = menuButtonRef.current.getBoundingClientRect();
        // Position menu below the button, aligned to the right edge. w-48 is 12rem (192px).
        setMenuPosition({ top: rect.bottom + 4, left: rect.right - 192 });
      }
    }, [isMenuOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                menuButtonRef.current && !menuButtonRef.current.contains(target) &&
                menuRef.current && !menuRef.current.contains(target)
            ) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);


    const openRenameModal = () => {
        setNewName(thumbnail.name);
        setIsRenameModalOpen(true);
        setIsMenuOpen(false);
    };

    const handleConfirmRename = () => {
        if (newName && newName.trim()) {
            onRename(thumbnail.id, newName.trim());
        }
        setIsRenameModalOpen(false);
    };

    const openDeleteModal = () => {
        setIsDeleteModalOpen(true);
        setIsMenuOpen(false);
    };

    const handleConfirmDelete = () => {
        onDelete(thumbnail.id);
        setIsDeleteModalOpen(false);
    };
    
    const MenuContent = (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: `${menuPosition?.top}px`,
                left: `${menuPosition?.left}px`,
                zIndex: 50,
            }}
            className="w-48 bg-yt-neutral-bg-800 rounded-lg shadow-yt2 py-2"
        >
            <button onClick={() => { onReEdit(thumbnail.imageData); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-body-sm text-yt-neutral-text2 hover:bg-yt-neutral-borderStrong focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Re-Edit</button>
            <button onClick={openRenameModal} className="w-full text-left px-4 py-2 text-body-sm text-yt-neutral-text2 hover:bg-yt-neutral-borderStrong focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Rename</button>
            <button onClick={() => { onOpenMoveModal(thumbnail); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-body-sm text-yt-neutral-text2 hover:bg-yt-neutral-borderStrong focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Move to...</button>
            <div className="border-t border-yt-neutral-border my-2"></div>
            <button onClick={openDeleteModal} className="w-full text-left px-4 py-2 text-body-sm text-yt-semantic-danger hover:bg-yt-semantic-danger hover:text-white focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Delete</button>
        </div>
    );

    return (
        <>
            <div className="bg-yt-neutral-bg-900 rounded-2xl overflow-hidden group relative w-64 flex-shrink-0">
                <button onClick={() => onReEdit(thumbnail.imageData)} className="w-full aspect-video bg-black overflow-hidden focus:outline-none focus:ring-2 focus:ring-yt-accent-focus rounded-t-2xl">
                    <img src={thumbnail.imageData} alt={thumbnail.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                </button>
                <div className="p-4">
                    <p className="font-bold text-body-sm truncate">{thumbnail.name}</p>
                    <p className="text-mono font-mono text-yt-neutral-text3 mt-2">{new Date(thumbnail.createdAt).toLocaleString()}</p>
                </div>

                <div className="absolute top-2 right-2">
                    <button ref={menuButtonRef} onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 w-10 h-10 flex items-center justify-center bg-yt-neutral-bg-950 bg-opacity-50 rounded-full hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                        <i className="fa-solid fa-ellipsis-vertical text-h4" aria-hidden="true"></i>
                    </button>
                    {isMenuOpen && menuPosition && ReactDOM.createPortal(MenuContent, document.body)}
                </div>
            </div>

            {isRenameModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                    <div className="bg-yt-neutral-bg-900 rounded-2xl p-6 w-full max-w-sm shadow-yt3">
                        <h3 className="text-h3 mb-4">Rename Thumbnail</h3>
                        <label htmlFor={`rename-${thumbnail.id}`} className="sr-only">New Name</label>
                        <input
                            id={`rename-${thumbnail.id}`}
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-yt-neutral-bg-800 rounded-lg px-3 h-control-md focus:outline-none focus:ring-2 focus:ring-yt-accent-focus text-body-sm"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsRenameModalOpen(false)} className="px-4 h-control-md bg-yt-neutral-borderStrong hover:bg-yt-neutral-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Cancel</button>
                            <button onClick={handleConfirmRename} disabled={!newName.trim()} className="px-4 h-control-md bg-yt-primary-500 text-black hover:bg-yt-primary-600 rounded-lg text-body-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Rename</button>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                    <div className="bg-yt-neutral-bg-900 rounded-2xl p-6 w-full max-w-sm shadow-yt3">
                        <h3 className="text-h3 mb-2">Delete Thumbnail</h3>
                        <p className="text-body text-yt-neutral-text2 mb-4">Are you sure you want to delete "{thumbnail.name}"? This action cannot be undone.</p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 h-control-md bg-yt-neutral-borderStrong hover:bg-yt-neutral-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Cancel</button>
                            <button onClick={handleConfirmDelete} className="px-4 h-control-md bg-yt-semantic-danger text-yt-neutral-text hover:bg-red-600 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export const HistoryPreview: React.FC<HistoryPreviewProps> = ({ onReEdit, historyKey }) => {
    const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const prevThumbnailsLength = useRef(thumbnails.length);
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    // State for the Move modal
    const [movingThumbnail, setMovingThumbnail] = useState<Thumbnail | null>(null);
    const [moveTargetFolderId, setMoveTargetFolderId] = useState<string>('uncategorized');
    const [isCreatingProjectInMove, setIsCreatingProjectInMove] = useState(false);
    const [newProjectNameInMove, setNewProjectNameInMove] = useState('');

    const refreshData = useCallback(() => {
        const { thumbnails, folders } = historyService.getData();
        setThumbnails(thumbnails);
        setFolders(folders);
    }, []);
    
    useEffect(() => {
        refreshData();
    }, [refreshData, historyKey]);

    useEffect(() => {
        if (thumbnails.length > prevThumbnailsLength.current && (selectedFolderId === null || selectedFolderId === 'all')) {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scroll({ left: 0, behavior: 'smooth' });
            }
        }
        prevThumbnailsLength.current = thumbnails.length;
    }, [thumbnails, selectedFolderId]);

    const handleThumbnailDelete = (id: string) => {
        historyService.deleteThumbnail(id);
        refreshData();
    };

    const handleThumbnailRename = (id: string, newName: string) => {
        const thumb = thumbnails.find(t => t.id === id);
        if (thumb) {
            historyService.updateThumbnail({ ...thumb, name: newName });
            refreshData();
        }
    };

    const handleCreateNewProject = () => {
        if (newProjectName.trim()) {
            const newFolder = historyService.addFolder(newProjectName.trim());
            refreshData();
            setSelectedFolderId(newFolder.id); // auto-select the new project
            setIsCreateProjectModalOpen(false);
            setNewProjectName('');
        }
    };
    
    // --- Move Modal Logic ---
    const handleOpenMoveModal = (thumbnail: Thumbnail) => {
        setMovingThumbnail(thumbnail);
        setMoveTargetFolderId(thumbnail.folderId ?? 'uncategorized');
        setIsCreatingProjectInMove(false);
        setNewProjectNameInMove('');
    };

    const handleCloseMoveModal = () => {
        setMovingThumbnail(null);
    };

    const handleConfirmMove = () => {
        if (!movingThumbnail) return;
        const finalFolderId = moveTargetFolderId === 'uncategorized' ? null : moveTargetFolderId;
        const thumb = thumbnails.find(t => t.id === movingThumbnail.id);
        if (thumb) {
            historyService.updateThumbnail({ ...thumb, folderId: finalFolderId });
            refreshData();
        }
        handleCloseMoveModal();
    };

    const handleCreateProjectInMove = () => {
        if (newProjectNameInMove.trim()) {
            const newFolder = historyService.addFolder(newProjectNameInMove.trim());
            refreshData(); // This updates the folder list in the modal
            setMoveTargetFolderId(newFolder.id);
            setIsCreatingProjectInMove(false);
            setNewProjectNameInMove('');
        }
    };
    // --- End Move Modal Logic ---

    const filteredThumbnails = useMemo(() => {
        const allSorted = thumbnails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (selectedFolderId === null || selectedFolderId === 'all') {
            return allSorted;
        }
        if (selectedFolderId === 'uncategorized') {
            return allSorted.filter(t => t.folderId === null);
        }
        return allSorted.filter(t => t.folderId === selectedFolderId);

    }, [thumbnails, selectedFolderId]);
    
    const sortedFolders = useMemo(() => folders.sort((a, b) => a.name.localeCompare(b.name)), [folders]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-4">
                <h2 className="text-h2 font-bold">History ({filteredThumbnails.length})</h2>
                <div className="flex items-center gap-2">
                    <label htmlFor="project-filter" className="text-body-sm text-yt-neutral-text3">Project:</label>
                    <div className="relative">
                        <select
                            id="project-filter"
                            value={selectedFolderId ?? 'all'}
                            onChange={(e) => setSelectedFolderId(e.target.value === 'all' ? null : e.target.value)}
                            className="bg-yt-neutral-bg-800 border-thin border-yt-neutral-border rounded-lg pl-3 pr-8 h-control-md text-body-sm focus:outline-none focus:ring-2 focus:ring-yt-accent-focus appearance-none"
                        >
                            <option value="all">All</option>
                            <option value="uncategorized">Uncategorized</option>
                            {sortedFolders.map(folder => (
                                <option key={folder.id} value={folder.id}>{folder.name}</option>
                            ))}
                        </select>
                        <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 transform pointer-events-none text-yt-neutral-text3 text-xs"></i>
                    </div>
                    <button
                        onClick={() => setIsCreateProjectModalOpen(true)}
                        className="px-4 h-control-md bg-yt-primary-500 text-black hover:bg-yt-primary-600 rounded-lg text-body-sm font-bold focus:outline-none focus:ring-2 focus:ring-yt-accent-focus"
                    >
                        New Project
                    </button>
                </div>
            </div>

            {thumbnails.length > 0 ? (
                <div ref={scrollContainerRef} className="flex-grow overflow-x-auto overflow-y-hidden -m-2 p-2">
                    <div className="flex items-start gap-4 pb-2">
                        {filteredThumbnails.map(thumb => (
                            <ThumbnailCard 
                                key={thumb.id} 
                                thumbnail={thumb} 
                                onDelete={handleThumbnailDelete}
                                onRename={handleThumbnailRename}
                                onReEdit={onReEdit}
                                onOpenMoveModal={handleOpenMoveModal}
                            />
                        ))}
                         {filteredThumbnails.length === 0 && (
                            <div className="w-full text-center py-10 text-yt-neutral-text3">
                                No thumbnails in this project.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center bg-yt-neutral-bg-900 rounded-2xl min-h-[200px]">
                    <div className="text-center text-yt-neutral-text3">
                        <p className="text-body-lg">No saved thumbnails yet.</p>
                        <p>Save your work from the editor or generator to see it here.</p>
                    </div>
                </div>
            )}
            {isCreateProjectModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                    <div className="bg-yt-neutral-bg-900 rounded-2xl p-6 w-full max-w-sm shadow-yt3">
                        <h3 className="text-h3 mb-4">Create New Project</h3>
                        <label htmlFor="new-project-name" className="sr-only">Project Name</label>
                        <input
                            id="new-project-name"
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="w-full bg-yt-neutral-bg-800 rounded-lg px-3 h-control-md focus:outline-none focus:ring-2 focus:ring-yt-accent-focus text-body-sm"
                            placeholder="Enter project name..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsCreateProjectModalOpen(false)} className="px-4 h-control-md bg-yt-neutral-borderStrong hover:bg-yt-neutral-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Cancel</button>
                            <button onClick={handleCreateNewProject} disabled={!newProjectName.trim()} className="px-4 h-control-md bg-yt-primary-500 text-black hover:bg-yt-primary-600 rounded-lg text-body-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Create</button>
                        </div>
                    </div>
                </div>
            )}
            {movingThumbnail && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                    <div className="bg-yt-neutral-bg-900 rounded-2xl p-6 w-full max-w-sm space-y-4 flex flex-col shadow-yt3">
                        <h3 className="text-h3">Move Thumbnail</h3>
                        <p className="text-body-sm text-yt-neutral-text3 -mt-2">Moving: <span className="font-medium text-yt-neutral-text2 truncate">{movingThumbnail.name}</span></p>

                        <div>
                            <label className="block text-body-sm font-bold text-yt-neutral-text mb-1">Destination Project</label>
                            <div className="bg-yt-neutral-bg-950 rounded-lg p-2 h-48 overflow-y-auto border-thin border-yt-neutral-border space-y-1">
                                <button
                                    onClick={() => { setMoveTargetFolderId('uncategorized'); setIsCreatingProjectInMove(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-body-sm flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-yt-accent-focus ${
                                        moveTargetFolderId === 'uncategorized' && !isCreatingProjectInMove ? 'bg-yt-primary-500 text-black font-bold' : 'hover:bg-yt-neutral-bg-800'
                                    }`}
                                >
                                    <i className="fa-solid fa-folder text-body" aria-hidden="true"></i>
                                    Uncategorized
                                </button>
                                {sortedFolders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => { setMoveTargetFolderId(folder.id); setIsCreatingProjectInMove(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-body-sm flex items-center gap-2 transition-colors truncate focus:outline-none focus:ring-2 focus:ring-yt-accent-focus ${
                                            moveTargetFolderId === folder.id && !isCreatingProjectInMove ? 'bg-yt-primary-500 text-black font-bold' : 'hover:bg-yt-neutral-bg-800'
                                        }`}
                                    >
                                        <i className="fa-solid fa-folder text-body" aria-hidden="true"></i>
                                        {folder.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!isCreatingProjectInMove ? (
                            <button
                                onClick={() => { setIsCreatingProjectInMove(true); setMoveTargetFolderId('new'); }}
                                className="w-full flex items-center justify-center gap-2 px-3 h-control-md bg-yt-neutral-bg-800 hover:bg-yt-neutral-borderStrong rounded-lg text-body-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yt-accent-focus"
                            >
                                <i className="fa-solid fa-folder-plus text-body" aria-hidden="true"></i>
                                New Project
                            </button>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); handleCreateProjectInMove(); }} className="space-y-2">
                                <input
                                    type="text"
                                    value={newProjectNameInMove}
                                    onChange={(e) => setNewProjectNameInMove(e.target.value)}
                                    className="w-full bg-yt-neutral-bg-800 rounded-lg px-3 h-control-md focus:outline-none focus:ring-2 focus:ring-yt-accent-focus text-body-sm"
                                    placeholder="Enter new project name..."
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => { setIsCreatingProjectInMove(false); setMoveTargetFolderId(movingThumbnail.folderId ?? 'uncategorized'); }} className="px-3 py-1 bg-yt-neutral-borderStrong hover:bg-yt-neutral-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Cancel</button>
                                    <button type="submit" disabled={!newProjectNameInMove.trim()} className="px-3 py-1 bg-yt-primary-500 text-black hover:bg-yt-primary-600 rounded-lg text-xs disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Create</button>
                                </div>
                            </form>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={handleCloseMoveModal} className="px-4 h-control-md bg-yt-neutral-borderStrong hover:bg-yt-neutral-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Cancel</button>
                            <button 
                                onClick={handleConfirmMove}
                                disabled={movingThumbnail.folderId === (moveTargetFolderId === 'uncategorized' ? null : moveTargetFolderId)}
                                className="px-4 h-control-md bg-yt-primary-500 text-black hover:bg-yt-primary-600 rounded-lg text-body-sm disabled:opacity-50 flex items-center justify-center w-24 focus:outline-none focus:ring-2 focus:ring-yt-accent-focus"
                            >
                                Move
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};