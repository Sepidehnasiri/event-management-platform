import { Suspense } from 'react';
import { Outlet, useNavigation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import Navbar from './components/Navbar/Navbar';
import Notification from './components/Common/Notification';
import queryClient from './services/queryClient';
import store from './store';

function NavigationBar() {
  const navigation = useNavigation();
  if (navigation.state !== 'loading') return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: 'var(--primary)',
      zIndex: 9999,
      animation: 'navProgress 1.2s ease-in-out infinite',
    }} />
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <UserProvider>
            <NavigationBar />
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 60px)' }}>
              <Suspense fallback={
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading...
                </div>
              }>
                <Outlet />
              </Suspense>
            </main>
            <Notification />
          </UserProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}
