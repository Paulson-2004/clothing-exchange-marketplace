import { useState, useEffect, useRef } from 'react';
import Icon from '../common/Icon';

function ImageUploadPreview({ existingImages = [], onChange }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Generate temporary browser URLs to display the selected local files.
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    
    // Cleanup function: Revoke the URLs when the component unmounts or files change.
    // WHY: URL.createObjectURL allocates memory in the browser. If we don't revoke it,
    // it causes a memory leak that lasts until the user closes the tab.
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const handleFileChange = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles || []);
    // Limit to 5 images total (existing + new)
    const availableSlots = 5 - existingImages.length;
    const allowedFiles = newFiles.slice(0, availableSlots);
    
    setFiles(allowedFiles);
    onChange(allowedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const removeFile = (indexToRemove) => {
    const newFiles = files.filter((_, idx) => idx !== indexToRemove);
    setFiles(newFiles);
    onChange(newFiles);
  };

  const hasContent = existingImages.length > 0 || previews.length > 0;

  return (
    <div className="image-upload-container">
      <div 
        className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${hasContent ? 'dropzone-compact' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        // Clicking the stylized dropzone triggers the hidden actual file input
        onClick={() => fileInputRef.current?.click()}
      >
        {/* We hide the default ugly HTML file input with CSS and trigger it programmatically */}
        <input 
          type="file" 
          accept="image/jpeg,image/png,image/webp" 
          multiple 
          onChange={(e) => handleFileChange(e.target.files)} 
          ref={fileInputRef}
          className="hidden-file-input" 
        />
        <div className="dropzone-content">
          <Icon name="camera" size={32} />
          <span className="dropzone-text">Click or drag photos here</span>
          <span className="dropzone-hint">Up to 5 images (JPG, PNG, WEBP)</span>
        </div>
      </div>

      {hasContent && (
        <div className="image-preview-gallery">
          {existingImages.map((url, idx) => (
            <div key={`existing-${idx}`} className="preview-wrapper existing-preview">
              <img src={url} alt={`Existing view ${idx + 1}`} className="preview-image" />
              <div className="preview-badge">Existing</div>
            </div>
          ))}

          {previews.map((url, idx) => (
            <div key={`new-${idx}`} className="preview-wrapper new-preview">
              <img src={url} alt={`New upload ${idx + 1}`} className="preview-image" />
              <button 
                type="button" 
                className="remove-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageUploadPreview;
