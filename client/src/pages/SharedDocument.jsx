import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Download, Eye, Loader2, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/api';

const formatFileSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const SharedDocument = () => {
  const { shareId } = useParams();
  const [sharedDoc, setSharedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const response = await api.get(`/documents/shared/${shareId}`);
        setSharedDoc(response.data.data.document);
      } catch (err) {
        setError(
          err.response?.data?.message || 'This shared document is unavailable'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [shareId]);

  const openShared = async () => {
    try {
      const response = await api.get(`/documents/shared/${shareId}/view`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Failed to open document');
    }
  };

  const downloadShared = async () => {
    try {
      const response = await api.get(`/documents/shared/${shareId}/download`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = sharedDoc.originalFileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !sharedDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="text-center max-w-md">
          <FileText className="w-14 h-14 text-[var(--text-secondary)] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            Document Unavailable
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Bot className="w-4 h-4" />
            Go to VidyaSaathi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            {sharedDoc.title}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{sharedDoc.originalFileName}</p>
        </div>

        {sharedDoc.description && (
          <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
            {sharedDoc.description}
          </p>
        )}

        <div className="flex justify-center gap-4 text-sm text-[var(--text-secondary)] mb-8">
          <span>{formatFileSize(sharedDoc.fileSize)}</span>
          <span>•</span>
          <span>Shared via VidyaSaathi</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={openShared}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Eye className="w-5 h-5" />
            Open
          </button>
          <button
            onClick={downloadShared}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-primary)]"
          >
            <Download className="w-5 h-5" />
            Download
          </button>
        </div>

        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          <Link to="/login" className="text-blue-500 hover:underline">
            Sign in
          </Link>{' '}
          to save documents in your own library
        </p>
      </div>
    </div>
  );
};

export default SharedDocument;
