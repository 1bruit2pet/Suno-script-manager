import React from 'react';

function ScriptList({ scripts, onDelete, onEdit }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {scripts.map((script) => (
        <div key={script.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 text-indigo-600">{script.title}</h3>
            {script.style && <p className="text-sm text-gray-500 mb-1">Style: {script.style}</p>}
            {script.tags && <p className="text-xs text-gray-400 mb-4">Tags: {script.tags}</p>}
            <div className="bg-gray-100 p-4 rounded mb-4 whitespace-pre-wrap font-mono text-sm max-h-48 overflow-y-auto">
              {script.lyrics}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => onEdit(script)}
              className="text-blue-500 hover:text-blue-700 font-semibold"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(script.id)}
              className="text-red-500 hover:text-red-700 font-semibold"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      {scripts.length === 0 && (
        <p className="text-gray-500 col-span-full text-center py-8">No scripts found. Create one above!</p>
      )}
    </div>
  );
}

export default ScriptList;
