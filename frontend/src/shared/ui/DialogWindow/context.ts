import { createContext, useContext } from 'react';
import type { DialogContextValue } from './types';

export const DialogContext = createContext<DialogContextValue>({
  show: () => { },
  hide: () => { },
});

/**
 * Хук для работы с диалогами
 * 
 * @example
 * const { show, hide } = useDialog();
 * 
 * show({
 *   content: <ConfirmDialog onConfirm={handleConfirm} />,
 *   maxWidth: 'sm',
 * });
 */
export const useDialog = () => useContext(DialogContext);
