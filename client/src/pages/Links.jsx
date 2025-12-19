import React, { useState, useEffect } from 'react';
import {
Plus,
Search,
ExternalLink,
Star,
Trash2,
Edit,
X,
Copy,
Globe,
BookOpen,
Video,
FileText,
Code,
Heart
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';


const Links = () => {
// State for storing all user links
const [links, setLinks] = useState([]);

// State for loading indicator
const [loading, setLoading] = useState(true);

// State for controlling add/edit modal visibility
const [showAddModal, setShowAddModal] = useState(false);

// State for the link being edited (null when adding new)
const [editingLink, setEditingLink] = useState(null);

// State for search functionality
const [searchTerm, setSearchTerm] = useState('');

// State for category filtering
const [filterCategory, setFilterCategory] = useState('all');

// State for favorites filtering
const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

// Form data state for add/edit modal
const [formData, setFormData] = useState({
title: '',
url: '',
description: '',
category: 'study_material',
subject: '',
tags: []
});

// Available categories for links
const categories = [
{ value: 'study_material', label: 'Study Material', icon: BookOpen },
{ value: 'tutorial', label: 'Tutorial', icon: Video },
{ value: 'documentation', label: 'Documentation', icon: FileText },
{ value: 'video_lecture', label: 'Video Lecture', icon: Video },
{ value: 'research_paper', label: 'Research Paper', icon: FileText },
{ value: 'tool', label: 'Tool', icon: Code },
{ value: 'reference', label: 'Reference', icon: Globe },
{ value: 'course', label: 'Course', icon: BookOpen },
{ value: 'practice', label: 'Practice', icon: Code },
{ value: 'other', label: 'Other', icon: Globe }
];


//Fetch all links from backend on component mount
  
  useEffect(() => {
  fetchLinks();
  }, []);

const fetchLinks = async () => {
try {
setLoading(true);
const response = await axios.get('/links');
setLinks(response.data.data.links);
} catch (error) {
console.error('Failed to fetch links:', error);
toast.error('Failed to load links');
} finally {
setLoading(false);
}
};

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
setFormData(prev => ({
...prev,
tags: [...prev.tags, tag]
}));
input.value = '';
}
}
};

const removeTag = (tagToRemove) => {
setFormData(prev => ({
...prev,
tags: prev.tags.filter(tag => tag !== tagToRemove)
}));
};

const resetForm = () => {
setFormData({
title: '',
url: '',
description: '',
category: 'study_material',
subject: '',
tags: []
});
};

const isValidUrl = (url) => {
try {
new URL(url.startsWith('http') ? url : `https://${url}`);
return true;
} catch {
return false;
}
};

const handleSubmit = async (e) => {
e.preventDefault();


if (!formData.title.trim()) {
  toast.error('Link title is required');
  return;
}
if (!formData.url.trim()) {
  toast.error('URL is required');
  return;
}
if (!isValidUrl(formData.url)) {
  toast.error('Please enter a valid URL');
  return;
}

try {
  let processedUrl = formData.url.trim();
  if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
    processedUrl = 'https://' + processedUrl;
  }

  const linkData = {
    ...formData,
    url: processedUrl,
    title: formData.title.trim(),
    description: formData.description.trim(),
    subject: formData.subject.trim()
  };

  if (editingLink) {
    await axios.put(`/links/${editingLink._id}`, linkData);
    toast.success('Link updated successfully');
    setEditingLink(null);
  } else {
    await axios.post('/links', linkData);
    toast.success('Link added successfully');
    setShowAddModal(false);
  }
  
  resetForm();
  fetchLinks();
} catch (error) {
  console.error('Failed to save link:', error);
  const errorMessage = error.response?.data?.message || 'Failed to save link';
  toast.error(errorMessage);
}


};

const handleLinkClick = async (link) => {
try {
await axios.post(`/links/${link._id}/click`);
window.open(link.url, '_blank', 'noopener,noreferrer');
setLinks(prev => prev.map(l =>
l._id === link._id
? { ...l, clickCount: l.clickCount + 1, lastVisited: new Date().toISOString() }
: l
));
} catch (error) {
console.error('Failed to record click:', error);
window.open(link.url, '_blank', 'noopener,noreferrer');
}
};

const handleToggleFavorite = async (linkId) => {
try {
await axios.patch(`/links/${linkId}/favorite`);
setLinks(prev => prev.map(link =>
link._id === linkId
? { ...link, isFavorite: !link.isFavorite }
: link
));
toast.success('Favorite status updated');
} catch (error) {
console.error('Failed to toggle favorite:', error);
const errorMessage = error.response?.data?.message || 'Failed to update favorite';
toast.error(errorMessage);
}
};

const handleDeleteLink = async (linkId) => {
if (!window.confirm('Are you sure you want to delete this link?')) return;
try {
await axios.delete(`/links/${linkId}`);
toast.success('Link deleted successfully');
fetchLinks();
} catch (error) {
console.error('Failed to delete link:', error);
const errorMessage = error.response?.data?.message || 'Failed to delete link';
toast.error(errorMessage);
}
};

