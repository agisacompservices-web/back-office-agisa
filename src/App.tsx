import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/Routes';
import { Toaster } from './components/ui/sonner';
import { ServiceProvider } from './context/ServiceContext';

function App() {
  return (
    <ServiceProvider>
      <RouterProvider router={router} />
      <Toaster />
    </ServiceProvider>
  );
}
export default App;
