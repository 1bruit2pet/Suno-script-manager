import React from 'react';

function ScriptForm({ onScriptAdded, editingScript, onUpdateScript, onCancelEdit }) {
  const [title, setTitle] = React.useState('');
  const [lyrics, setLyrics] = React.useState('');
  const [style, setStyle] = React.useState('');
  const [tags, setTags] = React.useState('');

  React.useEffect(() => {
    if (editingScript) {
      setTitle(editingScript.title);
      setLyrics(editingScript.lyrics);
      setStyle(editingScript.style || '');
      setTags(editingScript.tags || '');
    } else {
      setTitle('');
      setLyrics('');
      setStyle('');
      setTags('');
    }
  }, [editingScript]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const scriptData = { title, lyrics, style, tags };
    if (editingScript) {
      onUpdateScript(editingScript.id, scriptData);
    } else {
      onScriptAdded(scriptData);
    }
    // Reset form
    setTitle('');
    setLyrics('');
    setStyle('');
    setTags('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-bold mb-4">{editingScript ? 'Edit Script' : 'Add New Script'}</h2>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-gray-700 font-bold mb-2">Title</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-2">Style</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="e.g., Electronic, Jazz"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-2">Tags</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Comma separated"
          />
        </div>
        <div>
          <label className="block text-gray-700 font-bold mb-2">Lyrics / Prompt</label>
          <textarea
            className="w-full border p-2 rounded h-32"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {editingScript ? 'Update' : 'Save'}
        </button>
        {editingScript && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ScriptForm;
