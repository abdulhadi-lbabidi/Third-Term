import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DirectionProvider } from '@radix-ui/react-direction';
import { router } from './router';

const queryClient = new QueryClient();

export function App() {
  return (
    <DirectionProvider dir="rtl">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster position="top-center" reverseOrder={false} gutter={8} />
      </QueryClientProvider>
    </DirectionProvider>
  );
}
