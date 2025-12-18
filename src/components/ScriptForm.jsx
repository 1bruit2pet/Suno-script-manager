import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Wand2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { scriptService } from '../services/api';

function ScriptForm({ onScriptAdded, editingScript, onUpdateScript, onCancelEdit }) {
  const [formData, setFormData] = React.useState({
    title: '',
    style: '',
    tags: '',
    lyrics: ''
  });
  
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  useEffect(() => {
    if (editingScript) {
      setFormData({
        title: editingScript.title,
        style: editingScript.style || '',
        tags: editingScript.tags || '',
        lyrics: editingScript.lyrics
      });
    } else {
      setFormData({ title: '', style: '', tags: '', lyrics: '' });
    }
  }, [editingScript]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingScript) {
      onUpdateScript(editingScript.id, formData);
    } else {
      onScriptAdded(formData);
    }
    if (!editingScript) {
      setFormData({ title: '', style: '', tags: '', lyrics: '' });
      setImportUrl('');
    }
  };

  const handleImport = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const data = await scriptService.importFromUrl(importUrl);
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        style: data.style || prev.style,
        lyrics: data.lyrics || prev.lyrics,
        tags: data.tags || prev.tags
      }));
    } catch (err) {
      console.error("Import failed", err);
      setImportError("Could not fetch data. Check URL.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden mb-10"
    >
      <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {editingScript ? <Edit2 className="text-indigo-400" size={20}/> : <Wand2 className="text-indigo-400" size={20}/>}
          {editingScript ? 'Edit Script' : 'Create New Script'}
        </h2>
        {editingScript && (
          <button onClick={onCancelEdit} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        )}
      </div>
      
      {/* Import Section */}
      {!editingScript && (
        <div className="px-6 pt-6 pb-2">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon size={16} className="text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Paste Suno Song URL to auto-fill (e.g. https://suno.com/song/...)"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 p-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
              />
            </div>
            <button
              onClick={handleImport}
              disabled={isImporting || !importUrl}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              Import
            </button>
          </div>
          {importError && <p className="text-red-400 text-xs mt-2 ml-1">{importError}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Metadata */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Title</label>
            <input
              type="text"
              name="title"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="e.g. Neon City Nights"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Musical Style</label>
            <input
              type="text"
              name="style"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="e.g. Synthwave, 120 BPM"
              value={formData.style}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tags</label>
            <input
              type="text"
              name="tags"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="e.g. Melancholic, Upbeat"
              value={formData.tags}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Right Column: Lyrics/Prompt */}
        <div className="lg:col-span-2 flex flex-col">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lyrics & Structure</label>
          <textarea
            name="lyrics"
            className="flex-grow min-h-[250px] w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 font-mono text-sm leading-relaxed placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            placeholder="[Verse 1]&#10;Enter your lyrics here..."
            value={formData.lyrics}
            onChange={handleChange}
            required
          />
          <div className="flex justify-end pt-4 gap-3">
            {editingScript && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-6 py-2.5 rounded-lg font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5 transition-all"
            >
              <Save size={18} />
              {editingScript ? 'Save Changes' : 'Save Script'}
            </button>
          </div>
        </div>

      </form>
    </motion.div>
  );
}

export default ScriptForm;