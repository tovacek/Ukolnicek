import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import ChildDashboard from './components/ChildDashboard';
import ParentDashboard from './components/ParentDashboard';
import { UserRole } from './types';

const MainContent: React.FC = () => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return currentUser.role === UserRole.PARENT ? <ParentDashboard /> : <ChildDashboard />;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;
