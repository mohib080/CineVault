import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { PrivacyToggle } from './PrivacyToggle';

interface LetterboxdImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const LetterboxdImportModal: React.FC<LetterboxdImportModalProps> = ({ onClose, onSuccess }) => {
  const [importType, setImportType] = useState<'diary' | 'watchlist'>('diary');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PRIVATE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a valid .csv file exported from Letterboxd.');
      return;
    }
    setError(null);
    setSelectedFile(file);

    // Auto-detect import type from filename
    if (file.name.toLowerCase().includes('watchlist')) {
      setImportType('watchlist');
    } else if (file.name.toLowerCase().includes('diary')) {
      setImportType('diary');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!fileContent.trim()) {
      setError('Please select a CSV file first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.importLetterboxdCsv(fileContent, visibility, importType);
      setResult({
        imported: res.imported,
        skipped: res.skipped,
        total: res.total
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to import Letterboxd CSV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-card"
        style={{ maxWidth: 580, width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <UploadCloud size={20} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Import from Letterboxd</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {result ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Import Completed!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Successfully imported <strong style={{ color: 'var(--accent-gold)' }}>{result.imported}</strong> films into CineVault.
                {result.skipped > 0 && ` (${result.skipped} rows skipped)`}
              </p>
              <button className="btn btn-primary" onClick={onClose} style={{ minWidth: 160 }}>
                Done
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.85rem' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Import Type Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Dataset Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setImportType('diary')}
                    style={{
                      padding: '0.65rem',
                      background: importType === 'diary' ? 'rgba(229, 9, 20, 0.15)' : 'var(--bg-input)',
                      border: importType === 'diary' ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: importType === 'diary' ? '#fff' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    📖 Diary & Reviews (diary.csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportType('watchlist')}
                    style={{
                      padding: '0.65rem',
                      background: importType === 'watchlist' ? 'rgba(229, 9, 20, 0.15)' : 'var(--bg-input)',
                      border: importType === 'watchlist' ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: importType === 'watchlist' ? '#fff' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    📑 Watchlist (watchlist.csv)
                  </button>
                </div>
              </div>

              {/* Privacy Setting */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Default Privacy for Imported Films
                </label>
                <PrivacyToggle value={visibility} onChange={setVisibility} />
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-glow)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.75rem 1rem',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                {selectedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={36} color="var(--accent-gold)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {selectedFile.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to change file
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <UploadCloud size={36} color="var(--text-muted)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      Choose or Drag & Drop Letterboxd CSV
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Supports official exports (diary.csv, watchlist.csv)
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={!selectedFile || loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Start Import'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
