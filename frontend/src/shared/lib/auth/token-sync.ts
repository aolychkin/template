/**
 * Token Sync Service
 * 
 * Синхронизация состояния аутентификации между вкладками браузера.
 * Использует BroadcastChannel API с fallback на localStorage events.
 */
import { clearAuth } from './auth';
import { logger } from '../logger';

interface TokenSyncMessage {
  type: 'logout' | 'token_refresh';
  timestamp: number;
}

const CHANNEL_NAME = 'auth_sync';
const STORAGE_KEY = 'auth_logout';

class TokenSyncService {
  private channel: BroadcastChannel | null = null;
  private initialized = false;

  constructor() {
    // Инициализируем только в браузере
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Пробуем BroadcastChannel (современные браузеры)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = this.handleMessage.bind(this);
        logger.debug('[TokenSync] Using BroadcastChannel');
      } catch (error) {
        logger.warn('[TokenSync] BroadcastChannel failed, using localStorage fallback', error);
        this.setupStorageFallback();
      }
    } else {
      // Fallback на localStorage events
      this.setupStorageFallback();
    }
  }

  private setupStorageFallback(): void {
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
    logger.debug('[TokenSync] Using localStorage fallback');
  }

  private handleMessage(event: MessageEvent<TokenSyncMessage>): void {
    try {
      const { type } = event.data;

      if (type === 'logout') {
        logger.debug('[TokenSync] Received logout from another tab');
        this.performLogout();
      }
    } catch (error) {
      logger.error('[TokenSync] Error handling message:', error);
    }
  }

  private handleStorageEvent(event: StorageEvent): void {
    // localStorage fallback: слушаем изменения ключа auth_logout
    if (event.key === STORAGE_KEY && event.newValue) {
      logger.debug('[TokenSync] Received logout via localStorage');
      this.performLogout();
    }
  }

  private performLogout(): void {
    clearAuth();
    // Редирект на login
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Уведомить другие вкладки о logout
   */
  notifyLogout(): void {
    const message: TokenSyncMessage = {
      type: 'logout',
      timestamp: Date.now(),
    };

    if (this.channel) {
      try {
        this.channel.postMessage(message);
        logger.debug('[TokenSync] Sent logout via BroadcastChannel');
      } catch (error) {
        logger.error('[TokenSync] Failed to send via BroadcastChannel:', error);
        this.notifyViaStorage();
      }
    } else {
      this.notifyViaStorage();
    }
  }

  private notifyViaStorage(): void {
    try {
      // Записываем и сразу удаляем — это триггерит storage event в других вкладках
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      localStorage.removeItem(STORAGE_KEY);
      logger.debug('[TokenSync] Sent logout via localStorage');
    } catch (error) {
      logger.error('[TokenSync] Failed to send via localStorage:', error);
    }
  }

  /**
   * Уведомить другие вкладки об обновлении токена
   */
  notifyTokenRefresh(): void {
    const message: TokenSyncMessage = {
      type: 'token_refresh',
      timestamp: Date.now(),
    };

    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {
        // Игнорируем ошибки для token_refresh
      }
    }
  }

  /**
   * Очистка ресурсов
   */
  destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.initialized = false;
  }
}

// Singleton instance
export const tokenSync = new TokenSyncService();
