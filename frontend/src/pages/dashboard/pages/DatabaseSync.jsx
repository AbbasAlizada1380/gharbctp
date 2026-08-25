import React, { useState, useRef } from 'react';

const DatabaseSync = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // State for Upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // State for Download
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');

  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.sql')) {
        setUploadMessage('❌ Please select a valid .sql file.');
        setSelectedFile(null);
        fileInputRef.current.value = '';
        return;
      }
      setSelectedFile(file);
      setUploadMessage(`📎 Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('⚠️ Please choose a .sql file first.');
      return;
    }

    setIsUploading(true);
    setUploadMessage('⏳ Uploading and importing to server...');

    const formData = new FormData();
    formData.append('sqlFile', selectedFile);

    try {
      // ✅ Use the correct endpoint (matches your route)
      const response = await fetch(`${BASE_URL}/database/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // send cookies if using session auth
        // headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, // if using JWT
        // Do NOT set Content-Type manually – browser sets it with boundary
      });

      // The server returns JSON, not text
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Server error (${response.status})`);
      }

      setUploadMessage(`✅ ${result.message}`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      setUploadMessage(`❌ Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadMessage('⏳ Generating database backup...');

    try {
      // ✅ Use the correct endpoint
      const response = await fetch(`${BASE_URL}/database/export`, {
        method: 'GET',
        credentials: 'include',
        // headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      link.download = `database_backup_${dateStr}.sql`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadMessage(`✅ Backup downloaded successfully as ${link.download}!`);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadMessage(`❌ Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };
  // --- RENDER ---
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📂 Database Sync Tool</h2>

      {/* ===== UPLOAD SECTION ===== */}
      <div style={styles.card}>
        <h3 style={styles.subtitle}>📤 Upload Local .sql to Hosted Server</h3>
        <p style={styles.warning}>
          ⚠️ Warning: This will completely OVERWRITE the hosted database!
        </p>

        <div style={styles.inputGroup}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".sql"
            onChange={handleFileChange}
            disabled={isUploading}
            style={styles.fileInput}
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            style={{
              ...styles.button,
              ...styles.uploadButton,
              opacity: !selectedFile || isUploading ? 0.6 : 1,
              cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
            }}
          >
            {isUploading ? '⏳ Uploading...' : '🚀 Upload to Server'}
          </button>
        </div>

        {uploadMessage && (
          <p
            style={{
              ...styles.message,
              color: uploadMessage.includes('✅') ? 'green' : 'red',
            }}
          >
            {uploadMessage}
          </p>
        )}
      </div>

      {/* ===== DOWNLOAD SECTION ===== */}
      <div style={styles.card}>
        <h3 style={styles.subtitle}>📥 Download Hosted Database to Local</h3>
        <p style={styles.hint}>
          Downloads the entire current database as a .sql file (structure + data).
        </p>

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          style={{
            ...styles.button,
            ...styles.downloadButton,
            opacity: isDownloading ? 0.6 : 1,
            cursor: isDownloading ? 'not-allowed' : 'pointer',
          }}
        >
          {isDownloading ? '⏳ Generating...' : '⬇️ Download .sql Backup'}
        </button>

        {downloadMessage && (
          <p
            style={{
              ...styles.message,
              color: downloadMessage.includes('✅') ? 'green' : 'red',
            }}
          >
            {downloadMessage}
          </p>
        )}
      </div>
    </div>
  );
};

// --- STYLES (Inline for simplicity - feel free to use Tailwind or CSS Modules) ---
const styles = {
  container: {
    maxWidth: '700px',
    margin: '40px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    borderBottom: '2px solid #007bff',
    paddingBottom: '10px',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  subtitle: {
    marginTop: '0',
    marginBottom: '12px',
  },
  warning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '10px 14px',
    borderRadius: '4px',
    border: '1px solid #ffc107',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  hint: {
    color: '#6c757d',
    fontSize: '14px',
    marginBottom: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '12px',
  },
  fileInput: {
    padding: '10px',
    border: '1px dashed #007bff',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    transition: 'background-color 0.2s ease',
  },
  uploadButton: {
    backgroundColor: '#28a745',
  },
  downloadButton: {
    backgroundColor: '#007bff',
    width: '100%',
  },
  message: {
    marginTop: '16px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #dee2e6',
    fontSize: '14px',
    wordBreak: 'break-word',
  },
};

export default DatabaseSync;