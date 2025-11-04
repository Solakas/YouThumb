import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { historyService } from '../services/historyService';
import { Thumbnail, Folder } from '../types';
import { MoreVerticalIcon, FolderIcon, FolderPlusIcon } from './Icons';

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
            className="w-48 bg-gray-700 rounded-md shadow-lg py-1"
        >
            <button onClick={() => { onReEdit(thumbnail.imageData); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Re-Edit</button>
            <button onClick={openRenameModal} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Rename</button>
            <button onClick={() => { onOpenMoveModal(thumbnail); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Move to...</button>
            <div className="border-t border-gray-600 my-1"></div>
            <button onClick={openDeleteModal} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white">Delete</button>
        </div>
    );

    return (
        <>
            <div className="bg-gray-800 rounded-lg overflow-hidden group relative w-64 flex-shrink-0">
                <button onClick={() => onReEdit(thumbnail.imageData)} className="w-full aspect-video bg-black overflow-hidden">
                    <img src={thumbnail.imageData} alt={thumbnail.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                </button>
                <div className="p-3">
                    <p className="font-semibold text-sm truncate">{thumbnail.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(thumbnail.createdAt).toLocaleString()}</p>
                </div>

                <div className="absolute top-2 right-2">
                    <button ref={menuButtonRef} onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 bg-gray-900 bg-opacity-50 rounded-full hover:bg-opacity-75 focus:outline-none">
                        <MoreVerticalIcon className="h-5 w-5" />
                    </button>
                    {isMenuOpen && menuPosition && ReactDOM.createPortal(MenuContent, document.body)}
                </div>
            </div>

            {isRenameModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-4">Rename Thumbnail</h3>
                        <label htmlFor={`rename-${thumbnail.id}`} className="sr-only">New Name</label>
                        <input
                            id={`rename-${thumbnail.id}`}
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsRenameModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm">Cancel</button>
                            <button onClick={handleConfirmRename} disabled={!newName.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm disabled:opacity-50">Rename</button>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-2">Delete Thumbnail</h3>
                        <p className="text-gray-300 mb-4">Are you sure you want to delete "{thumbnail.name}"? This action cannot be undone.</p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm">Cancel</button>
                            <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm">Delete</button>
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
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold">History ({filteredThumbnails.length})</h2>
                <div className="flex items-center gap-2">
                    <label htmlFor="project-filter" className="text-sm text-gray-400">Project:</label>
                    <select
                        id="project-filter"
                        value={selectedFolderId ?? 'all'}
                        onChange={(e) => setSelectedFolderId(e.target.value === 'all' ? null : e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All</option>
                        <option value="uncategorized">Uncategorized</option>
                        {sortedFolders.map(folder => (
                            <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setIsCreateProjectModalOpen(true)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold"
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
                            <div className="w-full text-center py-10 text-gray-500">
                                No thumbnails in this project.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center bg-gray-800 rounded-lg min-h-[200px]">
                    <div className="text-center text-gray-500">
                        <p className="text-lg">No saved thumbnails yet.</p>
                        <p>Save your work from the editor or generator to see it here.</p>
                    </div>
                </div>
            )}
            {isCreateProjectModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
                        <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
                        <label htmlFor="new-project-name" className="sr-only">Project Name</label>
                        <input
                            id="new-project-name"
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter project name..."
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setIsCreateProjectModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm">Cancel</button>
                            <button onClick={handleCreateNewProject} disabled={!newProjectName.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm disabled:opacity-50">Create</button>
                        </div>
                    </div>
                </div>
            )}
            {movingThumbnail && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-4 flex flex-col">
                        <h3 className="text-lg font-semibold">Move Thumbnail</h3>
                        <p className="text-sm text-gray-400 -mt-2">Moving: <span className="font-medium text-gray-200 truncate">{movingThumbnail.name}</span></p>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Destination Project</label>
                            <div className="bg-gray-900 rounded-md p-2 h-48 overflow-y-auto border border-gray-700 space-y-1">
                                <button
                                    onClick={() => { setMoveTargetFolderId('uncategorized'); setIsCreatingProjectInMove(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                                        moveTargetFolderId === 'uncategorized' && !isCreatingProjectInMove ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
                                    }`}
                                >
                                    <FolderIcon className="h-4 w-4" />
                                    Uncategorized
                                </button>
                                {sortedFolders.map(folder => (
                                    <button
                                        key={folder.id}
                                        onClick={() => { setMoveTargetFolderId(folder.id); setIsCreatingProjectInMove(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors truncate ${
                                            moveTargetFolderId === folder.id && !isCreatingProjectInMove ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
                                        }`}
                                    >
                                        <FolderIcon className="h-4 w-4" />
                                        {folder.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!isCreatingProjectInMove ? (
                            <button
                                onClick={() => { setIsCreatingProjectInMove(true); setMoveTargetFolderId('new'); }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
                            >
                                <FolderPlusIcon className="h-4 w-4" />
                                New Project
                            </button>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); handleCreateProjectInMove(); }} className="space-y-2">
                                <input
                                    type="text"
                                    value={newProjectNameInMove}
                                    onChange={(e) => setNewProjectNameInMove(e.target.value)}
                                    className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Enter new project name..."
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => { setIsCreatingProjectInMove(false); setMoveTargetFolderId(movingThumbnail.folderId ?? 'uncategorized'); }} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-xs">Cancel</button>
                                    <button type="submit" disabled={!newProjectNameInMove.trim()} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-xs disabled:opacity-50">Create</button>
                                </div>
                            </form>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={handleCloseMoveModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm">Cancel</button>
                            <button 
                                onClick={handleConfirmMove}
                                disabled={movingThumbnail.folderId === (moveTargetFolderId === 'uncategorized' ? null : moveTargetFolderId)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm disabled:opacity-50 flex items-center justify-center w-24"
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