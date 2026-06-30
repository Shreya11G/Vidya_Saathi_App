import React, { useState, useEffect } from 'react';
import { FileText, Copy, RotateCcw, Save, Trash2, FolderOpen } from 'lucide-react';
import api from '../api/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const ParagraphWriter = () => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [savedParagraphs, setSavedParagraphs] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState({
    lines: 0,
    words: 0,
    characters: 0,
    charactersWithSpaces: 0,
  });

  const calculateStats = (inputText) => {
    const lines = inputText.split('\n').filter((line) => line.trim() !== '').length;
    const words = inputText.trim() === '' ? 0 : inputText.trim().split(/\s+/).length;
    const characters = inputText.replace(/\s/g, '').length;
    const charactersWithSpaces = inputText.length;

    return { lines, words, characters, charactersWithSpaces };
  };

  const fetchSavedParagraphs = async () => {
    try {
      const response = await api.get('/paragraphs');
      setSavedParagraphs(response.data.data.paragraphs || []);
    } catch (error) {
      console.error('Failed to fetch paragraphs:', error);
      toast.error('Failed to load saved paragraphs');
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    fetchSavedParagraphs();
  }, []);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setStats(calculateStats(newText));
  };

  const handleClear = () => {
    setText('');
    setTitle('');
    setActiveId(null);
    setStats({ lines: 0, words: 0, characters: 0, charactersWithSpaces: 0 });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Text copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast.error('Failed to copy text to clipboard');
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      toast.error('Write something before saving');
      return;
    }

    setSaving(true);
    try {
      const payload = { content: text, title: title.trim() || undefined };

      if (activeId) {
        const response = await api.put(`/paragraphs/${activeId}`, payload);
        const updated = response.data.data.paragraph;
        setSavedParagraphs((prev) =>
          prev.map((p) => (p._id === activeId ? updated : p))
        );
        setTitle(updated.title);
        toast.success('Paragraph updated');
      } else {
        const response = await api.post('/paragraphs', payload);
        const created = response.data.data.paragraph;
        setSavedParagraphs((prev) => [created, ...prev]);
        setActiveId(created._id);
        setTitle(created.title);
        toast.success('Paragraph saved');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save paragraph');
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (paragraph) => {
    setText(paragraph.content);
    setTitle(paragraph.title);
    setActiveId(paragraph._id);
    setStats(calculateStats(paragraph.content));
    toast.success('Paragraph loaded');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved paragraph?')) return;

    try {
      await api.delete(`/paragraphs/${id}`);
      setSavedParagraphs((prev) => prev.filter((p) => p._id !== id));
      if (activeId === id) {
        setActiveId(null);
        setTitle('');
      }
      toast.success('Paragraph deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete paragraph');
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Paragraph Writer</h1>
          <p className="text-[var(--text-secondary)]">
            Analyze your text and save paragraphs for later
          </p>
        </div>
        <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Text Input</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={!text.trim() || saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  title={activeId ? 'Update saved paragraph' : 'Save paragraph'}
                >
                  {saving ? <LoadingSpinner size="small" color="white" /> : <Save className="w-4 h-4" />}
                  <span>{activeId ? 'Update' : 'Save'}</span>
                </button>
                {text && (
                  <button
                    onClick={handleCopy}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Copy text"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                {text && (
                  <button
                    onClick={handleClear}
                    className="p-2 text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                    title="Clear text"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional — auto-generated from first line)"
              className="w-full mb-3 px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm"
            />

            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Paste or type your paragraph here..."
              className="w-full h-96 p-4 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)] placeholder-gray-400 resize-none"
              style={{ fontFamily: 'monospace' }}
            />

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">
                {activeId ? 'Editing saved paragraph' : 'New paragraph'}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {stats.charactersWithSpaces} characters
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Text Statistics</h2>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-700">Lines</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.lines}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">Non-empty lines</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-700">Words</span>
                  <span className="text-2xl font-bold text-green-600">{stats.words}</span>
                </div>
                <p className="text-xs text-green-600 mt-1">Space-separated words</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-700">Characters</span>
                  <span className="text-2xl font-bold text-purple-600">{stats.characters}</span>
                </div>
                <p className="text-xs text-purple-600">Excluding spaces</p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-700">With Spaces</span>
                  <span className="text-2xl font-bold text-orange-600">{stats.charactersWithSpaces}</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">Including spaces</p>
              </div>
            </div>

            {text && (
              <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Quick Analysis</h3>
                <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <div className="flex justify-between">
                    <span>Avg words/line:</span>
                    <span>{stats.lines > 0 ? Math.round((stats.words / stats.lines) * 10) / 10 : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg chars/word:</span>
                    <span>{stats.words > 0 ? Math.round((stats.characters / stats.words) * 10) / 10 : 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reading time:</span>
                    <span>{Math.ceil(stats.words / 200)} min</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Saved Paragraphs
            </h3>

            {loadingSaved ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="small" />
              </div>
            ) : savedParagraphs.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] text-center py-4">
                No saved paragraphs yet. Click Save to keep your work.
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {savedParagraphs.map((paragraph) => (
                  <li
                    key={paragraph._id}
                    className={`flex items-start gap-2 p-3 rounded-lg border transition-colors ${
                      activeId === paragraph._id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[var(--border-color)] hover:bg-[var(--bg-primary)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleLoad(paragraph)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {paragraph.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {paragraph.content.slice(0, 60)}
                        {paragraph.content.length > 60 ? '...' : ''}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-70">
                        {formatDate(paragraph.updatedAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(paragraph._id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Tips</h3>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1">
              <li>• Paste text from any source</li>
              <li>• Statistics update in real-time</li>
              <li>• Click Save to store paragraphs in your account</li>
              <li>• Load a saved item to edit and Update</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParagraphWriter;
