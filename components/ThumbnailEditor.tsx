import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useImageHistory } from '../hooks/useImageHistory';
import { geminiService } from '../services/geminiService';
import { historyService } from '../services/historyService';
import { PromptInput } from './PromptInput';
import { Spinner } from './Spinner';
import { UndoIcon, RedoIcon, DownloadIcon, SaveIcon, ArrowLeftIcon, PenToolIcon, XCircleIcon, TemplateIcon } from './Icons';
import { EDIT_PROMPT_SUGGESTIONS } from '../constants';
import { Folder, ChatMessage } from '../types';
import { Chat } from '@google/genai';
import { TEMPLATES } from '../constants';


interface ThumbnailEditorProps {
  initialImageData: string;
  onStartOver: () => void;
  onHistoryUpdate: () => void;
}

interface TextElement {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  outlineColor: string;
  outlineWidth: number;
  align: 'left' | 'center' | 'right';
  x: number;
  y: number;
  rotation: number; // degrees
}

// Accordion Component for UI Organization
const AccordionItem: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}> = ({ title, icon, children, isOpen, onClick }) => {
    return (
        <div className="border-b border-yt-neutral-border last:border-b-0">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-yt-neutral-bg-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yt-accent-focus transition-colors rounded-t-lg"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-bold text-body">{title}</span>
                </div>
                <i className={`fa-solid fa-chevron-down transition-transform duration-200 text-yt-neutral-text3 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && (
                <div className="p-4 bg-yt-neutral-bg-950/50">
                    {children}
                </div>
            )}
        </div>
    );
};


export const ThumbnailEditor: React.FC<ThumbnailEditorProps> = ({ initialImageData, onStartOver, onHistoryUpdate }) => {
  const { current, push, undo, redo, canUndo, canRedo } = useImageHistory({ imageData: initialImageData, prompt: 'Initial Image' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isMasking, setIsMasking] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('uncategorized');
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);

  // Accordion State
  const [openAccordion, setOpenAccordion] = useState<string | null>('text');
  const toggleAccordion = (id: string) => setOpenAccordion(p => p === id ? null : id);

  // Text Tool State
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const dragOffset = useRef({x: 0, y: 0});
  const [imageLayout, setImageLayout] = useState<React.CSSProperties>({ visibility: 'hidden' });

  // Chat/Ask Mode State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    chatRef.current = geminiService.startChat("You are an expert on YouTube thumbnails. Keep your answers concise, to the point, and use lists for readability.");
  }, []);

  const selectedText = textElements.find(t => t.id === selectedTextId);

  // --- CANVAS SYNC & DRAWING ---
  const getCanvasCoords = useCallback((event: { clientX: number, clientY: number }) => {
    const image = imageRef.current;
    const canvas = textCanvasRef.current; 
    if (!image || !canvas) return { x: 0, y: 0 };
    
    const rect = image.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawTextElements = useCallback(() => {
    const canvas = textCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    textElements.forEach(el => {
        ctx.save();
        ctx.font = `${el.fontSize}px "${el.fontFamily}"`;
        ctx.fillStyle = el.color;
        ctx.strokeStyle = el.outlineColor;
        ctx.lineWidth = el.outlineWidth;
        ctx.textAlign = el.align;

        ctx.translate(el.x, el.y);
        ctx.rotate(el.rotation * Math.PI / 180);
        
        if (el.outlineWidth > 0) {
            ctx.strokeText(el.text, 0, 0);
        }
        ctx.fillText(el.text, 0, 0);
        
        if (el.id === selectedTextId) {
            const metrics = ctx.measureText(el.text);
            const w = metrics.width;
            const h = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            const x = el.align === 'center' ? -w/2 : el.align === 'right' ? -w : 0;
            const y = -metrics.actualBoundingBoxAscent;

            ctx.strokeStyle = '#00E5FF';
            const canvasWidthNum = parseFloat(imageLayout.width as string) || canvas.width;
            ctx.lineWidth = 2 * (canvas.width / (canvasWidthNum > 0 ? canvasWidthNum : canvas.width)); // Scale line width with zoom
            ctx.setLineDash([6, 3]);
            ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);
            ctx.setLineDash([]);
        }
        ctx.restore();
    });
  }, [textElements, selectedTextId, imageLayout.width]);
  
  const clearMask = useCallback(() => {
      const canvas = maskCanvasRef.current;
      if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
      }
  }, []);

  const syncLayout = useCallback(() => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport || !image || !image.complete || image.naturalWidth === 0) {
      return false;
    }

    const { width: viewportWidth, height: viewportHeight } = viewport.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = image;
    
    [maskCanvasRef, textCanvasRef].forEach(ref => {
      if (ref.current) {
        ref.current.width = naturalWidth;
        ref.current.height = naturalHeight;
      }
    });

    const imageRatio = naturalWidth / naturalHeight;
    const viewportRatio = viewportWidth / viewportHeight;

    let displayWidth, displayHeight;
    if (imageRatio > viewportRatio) {
      displayWidth = viewportWidth;
      displayHeight = viewportWidth / imageRatio;
    } else {
      displayHeight = viewportHeight;
      displayWidth = viewportHeight * imageRatio;
    }
    
    const top = (viewportHeight - displayHeight) / 2;
    const left = (viewportWidth - displayWidth) / 2;

    setImageLayout({
      width: `${displayWidth}px`,
      height: `${displayHeight}px`,
      top: `${top}px`,
      left: `${left}px`,
      visibility: 'visible'
    });
    
    clearMask();
    drawTextElements();
    return true;
  }, [drawTextElements, clearMask]);


  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(syncLayout);
    observer.observe(viewport);

    const image = imageRef.current;
    if (image) {
      if (image.complete) {
        syncLayout();
      } else {
        image.addEventListener('load', syncLayout);
      }
    }
    
    return () => {
      observer.disconnect();
      if (image) {
        image.removeEventListener('load', syncLayout);
      }
    };
  }, [current.imageData, syncLayout]);
  
  useEffect(() => {
    drawTextElements();
  }, [textElements, selectedTextId, drawTextElements]);


  const getCompositedImage = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
        const finalCanvas = document.createElement('canvas');
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = current.imageData;
        image.onload = () => {
            finalCanvas.width = image.naturalWidth;
            finalCanvas.height = image.naturalHeight;
            const ctx = finalCanvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(image, 0, 0);
            
            textElements.forEach(el => {
                ctx.save();
                ctx.font = `${el.fontSize}px "${el.fontFamily}"`;
                ctx.fillStyle = el.color;
                ctx.strokeStyle = el.outlineColor;
                ctx.lineWidth = el.outlineWidth;
                ctx.textAlign = el.align;
                ctx.translate(el.x, el.y);
                ctx.rotate(el.rotation * Math.PI / 180);
                if (el.outlineWidth > 0) ctx.strokeText(el.text, 0, 0);
                ctx.fillText(el.text, 0, 0);
                ctx.restore();
            });
            resolve(finalCanvas.toDataURL('image/png'));
        };
    });
  }, [current.imageData, textElements]);

  // --- MAIN ACTIONS ---

  const handleSendPrompt = async ({ prompt, mode, guideImage }: { prompt: string; mode: 'edit' | 'ask'; guideImage: string | null; }) => {
    if (mode === 'edit') {
      if (isLoading) return;
      setIsLoading(true);
      setError(null);

      let maskDataUrl: string | undefined = undefined;
      if (isMasking && maskCanvasRef.current) {
          const sourceCanvas = maskCanvasRef.current;
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = sourceCanvas.width;
          maskCanvas.height = sourceCanvas.height;
          const maskCtx = maskCanvas.getContext('2d');
          if (maskCtx) {
              maskCtx.fillStyle = 'white'; maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
              maskCtx.globalCompositeOperation = 'destination-in'; maskCtx.drawImage(sourceCanvas, 0, 0);
              maskCtx.globalCompositeOperation = 'difference'; maskCtx.fillStyle = 'white'; maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
              maskDataUrl = maskCanvas.toDataURL('image/png');
          }
          setIsMasking(false);
      }

      try {
        const newImageData = await geminiService.editImage(current.imageData, prompt, maskDataUrl, guideImage || undefined);
        push({ imageData: newImageData, prompt });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    } else { // Ask Mode
        if (isAnswering || !chatRef.current) return;
        const userMessage: ChatMessage = { role: 'user', content: prompt };
        setChatHistory(prev => [...prev, userMessage]);
        setIsAnswering(true);

        try {
            const response = await geminiService.sendMessage(chatRef.current, prompt);
            const modelMessage: ChatMessage = { role: 'model', content: response.text };
            setChatHistory(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'system', content: "Sorry, I couldn't get a response. Please try again." };
            setChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsAnswering(false);
        }
    }
  };

  const handleDownload = async () => {
    const imageDataUrl = await getCompositedImage();
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `YouThumb-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // --- MASKING ---
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMasking) return;
    setIsDrawing(true);
    lastPos.current = getCanvasCoords(event);
  };
  
  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isMasking) return;
    const canvas = maskCanvasRef.current;
    if (!canvas || !lastPos.current) return;
    const pos = getCanvasCoords(event);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)'; ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = () => setIsDrawing(false);

  // --- TEXT TOOL LOGIC ---
  const handleAddText = () => {
      const canvas = textCanvasRef.current;
      if (!canvas) return;
      const newId = `text_${Date.now()}`;
      const newTextElement: TextElement = {
          id: newId,
          text: 'Your Text Here',
          fontFamily: 'Inter',
          fontSize: 80,
          color: '#FFFFFF',
          outlineColor: '#000000',
          outlineWidth: 4,
          align: 'center',
          x: canvas.width / 2,
          y: canvas.height / 2,
          rotation: 0,
      };
      setTextElements(prev => [...prev, newTextElement]);
      setSelectedTextId(newId);
      setOpenAccordion('text');
  };

  const updateSelectedText = (props: Partial<TextElement>) => {
      if (!selectedTextId) return;
      setTextElements(prev => prev.map(el => el.id === selectedTextId ? { ...el, ...props } : el));
  };
  
  const handleDeleteSelectedText = () => {
      if (!selectedTextId) return;
      setTextElements(prev => prev.filter(el => el.id !== selectedTextId));
      setSelectedTextId(null);
  }

  const findTextElementAtCoords = useCallback((x: number, y: number): TextElement | null => {
        const canvas = textCanvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        for (let i = textElements.length - 1; i >= 0; i--) {
            const el = textElements[i];
            ctx.save();
            ctx.font = `${el.fontSize}px "${el.fontFamily}"`;
            const metrics = ctx.measureText(el.text);
            const w = metrics.width;
            const h = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            
            const dx = x - el.x;
            const dy = y - el.y;
            const angleRad = -el.rotation * Math.PI / 180;
            const rotX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
            const rotY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

            const x_offset = el.align === 'center' ? -w/2 : el.align === 'right' ? -w : 0;
            const y_offset = -metrics.actualBoundingBoxAscent;
            ctx.restore();

            if (rotX >= x_offset - 5 && rotX <= x_offset + w + 5 && rotY >= y_offset - 5 && rotY <= y_offset + h + 5) {
                return el;
            }
        }
        return null;
  }, [textElements]);
  
  const onTextCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = textCanvasRef.current;
      if (!canvas) return;
      const { x, y } = getCanvasCoords(e);
      const clickedElement = findTextElementAtCoords(x, y);

      if (clickedElement) {
          setSelectedTextId(clickedElement.id);
          setIsDraggingText(true);
          canvas.style.cursor = 'grabbing';
          dragOffset.current = { x: x - clickedElement.x, y: y - clickedElement.y };
      } else {
          setSelectedTextId(null);
      }
  };

  const onTextCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = textCanvasRef.current;
      if (!canvas) return;
      const { x, y } = getCanvasCoords(e);

      if (isDraggingText && selectedTextId) {
          updateSelectedText({ x: x - dragOffset.current.x, y: y - dragOffset.current.y });
      } else {
        const hoveredElement = findTextElementAtCoords(x, y);
        canvas.style.cursor = hoveredElement ? 'grab' : 'default';
      }
  };
  
  const onTextCanvasMouseUpOrLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDraggingText(false);
    const canvas = textCanvasRef.current;
    if (canvas) {
        const { x, y } = getCanvasCoords(e);
        const hoveredElement = findTextElementAtCoords(x, y);
        canvas.style.cursor = hoveredElement ? 'grab' : 'default';
    }
  };

  // --- SAVE MODAL LOGIC ---
  const openSaveModal = async () => {
    const defaultName = current.prompt.substring(0, 50) || `edited-${Date.now()}`;
    setSaveName(defaultName);
    const { folders } = historyService.getData();
    setFolders(folders.sort((a,b) => a.name.localeCompare(b.name)));
    setSelectedFolderId('uncategorized');
    setNewProjectName(''); setIsCreatingNewProject(false);
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
        console.error("Error creating project:", error);
    }
  };
  const handleConfirmSave = async () => {
    if (!saveName.trim() || isSaving) return;
    setIsSaving(true);
    const imageData = await getCompositedImage();
    const finalFolderId = selectedFolderId === 'uncategorized' ? null : selectedFolderId;

    await historyService.addThumbnail(imageData, saveName.trim(), finalFolderId);
    setSaveMessage(`'${saveName.trim()}' saved to history!`);
    onHistoryUpdate();
    
    setIsSaveModalOpen(false); setSaveName(''); setIsSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };
  const handleTemplateSelect = (prompt: string) => { handleSendPrompt({ prompt, mode: 'edit', guideImage: null }) };


  return (
    <div className="flex-grow flex flex-col md:flex-row gap-6 lg:gap-8 md:items-start">
        {/* Left Side: Toolbar */}
        <div className="w-full md:w-96 lg:w-[400px] flex-shrink-0 flex flex-col gap-4">
            <div className="bg-yt-neutral-bg-900 rounded-2xl">
                <div className="p-1">
                    <AccordionItem title="Selection Tools" icon={<PenToolIcon className="w-5 h-5"/>} isOpen={openAccordion === 'selection'} onClick={() => toggleAccordion('selection')}>
                         <button onClick={() => setIsMasking(!isMasking)} className={`w-full flex items-center justify-center gap-2 px-4 h-control-md rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yt-accent-focus ${isMasking ? 'bg-yt-primary-500 text-black' : 'bg-yt-neutral-bg-800 hover:bg-yt-neutral-borderStrong'}`}>
                            <PenToolIcon className="w-5 h-5"/>
                            <span className="text-body-sm font-bold">{isMasking ? 'Cancel Mask' : 'Mask Edit'}</span>
                        </button>
                        {isMasking && <button onClick={clearMask} className="mt-2 w-full text-xs text-center text-yt-neutral-text3 hover:text-yt-neutral-text">Clear Mask</button> }
                    </AccordionItem>
                    <AccordionItem title="Templates" icon={<TemplateIcon className="w-5 h-5"/>} isOpen={openAccordion === 'templates'} onClick={() => toggleAccordion('templates')}>
                       <div className="space-y-2">
                        {TEMPLATES.map(template => (
                            <button key={template.name} onClick={() => handleTemplateSelect(template.prompt)} className="w-full text-left p-3 bg-yt-neutral-bg-800 hover:bg-yt-neutral-borderStrong rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                                <p className="font-bold text-body-sm">{template.name}</p>
                            </button>
                        ))}
                    </div>
                    </AccordionItem>
                    <AccordionItem title="Text Tool" icon={<i className="fa-solid fa-font w-5 h-5 text-center"></i>} isOpen={openAccordion === 'text'} onClick={() => toggleAccordion('text')}>
                        <div className="space-y-4">
                            <button onClick={handleAddText} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 h-control-md bg-yt-neutral-bg-800 hover:bg-yt-neutral-borderStrong rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                                 <i className="fa-solid fa-plus"></i> <span className="text-body-sm font-bold">Add Text</span>
                            </button>
                            {selectedText && (
                                <div className="space-y-4 p-3 bg-yt-neutral-bg-800/50 rounded-lg">
                                    <h4 className="text-body-sm font-bold border-b border-yt-neutral-border pb-2 mb-3">Edit Text</h4>
                                    <textarea value={selectedText.text} onChange={e => updateSelectedText({text: e.target.value})} className="w-full bg-yt-neutral-bg-950 rounded-lg p-2 text-body-sm h-20 resize-y border-thin border-transparent focus:outline-none focus:ring-2 focus:ring-yt-accent-focus" />
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-4 text-body-sm">
                                        <label>Font <div className="relative mt-1"><select value={selectedText.fontFamily} onChange={e => updateSelectedText({fontFamily: e.target.value})} className="w-full bg-yt-neutral-bg-950 rounded-md py-1.5 pl-2 pr-8 border-thin border-transparent focus:outline-none focus:ring-2 focus:ring-yt-accent-focus appearance-none"><option>Inter</option><option>Bangers</option><option>Roboto</option><option>Montserrat</option></select><i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 transform pointer-events-none text-yt-neutral-text3 text-xs"></i></div></label>
                                        <label>Size <input type="number" value={selectedText.fontSize} onChange={e => updateSelectedText({fontSize: +e.target.value})} className="w-full bg-yt-neutral-bg-950 rounded-md p-1.5 mt-1 border-thin border-transparent focus:outline-none focus:ring-2 focus:ring-yt-accent-focus" /></label>
                                        <label>Color <input type="color" value={selectedText.color} onChange={e => updateSelectedText({color: e.target.value})} className="w-full h-9 bg-transparent rounded-md p-0 mt-1 border-none cursor-pointer" /></label>
                                        <label>Align <div className="grid grid-cols-3 gap-1 mt-1">{['left', 'center', 'right'].map(a => <button key={a} onClick={() => updateSelectedText({align: a as any})} className={`h-9 w-full flex items-center justify-center rounded transition-colors ${selectedText.align === a ? 'bg-yt-primary-500 text-black' : 'bg-yt-neutral-bg-950 hover:bg-yt-neutral-border'}`}><i className={`fa-solid fa-align-${a}`}></i></button>)}</div></label>
                                        <label>Outline <input type="color" value={selectedText.outlineColor} onChange={e => updateSelectedText({outlineColor: e.target.value})} className="w-full h-9 bg-transparent rounded-md p-0 mt-1 border-none cursor-pointer" /></label>
                                        <label>Width <input type="number" min="0" value={selectedText.outlineWidth} onChange={e => updateSelectedText({outlineWidth: +e.target.value})} className="w-full bg-yt-neutral-bg-950 rounded-md p-1.5 mt-1 border-thin border-transparent focus:outline-none focus:ring-2 focus:ring-yt-accent-focus" /></label>
                                    </div>
                                    <label className="block text-body-sm pt-2">Rotation ({selectedText.rotation}°) <input type="range" min="-180" max="180" value={selectedText.rotation} onChange={e => updateSelectedText({rotation: +e.target.value})} className="w-full mt-2 accent-yt-primary-500" /></label>
                                    <button onClick={handleDeleteSelectedText} className="w-full text-center text-sm text-yt-semantic-danger hover:underline pt-2">Delete Text</button>
                                </div>
                            )}
                        </div>
                    </AccordionItem>
                 </div>
            </div>
            
            <div className="bg-yt-neutral-bg-900 rounded-2xl p-4 space-y-3 flex-shrink-0">
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={undo} disabled={!canUndo || isLoading} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-yt-neutral-bg-800 hover:bg-yt-neutral-borderStrong rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                        <UndoIcon className="w-6 h-6"/>
                        <span className="text-body-sm">Undo</span>
                    </button>
                    <button onClick={redo} disabled={!canRedo || isLoading} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-yt-neutral-bg-800 hover:bg-yt-neutral-borderStrong rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                        <RedoIcon className="w-6 h-6"/>
                        <span className="text-body-sm">Redo</span>
                    </button>
                </div>
                
                <div className="space-y-3 pt-3">
                    <button onClick={openSaveModal} disabled={isLoading} className="w-full flex items-center justify-center gap-2.5 px-4 h-control-lg bg-yt-primary-500 text-black hover:bg-yt-primary-600 rounded-lg transition-colors disabled:opacity-50 motion-safe:hover:shadow-glowPrimary focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                        <SaveIcon className="w-5 h-5"/>
                        <span className="text-body font-bold">Save to History</span>
                    </button>
                    <button onClick={handleDownload} disabled={isLoading} className="w-full flex items-center justify-center gap-2.5 px-4 h-control-lg bg-yt-semantic-success text-yt-neutral-text hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                        <DownloadIcon className="w-5 h-5"/>
                        <span className="text-body font-bold">Download</span>
                    </button>
                </div>
                 <div className="border-t border-yt-neutral-border !mt-3 !mb-3"></div>
                 <button onClick={onStartOver} className="w-full flex items-center justify-center gap-2 px-4 h-control-md bg-yt-neutral-bg-800 hover:bg-yt-neutral-borderStrong rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                    <ArrowLeftIcon className="w-5 h-5"/>
                    <span className="text-body-sm font-bold">Start Over</span>
                </button>
                <div className="h-5 text-center"> {saveMessage && <p className="text-yt-semantic-success text-body-sm">{saveMessage}</p>}</div>
            </div>
        </div>

        {/* Right Side: Image and Prompt */}
        <div className="flex-grow flex flex-col gap-4 min-w-0 md:sticky md:top-8">
            <div className="w-full flex-grow bg-yt-neutral-bg-900 rounded-2xl flex items-center justify-center overflow-hidden p-4 min-h-[400px]">
                <div ref={viewportRef} className="w-full aspect-[16/9] relative border-2 border-yt-primary-500/30 rounded-lg bg-yt-neutral-bg-950">
                    {isLoading && (
                        <div className="absolute inset-0 bg-yt-neutral-bg-950/75 flex flex-col items-center justify-center z-30 rounded-lg">
                            <Spinner className="w-16 h-16 mb-4"/>
                            <p className="text-body-lg font-bold">Applying edits...</p>
                        </div>
                    )}
                    {error && <p className="absolute z-30 text-yt-semantic-danger text-center p-4">{error}</p>}
                    
                    <img 
                      ref={imageRef} 
                      src={current.imageData} 
                      alt={current.prompt} 
                      className="absolute block rounded-md transition-opacity"
                      style={{ ...imageLayout, opacity: isLoading ? 0.5 : 1 }}
                    />
                    
                    <canvas 
                      ref={maskCanvasRef} 
                      style={imageLayout} 
                      className={`absolute cursor-crosshair z-10 ${isMasking ? 'pointer-events-auto' : 'pointer-events-none'}`} 
                      onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} 
                    />
                    
                    <canvas 
                      ref={textCanvasRef} 
                      style={imageLayout} 
                      className="absolute z-20"
                      onMouseDown={onTextCanvasMouseDown} onMouseMove={onTextCanvasMouseMove} onMouseUp={onTextCanvasMouseUpOrLeave} onMouseLeave={onTextCanvasMouseUpOrLeave} 
                    />
                </div>
            </div>

            <div className="bg-yt-neutral-bg-900 rounded-2xl p-4 border border-yt-primary-500/30">
                <PromptInput 
                    onSend={handleSendPrompt} 
                    isLoading={isLoading || isAnswering}
                    suggestions={EDIT_PROMPT_SUGGESTIONS}
                    chatHistory={chatHistory}
                />
            </div>
        </div>

        {/* Modals */}
        {isSaveModalOpen && (
             <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" role="dialog" aria-modal="true">
                <div className="bg-yt-neutral-bg-900 rounded-2xl p-6 w-full max-w-sm space-y-4 flex flex-col shadow-yt3">
                    <h3 className="text-h3">Save Thumbnail</h3>
                    <div>
                        <label htmlFor="save-name-editor" className="block text-body-sm font-bold text-yt-neutral-text mb-1">Name</label>
                        <input id="save-name-editor" type="text" value={saveName} onChange={(e) => setSaveName(e.target.value)} className="w-full bg-yt-neutral-bg-800 rounded-lg px-3 h-control-md focus:outline-none focus:ring-2 focus:ring-yt-accent-focus text-body-sm" placeholder="Enter a name..." />
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
                        <button onClick={handleConfirmSave} disabled={!saveName.trim() || isSaving} className="px-4 h-control-md bg-yt-primary-500 text-black hover:bg-yt-primary-600 rounded-lg text-body-sm disabled:opacity-50 flex items-center justify-center w-24 focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                            {isSaving ? <Spinner /> : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};