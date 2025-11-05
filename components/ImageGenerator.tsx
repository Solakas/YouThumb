import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { historyService } from '../services/historyService';
import { PromptInput } from './PromptInput';
import { Spinner } from './Spinner';
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
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);


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
    setIsCreatingNewProject(false);
    setIsSaveModalOpen(true);
  };

  const handleCreateNewProject = () => {
    if (!newProjectName.trim()) return;
    try {
        const newFolder = historyService.addFolder(newProjectName.trim());
        const { folders } = historyService.getData();
        setFolders(folders.sort((a,b) => a.name.localeCompare(b.name)));
        setSelectedFolderId(newFolder.id);
        setNewProjectName('');
        setIsCreatingNewProject(false);
    } catch (error) {
        setError(error instanceof Error ? error.message : "Error creating project.");
    }
  };

  const handleConfirmSave = async () => {
    if (!generatedImage || !saveName.trim() || isSaving) return;
    
    setIsSaving(true);
    const finalFolderId = selectedFolderId === 'uncategorized' ? null : selectedFolderId;

    await historyService.addThumbnail(generatedImage, saveName.trim(), finalFolderId);
    setSaveMessage(`'${saveName.trim()}' saved to history!`);
    onHistoryUpdate();
    
    setIsSaveModalOpen(false);
    setSaveName('');
    setIsSaving(false);

    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="flex-grow flex flex-col items-center gap-8">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-h1 font-extrabold mb-4">Thumbnail Generator</h1>
        <p className="text-body-lg text-yt-neutral-text3 mb-8">Describe the thumbnail you want to create. Be as descriptive as possible!</p>
      </div>
      <div className="w-full max-w-4xl">
        <PromptInput 
            // Fix: Wrap the handler in a lambda to extract the prompt from the data object, resolving the type mismatch.
            onSend={({ prompt }) => handleGenerate(prompt)} 
            isLoading={isLoading}
            suggestions={GENERATE_PROMPT_SUGGESTIONS}
            placeholder="e.g., A majestic lion wearing a crown, cinematic lighting"
        />
      </div>

      <div className="w-full max-w-4xl flex-grow aspect-w-16 aspect-h-9 bg-yt-neutral-bg-900 rounded-2xl flex items-center justify-center p-4">
        {isLoading && <Spinner className="w-16 h-16" />}
        {error && <p className="text-yt-semantic-danger text-center">{error}</p>}
        {generatedImage && (
            <img src={generatedImage} alt="Generated Thumbnail" className="object-contain max-w-full max-h-full rounded-lg" />
        )}
        {!isLoading && !error && !generatedImage && (
            <div className="text-center text-yt-neutral-text3">
                <p className="text-body-lg">Your generated image will appear here.</p>
                <p>All images are generated in 16:9 aspect ratio.</p>
            </div>
        )}
      </div>

      {generatedImage && (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-4">
                <button onClick={openSaveModal} className="px-6 h-control-lg bg-yt-primary-500 text-black hover:bg-yt-primary-600 rounded-lg transition-colors font-bold motion-safe:hover:shadow-glowPrimary focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                    Save to History
                </button>
                <button onClick={handleDownload} className="flex items-center gap-2 px-6 h-control-lg bg-yt-semantic-success text-yt-neutral-text hover:bg-green-600 rounded-lg transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                    <i className="fa-solid fa-download text-h4" aria-hidden="true"></i> Download Image
                </button>
            </div>
            <div className="h-5">
                {saveMessage && <p className="text-yt-semantic-success text-body-sm">{saveMessage}</p>}
            </div>
          </div>
      )}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
            <div className="bg-yt-neutral-bg-900 rounded-2xl p-6 w-full max-w-sm space-y-4 flex flex-col shadow-yt3">
            <h3 className="text-h3">Save Thumbnail</h3>
            
            <div>
              <label htmlFor="save-name-generator" className="block text-body-sm font-bold text-yt-neutral-text mb-1">Name</label>
              <input
                id="save-name-generator"
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full bg-yt-neutral-bg-800 rounded-lg px-3 h-control-md focus:outline-none focus:ring-2 focus:ring-yt-accent-focus text-body-sm"
                placeholder="Enter a name..."
              />
            </div>

            <div>
              <label className="block text-body-sm font-bold text-yt-neutral-text mb-1">Project</label>
              <div className="bg-yt-neutral-bg-950 rounded-lg p-2 h-48 overflow-y-auto border-thin border-yt-neutral-border space-y-1">
                <button
                  onClick={() => { setSelectedFolderId('uncategorized'); setIsCreatingNewProject(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-body-sm flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-yt-accent-focus ${
                    selectedFolderId === 'uncategorized' && !isCreatingNewProject ? 'bg-yt-primary-500 text-black font-bold' : 'hover:bg-yt-neutral-bg-800'
                  }`}
                >
                  <i className="fa-solid fa-folder text-body" aria-hidden="true"></i>
                  Uncategorized
                </button>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => { setSelectedFolderId(folder.id); setIsCreatingNewProject(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-body-sm flex items-center gap-2 transition-colors truncate focus:outline-none focus:ring-2 focus:ring-yt-accent-focus ${
                      selectedFolderId === folder.id && !isCreatingNewProject ? 'bg-yt-primary-500 text-black font-bold' : 'hover:bg-yt-neutral-bg-800'
                    }`}
                  >
                    <i className="fa-solid fa-folder text-body" aria-hidden="true"></i>
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>
            
            {!isCreatingNewProject ? (
              <button
                  onClick={() => { setIsCreatingNewProject(true); setSelectedFolderId('new'); }}
                  className="w-full flex items-center justify-center gap-2 px-3 h-control-md bg-yt-neutral-bg-800 hover:bg-yt-neutral-borderStrong rounded-lg text-body-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yt-accent-focus"
              >
                  <i className="fa-solid fa-folder-plus text-body" aria-hidden="true"></i>
                  New Project
              </button>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleCreateNewProject(); }} className="space-y-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-yt-neutral-bg-800 rounded-lg px-3 h-control-md focus:outline-none focus:ring-2 focus:ring-yt-accent-focus text-body-sm"
                    placeholder="Enter new project name..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setIsCreatingNewProject(false); setSelectedFolderId('uncategorized'); }} className="px-3 py-1 bg-yt-neutral-borderStrong hover:bg-yt-neutral-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Cancel</button>
                      <button type="submit" disabled={!newProjectName.trim()} className="px-3 py-1 bg-yt-primary-500 text-black hover:bg-yt-primary-600 rounded-lg text-xs disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Create</button>
                  </div>
              </form>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsSaveModalOpen(false)} className="px-4 h-control-md bg-yt-neutral-borderStrong hover:bg-yt-neutral-border rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">Cancel</button>
              <button 
                onClick={handleConfirmSave} 
                disabled={!saveName.trim() || isSaving} 
                className="px-4 h-control-md bg-yt-primary-500 text-black hover:bg-yt-primary-600 rounded-lg text-body-sm disabled:opacity-50 flex items-center justify-center w-24 focus:outline-none focus:ring-2 focus:ring-yt-accent-focus"
              >
                {isSaving ? <Spinner className="w-icon-sm h-icon-sm" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};