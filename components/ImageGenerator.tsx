import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { historyService } from '../services/historyService';
import { PromptInput } from './PromptInput';
import { Spinner } from './Spinner';
import { DownloadIcon } from './Icons';
import { GENERATE_PROMPT_SUGGESTIONS } from '../constants';
import { Folder } from '../types';

interface ImageGeneratorProps {
  onHistoryUpdate: () => void;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onHistoryUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  // State for the save modal
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('uncategorized');
  const [newProjectName, setNewProjectName] = useState('');


  const handleGenerate = async (p: string) => {
    if (!p || isLoading) return;
    setPrompt(p);
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imageDataUrl = await geminiService.generateImage(p);
      setGeneratedImage(imageDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-thumbnail-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openSaveModal = () => {
    if (!generatedImage) return;
    const defaultName = prompt.substring(0, 50) || `generated-${Date.now()}`;
    setSaveName(defaultName);
    
    const { folders } = historyService.getData();
    setFolders(folders.sort((a,b) => a.name.localeCompare(b.name)));
    setSelectedFolderId('uncategorized');
    setNewProjectName('');
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!generatedImage || !saveName.trim()) return;
    if (selectedFolderId === 'new' && !newProjectName.trim()) return;
    
    setIsSaving(true);
    let finalFolderId: string | null = null;
    if (selectedFolderId === 'new') {
        const newFolder = historyService.addFolder(newProjectName.trim());
        finalFolderId = newFolder.id;
    } else if (selectedFolderId !== 'uncategorized') {
        finalFolderId = selectedFolderId;
    }

    await historyService.addThumbnail(generatedImage, saveName.trim(), finalFolderId);
    setSaveMessage(`'${saveName.trim()}' saved to history!`);
    onHistoryUpdate();
    
    setIsSaveModalOpen(false);
    setSaveName('');
    setIsSaving(false);

    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="flex-grow flex flex-col items-center gap-6">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Thumbnail Generator</h1>
        <p className="text-gray-400">Describe the thumbnail you want to create. Be as descriptive as possible!</p>
      </div>
      <div className="w-full max-w-4xl">
        <PromptInput 
            onSend={handleGenerate} 
            isLoading={isLoading}
            suggestions={GENERATE_PROMPT_SUGGESTIONS}
            placeholder="e.g., A majestic lion wearing a crown, cinematic lighting"
        />
      </div>

      <div className="w-full max-w-4xl flex-grow aspect-w-16 aspect-h-9 bg-gray-800 rounded-lg flex items-center justify-center p-4">
        {isLoading && <Spinner className="w-16 h-16" />}
        {error && <p className="text-red-400 text-center">{error}</p>}
        {generatedImage && (
            <img src={generatedImage} alt="Generated Thumbnail" className="object-contain max-w-full max-h-full rounded-md" />
        )}
        {!isLoading && !error && !generatedImage && (
            <div className="text-center text-gray-500">
                <p className="text-lg">Your generated image will appear here.</p>
                <p>All images are generated in 16:9 aspect ratio.</p>
            </div>
        )}
      </div>

      {generatedImage && (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-4">
                <button onClick={openSaveModal} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors font-semibold">
                    Save to History
                </button>
                <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-md transition-colors font-semibold">
                    <DownloadIcon className="h-5 w-5" /> Download Image
                </button>
            </div>
            <div className="h-5">
                {saveMessage && <p className="text-green-400 text-sm">{saveMessage}</p>}
            </div>
          </div>
      )}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">Save Thumbnail</h3>
            
            <div>
              <label htmlFor="save-name-generator" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                id="save-name-generator"
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a name..."
              />
            </div>

            <div>
              <label htmlFor="project-select-generator" className="block text-sm font-medium text-gray-300 mb-1">Project</label>
              <select
                id="project-select-generator"
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="uncategorized">Uncategorized</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
                <option value="new">-- Create New Project --</option>
              </select>
            </div>

            {selectedFolderId === 'new' && (
              <div>
                <label htmlFor="new-project-name-generator" className="block text-sm font-medium text-gray-300 mb-1">New Project Name</label>
                <input
                    id="new-project-name-generator"
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter project name..."
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm">Cancel</button>
              <button 
                onClick={handleConfirmSave} 
                disabled={!saveName.trim() || isSaving || (selectedFolderId === 'new' && !newProjectName.trim())} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm disabled:opacity-50 flex items-center justify-center w-24"
              >
                {isSaving ? <Spinner className="w-4 h-4" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};