import React, { useState, useEffect } from 'react';
import ScriptForm from './components/ScriptForm';
import ScriptList from './components/ScriptList';
import { scriptService } from './services/api';

function App() {
  const [scripts, setScripts] = useState([]);
  const [editingScript, setEditingScript] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const data = await scriptService.getAll();
      setScripts(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching scripts:", err);
      setError("Failed to load scripts. Check if the backend is running.");
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

  const handleDeleteScript = async (id) => {
    if (window.confirm("Are you sure you want to delete this script?")) {
      try {
        await scriptService.delete(id);
        fetchScripts();
      } catch (err) {
        console.error("Error deleting script:", err);
        alert("Failed to delete script");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">Suno Script Manager</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <ScriptForm 
          onScriptAdded={handleAddScript} 
          editingScript={editingScript}
          onUpdateScript={handleUpdateScript}
          onCancelEdit={() => setEditingScript(null)}
        />
        
        <div className="border-t border-gray-300 my-8"></div>
        
        {loading ? (
          <p className="text-center text-gray-500">Loading scripts...</p>
        ) : (
          <ScriptList 
            scripts={scripts} 
            onDelete={handleDeleteScript} 
            onEdit={setEditingScript}
          />
        )}
      </div>
    </div>
  );
}

export default App;