const handleEditLink = (link) => {
setEditingLink(link);
setFormData({
title: link.title,
url: link.url,
description: link.description || '',
category: link.category,
subject: link.subject || '',
tags: link.tags
});
};

const handleCancelEdit = () => {
setEditingLink(null);
resetForm();
};

const handleCopyUrl = async (url) => {
try {
await navigator.clipboard.writeText(url);
toast.success('URL copied to clipboard');
} catch (error) {
console.error('Failed to copy URL:', error);
toast.error('Failed to copy URL');
}
};

const getCategoryIcon = (category) => {
const categoryConfig = categories.find(cat => cat.value === category);
return categoryConfig ? categoryConfig.icon : Globe;
};

const filteredLinks = links.filter(link => {
const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
(link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
link.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));


const matchesCategory = filterCategory === 'all' || link.category === filterCategory;
const matchesFavorites = !showFavoritesOnly || link.isFavorite;
return matchesSearch && matchesCategory && matchesFavorites;


});

const sortedLinks = filteredLinks.sort((a, b) => {
if (a.isFavorite && !b.isFavorite) return -1;
if (!a.isFavorite && b.isFavorite) return 1;
return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
});

if (loading) {
return ( <div className="flex items-center justify-center py-12"> <LoadingSpinner size="large" /> </div>
);
}

return (
 <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Link Keeper</h1>
          <p className="text-[var(--text-secondary)]">
            Save and organize your important study resources
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Link</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm borderborder border-[var(--border-color)]
 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search links, descriptions, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)]"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)]"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Favorites Toggle */}
        <div className="mt-4 flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              className="border border-[var(--border-color)] text-red-600 focus:ring-red-500"
            />
            <span className="ml-2 text-sm text-[var(--text-secondary)] flex items-center">
              <Heart className="w-4 h-4 mr-1 text-red-500" />
              Show favorites only
            </span>
          </label>
        </div>
      </div>

      {/* Links Grid */}
      <div className="space-y-4">
        {sortedLinks.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-12 text-center">
            <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-blue-500" />
            </div>

            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No links found
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              {searchTerm || filterCategory !== 'all' || showFavoritesOnly
                ? 'Try adjusting your search or filters'
                : 'Start building your collection of important study resources'
              }
            </p>
            {!searchTerm && filterCategory === 'all' && !showFavoritesOnly && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Link</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedLinks.map((link) => {
              const CategoryIcon = getCategoryIcon(link.category);
              return (
                <div
                  key={link._id}
                  className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 hover:shadow-md transition-all duration-200 group"
                >
                  {/* Link Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CategoryIcon className="w-5 h-5 text-blue-500" />
                      {link.isFavorite && (
                        <Heart className="w-4 h-4 text-red-500 fill-current" />
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyUrl(link.url)}
                        className="p-1 rounded hover:bg-[var(--bg-primary)] text-gray-500 hover:text-blue-600 transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(link._id)}
                        className={`p-1 rounded hover:bg-[var(--bg-primary)] transition-colors ${
                          link.isFavorite ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                        title={link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditLink(link)}
                        className="p-1 rounded hover:bg-[var(--bg-primary)] text-gray-500 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link._id)}
                        className="p-1 rounded hover:bg-[var(--bg-primary)] text-gray-500 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Link Content */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-2 line-clamp-2">
                      {link.title}
                    </h3>
                    {link.description && (
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
                        {link.description}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                      {link.url}
                    </p>
                  </div>

                  {/* Tags */}
                  {link.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {link.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {link.tags.length > 3 && (
                        <span className="inline-block bg-[var(--bg-primary)] text-[var(--text-secondary)] text-xs px-2 py-1 rounded-full">
                          +{link.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Link Footer */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-primary)] mb-3">
                    <span className="capitalize">
                      {categories.find(cat => cat.value === link.category)?.label || link.category}
                    </span>
                    <span>{link.clickCount} clicks</span>
                  </div>

                  {/* Open Link Button */}
                  <button
                    onClick={() => handleLinkClick(link)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Link</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Link Modal */}
      {(showAddModal || editingLink) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-secondary)] rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {editingLink ? 'Edit Link' : 'Add New Link'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    handleCancelEdit();
                  }}
                  className="text-gray-400 hover:text-[var(--text-primary)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Link Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                    placeholder="Enter link title"
                    required
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                    placeholder="Brief description of the link (optional)"
                  />
                </div>

                {/* Category and Subject */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(text-primary)] mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Type and press Enter to add tags"
                    onKeyDown={handleTagInput}
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                  />
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-sm px-2 py-1 rounded-full"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    {editingLink ? 'Update Link' : 'Add Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      handleCancelEdit();
                    }}
                    className="flex-1 bg-[var(--bg-secondary)]  hover:bg-[var(--bg-primary)] text-[var(--text-primary)] py-2 px-4 rounded-lg transition-colors border border-[var(--border-color)]"
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

export default Links;
