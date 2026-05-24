import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Camera, Image as ImageIcon, FileText, X, AlertTriangle, Activity, CheckCircle2, ChevronRight, Loader, Trash2, Download, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/SymptomScanner.css';

const SymptomScanner = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:8000/api/scanner/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.scans);
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent loading the scan
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`http://localhost:8000/api/scanner/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Synchronously remove from UI without refresh
      setHistory(prev => prev.filter(scan => scan.id !== id));
      if (analysisResult && analysisResult.id === id) {
        clearSelection();
      }
      showToast("Scan removed successfully");
    } catch (error) {
      console.error("Failed to delete", error);
      showToast("Failed to remove scan");
    }
  };

  const handleFileSelect = (file) => {
    if (file) {
      const isPdfFile = file.type === 'application/pdf';
      setSelectedFile(file);
      setIsPdf(isPdfFile);
      setPreviewUrl(isPdfFile ? null : URL.createObjectURL(file));
      setAnalysisResult(null);
      setIsCameraOpen(false);
      stopCamera();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPdf(false);
    setAnalysisResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setAnalysisResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        handleFileSelect(file);
      }, 'image/jpeg');
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setProgress(10);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const token = localStorage.getItem('auth_token');

      // Simulate progress for UI
      const interval = setInterval(() => {
        setProgress(p => p < 90 ? p + 5 : p);
      }, 500);

      const response = await axios.post('http://localhost:8000/api/scanner/analyze', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        setAnalysisResult(response.data.scan);
        setLoading(false);
        fetchHistory();
      }, 500);

    } catch (error) {
      console.error('Analysis failed', error);
      alert('Failed to analyze the document. Please ensure it is under 10MB.');
      setLoading(false);
      setProgress(0);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MODERATE': return '#eab308';
      case 'LOW': return '#10b981';
      default: return '#64748b';
    }
  };

  const getBloodStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'normal': return '#10b981';
      case 'monitor': return '#eab308';
      case 'consult doctor': return '#ef4444';
      default: return '#64748b';
    }
  };

  const loadPastScan = (scan) => {
    setSelectedFile(null);
    setPreviewUrl(scan.is_pdf ? null : scan.image_url);
    setIsPdf(scan.is_pdf);
    setAnalysisResult(scan);
    setIsCameraOpen(false);
    stopCamera();
  };

  const handleNearestHospitals = () => {
    const aiData = analysisResult?.ai_analysis || {};
    const specialty = aiData.suggested_specialists?.[0] || 'General Physician';
    // Navigate to nearby care with the suggested specialty as a query parameter
    navigate(`/dashboard/nearby-care?symptom=${encodeURIComponent(specialty)}`);
  };

  const renderAnalysisContent = () => {
    if (!analysisResult) return null;
    const aiData = analysisResult.ai_analysis || {};
    const scanType = analysisResult.scan_type || 'IMAGE_SCAN';

    return (
      <div className="analysis-results-panel">
        <div className="results-header" style={{ borderBottomColor: getRiskColor(analysisResult.risk_level) }}>
          <div>
            <h3>Analysis Summary</h3>
            <span className="scan-completed-badge"><CheckCircle2 size={14} /> Scan Completed</span>
          </div>
          <div className="symptom-risk-container">
            <span className="confidence-score">Confidence: {analysisResult.confidence_score || 85}%</span>
            <div className="risk-badge" style={{ backgroundColor: getRiskColor(analysisResult.risk_level) }}>
              {analysisResult.risk_level} RISK
            </div>
          </div>
        </div>

        {analysisResult.summary && (
          <div className="summary-banner">
            <p>{analysisResult.summary}</p>
          </div>
        )}

        {/* Dynamic Rendering Based on Scan Type */}

        {scanType === 'BLOOD_REPORT' && aiData.blood_metrics && (
          <div className="result-section">
            <h4><Activity size={18} /> Blood Report Metrics</h4>
            <div className="blood-metrics-grid">
              {aiData.blood_metrics.map((metric, i) => (
                <div key={i} className="blood-metric-card" style={{ borderLeftColor: getBloodStatusColor(metric.status) }}>
                  <span className="metric-name">{metric.name}</span>
                  <span className="metric-value">{metric.value}</span>
                  <span className="metric-status" style={{ color: getBloodStatusColor(metric.status) }}>{metric.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {scanType === 'PRESCRIPTION' && aiData.medicines && (
          <div className="result-section">
            <h4><FileText size={18} /> Extracted Medicines</h4>
            <div className="medicines-list">
              {aiData.medicines.map((med, i) => (
                <div key={i} className="medicine-card">
                  <div className="med-header">
                    <strong>{med.name}</strong>
                    <span>{med.dosage}</span>
                  </div>
                  <div className="med-details">
                    <span><Clock size={12} /> {med.timing}</span>
                    <span><Activity size={12} /> {med.duration}</span>
                  </div>
                  <p className="med-purpose">{med.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {scanType === 'IMAGE_SCAN' && aiData.visual_findings && (
          <div className="result-section">
            <h4><ImageIcon size={18} /> Visual Findings</h4>
            <p>{aiData.visual_findings}</p>
          </div>
        )}

        {/* Common Sections */}
        {aiData.potential_conditions && aiData.potential_conditions.length > 0 && (
          <div className="result-section">
            <h4><AlertTriangle size={18} /> Potential Conditions</h4>
            <ul className="styled-list">
              {aiData.potential_conditions.map((cond, i) => <li key={i}>{cond}</li>)}
            </ul>
          </div>
        )}

        {aiData.recommendations && aiData.recommendations.length > 0 && (
          <div className="result-section">
            <h4><CheckCircle2 size={18} /> Recommended Actions</h4>
            <ul className="styled-list">
              {aiData.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
            </ul>
          </div>
        )}

        {aiData.suggested_specialists && aiData.suggested_specialists.length > 0 && (
          <div className="result-section">
            <h4><MapPin size={18} /> Suggested Specialists</h4>
            <div className="specialist-tags">
              {aiData.suggested_specialists.map((spec, i) => <span key={i} className="spec-tag">{spec}</span>)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="scanner-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          {toastMessage}
        </div>
      )}

      <div className="scanner-main">
        <div className="scanner-header">
          <h2>AI Document & Image Analysis Center</h2>
          <p>Upload PDFs, Blood Reports, Prescriptions, MRIs, or Photos for instant multimodal AI analysis.</p>
        </div>

        <div className="scanner-content">
          {!previewUrl && !isPdf && !isCameraOpen ? (
            <div
              className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileSelect(e.target.files[0])}
                accept="image/*,application/pdf"
                hidden
              />
              <div className="upload-icon">
                <UploadCloud size={48} color="#2563eb" />
              </div>
              <h3>Drag & Drop a document or image here</h3>
              <p>or click to browse your files (PDF, JPG, PNG)</p>
            </div>
          ) : isCameraOpen ? (
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline className="video-preview"></video>
              <div className="camera-controls">
                <button className="btn-cancel" onClick={stopCamera}>Cancel</button>
                <button className="btn-capture" onClick={capturePhoto}></button>
                <div style={{ width: '60px' }}></div>
              </div>
            </div>
          ) : (
            <div className="analysis-view">
              <div className="image-preview-panel">
                <div className="preview-header">
                  <span>Selected Document</span>
                  <button className="btn-icon" onClick={clearSelection}><X size={20} /></button>
                </div>

                {isPdf ? (
                  <div className="pdf-preview-placeholder">
                    <FileText size={64} color="#64748b" />
                    <p>{selectedFile ? selectedFile.name : 'PDF Document'}</p>
                  </div>
                ) : (
                  <img src={previewUrl} alt="Symptom" className="preview-image" />
                )}

                {!analysisResult && !loading && (
                  <button className="btn-analyze" onClick={analyzeImage}>
                    <Activity size={20} /> Run AI Analysis
                  </button>
                )}

                {loading && (
                  <div className="analyzing-state">
                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="processing-text">
                      <Loader className="spinner" size={24} />
                      <p>{progress < 50 ? 'Extracting text and markers...' : 'Running diagnostic models...'}</p>
                    </div>
                    <span>{progress}% Completed</span>
                  </div>
                )}
              </div>

              {renderAnalysisContent()}
            </div>
          )}
        </div>
      </div>

      <div className="scanner-sidebar">
        <div className="sidebar-header">
          <h3>Scan History</h3>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-history">
              <FileText size={32} />
              <p>No past analysis found</p>
            </div>
          ) : (
            history.map(scan => (
              <div key={scan.id} className={`history-card ${analysisResult?.id === scan.id ? 'active' : ''}`} onClick={() => loadPastScan(scan)}>
                {scan.is_pdf ? (
                  <div className="history-pdf-thumb"><FileText size={24} color="#64748b" /></div>
                ) : (
                  <img src={scan.image_url} alt="Past scan" className="history-thumb" />
                )}
                <div className="history-info">
                  <span className="history-date">{new Date(scan.created_at).toLocaleDateString()}</span>
                  <span className="history-type">{scan.scan_type?.replace('_', ' ')}</span>
                  <div className="history-risk" style={{ color: getRiskColor(scan.risk_level) }}>
                    {scan.risk_level}
                  </div>
                </div>
                {/* Instant Delete Button - No Alert */}
                <button
                  className="btn-delete-scan"
                  onClick={(e) => handleDelete(e, scan.id)}
                  title="Delete scan"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomScanner;
