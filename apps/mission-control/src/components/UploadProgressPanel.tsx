import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud, FileText, CheckCircle, AlertTriangle, Loader, RefreshCw, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Upload {
  id: string;
  filename: string;
  totalBytes: number;
  uploadedBytes: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'done' | 'failed' | 'cancelled';
  error?: string;
  file: File; // Original File object
  cancelController?: AbortController; // For aborting ongoing fetch requests
}

const API_BASE_URL = '/api/v1/uploads';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export const UploadProgressPanel: React.FC = () => {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const uploadQueue = useRef<File[]>([]);
  const processingUploads = useRef<Set<string>>(new Set());
  const maxConcurrentUploads = 3;

  const updateUpload = useCallback((id: string, updates: Partial<Upload>) => {
    setUploads(prevUploads =>
      prevUploads.map(upload => (upload.id === id ? { ...upload, ...updates, uploadedBytes: Math.min(updates.uploadedBytes ?? upload.uploadedBytes, upload.totalBytes) } : upload))
    );
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads(prevUploads => prevUploads.filter(upload => upload.id !== id));
    processingUploads.current.delete(id);
  }, []);

  const processQueue = useCallback(async () => {
    if (uploadQueue.current.length === 0 || processingUploads.current.size >= maxConcurrentUploads) {
      return;
    }

    const nextFile = uploadQueue.current.shift();
    if (!nextFile) return;

    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const cancelController = new AbortController();

    const newUpload: Upload = {
      id: uploadId,
      filename: nextFile.name,
      totalBytes: nextFile.size,
      uploadedBytes: 0,
      percentage: 0,
      status: 'uploading',
      file: nextFile,
      cancelController: cancelController,
    };
    setUploads(prev => [...prev, newUpload]);
    processingUploads.current.add(uploadId);

    try {
      if (nextFile.size <= CHUNK_SIZE) {
        // Standard upload for small files
        await uploadStandard(newUpload, updateUpload, cancelController);
      } else {
        // Chunked upload for larger files
        await uploadChunked(newUpload, updateUpload, cancelController);
      }
      updateUpload(uploadId, { status: 'done', percentage: 100 });
    } catch (error: any) {
      console.error('Upload failed:', error);
      updateUpload(uploadId, { status: 'failed', error: error.message || 'Unknown error' });
    } finally {
      processingUploads.current.delete(uploadId);
      processQueue(); // Try to process the next item in queue
    }
  }, [updateUpload, removeUpload]);


  useEffect(() => {
    processQueue();
  }, [uploads, processQueue]); // Rerun when uploads state changes to trigger queue processing

  const onDrop = useCallback((acceptedFiles: File[]) => {
    uploadQueue.current = [...uploadQueue.current, ...acceptedFiles];
    processQueue();
  }, [processQueue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleCancel = useCallback(async (uploadId: string) => {
    const uploadToCancel = uploads.find(u => u.id === uploadId);
    if (!uploadToCancel) return;

    if (uploadToCancel.cancelController) {
      uploadToCancel.cancelController.abort(); // Abort ongoing fetch
    }

    // If it's a chunked upload, tell the backend to clean up
    if (uploadToCancel.totalBytes > CHUNK_SIZE) {
      try {
        await fetch(`${API_BASE_URL}/chunked/${uploadToCancel.id}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn(`Failed to notify backend of chunked upload cancellation for ${uploadToCancel.id}:`, e);
      }
    }
    updateUpload(uploadId, { status: 'cancelled', error: 'Upload cancelled' });
    setTimeout(() => removeUpload(uploadId), 3000); // Remove after a delay
  }, [uploads, updateUpload, removeUpload]);


  const handleRetry = useCallback(async (uploadId: string) => {
    const uploadToRetry = uploads.find(u => u.id === uploadId);
    if (!uploadToRetry) return;

    // Remove the old entry and add the file back to the queue
    removeUpload(uploadId);
    uploadQueue.current = [uploadToRetry.file, ...uploadQueue.current];
    processQueue();
  }, [uploads, removeUpload, processQueue]);


  return (
    <div data-testid="upload-progress-panel" className="bg-panel border border-border rounded-lg shadow-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-white flex items-center gap-2">
        <UploadCloud size={18} className="text-accentCyan" /> File Uploads
      </h3>

      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4',
          isDragActive ? 'border-accentCyan bg-accentCyan/10 text-accentCyan' : 'border-gray-600 bg-background hover:border-gray-400 text-gray-400'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud size={24} className="mx-auto mb-2" />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map(upload => (
            <div key={upload.id} className="bg-background border border-gray-700 rounded-md p-3 flex items-center justify-between gap-3">
              <div className="flex items-center flex-grow gap-3">
                {upload.status === 'uploading' && <Loader size={16} className="text-blue-400 animate-spin" />}
                {upload.status === 'processing' && <Loader size={16} className="text-yellow-400 animate-spin" />}
                {upload.status === 'done' && <CheckCircle size={16} className="text-green-500" />}
                {upload.status === 'failed' && <AlertTriangle size={16} className="text-red-500" />}
                {upload.status === 'cancelled' && <XCircle size={16} className="text-gray-500" />}
                <div className="flex-grow">
                  <p className="text-sm font-medium text-white">{upload.filename}</p>
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                    <div
                      className={clsx(
                        'h-2.5 rounded-full transition-all duration-300',
                        upload.status === 'uploading' && 'bg-blue-500',
                        upload.status === 'processing' && 'bg-yellow-500',
                        upload.status === 'done' && 'bg-green-500',
                        (upload.status === 'failed' || upload.status === 'cancelled') && 'bg-red-500'
                      )}
                      style={{ width: `${upload.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {upload.status === 'uploading' && `Uploading: ${upload.percentage.toFixed(1)}%`}
                    {upload.status === 'processing' && `Processing...`}
                    {upload.status === 'done' && `Completed`}
                    {upload.status === 'failed' && `Failed: ${upload.error}`}
                    {upload.status === 'cancelled' && `Cancelled`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(upload.status === 'uploading' || upload.status === 'processing') && (
                  <button
                    onClick={() => handleCancel(upload.id)}
                    className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition"
                    title="Cancel Upload"
                  >
                    <X size={16} />
                  </button>
                )}
                {upload.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(upload.id)}
                    className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition"
                    title="Retry Upload"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
                {(upload.status === 'done' || upload.status === 'cancelled') && (
                    <button
                        onClick={() => removeUpload(upload.id)}
                        className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition"
                        title="Dismiss"
                    >
                        <X size={16} />
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// Helper for standard uploads
async function uploadStandard(
  upload: Upload,
  updateUpload: (id: string, updates: Partial<Upload>) => void,
  cancelController: AbortController
) {
  const formData = new FormData();
  formData.append('file', upload.file);

  const response = await fetch(`${API_BASE_URL}/`, {
    method: 'POST',
    body: formData,
    signal: cancelController.signal,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Standard upload failed');
  }

  // Poll for progress updates after the file is sent, until it's processed/done/failed
  // This covers the server-side virus scanning and file validation.
  let pollInterval: any;
  return new Promise<void>((resolve, reject) => {
    pollInterval = setInterval(async () => {
      try {
        const progressResponse = await fetch(`${API_BASE_URL}/progress/${upload.id}`, { signal: cancelController.signal });
        if (!progressResponse.ok) {
          clearInterval(pollInterval);
          const errorData = await progressResponse.json();
          reject(new Error(errorData.detail || 'Failed to get upload progress'));
          return;
        }
        const progressData = await progressResponse.json();
        updateUpload(upload.id, {
          uploadedBytes: progressData.uploaded_bytes,
          percentage: progressData.percentage,
          status: progressData.status,
          error: progressData.error,
        });

        if (progressData.status === 'done') {
          clearInterval(pollInterval);
          resolve();
        } else if (progressData.status === 'failed') {
          clearInterval(pollInterval);
          reject(new Error(progressData.error || 'Upload failed during processing'));
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          console.log('Progress polling aborted.');
        } else {
          console.error('Error polling upload progress:', e);
          clearInterval(pollInterval);
          reject(e);
        }
      }
    }, 1000); // Poll every 1 second
  }).finally(() => {
    if (pollInterval) clearInterval(pollInterval);
  });
}

// Helper for chunked uploads
async function uploadChunked(
  upload: Upload,
  updateUpload: (id: string, updates: Partial<Upload>) => void,
  cancelController: AbortController
) {
  // 1. Initialize chunked upload
  const initResponse = await fetch(`${API_BASE_URL}/chunked/init?filename=${encodeURIComponent(upload.filename)}&total_bytes=${upload.totalBytes}`, {
    method: 'POST',
    signal: cancelController.signal,
  });

  if (!initResponse.ok) {
    const errorData = await initResponse.json();
    throw new Error(errorData.detail || 'Failed to initialize chunked upload');
  }
  const initData = await initResponse.json();
  const serverUploadId = initData.upload_id; // The ID the server uses for this upload

  // Update our local upload with the server's ID for tracking
  updateUpload(upload.id, { id: serverUploadId }); // Update the local ID to match server's

  // 2. Upload chunks
  let uploadedBytes = 0;
  for (let start = 0; start < upload.totalBytes; start += CHUNK_SIZE) {
    if (cancelController.signal.aborted) {
      throw new Error('Upload aborted');
    }

    const end = Math.min(start + CHUNK_SIZE - 1, upload.totalBytes - 1);
    const chunk = upload.file.slice(start, end + 1);

    const chunkResponse = await fetch(`${API_BASE_URL}/chunked/${serverUploadId}`, {
      method: 'POST',
      headers: {
        'Content-Range': `bytes ${start}-${end}/${upload.totalBytes}`,
        'Content-Type': 'application/octet-stream', // Or appropriate MIME type
      },
      body: chunk,
      signal: cancelController.signal,
    });

    if (!chunkResponse.ok) {
      const errorData = await chunkResponse.json();
      throw new Error(errorData.detail || `Failed to upload chunk ${start}-${end}`);
    }

    uploadedBytes += chunk.size;
    updateUpload(serverUploadId, {
      uploadedBytes: uploadedBytes,
      percentage: (uploadedBytes / upload.totalBytes) * 100,
    });
  }

  // 3. Finalize upload
  const finalizeResponse = await fetch(`${API_BASE_URL}/chunked/${serverUploadId}/finalize`, {
    method: 'POST',
    signal: cancelController.signal,
  });

  if (!finalizeResponse.ok) {
    const errorData = await finalizeResponse.json();
    throw new Error(errorData.detail || 'Failed to finalize chunked upload');
  }

  // 4. Poll for progress updates (post-upload processing)
  let pollInterval: any;
  return new Promise<void>((resolve, reject) => {
    pollInterval = setInterval(async () => {
      try {
        const progressResponse = await fetch(`${API_BASE_URL}/progress/${serverUploadId}`, { signal: cancelController.signal });
        if (!progressResponse.ok) {
          clearInterval(pollInterval);
          const errorData = await progressResponse.json();
          reject(new Error(errorData.detail || 'Failed to get upload progress during finalization poll'));
          return;
        }
        const progressData = await progressResponse.json();
        updateUpload(serverUploadId, {
          uploadedBytes: progressData.uploaded_bytes,
          percentage: progressData.percentage,
          status: progressData.status,
          error: progressData.error,
        });

        if (progressData.status === 'done') {
          clearInterval(pollInterval);
          resolve();
        } else if (progressData.status === 'failed') {
          clearInterval(pollInterval);
          reject(new Error(progressData.error || 'Chunked upload failed during processing'));
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          console.log('Progress polling aborted during finalization.');
        } else {
          console.error('Error polling chunked upload progress:', e);
          clearInterval(pollInterval);
          reject(e);
        }
      }
    }, 1000); // Poll every 1 second
  }).finally(() => {
    if (pollInterval) clearInterval(pollInterval);
  });
}
