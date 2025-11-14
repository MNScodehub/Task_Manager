import { useState } from 'react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  if (currentPage === 'login') {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'signup') {
    return <SignupPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'dashboard') {
    return <Dashboard onNavigate={handleNavigate} />;
  }

  if (currentPage === 'profile') {
    return <ProfilePage onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Hi! Welcome to your Task Manager.
        </h1>

        <p className="text-lg text-gray-600 mb-12">
          Manage your daily tasks easily and stay organized.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button
            onClick={() => handleNavigate('login')}
            className="w-full sm:w-48 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Login
          </button>

          <button
            onClick={() => handleNavigate('signup')}
            className="w-full sm:w-48 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Signup
          </button>

          <button
            onClick={() => handleNavigate('dashboard')}
            className="w-full sm:w-48 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
