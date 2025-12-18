import React, { useState, useEffect } from 'react';
import { Plus, Disc, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScriptForm from './components/ScriptForm';
import ScriptList from './components/ScriptList';
import SearchBar from './components/SearchBar';
import { scriptService } from './services/api';

function App() {
  const [scripts, setScripts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingScript, setEditingScript] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const data = await scriptService.getAll();
      setScripts(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching scripts:", err);
      setError("Failed to load scripts. Backend might be sleeping (free tier).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleAddScript = async (scriptData) => {
    try {
      await scriptService.create(scriptData);
      fetchScripts();
      setIsFormOpen(false);
      setError(null);
      showToast("Script created successfully! 🎵");
    } catch (err) {
      console.error("Error adding script:", err);
      const errorMessage = err.response?.data?.detail || "Failed to add script.";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleUpdateScript = async (id, scriptData) => {
    try {
      await scriptService.update(id, scriptData);
      setEditingScript(null);
      fetchScripts();
      showToast("Script updated! ✨");
    } catch (err) {
      console.error("Error updating script:", err);
      alert("Failed to update script");
    }
  };

  const handleDeleteScript = async (id) => {
    if (window.confirm("Delete this script permanently?")) {
      try {
        await scriptService.delete(id);
        // Optimistic update: remove from list immediately
        setScripts(prev => prev.filter(s => s.id !== id)); 
        showToast("Script deleted. 🗑️", "error");
      } catch (err) {
        console.error("Error deleting script:", err);
        alert("Failed to delete script");
      }
    }
  };

  const filteredScripts = scripts.filter(script => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      script.title?.toLowerCase().includes(q) ||
      script.style?.toLowerCase().includes(q) ||
      script.tags?.toLowerCase().includes(q) ||
      script.lyrics?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 right-8 z-50 px-6 py-3 rounded-xl shadow-2xl font-medium flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar / Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Disc size={24} className="text-white animate-spin-slow" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent hidden sm:block">
              Suno Manager
            </h1>
          </div>
          
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setEditingScript(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
              isFormOpen 
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                : "bg-white text-slate-900 hover:bg-slate-200 shadow-lg shadow-white/10"
            }`}
          >
            {isFormOpen ? <LayoutGrid size={18} /> : <Plus size={18} />}
            {isFormOpen ? "View List" : "New Script"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {isFormOpen ? (
            <ScriptForm 
              key="form"
              onScriptAdded={handleAddScript} 
              editingScript={editingScript}
              onUpdateScript={handleUpdateScript}
              onCancelEdit={() => {
                setIsFormOpen(false);
                setEditingScript(null);
              }}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SearchBar value={searchQuery} onChange={setSearchQuery} />

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-slate-800/50 rounded-2xl animate-pulse border border-slate-800" />
                  ))}
                </div>
              ) : (
                <ScriptList 
                  scripts={filteredScripts} 
                  onDelete={handleDeleteScript} 
                  onEdit={handleEditClick}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default App;