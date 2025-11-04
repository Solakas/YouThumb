import { Thumbnail, Folder } from '../types';

const HISTORY_KEY = 'youthumb-history';
const MAX_HISTORY_ITEMS = 100; // Safety limit
const THUMBNAIL_PREVIEW_WIDTH = 480; // px
const THUMBNAIL_PREVIEW_HEIGHT = 270; // px
const THUMBNAIL_PREVIEW_QUALITY = 0.8; // JPEG quality

interface HistoryData {
  thumbnails: Thumbnail[];
  folders: Folder[];
}

const getHistory = (): HistoryData => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (data) {
      const parsedData = JSON.parse(data);
      return {
        thumbnails: Array.isArray(parsedData.thumbnails) ? parsedData.thumbnails : [],
        folders: Array.isArray(parsedData.folders) ? parsedData.folders : [],
      };
    }
  } catch (error) {
    console.error("Failed to parse history from localStorage", error);
  }
  return { thumbnails: [], folders: [] };
};

const saveHistory = (data: HistoryData) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save history to localStorage", error);
  }
};

const resizeImage = (base64Str: string, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context for resizing'));
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', THUMBNAIL_PREVIEW_QUALITY));
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for resizing.'));
    };
  });
};

export const historyService = {
  // Combined getter
  getData: (): HistoryData => getHistory(),

  // Thumbnail methods
  addThumbnail: async (imageData: string, name: string, folderId: string | null = null): Promise<Thumbnail> => {
    const history = getHistory();
    
    // Resize image to save space in localStorage
    const resizedImageData = await resizeImage(imageData, THUMBNAIL_PREVIEW_WIDTH, THUMBNAIL_PREVIEW_HEIGHT);

    const newThumbnail: Thumbnail = {
      id: `thumb_${Date.now()}`,
      name,
      imageData: resizedImageData,
      createdAt: new Date().toISOString(),
      folderId: folderId,
    };
    history.thumbnails.unshift(newThumbnail);

    // Enforce a limit on the number of saved thumbnails to prevent exceeding quota
    if (history.thumbnails.length > MAX_HISTORY_ITEMS) {
        history.thumbnails = history.thumbnails.slice(0, MAX_HISTORY_ITEMS);
    }

    saveHistory(history);
    return newThumbnail;
  },

  updateThumbnail: (updatedThumbnail: Thumbnail): void => {
    const history = getHistory();
    const index = history.thumbnails.findIndex(t => t.id === updatedThumbnail.id);
    if (index !== -1) {
      history.thumbnails[index] = updatedThumbnail;
      saveHistory(history);
    }
  },

  deleteThumbnail: (thumbnailId: string): void => {
    const history = getHistory();
    history.thumbnails = history.thumbnails.filter(t => t.id !== thumbnailId);
    saveHistory(history);
  },

  // Folder methods
  addFolder: (name: string): Folder => {
    const history = getHistory();
    const newFolder: Folder = {
      id: `folder_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
    };
    history.folders.push(newFolder);
    saveHistory(history);
    return newFolder;
  },
  
  updateFolder: (updatedFolder: Folder): void => {
    const history = getHistory();
    const index = history.folders.findIndex(f => f.id === updatedFolder.id);
    if (index !== -1) {
      history.folders[index] = updatedFolder;
      saveHistory(history);
    }
  },

  deleteFolder: (folderId: string): void => {
    const history = getHistory();
    history.thumbnails.forEach(thumb => {
      if (thumb.folderId === folderId) {
        thumb.folderId = null;
      }
    });
    history.folders = history.folders.filter(f => f.id !== folderId);
    saveHistory(history);
  },
};