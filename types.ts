
export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface ImageHistoryState {
  imageData: string; // base64 data URL
  prompt: string;
}

export interface Thumbnail {
  id: string;
  name: string;
  imageData: string; // base64 data URL
  createdAt: string; // ISO Date string
  folderId: string | null;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string; // ISO Date string
}
