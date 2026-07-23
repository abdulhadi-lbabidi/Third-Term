import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import i18n from './i18n';
import { router } from './router';

const queryClient = new QueryClient();

export function App() {
  useEffect(() => {
    const syncDocumentLanguage = (language: string) => {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    };

    syncDocumentLanguage(i18n.language);
    i18n.on('languageChanged', syncDocumentLanguage);

    return () => {
      i18n.off('languageChanged', syncDocumentLanguage);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
