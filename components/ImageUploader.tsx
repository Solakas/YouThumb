import React, { useState, useCallback } from 'react';

interface ImageUploaderProps {
  onImageUpload: (imageDataUrl: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
      setError(null);
      if (!file.type.startsWith('image/')) {
          setError('Please upload a valid image file (PNG, JPG, etc.).');
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
          if (e.target?.result) {
              onImageUpload(e.target.result as string);
          } else {
              setError("Could not read the file.");
          }
      };
      reader.onerror = () => {
          setError("Error reading the file.");
      }
      reader.readAsDataURL(file);
  };
  
  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
  };


  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center h-full">
      <h2 className="text-h2 font-bold text-center mb-8">Upload an Image</h2>
      <div 
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        className={`relative border-thick border-solid rounded-2xl p-12 transition-all duration-200 w-full h-full flex flex-col justify-center focus-within:ring-2 focus-within:ring-yt-accent-focus ${isDragging ? 'border-yt-primary-500 bg-yt-neutral-bg-800 motion-safe:shadow-glowPrimary' : 'border-yt-neutral-border'}`}>
        
        <input 
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/*"
          onChange={onFileSelect}
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
          <i className="fa-solid fa-upload text-[32px] text-yt-neutral-text3 mb-4" aria-hidden="true"></i>
          <p className="font-bold text-body-lg">
            <span className="text-yt-primary-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-yt-neutral-text3 text-body-sm mt-1">PNG, JPG, WEBP, etc.</p>
        </label>
      </div>
      {error && <p className="text-yt-semantic-danger mt-4">{error}</p>}
    </div>
  );
};