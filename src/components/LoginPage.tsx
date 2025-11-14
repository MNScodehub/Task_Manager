import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (!profile) {
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([{ id: data.user.id, name: '' }]);

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }

          setUserId(data.user.id);
          setShowNamePrompt(true);
          setLoading(false);
        } else if (!profile.name || profile.name.trim() === '') {
          setUserId(data.user.id);
          setShowNamePrompt(true);
          setLoading(false);
        } else {
          onNavigate('dashboard');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userId) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ name: userName.trim(), updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      onNavigate('dashboard');
    } catch (err) {
      console.error('Error saving name:', err);
      setError('Failed to save name');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      {showNamePrompt ? (
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Welcome!
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Please tell us your preferred name to personalize your experience.
          </p>
          <form onSubmit={handleSaveName} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="userName" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !userName.trim()}
              className="w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Login to Your Account
        </h1>

        <p className="text-gray-600 mb-8 text-center">
          Enter your email and password to continue.
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Logging in...' : 'Login'}
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
      )}
    </div>
  );
}

export default LoginPage;
