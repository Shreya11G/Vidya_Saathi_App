import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Pin,
  Heart,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'study',
    color: 'yellow',
    tags: []
  });

  const noteColors = [
    { name: 'yellow', class: 'bg-yellow-200 border-yellow-300', textClass: 'text-yellow-900' },
    { name: 'blue', class: 'bg-blue-200 border-blue-300', textClass: 'text-blue-900' },
    { name: 'green', class: 'bg-green-200 border-green-300', textClass: 'text-green-900' },
    { name: 'pink', class: 'bg-pink-200 border-pink-300', textClass: 'text-pink-900' },
    { name: 'orange', class: 'bg-orange-200 border-orange-300', textClass: 'text-orange-900' },
    { name: 'purple', class: 'bg-purple-200 border-purple-300', textClass: 'text-purple-900' },
    { name: 'gray', class: 'bg-gray-200 border-gray-300', textClass: 'text-gray-900' }
  ];

  const fetchNotes = async () => {
    try {
      const response = await axios.get('/notes');
      setNotes(response.data.data.notes);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagInput = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.target;
      const tag = input.value.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
        input.value = '';
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: 'study', color: 'yellow', tags: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      if (editingNote) {
        await axios.put(`/notes/${editingNote._id}`, formData);
        toast.success('Note updated successfully');
        setEditingNote(null);
      } else {
        await axios.post('/notes', formData);
        toast.success('Note created successfully');
        setShowAddModal(false);
      }
      resetForm();
      fetchNotes();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to save note';
      toast.error(errorMessage);
    }
  };

  const handleTogglePin = async (noteId) => {
    try {
      await axios.patch(`/notes/${noteId}/pin`);
      fetchNotes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update note');
    }
  };

  const handleToggleFavorite = async (noteId) => {
    try {
      await axios.patch(`/notes/${noteId}/favorite`);
      fetchNotes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await axios.delete(`/notes/${noteId}`);
      toast.success('Note deleted successfully');
      fetchNotes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete note');
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content, category: note.category, color: note.color, tags: note.tags });
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    resetForm();
  };

  const getNoteColorClasses = (color) => {
    return noteColors.find(c => c.name === color) || noteColors[0];
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || note.category === filterCategory;
    return matchesSearch && matchesCategory && !note.isArchived;
  });

  const sortedNotes = filteredNotes.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (loading) return <div className="flex items-center justify-center py-12"><LoadingSpinner size="large" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notes</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and organize your sticky notes</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /><span>Add Note</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="study">Study</option>
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="ideas">Ideas</option>
              <option value="reminders">Reminders</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="space-y-4">
        {sortedNotes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-yellow-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notes found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || filterCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first note to get started'}
            </p>
            {!searchTerm && filterCategory === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /><span>Add Your First Note</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedNotes.map((note) => {
              const colorClasses = getNoteColorClasses(note.color);
              return (
                <div key={note._id} className={`${colorClasses.class} border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 relative group`} style={{ minHeight: '200px' }}>
                  {/* Note Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {note.isPinned && <Pin className="w-4 h-4 text-gray-600 fill-current" />}
                      {note.isFavorite && <Heart className="w-4 h-4 text-red-500 fill-current" />}
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleTogglePin(note._id)} className={`p-1 rounded hover:bg-white/50 transition-colors ${note.isPinned ? 'text-gray-700' : 'text-gray-500'}`} title={note.isPinned ? 'Unpin' : 'Pin'}><Pin className="w-4 h-4" /></button>
                      <button onClick={() => handleToggleFavorite(note._id)} className={`p-1 rounded hover:bg-white/50 transition-colors ${note.isFavorite ? 'text-red-500' : 'text-gray-500'}`} title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}><Heart className="w-4 h-4" /></button>
                      <button onClick={() => handleEditNote(note)} className="p-1 rounded hover:bg-white/50 text-gray-500 hover:text-gray-700 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                                              <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="p-1 rounded hover:bg-white/50 text-gray-500 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className={`${colorClasses.textClass}`}>
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{note.title}</h3>
                    <p className="text-sm opacity-80 line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                  </div>

                  {/* Note Footer */}
                  <div className="absolute bottom-4 left-4 right-4">
                    {/* Tags */}
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="inline-block bg-white/50 text-xs px-2 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="inline-block bg-white/50 text-xs px-2 py-1 rounded-full">
                            +{note.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Category and Date */}
                    <div className="flex items-center justify-between text-xs opacity-60">
                      <span className="capitalize">{note.category}</span>
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Note Modal */}
      {(showAddModal || editingNote) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingNote ? 'Edit Note' : 'Add New Note'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    handleCancelEdit();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Note Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter note title"
                    required
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content *</label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter note content"
                    required
                  />
                </div>

                {/* Category and Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="study">Study</option>
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="ideas">Ideas</option>
                      <option value="reminders">Reminders</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                    <div className="flex space-x-2">
                      {noteColors.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color: color.name }))}
                          className={`w-8 h-8 rounded-full border-2 ${color.class} ${
                            formData.color === color.name ? 'border-gray-800 dark:border-white' : 'border-gray-300'
                          } hover:scale-110 transition-transform`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                  <input
                    type="text"
                    placeholder="Type and press Enter to add tags"
                    onKeyDown={handleTagInput}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 text-sm px-2 py-1 rounded-full"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    {editingNote ? 'Update Note' : 'Create Note'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      handleCancelEdit();
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
