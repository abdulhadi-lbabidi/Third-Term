import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Toaster as SonnerToaster } from 'sonner';
import { DirectionProvider } from '@radix-ui/react-direction';
import { DirectionProvider as BaseUIDirectionProvider } from '@base-ui/react/direction-provider';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <BaseUIDirectionProvider direction="rtl">
      <DirectionProvider dir="rtl">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster position="top-center" reverseOrder={false} gutter={8} />
          <SonnerToaster position="top-center" richColors />
        </QueryClientProvider>
      </DirectionProvider>
    </BaseUIDirectionProvider>
  );
}
