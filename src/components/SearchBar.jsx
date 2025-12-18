import React from 'react';
import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

function SearchBar({ value, onChange }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative max-w-2xl mx-auto mb-8 group"
    >
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className={`h-5 w-5 transition-colors duration-300 ${value ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-12 pr-12 py-4 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl leading-5 text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-lg shadow-lg transition-all duration-300"
        placeholder="Search scripts, lyrics, styles..."
      />

      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-4 flex items-center"
        >
          <div className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </div>
        </button>
      )}
    </motion.div>
  );
}

export default SearchBar;
