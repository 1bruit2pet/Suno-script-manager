import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScriptForm from './components/ScriptForm';
import ScriptList from './components/ScriptList';

const API_URL = 'http://localhost:8000/scripts/';

function App() {
  const [scripts, setScripts] = useState([]);
  const [editingScript, setEditingScript] = useState(null);

  const fetchScripts = async () => {
    try {
      const response = await axios.get(API_URL);
      setScripts(response.data);
    } catch (error) {
      console.error("Error fetching scripts:", error);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleAddScript = async (scriptData) => {
    try {
      await axios.post(API_URL, scriptData);
      fetchScripts();
    } catch (error) {
      console.error("Error adding script:", error);
    }
  };

  const handleUpdateScript = async (id, scriptData) => {
    try {
      await axios.patch(`${API_URL}${id}`, scriptData);
      setEditingScript(null);
      fetchScripts();
    } catch (error) {
      console.error("Error updating script:", error);
    }
  };

  const handleDeleteScript = async (id) => {
    if (window.confirm("Are you sure you want to delete this script?")) {
      try {
        await axios.delete(`${API_URL}${id}`);
        fetchScripts();
      } catch (error) {
        console.error("Error deleting script:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">Suno Script Manager</h1>
        
        <ScriptForm 
          onScriptAdded={handleAddScript} 
          editingScript={editingScript}
          onUpdateScript={handleUpdateScript}
          onCancelEdit={() => setEditingScript(null)}
        />
        
        <div className="border-t border-gray-300 my-8"></div>
        
        <ScriptList 
          scripts={scripts} 
          onDelete={handleDeleteScript} 
          onEdit={setEditingScript}
        />
      </div>
    </div>
  );
}

export default App;