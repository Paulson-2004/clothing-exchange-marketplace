import { useState, useEffect } from 'react';

// Handles selecting new image files and previewing them, plus showing
// any images the listing already has (when editing). Calls onChange
// with the current array of File objects whenever the selection changes.
function ImageUploadPreview({ existingImages = [], onChange }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    // Build local object URLs for the newly selected files so the user
    // can see what they're about to upload before submitting.
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    // Clean up object URLs when files change or the component unmounts,
    // to avoid leaking memory.
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    onChange(selected);
  };

  return (
    <div className="image-upload">
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} />
      <p className="image-upload-hint">Up to 5 images. JPG, PNG, or WEBP. 5MB max each.</p>

      {existingImages.length > 0 && (
        <div className="image-preview-row">
          {existingImages.map((url) => (
            <img key={url} src={url} alt="Existing listing" className="image-preview-thumb" />
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div className="image-preview-row">
          {previews.map((url) => (
            <img key={url} src={url} alt="New upload preview" className="image-preview-thumb" />
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageUploadPreview;
