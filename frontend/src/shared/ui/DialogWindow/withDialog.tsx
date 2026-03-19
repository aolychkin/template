import { useCallback, useMemo, useState, type ReactNode, type ComponentType } from 'react';
import { DialogContext } from './context';
import { DialogWindow } from './DialogWindow';
import type { DialogWindowProps } from './types';

/**
 * HOC для добавления поддержки диалогов
 * 
 * @example
 * // В app/providers/index.tsx
 * export const Providers = withDialog(() => (
 *   <Provider store={store}>
 *     <ThemeProvider theme={theme}>
 *       {children}
 *     </ThemeProvider>
 *   </Provider>
 * ));
 */
export const withDialog = <P extends object>(
  WrappedComponent: ComponentType<P>
) => {
  const WithDialog = (props: P) => {
    const [dialogContent, setDialogContent] = useState<ReactNode>(null);
    const [dialogMaxWidth, setDialogMaxWidth] = useState<DialogWindowProps['maxWidth']>('sm');
    const [dialogFullWidth, setDialogFullWidth] = useState(false);
    const [dialogDataTestId, setDialogDataTestId] = useState<string>();
    const [dialogOnBackdropClick, setDialogOnBackdropClick] = useState<{
      onClick?: () => void;
    }>({});

    const show = useCallback(
      ({
        content,
        maxWidth,
        fullWidth = false,
        onBackdropClick,
        dataTestId,
      }: Omit<DialogWindowProps, 'content'> & { content: ReactNode }) => {
        setDialogContent(content);
        setDialogMaxWidth(maxWidth);
        setDialogFullWidth(fullWidth);
        setDialogDataTestId(dataTestId);
        setDialogOnBackdropClick({ onClick: onBackdropClick });
      },
      []
    );

    const hide = useCallback(() => setDialogContent(null), []);

    const contextValue = useMemo(() => ({ show, hide }), [show, hide]);

    return (
      <DialogContext.Provider value={contextValue}>
        <WrappedComponent {...props} />
        {dialogContent !== null && (
          <DialogWindow
            content={dialogContent}
            maxWidth={dialogMaxWidth}
            fullWidth={dialogFullWidth}
            onBackdropClick={dialogOnBackdropClick.onClick || hide}
            dataTestId={dialogDataTestId}
          />
        )}
      </DialogContext.Provider>
    );
  };

  WithDialog.displayName = `withDialog(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithDialog;
};
