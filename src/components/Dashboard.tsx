import { CheckCircle2, Clock, AlertCircle, Trash2, Sparkles, Save, Edit, X, User, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'done';
  created_at: string;
}

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  created_at: string;
}

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

function Dashboard({ onNavigate }: DashboardProps) {
  const [newTask, setNewTask] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'done'>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string[]>>({});
  const [generatingAI, setGeneratingAI] = useState<Record<string, boolean>>({});
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null);
  const [editSubtaskText, setEditSubtaskText] = useState('');
  const [userName, setUserName] = useState<string>('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (onNavigate) {
        onNavigate('login');
      }
      return;
    }
    fetchTasks();
    fetchUserName();
  };

  useEffect(() => {
    tasks.forEach(task => {
      fetchSubtasks(task.id);
    });
  }, [tasks]);

  const fetchUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name, profile_picture_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        if (profile.name) setUserName(profile.name);
        if (profile.profile_picture_url) setProfilePictureUrl(profile.profile_picture_url);
      }
    } catch (err) {
      console.error('Error fetching user name:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in to view tasks');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in to add tasks');
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          title: newTask,
          priority,
          status,
        }]);

      if (error) throw error;

      setNewTask('');
      setPriority('medium');
      setStatus('pending');
      await fetchTasks();
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      await fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: 'pending' | 'in-progress' | 'done') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
      await fetchTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status');
    }
  };

  const handleUpdatePriority = async (taskId: string, newPriority: 'low' | 'medium' | 'high') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority: newPriority, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
      await fetchTasks();
    } catch (err) {
      console.error('Error updating task priority:', err);
      setError('Failed to update task priority');
    }
  };

  const fetchSubtasks = async (taskId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSubtasks(prev => ({ ...prev, [taskId]: data || [] }));
    } catch (err) {
      console.error('Error fetching subtasks:', err);
    }
  };

  const generateSubtasks = async (taskId: string, taskTitle: string) => {
    setGeneratingAI(prev => ({ ...prev, [taskId]: true }));
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to generate subtasks');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-subtasks`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskTitle }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate subtasks');
      }

      const data = await response.json();
      setAiSuggestions(prev => ({ ...prev, [taskId]: data.subtasks || [] }));
    } catch (err) {
      console.error('Error generating subtasks:', err);
      setError('Failed to generate subtasks with AI');
    } finally {
      setGeneratingAI(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const saveSubtask = async (taskId: string, subtaskTitle: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to save subtasks');
        return;
      }

      const { error } = await supabase
        .from('subtasks')
        .insert([{
          task_id: taskId,
          user_id: user.id,
          title: subtaskTitle,
        }]);

      if (error) throw error;

      await fetchSubtasks(taskId);

      setAiSuggestions(prev => ({
        ...prev,
        [taskId]: (prev[taskId] || []).filter(s => s !== subtaskTitle)
      }));
    } catch (err) {
      console.error('Error saving subtask:', err);
      setError('Failed to save subtask');
    }
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;
      await fetchSubtasks(taskId);
    } catch (err) {
      console.error('Error deleting subtask:', err);
      setError('Failed to delete subtask');
    }
  };

  const startEditSubtask = (subtask: Subtask) => {
    setEditingSubtask(subtask.id);
    setEditSubtaskText(subtask.title);
  };

  const saveEditSubtask = async (taskId: string, subtaskId: string) => {
    if (!editSubtaskText.trim()) return;

    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ title: editSubtaskText, updated_at: new Date().toISOString() })
        .eq('id', subtaskId);

      if (error) throw error;

      setEditingSubtask(null);
      setEditSubtaskText('');
      await fetchSubtasks(taskId);
    } catch (err) {
      console.error('Error updating subtask:', err);
      setError('Failed to update subtask');
    }
  };

  const cancelEditSubtask = () => {
    setEditingSubtask(null);
    setEditSubtaskText('');
  };

  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-200 text-red-800 border-red-300';
      case 'medium': return 'bg-amber-200 text-amber-800 border-amber-300';
      case 'low': return 'bg-green-200 text-green-800 border-green-300';
      default: return 'bg-gray-200 text-gray-800 border-gray-300';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onNavigate) {
      onNavigate('home');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      event.target.value = '';
      return;
    }

    await uploadProfilePicture(file, event);
  };

  const uploadProfilePicture = async (file: File, event?: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to upload');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

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
      setShowUploadModal(false);

      if (event?.target) {
        event.target.value = '';
      }
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {userName ? `Welcome back, ${userName}!` : 'Your Tasks'}
            </h1>
            <p className="text-gray-600">
              {userName ? 'Ready to conquer your day?' : 'Easily manage and visualize your tasks.'}
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            {profilePictureUrl ? (
              <div className="relative">
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="absolute bottom-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all"
                  title="Edit profile picture"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-32 h-32 rounded-full bg-blue-200 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-16 h-16 text-blue-500" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="profile-picture-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="profile-picture-upload"
                  className={`flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Your Profile Picture'}
                </label>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Task</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Task title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loading}
            />
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className={`w-auto min-w-[100px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium ${getPriorityStyle(priority)}`}
                  disabled={loading}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'pending' | 'in-progress' | 'done')}
                  className={`w-auto min-w-[120px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium ${getStatusStyle(status)}`}
                  disabled={loading}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <button
                onClick={handleAddTask}
                disabled={loading || !newTask.trim()}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Task List</h2>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Logout
            </button>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks yet. Add your first task above!</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 p-5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-blue-500 w-6 h-6 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-lg text-gray-800 font-medium">{task.title}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-3 ml-9">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                      <select
                        value={task.priority}
                        onChange={(e) => handleUpdatePriority(task.id, e.target.value as 'low' | 'medium' | 'high')}
                        className={`w-auto min-w-[100px] px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium ${getPriorityStyle(task.priority)}`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value as 'pending' | 'in-progress' | 'done')}
                        className={`w-auto min-w-[120px] px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium ${getStatusStyle(task.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>

                  <div className="ml-9 mt-4 border-t border-blue-200 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => generateSubtasks(task.id, task.title)}
                        disabled={generatingAI[task.id]}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-4 h-4" />
                        {generatingAI[task.id] ? 'Generating...' : 'Generate Subtasks with AI'}
                      </button>

                      {(subtasks[task.id]?.length > 0 || aiSuggestions[task.id]?.length > 0) && (
                        <button
                          onClick={() => toggleTaskCollapse(task.id)}
                          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-blue-100 rounded-lg transition-all"
                        >
                          {collapsedTasks[task.id] ? (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              <span>Expand</span>
                            </>
                          ) : (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              <span>Collapse</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {!collapsedTasks[task.id] && (
                      <>
                        {aiSuggestions[task.id] && aiSuggestions[task.id].length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-600">AI Suggestions:</p>
                            {aiSuggestions[task.id].map((suggestion, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-gray-200">
                                <span className="text-sm text-gray-700 flex-1">{suggestion}</span>
                                <button
                                  onClick={() => saveSubtask(task.id, suggestion)}
                                  className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded transition-all"
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {subtasks[task.id] && subtasks[task.id].length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-600">Subtasks:</p>
                            {subtasks[task.id].map((subtask) => (
                          <div key={subtask.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded border border-blue-200">
                            {editingSubtask === subtask.id ? (
                              <>
                                <input
                                  type="text"
                                  value={editSubtaskText}
                                  onChange={(e) => setEditSubtaskText(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => saveEditSubtask(task.id, subtask.id)}
                                    className="p-1 bg-green-500 hover:bg-green-600 text-white rounded transition-all"
                                  >
                                    <Save className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={cancelEditSubtask}
                                    className="p-1 bg-gray-400 hover:bg-gray-500 text-white rounded transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-sm text-gray-700 flex-1">{subtask.title}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => startEditSubtask(subtask)}
                                    className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-all"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteSubtask(task.id, subtask.id)}
                                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {profilePictureUrl ? 'Update Profile Picture' : 'Upload Profile Picture'}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="profile-picture-input-modal"
                disabled={uploading}
              />
              <label
                htmlFor="profile-picture-input-modal"
                className={`flex items-center justify-center gap-2 w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-5 h-5" />
                {uploading ? 'Uploading...' : 'Select and Upload New Picture'}
              </label>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Supported formats: JPG, PNG, GIF (Max 5MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
