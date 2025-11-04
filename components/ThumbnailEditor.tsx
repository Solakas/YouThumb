import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useImageHistory } from '../hooks/useImageHistory';
import { geminiService } from '../services/geminiService';
import { historyService } from '../services/historyService';
import { ChatMessage, Folder } from '../types';
import { PromptInput } from './PromptInput';
import { Spinner } from './Spinner';
import { DownloadIcon, RedoIcon, UndoIcon, ArrowLeftIcon, CropIcon, PenToolIcon, MagicWandIcon, XCircleIcon, SaveIcon, OutlineIcon, TemplateIcon, FolderIcon, FolderPlusIcon } from './Icons';
import { EDIT_PROMPT_SUGGESTIONS, ASK_PROMPT_SUGGESTIONS, TEMPLATES } from '../constants';
import type { Chat } from '@google/genai';

type SelectionMode = 'rectangle' | 'freehand' | 'chroma' | null;
type Point = { x: number; y: number };

interface ThumbnailEditorProps {
  initialImageData: string;
  onStartOver: () => void;
  onHistoryUpdate: () => void;
}

const loadingTexts = [
    'Analyzing pixels...',
    'Consulting the AI...',
    'Applying creative filters...',
    'Generating awesomeness...',
    'Adding a touch of magic...',
    'Finalizing the masterpiece...'
];

const ProcessingOverlay: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
    const [text, setText] = useState(loadingTexts[0]);
    
    const tetrominoes = useMemo(() => {
      if (!isLoading) return [];
      const types = ['i', 'o', 't', 'l', 'j', 's', 'z'];
      return Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        type: types[i % types.length],
        style: {
          left: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 5 + 5}s`,
          animationDelay: `${Math.random() * 10}s`,
          transform: `scale(${Math.random() * 0.5 + 0.8})`
        }
      }));
    }, [isLoading]);

    useEffect(() => {
        if (isLoading) {
            setText(loadingTexts[Math.floor(Math.random() * loadingTexts.length)]);
            const interval = setInterval(() => {
                setText(prevText => {
                    const currentIndex = loadingTexts.indexOf(prevText);
                    const nextIndex = (currentIndex + 1) % loadingTexts.length;
                    return loadingTexts[nextIndex];
                });
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [isLoading]);

    if (!isLoading) {
        return null;
    }

    return (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex flex-col items-center justify-center z-20 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                {tetrominoes.map(t => (
                    <div
                        key={t.id}
                        className={`tetromino tetromino-${t.type}`}
                        style={t.style as React.CSSProperties}
                    />
                ))}
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center">
                <Spinner className="w-12 h-12 text-blue-400 mb-4" />
                <p className="text-lg font-semibold text-white animate-pulse">{text}</p>
            </div>
        </div>
    );
};

const SelectionToolbar: React.FC<{
    selectionMode: SelectionMode;
    setSelectionMode: (mode: SelectionMode) => void;
    clearSelection: () => void;
    tolerance: number;
    setTolerance: (t: number) => void;
    hasSelection: boolean;
    onOpenOutlineModal: () => void;
}> = ({ selectionMode, setSelectionMode, clearSelection, tolerance, setTolerance, hasSelection, onOpenOutlineModal }) => {
    const tools: { mode: SelectionMode; icon: React.FC<any>; name: string }[] = [
        { mode: 'rectangle', icon: CropIcon, name: 'Area Select' },
        { mode: 'freehand', icon: PenToolIcon, name: 'Free Area select' },
        { mode: 'chroma', icon: MagicWandIcon, name: 'Smart Area select' },
    ];
    return (
        <div className="p-4 bg-gray-800 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wide">Selection Tools</h3>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {tools.map(tool => (
                       <div key={tool.mode} className="relative group flex items-center">
                           <button
                               onClick={() => setSelectionMode(tool.mode)}
                               className={`p-2 rounded-md transition-colors ${selectionMode === tool.mode ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                               aria-label={tool.name}
                           >
                               <tool.icon className="h-5 w-5" />
                           </button>
                           <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                               {tool.name}
                           </span>
                       </div>
                    ))}
                </div>
                {hasSelection && (
                    <div className="flex items-center gap-2">
                         <div className="relative group flex items-center">
                           <button
                               onClick={onOpenOutlineModal}
                               className={`p-2 rounded-md transition-colors bg-gray-700 hover:bg-gray-600`}
                               aria-label="Add Outline"
                           >
                               <OutlineIcon className="h-5 w-5" />
                           </button>
                           <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                               Add Outline
                           </span>
                       </div>
                        <div className="relative group flex items-center">
                            <button onClick={clearSelection} className="p-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors" aria-label="Clear Selection">
                                <XCircleIcon className="h-5 w-5" />
                            </button>
                            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                Clear Selection
                            </span>
                        </div>
                    </div>
                )}
            </div>
            {selectionMode === 'chroma' && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <label htmlFor="tolerance">Tolerance</label>
                        <span>{tolerance}</span>
                    </div>
                    <input type="range" id="tolerance" min="0" max="100" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
            )}
        </div>
    );
};

