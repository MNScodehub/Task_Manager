import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

function Dashboard({ onNavigate }: DashboardProps) {
  const [newTask, setNewTask] = useState('');

  const tasks = [
    { id: 1, name: 'Finish Homework' },
    { id: 2, name: 'Call John' },
    { id: 3, name: 'Buy Groceries' },
  ];

  const handleLogout = () => {
    if (onNavigate) {
      onNavigate('home');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          Your Tasks
        </h1>
        <p className="text-gray-600 text-center mb-10">
          Easily manage and visualize your tasks.
        </p>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Task List</h2>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <CheckCircle2 className="text-blue-500 w-6 h-6" />
                <span className="text-lg text-gray-700">{task.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Task</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add New Task"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="flex gap-4 justify-center">
              <button className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                Add
              </button>
              <button
                onClick={handleLogout}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
