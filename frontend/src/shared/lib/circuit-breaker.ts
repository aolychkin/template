/**
 * Circuit Breaker для защиты от каскадных сбоев
 * 
 * - Состояния: closed, open, half-open
 * - Threshold: 5 failures
 * - Cooldown: 30s
 */
import { logger } from './logger';

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold?: number;  // Количество ошибок для открытия
  cooldownPeriod?: number;    // Время в ms до half-open
  successThreshold?: number;  // Успехов для закрытия из half-open
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  cooldownPeriod: 30000,  // 30s
  successThreshold: 1,
};

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private options: Required<CircuitBreakerOptions>;

  constructor(
    private name: string,
    options: CircuitBreakerOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      logger.warn(`Circuit breaker "${this.name}" is open, rejecting request`);
      throw new Error(`Service "${this.name}" is temporarily unavailable`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    if (this.state === 'closed') {
      return true;
    }

    if (this.state === 'open') {
      // Проверяем, прошёл ли cooldown
      const now = Date.now();
      if (now - this.lastFailureTime >= this.options.cooldownPeriod) {
        this.state = 'half-open';
        this.successes = 0;
        logger.info(`Circuit breaker "${this.name}" is now half-open`);
        return true;
      }
      return false;
    }

    // half-open — пропускаем один запрос
    return true;
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
        logger.info(`Circuit breaker "${this.name}" is now closed`);
      }
    } else if (this.state === 'closed') {
      // Сбрасываем счётчик ошибок при успехе
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Одна ошибка в half-open — снова открываем
      this.state = 'open';
      logger.warn(`Circuit breaker "${this.name}" is open again after half-open failure`);
    } else if (this.state === 'closed' && this.failures >= this.options.failureThreshold) {
      this.state = 'open';
      logger.warn(`Circuit breaker "${this.name}" is now open after ${this.failures} failures`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }
}

// Singleton для gRPC клиента
export const grpcCircuitBreaker = new CircuitBreaker('grpc-api', {
  failureThreshold: 5,
  cooldownPeriod: 30000,
  successThreshold: 1,
});
