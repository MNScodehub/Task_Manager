import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, Upload, Edit, ArrowLeft } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [userName, setUserName] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to view profile');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('name, profile_picture_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setUserName(profile.name || '');
        setProfilePictureUrl(profile.profile_picture_url || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    await uploadProfilePicture(file);
  };

  const uploadProfilePicture = async (file: File) => {
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to upload');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      if (profilePictureUrl) {
        const oldFileName = profilePictureUrl.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('profile-pictures')
            .remove([oldFileName]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfilePictureUrl(publicUrl);
      setSuccess('Profile picture updated successfully!');
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Your Profile
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Manage your personal information
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-blue-200 flex items-center justify-center border-4 border-white shadow-lg">
                      <User className="w-16 h-16 text-blue-500" />
                    </div>
                  )}
                  {profilePictureUrl && (
                    <button
                      onClick={handleEditClick}
                      disabled={uploading}
                      className="absolute bottom-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all disabled:opacity-50"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-800">{userName || 'User'}</h2>
                  <p className="text-sm text-gray-600">Member since {new Date().getFullYear()}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Picture</h3>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!profilePictureUrl && (
                <button
                  onClick={handleEditClick}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Upload className="w-5 h-5" />
                  {uploading ? 'Uploading...' : 'Upload Your Profile Picture'}
                </button>
              )}

              <p className="text-xs text-gray-500 text-center mt-3">
                Supported formats: JPG, PNG, GIF (Max 5MB)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
