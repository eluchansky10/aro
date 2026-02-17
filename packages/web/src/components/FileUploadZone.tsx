'use client';

import { useRef, useState, useCallback } from 'react';
import type { UploadedFile } from '../lib/types';
import { MAX_CONTEXT_FILES, MAX_FILE_SIZE_BYTES } from '../lib/constants';

interface FileUploadZoneProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  disabled?: boolean;
}

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.markdown', '.csv'];

export default function FileUploadZone({ files, onFilesChange, disabled }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [...files];

    for (let i = 0; i < fileList.length; i++) {
      if (newFiles.length >= MAX_CONTEXT_FILES) break;

      const file = fileList[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) continue;
      if (file.size > MAX_FILE_SIZE_BYTES) continue;
      if (newFiles.some(f => f.name === file.name)) continue;

      const content = await file.text();
      newFiles.push({ name: file.name, content, size: file.size });
    }

    onFilesChange(newFiles);
  }, [files, onFilesChange]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || !e.dataTransfer.files.length) return;
    processFiles(e.dataTransfer.files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    processFiles(e.target.files);
    e.target.value = '';
  }

  function removeFile(name: string) {
    onFilesChange(files.filter(f => f.name !== name));
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, color: '#a3a3a3', marginBottom: 8, fontWeight: 500 }}>
        Context Files <span style={{ color: '#525252', fontWeight: 400 }}>(optional, max {MAX_CONTEXT_FILES} files, {MAX_FILE_SIZE_BYTES / 1024}KB each)</span>
      </label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{
          padding: files.length > 0 ? '10px 14px' : '20px 14px',
          background: dragOver ? '#1a1a2e' : '#141414',
          border: `1px dashed ${dragOver ? '#3b82f6' : '#333'}`,
          borderRadius: 8,
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: files.length > 0 ? 'left' as const : 'center' as const,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          style={{ display: 'none' }}
        />

        {files.length === 0 ? (
          <div style={{ color: '#525252', fontSize: 13 }}>
            Drop .txt, .md, or .csv files here, or click to browse
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {files.map((f) => (
              <div key={f.name} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
              }}>
                <span style={{ fontSize: 13, color: '#a3a3a3' }}>
                  {f.name} <span style={{ color: '#525252' }}>({(f.size / 1024).toFixed(1)}KB)</span>
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#525252',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '0 4px',
                  }}
                  title="Remove file"
                >
                  x
                </button>
              </div>
            ))}
            {files.length < MAX_CONTEXT_FILES && (
              <div style={{ fontSize: 12, color: '#404040', marginTop: 4 }}>
                + Add more files ({MAX_CONTEXT_FILES - files.length} remaining)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
