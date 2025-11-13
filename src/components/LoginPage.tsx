import { useState } from 'react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Login to Your Account
        </h1>

        <p className="text-gray-600 mb-8 text-center">
          Enter your email and password to continue.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Login
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('signup')}
            className="text-blue-500 hover:text-blue-600 font-semibold hover:underline"
          >
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
