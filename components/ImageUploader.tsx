import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './Icons';

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
    <div className="flex-grow flex flex-col items-center justify-center text-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">YouThumb</h1>
        <p className="text-lg text-gray-400 mb-8">Upload an image to start editing with the power of AI. Or, use the generator to create a new one from scratch.</p>

        <div 
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          className={`relative border-2 border-dashed rounded-lg p-10 sm:p-20 transition-colors ${isDragging ? 'border-blue-500 bg-gray-800' : 'border-gray-600'}`}>
          
          <input 
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/*"
            onChange={onFileSelect}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
            <UploadCloudIcon className="h-16 w-16 text-gray-500 mb-4"/>
            <p className="font-semibold text-lg">
              <span className="text-blue-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-gray-500 text-sm mt-1">PNG, JPG, WEBP, etc.</p>
          </label>
        </div>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    </div>
  );
};