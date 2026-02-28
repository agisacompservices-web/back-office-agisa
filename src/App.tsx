import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/Routes';
import { Toaster } from './components/ui/sonner';
import { ServiceProvider } from './context/ServiceContext';
import { NetworkStatus } from './components/NetworkStatus';

function App() {
  return (
    <ServiceProvider>
      <RouterProvider router={router} />
      <NetworkStatus />
      <Toaster />
    </ServiceProvider>
  );
}
export default App;
