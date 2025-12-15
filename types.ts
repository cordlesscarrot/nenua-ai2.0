export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  image?: string; // Base64
}

export interface SmartDevice {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'lock' | 'camera';
  status: boolean | string; // on/off or value
  value?: number; // for thermostat
  room: string;
}

export enum AppMode {
  CHAT = 'CHAT',
  ROAST = 'ROAST',
  DASHBOARD = 'DASHBOARD'
}

export interface UserSession {
  uid: string;
  email: string;
  displayName: string;
  isAuthenticated: boolean;
}