const TemplateSelector: React.FC<{
    onApply: (prompt: string) => void;
    isLoading: boolean;
}> = ({ onApply, isLoading }) => {
    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPrompt = e.target.value;
        if (selectedPrompt) {
            onApply(selectedPrompt);
            e.target.value = ''; // Reset dropdown after selection
        }
    };

    return (
        <div className="p-4 bg-gray-800 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wide flex items-center gap-2">
                <TemplateIcon className="h-4 w-4" />
                Apply a Template
            </h3>
            <select
                onChange={handleSelect}
                disabled={isLoading}
                className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                aria-label="Apply a template"
            >
                <option value="">Choose a style...</option>
                {TEMPLATES.map(template => (
                    <option key={template.name} value={template.prompt}>
                        {template.name}
                    </option>
                ))}
            </select>
        </div>
    );
};


export const ThumbnailEditor: React.FC<ThumbnailEditorProps> = ({ initialImageData, onStartOver, onHistoryUpdate }) => {
  const { current, push, undo, redo, canUndo, canRedo, reset } = useImageHistory({
    imageData: initialImageData,
    prompt: 'Initial image',
  });
  const [editChatMessages, setEditChatMessages] = useState<ChatMessage[]>([
    { role: 'system', content: "Welcome! Describe the changes you'd like to make to your thumbnail." },
  ]);
  const [askChatMessages, setAskChatMessages] = useState<ChatMessage[]>([
    { role: 'system', content: "Welcome! Ask me anything about using the editor or for creative ideas." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [contrast, setContrast] = useState(100);

  // Selection state
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [selectionMask, setSelectionMask] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [path, setPath] = useState<Point[]>([]);
  const [tolerance, setTolerance] = useState(20);

  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Assistant State
  const [assistantMode, setAssistantMode] = useState<'edit' | 'ask'>('edit');
  const chatRef = useRef<Chat | null>(null);
  
  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('uncategorized');
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
  
  // Outline Modal State
  const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false);
  const [outlineColor, setOutlineColor] = useState('#FFFFFF');
  const [outlineWidth, setOutlineWidth] = useState(5); // in pixels

  const clearSelection = useCallback(() => {
    setSelectionMask(null);
    setSelectionMode(null);
  }, []);

  useEffect(() => {
    // When the initial image prop changes (i.e., from history), reset the editor state.
    reset({ imageData: initialImageData, prompt: 'Loaded from history' });
    setBrightness(100);
    setSaturation(100);
    setContrast(100);
    clearSelection();
    setEditChatMessages([
        { role: 'system', content: "Image loaded. Describe the changes you'd like to make to your thumbnail." },
    ]);
  }, [initialImageData, reset, clearSelection]);

  useEffect(() => {
    chatRef.current = geminiService.startChat(
      "You are an expert AI assistant for YouThumb. Your role is to help users with the editor. " +
      "1. Answer questions about how to use the editor's features. " +
      "2. Provide creative suggestions for thumbnails. " +
      "3. Offer general guidance on creating effective thumbnails. " +
      "IMPORTANT: Keep your answers short, clear, and to the point. Use bullet points (using '*') or numbered lists for instructions and ideas to make them easy to read. " +
      "Do not attempt to perform edits yourself; guide the user on how to do them using the app."
    );
  }, []);

  const drawImageOnCanvas = useCallback(() => {
    const canvas = imageCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
    img.src = current.imageData;
  }, [current.imageData]);

  useEffect(() => {
    drawImageOnCanvas();
  }, [drawImageOnCanvas]);

  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    
    if (imageCanvasRef.current) {
        overlay.width = imageCanvasRef.current.width;
        overlay.height = imageCanvasRef.current.height;
    }

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (selectionMask) {
      const maskImg = new Image();
      maskImg.onload = () => {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(maskImg, 0, 0);
        ctx.globalAlpha = 1.0;
      };
      maskImg.src = selectionMask;
    } else if (isDrawing) {
        ctx.strokeStyle = 'rgba(0, 150, 255, 1)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        if (selectionMode === 'rectangle' && startPoint && endPoint) {
            ctx.strokeRect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
        } else if (selectionMode === 'freehand' && path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for(let i=1; i<path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
        }
    }
  }, [selectionMask, isDrawing, startPoint, endPoint, path, selectionMode]);
  
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLDivElement>): Point | null => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
          x: (e.clientX - rect.left) * (canvas.width / rect.width),
          y: (e.clientY - rect.top) * (canvas.height / rect.height)
      };
  };
  
  const createMaskFromPath = (points: Point[], close: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageCanvasRef.current!.width;
    canvas.height = imageCanvasRef.current!.height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    if (close) ctx.closePath();
    ctx.fill();
    setSelectionMask(canvas.toDataURL());
  };

  const magicWandSelect = (startPos: Point) => {
    const imageCanvas = imageCanvasRef.current;
    if (!imageCanvas) return;
    const ctx = imageCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { width, height } = imageCanvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d')!;
    const maskImageData = maskCtx.createImageData(width, height);
    const maskData = maskImageData.data;
    
    const startIdx = (Math.round(startPos.y) * width + Math.round(startPos.x)) * 4;
    const startR = data[startIdx];
    const startG = data[startIdx+1];
    const startB = data[startIdx+2];

    const queue: Point[] = [startPos];
    const visited = new Uint8Array(width * height);
    visited[Math.round(startPos.y) * width + Math.round(startPos.x)] = 1;
    
    const toleranceSq = tolerance * tolerance * 3; // Compare squared distances

    while(queue.length > 0) {
        const {x, y} = queue.shift()!;
        const xi = Math.round(x);
        const yi = Math.round(y);
        
        if (xi < 0 || xi >= width || yi < 0 || yi >= height) continue;

        const idx = (yi * width + xi) * 4;
        const r = data[idx];
        const g = data[idx+1];
        const b = data[idx+2];
        
        const distSq = Math.pow(r - startR, 2) + Math.pow(g - startG, 2) + Math.pow(b - startB, 2);

        if (distSq < toleranceSq) {
             maskData[idx] = 255;
             maskData[idx+1] = 255;
             maskData[idx+2] = 255;
             maskData[idx+3] = 255;

             const neighbors = [{x: xi+1, y: yi}, {x: xi-1, y: yi}, {x: xi, y: yi+1}, {x: xi, y: yi-1}];
             for (const p of neighbors) {
                 if (p.x >= 0 && p.x < width && p.y >= 0 && p.y < height && !visited[p.y * width + p.x]) {
                    visited[p.y * width + p.x] = 1;
                    queue.push(p);
                 }
             }
        }
    }
    maskCtx.putImageData(maskImageData, 0, 0);
    setSelectionMask(maskCanvas.toDataURL());
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectionMode) return;
    const pos = getCanvasCoordinates(e);
    if (!pos) return;

    setIsDrawing(true);
    setStartPoint(pos);
    setEndPoint(pos);

    if (selectionMode === 'freehand') {
        setPath([pos]);
    } else if (selectionMode === 'chroma') {
        setIsDrawing(false);
        setStartPoint(null);
        magicWandSelect(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !selectionMode) return;
    const pos = getCanvasCoordinates(e);
    if (!pos) return;
    
    if (selectionMode === 'rectangle') {
        setEndPoint(pos);
    } else if (selectionMode === 'freehand') {
        setPath(prev => [...prev, pos]);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !selectionMode || !startPoint || !endPoint) return;
    setIsDrawing(false);
    
    if (selectionMode === 'rectangle') {
      const rectPath = [
          startPoint,
          {x: endPoint.x, y: startPoint.y},
          endPoint,
          {x: startPoint.x, y: endPoint.y}
      ];
      createMaskFromPath(rectPath, true);
    } else if (selectionMode === 'freehand') {
      createMaskFromPath(path, true);
    }
    
    setStartPoint(null);
    setEndPoint(null);
    setPath([]);
  };

  const applyFiltersToImageData = (imageDataUrl: string, filters: { brightness: number, saturation: number, contrast: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.filter = `brightness(${filters.brightness}%) saturate(${filters.saturation}%) contrast(${filters.contrast}%)`;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error("Failed to load image for filter application."));
        img.src = imageDataUrl;
    });
  };

  const handleApplyOutline = async () => {
    if (!selectionMask || isLoading) return;

    setIsLoading(true);
    setIsOutlineModalOpen(false);

    const prompt = `Add a ${outlineColor} outline, approximately ${outlineWidth} pixels thick, around the area marked in white on the provided mask image. IMPORTANT: Apply this change ONLY to the selected area. The rest of the image must remain untouched.`;

    setEditChatMessages(prev => [...prev, { role: 'user', content: `Request: Add ${outlineColor} outline (${outlineWidth}px)` }]);

    try {
        const imageWithFilters = await applyFiltersToImageData(current.imageData, { brightness, saturation, contrast });
        const newImageData = await geminiService.editImage(imageWithFilters, prompt, selectionMask);
        
        push({ imageData: newImageData, prompt: `Applied outline` });
        
        setBrightness(100);
        setSaturation(100);
        setContrast(100);
        clearSelection();
        
        setEditChatMessages(prev => [...prev, { role: 'model', content: "Outline applied successfully." }]);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setEditChatMessages(prev => [...prev, { role: 'system', content: `Error applying outline: ${errorMessage}` }]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleApplyTemplate = async (prompt: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setAssistantMode('edit');
    const templateName = TEMPLATES.find(t => t.prompt === prompt)?.name || 'Template';
    setEditChatMessages(prev => [...prev, { role: 'user', content: `Request: Apply ${templateName}` }]);

    try {
        const imageWithFilters = await applyFiltersToImageData(current.imageData, { brightness, saturation, contrast });
        const newImageData = await geminiService.editImage(imageWithFilters, prompt);
        push({ imageData: newImageData, prompt: `Applied ${templateName}` });

        setBrightness(100);
        setSaturation(100);
        setContrast(100);
        clearSelection();
        
        setEditChatMessages(prev => [...prev, { role: 'model', content: `Successfully applied the ${templateName}.` }]);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setEditChatMessages(prev => [...prev, { role: 'system', content: `Error applying template: ${errorMessage}` }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSendPrompt = async (prompt: string) => {
    if (!prompt || isLoading) return;

    setIsLoading(true);

    if (assistantMode === 'edit') {
        setEditChatMessages(prev => [...prev, { role: 'user', content: prompt }]);
        try {
          const imageWithFilters = await applyFiltersToImageData(current.imageData, { brightness, saturation, contrast });
          const newImageData = await geminiService.editImage(imageWithFilters, prompt, selectionMask ?? undefined);
          push({ imageData: newImageData, prompt });
          
          setBrightness(100);
          setSaturation(100);
          setContrast(100);
          clearSelection();
          
          setEditChatMessages(prev => [...prev, { role: 'model', content: "Here is the edited image." }]);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
          setEditChatMessages(prev => [...prev, { role: 'system', content: `Error: ${errorMessage}` }]);
        } finally {
          setIsLoading(false);
        }
    } else { // 'ask' mode
        setAskChatMessages(prev => [...prev, { role: 'user', content: prompt }]);
        if (!chatRef.current) {
            setAskChatMessages(prev => [...prev, { role: 'system', content: `Error: Chat not initialized.` }]);
            setIsLoading(false);
            return;
        }
        try {
            const response = await geminiService.sendMessage(chatRef.current, prompt);
            const modelMessage: ChatMessage = { role: 'model', content: response.text };
            setAskChatMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setAskChatMessages(prev => [...prev, { role: 'system', content: `Error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    }
  };
  
  const handleConfirmSave = async () => {
    if (isSaving || isDownloading || !saveName.trim()) return;

    setIsSaving(true);
    try {
      const finalFolderId = selectedFolderId === 'uncategorized' ? null : selectedFolderId;
      const imageToSave = await applyFiltersToImageData(current.imageData, { brightness, saturation, contrast });
      await historyService.addThumbnail(imageToSave, saveName.trim(), finalFolderId);
      setEditChatMessages(prev => [...prev, { role: 'system', content: `Successfully saved "${saveName.trim()}" to history.` }]);
      onHistoryUpdate();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setEditChatMessages(prev => [...prev, { role: 'system', content: `Error saving thumbnail: ${errorMessage}` }]);
    } finally {
      setIsSaving(false);
      setIsSaveModalOpen(false);
      setSaveName('');
    }
  };

  const openSaveModal = () => {
    setSaveName(`thumbnail-${Date.now()}`);
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
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setEditChatMessages(prev => [...prev, { role: 'system', content: `Error creating project: ${errorMessage}` }]);
    }
  };

  const handleDownload = async () => {
    if (isSaving || isDownloading) return;
    setIsDownloading(true);
    try {
      const imageToDownload = await applyFiltersToImageData(current.imageData, { brightness, saturation, contrast });
      const link = document.createElement('a');
      link.href = imageToDownload;
      link.download = `thumbnail-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setEditChatMessages(prev => [...prev, { role: 'system', content: `Error preparing for download: ${errorMessage}` }]);
    } finally {
      setIsDownloading(false);
    }
  };
  
  const messagesToDisplay = assistantMode === 'edit' ? editChatMessages : askChatMessages;

  return (
    <div className="flex-grow flex flex-col lg:flex-row gap-6">
        {isOutlineModalOpen && (
             <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-4">
                  <h3 className="text-lg font-semibold">Add Outline</h3>
                    
                    <div className="flex items-center gap-4">
                        <label htmlFor="outline-color" className="block text-sm font-medium text-gray-300">Color</label>
                        <input
                        id="outline-color"
                        type="color"
                        value={outlineColor}
                        onChange={(e) => setOutlineColor(e.target.value)}
                        className="w-10 h-10 p-1 bg-gray-700 rounded-md cursor-pointer"
                        />
                    </div>
                  
                   <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <label htmlFor="outline-width">Width</label>
                            <span>{outlineWidth}px</span>
                        </div>
                        <input type="range" id="outline-width" min="1" max="20" value={outlineWidth} onChange={(e) => setOutlineWidth(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                    </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setIsOutlineModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm">Cancel</button>
                    <button 
                      onClick={handleApplyOutline}
                      disabled={isLoading} 
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm disabled:opacity-50 flex items-center justify-center w-24"
                    >
                        {isLoading ? <Spinner className="w-4 h-4" /> : 'Apply'}
                    </button>
                  </div>
              </div>
            </div>
        )}
        {isSaveModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
              <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm space-y-4 flex flex-col">
                  <h3 className="text-lg font-semibold">Save Thumbnail</h3>
                  
                  <div>
                    <label htmlFor="save-name-editor" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                    <input
                      id="save-name-editor"
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter a name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Project</label>
                    <div className="bg-gray-900 rounded-md p-2 h-48 overflow-y-auto border border-gray-700 space-y-1">
                      <button
                        onClick={() => { setSelectedFolderId('uncategorized'); setIsCreatingNewProject(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                          selectedFolderId === 'uncategorized' && !isCreatingNewProject ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
                        }`}
                      >
                        <FolderIcon className="h-4 w-4" />
                        Uncategorized
                      </button>
                      {folders.map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => { setSelectedFolderId(folder.id); setIsCreatingNewProject(false); }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors truncate ${
                            selectedFolderId === folder.id && !isCreatingNewProject ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'
                          }`}
                        >
                          <FolderIcon className="h-4 w-4" />
                          {folder.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!isCreatingNewProject ? (
                    <button
                        onClick={() => { setIsCreatingNewProject(true); setSelectedFolderId('new'); }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors"
                    >
                        <FolderPlusIcon className="h-4 w-4" />
                        New Project
                    </button>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleCreateNewProject(); }} className="space-y-2">
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Enter new project name..."
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => { setIsCreatingNewProject(false); setSelectedFolderId('uncategorized'); }} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-xs">Cancel</button>
                            <button type="submit" disabled={!newProjectName.trim()} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-xs disabled:opacity-50">Create</button>
                        </div>
                    </form>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm">Cancel</button>
                    <button 
                      onClick={handleConfirmSave} 
                      disabled={!saveName.trim() || isSaving} 
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm disabled:opacity-50 flex items-center justify-center w-24"
                    >
                        {isSaving ? <Spinner className="w-4 h-4" /> : 'Save'}
                    </button>
                  </div>
              </div>
            </div>
        )}
        <div className="lg:w-1/3 flex flex-col bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-2 text-center">Editing Assistant</h2>
             <div className="flex border-b border-gray-700 mb-4">
                <button
                    onClick={() => setAssistantMode('edit')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    assistantMode === 'edit'
                        ? 'border-b-2 border-blue-500 text-white'
                        : 'text-gray-400 hover:text-white border-b-2 border-transparent'
                    }`}
                >
                    Edit
                </button>
                <button
                    onClick={() => setAssistantMode('ask')}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    assistantMode === 'ask'
                        ? 'border-b-2 border-blue-500 text-white'
                        : 'text-gray-400 hover:text-white border-b-2 border-transparent'
                    }`}
                >
                    Ask
                </button>
            </div>
            <div className="relative flex-grow min-h-0">
                <div className="absolute inset-0 overflow-y-auto pr-2 space-y-4">
                    {messagesToDisplay.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-sm px-4 py-2 ${
                                msg.role === 'user'
                                ? 'bg-blue-600 rounded-l-lg rounded-tr-lg'
                                : msg.role === 'model'
                                ? 'bg-gray-700 rounded-r-lg rounded-tl-lg'
                                : 'bg-indigo-600 text-white rounded-r-lg rounded-tl-lg'
                            }`}>
                                <p className={`text-sm ${msg.role === 'model' ? 'whitespace-pre-wrap' : ''}`}>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-xs md:max-w-sm rounded-lg px-4 py-2 bg-gray-700 flex items-center gap-2">
                               <Spinner />
                               <p className="text-sm">{assistantMode === 'edit' ? 'Editing your image...' : 'Thinking...'}</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4">
                <PromptInput 
                    onSend={handleSendPrompt} 
                    isLoading={isLoading} 
                    suggestions={assistantMode === 'edit' ? EDIT_PROMPT_SUGGESTIONS : ASK_PROMPT_SUGGESTIONS}
                    placeholder={assistantMode === 'edit' ? "e.g., Make the background blurry" : "Ask for advice or help..."}
                />
            </div>
        </div>
        
        <div className="lg:w-2/3 flex flex-col gap-4">
            <div 
                className="relative aspect-w-16 aspect-h-9 w-full bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} // End drawing if mouse leaves
            >
                <canvas 
                    ref={imageCanvasRef}
                    className="object-contain w-full h-full"
                    style={{ filter: `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)` }}
                />
                <canvas 
                    ref={overlayCanvasRef}
                    className="absolute top-0 left-0 w-full h-full object-contain cursor-crosshair"
                />
                <ProcessingOverlay isLoading={isLoading && assistantMode === 'edit'} />
            </div>
             <SelectionToolbar 
                selectionMode={selectionMode}
                setSelectionMode={setSelectionMode}
                clearSelection={clearSelection}
                tolerance={tolerance}
                setTolerance={setTolerance}
                hasSelection={!!selectionMask}
                onOpenOutlineModal={() => setIsOutlineModalOpen(true)}
             />
             <TemplateSelector onApply={handleApplyTemplate} isLoading={isLoading} />
            <div className="p-4 bg-gray-800 rounded-lg space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wide">Adjustments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <label htmlFor="brightness">Brightness</label>
                            <span>{brightness}%</span>
                        </div>
                        <input type="range" id="brightness" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                    </div>
                     <div className="space-y-2">
                         <div className="flex justify-between items-center text-sm">
                            <label htmlFor="saturation">Saturation</label>
                            <span>{saturation}%</span>
                        </div>
                        <input type="range" id="saturation" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                    </div>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <label htmlFor="contrast">Contrast</label>
                            <span>{contrast}%</span>
                        </div>
                        <input type="range" id="contrast" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                    </div>
                </div>
                <button 
                    onClick={() => { setBrightness(100); setSaturation(100); setContrast(100); }}
                    className="w-full mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm"
                >
                    Reset Adjustments
                </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-2 bg-gray-800 rounded-lg">
                <button onClick={onStartOver} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm">
                    <ArrowLeftIcon className="h-4 w-4" /> Start Over
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={undo} disabled={!canUndo || isLoading} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <UndoIcon className="h-5 w-5" />
                    </button>
                    <button onClick={redo} disabled={!canRedo || isLoading} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <RedoIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={openSaveModal} disabled={isLoading || isSaving || isDownloading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm w-28 justify-center">
                        <SaveIcon className="h-4 w-4" />
                        Save
                    </button>
                    <button onClick={handleDownload} disabled={isLoading || isSaving || isDownloading} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm w-32 justify-center">
                        {isDownloading ? <Spinner className="h-4 w-4" /> : <DownloadIcon className="h-4 w-4" />}
                        {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
