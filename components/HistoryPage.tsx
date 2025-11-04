import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { historyService } from '../services/historyService';
import { Thumbnail, Folder } from '../types';
import { MoreVerticalIcon } from './Icons';

interface HistoryPreviewProps {
  onReEdit: (imageDataUrl: string) => void;
  historyKey: number;
}

const ThumbnailCard: React.FC<{
    thumbnail: Thumbnail;
    folders: Folder[];
    onDelete: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onMove: (id: string, folderId: string | null) => void;
    onReEdit: (imageData: string) => void;
}> = ({ thumbnail, folders, onDelete, onRename, onMove, onReEdit }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // State for modals
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [newName, setNewName] = useState(thumbnail.name);


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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <div className="bg-gray-800 rounded-lg overflow-hidden group relative transition-transform transform hover:scale-105 w-64 flex-shrink-0">
                <button onClick={() => onReEdit(thumbnail.imageData)} className="w-full aspect-video bg-black">
                    <img src={thumbnail.imageData} alt={thumbnail.name} className="w-full h-full object-cover" loading="lazy" />
                </button>
                <div className="p-3">
                    <p className="font-semibold text-sm truncate">{thumbnail.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(thumbnail.createdAt).toLocaleString()}</p>
                </div>

                <div ref={dropdownRef} className="absolute top-2 right-2">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 bg-gray-900 bg-opacity-50 rounded-full hover:bg-opacity-75 focus:outline-none">
                        <MoreVerticalIcon className="h-5 w-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 py-1">
                            <button onClick={() => { onReEdit(thumbnail.imageData); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Re-Edit</button>
                            <button onClick={openRenameModal} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Rename</button>
                            <div className="relative group/submenu">
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Move to...</button>
                                <div className="absolute right-full -top-1 mt-0 w-48 bg-gray-700 rounded-md shadow-lg z-20 py-1 hidden group-hover/submenu:block">
                                    <button onClick={() => onMove(thumbnail.id, null)} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Uncategorized</button>
                                    {folders.map(f => (
                                        <button key={f.id} onClick={() => onMove(thumbnail.id, f.id)} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 truncate">{f.name}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t border-gray-600 my-1"></div>
                            <button onClick={openDeleteModal} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white">Delete</button>
                        </div>
                    )}
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
    
    const handleThumbnailMove = (id: string, folderId: string | null) => {
        const thumb = thumbnails.find(t => t.id === id);
        if (thumb) {
            historyService.updateThumbnail({ ...thumb, folderId });
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
                                folders={folders}
                                onDelete={handleThumbnailDelete}
                                onRename={handleThumbnailRename}
                                onMove={handleThumbnailMove}
                                onReEdit={onReEdit}
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
        </div>
    );
};