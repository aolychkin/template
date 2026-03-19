import { ComponentType } from 'react';
import { lazyWithRetry } from './lazyWithRetry';

interface LazyNamedOptions {
  retries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

/**
 * Lazy load a named export from a module.
 * Useful when component is not the default export.
 *
 * @param importFn - Dynamic import function returning module
 * @param exportName - Name of the export to extract
 * @param options - Configuration for retry behavior
 * @returns React.LazyExoticComponent
 *
 * @example
 * const UserCard = lazyNamed(
 *   () => import('entities/user/ui'),
 *   'UserCard'
 * );
 */
export function lazyNamed<T extends ComponentType<unknown>>(
  importFn: () => Promise<Record<string, unknown>>,
  exportName: string,
  options: LazyNamedOptions = {}
): React.LazyExoticComponent<T> {
  return lazyWithRetry<T>(
    () =>
      importFn().then(module => {
        const component = module[exportName];
        if (!component) {
          throw new Error(`Export "${exportName}" not found in module`);
        }
        return { default: component as T };
      }),
    options
  );
}
