/**
 * Auth Sync - синхронизация состояния авторизации между вкладками
 * 
 * - BroadcastChannel для современных браузеров
 * - localStorage fallback для Safari < 15.4
 */
import { logger } from '../logger';

const SYNC_CHANNEL = 'auth_sync';
const STORAGE_KEY = 'auth_sync_message';

type SyncMessage = {
  type: 'logout' | 'login' | 'profile_update';
  timestamp: number;
};

let channel: BroadcastChannel | null = null;
let useLocalStorageFallback = false;

const initChannel = (): boolean => {
  if (typeof BroadcastChannel === 'undefined') {
    useLocalStorageFallback = true;
    return false;
  }

  if (!channel) {
    try {
      channel = new BroadcastChannel(SYNC_CHANNEL);
      return true;
    } catch (error) {
      logger.error('Failed to create BroadcastChannel:', error);
      useLocalStorageFallback = true;
      return false;
    }
  }

  return true;
};

// Инициализируем при загрузке
initChannel();

const broadcastMessage = (message: SyncMessage) => {
  if (channel && !useLocalStorageFallback) {
    try {
      channel.postMessage(message);
      return;
    } catch (error) {
      logger.error('Failed to broadcast via BroadcastChannel:', error);
    }
  }

  // Fallback: localStorage events
  try {
    // Записываем и сразу удаляем — это триггерит storage event в других вкладках
    localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logger.error('Failed to broadcast via localStorage:', error);
  }
};

export const broadcastLogout = () => {
  broadcastMessage({ type: 'logout', timestamp: Date.now() });
};

export const broadcastLogin = () => {
  broadcastMessage({ type: 'login', timestamp: Date.now() });
};

export const broadcastProfileUpdate = () => {
  broadcastMessage({ type: 'profile_update', timestamp: Date.now() });
};

export const onAuthSync = (callback: (message: SyncMessage) => void) => {
  // BroadcastChannel listener
  if (channel && !useLocalStorageFallback) {
    const handler = (event: MessageEvent<SyncMessage>) => {
      try {
        callback(event.data);
      } catch (error) {
        logger.error('Failed to handle sync message:', error);
      }
    };

    channel.addEventListener('message', handler);

    return () => {
      try {
        channel?.removeEventListener('message', handler);
      } catch (error) {
        logger.error('Failed to remove listener:', error);
      }
    };
  }

  // Fallback: localStorage listener
  const storageHandler = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;

    try {
      const message = JSON.parse(event.newValue) as SyncMessage;
      callback(message);
    } catch (error) {
      logger.error('Failed to parse sync message:', error);
    }
  };

  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener('storage', storageHandler);
  };
};
