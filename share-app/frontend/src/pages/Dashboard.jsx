import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Plus, LogIn, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await axios.post('http://localhost:5000/api/session/create', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/room/${data.code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (joinCode.length !== 12) {
      setError('Connection code must be exactly 12 digits');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      await axios.post('http://localhost:5000/api/session/join', { code: joinCode }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/room/${joinCode}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room. Verify the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 mx-auto animate-fade-in-up">
      {/* Create Room Card */}
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col justify-between border border-gray-100 hover:shadow-2xl transition-shadow">
        <div>
          <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6">
            <Plus className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Session</h2>
          <p className="text-gray-500 mb-8">
            Generate a unique, secure 12-digit connection code to share files and chat with another peer privately.
          </p>
        </div>
        
        <button
          onClick={handleCreateRoom}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white bg-primary-600 hover:bg-primary-700 font-medium transition-colors focus:ring-4 focus:ring-primary-100 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Generate Connection Code'}
        </button>
      </div>

      {/* Join Room Card */}
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col justify-between border border-gray-100 hover:shadow-2xl transition-shadow">
        <div>
          <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Join a Session</h2>
          <p className="text-gray-500 mb-6">
            Have a code? Enter it below to securely connect to an existing session.
          </p>
          
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleJoinRoom}>
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="000000000000"
                maxLength={12}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-lg tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
              />
            </div>
            
            <button
               type="submit"
               disabled={isLoading || joinCode.length !== 12}
               className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-medium transition-colors focus:ring-4 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Connect to Session
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
