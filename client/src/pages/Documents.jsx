import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Search,
  Trash2,
  Eye,
  Download,
  Share2,
  Copy,
  X,
  Loader2,
  FolderOpen,
  Link2,
  Pencil,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp';
const MAX_SIZE = 15 * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const getFileIcon = (mimeType) => {
  if (mimeType?.startsWith('image/')) return ImageIcon;
  return FileText;
};

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);
  const [shareDoc, setShareDoc] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [sharingLoading, setSharingLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents');
      setDocuments(response.data.data.documents || []);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file) => {
    if (file.size > MAX_SIZE) return 'File size exceeds 15MB limit';
    return null;
  };

  const handleFilesSelect = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const valid = [];
    for (const file of incoming) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    setSelectedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size));
      const merged = [...prev];
      for (const file of valid) {
        if (!names.has(file.name + file.size)) merged.push(file);
      }
      return merged;
    });

    if (valid.length === 1 && !uploadTitle) {
      setUploadTitle(valid[0].name.replace(/\.[^.]+$/, ''));
    }
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setUploadTitle('');
    setUploadDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));
    if (selectedFiles.length === 1 && uploadTitle.trim()) {
      formData.append('title', uploadTitle.trim());
    }
    if (uploadDescription.trim()) formData.append('description', uploadDescription.trim());

    try {
      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded =
        response.data.data.documents || [response.data.data.document].filter(Boolean);
      setDocuments((prev) => [...uploaded, ...prev]);
      clearSelectedFiles();
      toast.success(
        uploaded.length === 1
          ? 'Document saved to your library'
          : `${uploaded.length} documents saved to your library`
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const openDocument = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc._id}/view`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Failed to open document');
    }
  };

  const downloadDocument = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc._id}/download`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.originalFileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download document');
    }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm('Delete this document permanently?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const saveEdit = async () => {
    if (!editingDoc) return;
    try {
      const response = await api.put(`/documents/${editingDoc._id}`, {
        title: editingDoc.title,
        description: editingDoc.description,
      });
      setDocuments((prev) =>
        prev.map((d) => (d._id === editingDoc._id ? response.data.data.document : d))
      );
      setEditingDoc(null);
      toast.success('Document updated');
    } catch {
      toast.error('Failed to update document');
    }
  };

  const openShareModal = async (doc) => {
    setShareDoc(doc);
    if (doc.isShared && doc.shareId) {
      setShareUrl(`${window.location.origin}/documents/shared/${doc.shareId}`);
      return;
    }
    setShareUrl('');
    setSharingLoading(true);
    try {
      const response = await api.post(`/documents/${doc._id}/share`);
      const updated = response.data.data.document;
      setDocuments((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
      setShareDoc(updated);
      setShareUrl(response.data.data.shareUrl);
    } catch {
      toast.error('Failed to enable sharing');
      setShareDoc(null);
    } finally {
      setSharingLoading(false);
    }
  };

  const disableSharing = async () => {
    if (!shareDoc) return;
    try {
      const response = await api.delete(`/documents/${shareDoc._id}/share`);
      const updated = response.data.data.document;
      setDocuments((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
      setShareDoc(updated);
      setShareUrl('');
      toast.success('Sharing disabled');
    } catch {
      toast.error('Failed to disable sharing');
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const filtered = documents.filter((doc) => {
    const q = searchTerm.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.originalFileName?.toLowerCase().includes(q) ||
      doc.description?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
          My Documents
        </h1>
        <p className="text-[var(--text-secondary)]">
          Upload, store, open, and share your study documents anytime
        </p>
      </motion.div>

      {/* Upload */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Upload Document</h2>
        </div>

        <div
          className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFilesSelect(e.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={ACCEPTED_TYPES}
            onChange={(e) => handleFilesSelect(e.target.files)}
          />
          <FolderOpen className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="text-[var(--text-primary)] font-medium">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file(s) selected`
              : 'Click or drag files here'}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            PDF, Word, PowerPoint, TXT, images — max 15MB each
          </p>
          {selectedFiles.length > 0 && (
            <ul className="mt-4 text-left max-w-md mx-auto space-y-1">
              {selectedFiles.map((file) => (
                <li
                  key={`${file.name}-${file.size}`}
                  className="text-sm text-[var(--text-secondary)] truncate"
                >
                  {file.name} ({formatFileSize(file.size)})
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedFiles.length === 1 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Document title"
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
            />
            <input
              type="text"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Description (optional)"
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
            />
          </div>
        )}

        <div className="mt-4 flex justify-end gap-3">
          {selectedFiles.length > 0 && (
            <button
              onClick={clearSelectedFiles}
              className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] rounded-lg"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {selectedFiles.length > 1
              ? `Save ${selectedFiles.length} Documents`
              : 'Save to Library'}
          </button>
        </div>
      </motion.div>

      {/* Search + list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-12 text-center">
            <FileText className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" />
            <p className="text-[var(--text-primary)] font-medium">No documents yet</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Upload your first document to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((doc) => {
              const Icon = getFileIcon(doc.mimeType);
              return (
                <div
                  key={doc._id}
                  className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-5 hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                        {doc.originalFileName}
                      </p>
                      {doc.description && (
                        <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[var(--text-secondary)]">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.updatedAt)}</span>
                        {doc.isShared && (
                          <>
                            <span>•</span>
                            <span className="text-green-500 flex items-center gap-1">
                              <Link2 className="w-3 h-3" /> Shared
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
                    <button
                      onClick={() => openDocument(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 rounded-lg"
                    >
                      <Eye className="w-4 h-4" /> Open
                    </button>
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button
                      onClick={() => openShareModal(doc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600/10 text-green-500 hover:bg-green-600/20 rounded-lg"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button
                      onClick={() => setEditingDoc({ ...doc })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => deleteDocument(doc._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Edit modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Edit Document</h3>
              <button onClick={() => setEditingDoc(null)}>
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={editingDoc.title}
                onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
              />
              <textarea
                value={editingDoc.description || ''}
                onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })}
                rows={3}
                placeholder="Description"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingDoc(null)}
                className="px-4 py-2 text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {shareDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Share Document</h3>
              <button onClick={() => setShareDoc(null)}>
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Anyone with this link can view and download &quot;{shareDoc.title}&quot;
            </p>
            {sharingLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : shareUrl ? (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                />
                <button
                  onClick={copyShareLink}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">Sharing is disabled for this document.</p>
            )}
            <div className="flex justify-between mt-6">
              {shareUrl && (
                <button
                  onClick={disableSharing}
                  className="text-sm text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg"
                >
                  Disable sharing
                </button>
              )}
              <button
                onClick={() => setShareDoc(null)}
                className="ml-auto px-4 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
