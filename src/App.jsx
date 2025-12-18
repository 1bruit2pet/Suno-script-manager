import React, { useState, useEffect } from 'react';
import { Plus, Disc, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScriptForm from './components/ScriptForm';
import ScriptList from './components/ScriptList';
import { scriptService } from './services/api';

function App() {
  const [scripts, setScripts] = useState([]);
  const [editingScript, setEditingScript] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
      setIsFormOpen(false); // Close form on success
    } catch (err) {
      console.error("Error adding script:", err);
      alert("Failed to add script");
    }
  };

  const handleUpdateScript = async (id, scriptData) => {
    try {
      await scriptService.update(id, scriptData);
      setEditingScript(null);
      fetchScripts();
    } catch (err) {
      console.error("Error updating script:", err);
      alert("Failed to update script");
    }
  };

  const handleEditClick = (script) => {
    setEditingScript(script);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteScript = async (id) => {
    if (window.confirm("Delete this script permanently?")) {
      try {
        await scriptService.delete(id);
        fetchScripts();
      } catch (err) {
        console.error("Error deleting script:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* Navbar / Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Disc size={24} className="text-white animate-spin-slow" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
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
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-slate-800/50 rounded-2xl animate-pulse border border-slate-800" />
                  ))}
                </div>
              ) : (
                <ScriptList 
                  scripts={scripts} 
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