import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Copy, Check, Music, Tag } from 'lucide-react';

function ScriptList({ scripts, onDelete, onEdit }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <AnimatePresence>
        {scripts.map((script) => (
          <motion.div
            key={script.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-slate-100 truncate pr-4">{script.title}</h3>
              <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onEdit(script)}
                  className="p-2 bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-600 transition-colors"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(script.id)}
                  className="p-2 bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {script.style && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Music size={12} /> {script.style}
                </span>
              )}
              {script.tags && script.tags.split(',').map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                  <Tag size={12} /> {tag.trim()}
                </span>
              ))}
            </div>

            {/* Content Area */}
            <div className="relative flex-grow bg-slate-900/50 rounded-xl p-4 border border-slate-800 group-hover:border-slate-700 transition-colors overflow-hidden">
              <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {script.lyrics}
              </pre>
              
              {/* Floating Copy Button */}
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => handleCopy(script.lyrics, script.id)}
                  className={`p-2 rounded-lg backdrop-blur-md transition-all duration-200 shadow-lg ${
                    copiedId === script.id
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {copiedId === script.id ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

          </motion.div>
        ))}
      </AnimatePresence>
      
      {scripts.length === 0 && (
        <div className="col-span-full text-center py-20">
          <div className="inline-block p-4 rounded-full bg-slate-800/50 mb-4">
            <Music size={48} className="text-slate-600" />
          </div>
          <p className="text-slate-500 text-lg">No scripts yet. Start creating!</p>
        </div>
      )}
    </div>
  );
}

export default ScriptList;