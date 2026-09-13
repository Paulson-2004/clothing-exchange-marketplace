import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getListingById,
  createListing,
  updateListing,
  getEstimatedValue,
} from '../api/listingApi';
import { useAuth } from '../context/AuthContext';
import ImageUploadPreview from '../components/listing/ImageUploadPreview';
import Loader from '../components/common/Loader';

const CATEGORIES = ['tops', 'bottoms', 'dresses', 'outerwear', 'formalwear', 'footwear', 'accessories', 'activewear', 'other'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair'];

const initialFormState = {
  title: '',
  category: '',
  brand: '',
  size: '',
  condition: '',
  description: '',
  estimatedValue: '',
  city: '',
  state: '',
  country: '',
};

function CreateEditListingPage() {
  const { id } = useParams(); // present only when editing
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState(initialFormState);
  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [pageStatus, setPageStatus] = useState(isEditMode ? 'loading' : 'ready'); // 'loading' | 'ready' | 'notfound' | 'forbidden'
  const [submitState, setSubmitState] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [formError, setFormError] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    const fetchListing = async () => {
      try {
        const data = await getListingById(id);
        const listing = data.listing;

        if (listing.owner?._id !== user?.id) {
          setPageStatus('forbidden');
          return;
        }

        setFormData({
          title: listing.title,
          category: listing.category,
          brand: listing.brand,
          size: listing.size,
          condition: listing.condition,
          description: listing.description,
          estimatedValue: listing.estimatedValue,
          city: listing.location?.city || '',
          state: listing.location?.state || '',
          country: listing.location?.country || '',
        });
        setExistingImages(listing.images || []);
        setPageStatus('ready');
      } catch (err) {
        setPageStatus('notfound');
      }
    };

    fetchListing();
  }, [id, isEditMode, user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSuggestValue = async () => {
    if (!formData.category || !formData.condition) {
      setFormError('Select a category and condition first to get a value suggestion');
      return;
    }
    setSuggesting(true);
    try {
      const value = await getEstimatedValue({
        category: formData.category,
        brand: formData.brand,
        condition: formData.condition,
      });
      setFormData((prev) => ({ ...prev, estimatedValue: value }));
    } catch (err) {
      setFormError('Could not get a value suggestion right now');
    } finally {
      setSuggesting(false);
    }
  };

  const countWords = (text) => text.trim().split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w)).length;

  const validate = () => {
    if (!formData.title || !formData.category || !formData.brand || !formData.size || !formData.condition || !formData.description) {
      return 'Please fill in all required fields';
    }
    if (formData.title.trim().length < 10) return 'Title must be at least 10 characters long';
    if (formData.brand.trim().length < 2) return 'Brand must be at least 2 characters long';
    if (formData.description.length > 1000) {
      return 'Description cannot exceed 1000 characters';
    }
    if (countWords(formData.description) < 30) {
      return 'Description must contain at least 30 words';
    }
    if (!formData.city.trim() || !formData.state.trim() || !formData.country.trim()) {
      return 'City, state, and country are required';
    }
    const value = Number(formData.estimatedValue);
    if (formData.estimatedValue === '' || Number.isNaN(value) || value < 0) {
      return 'Estimated value must be a valid non-negative number';
    }
    if (!isEditMode && imageFiles.length === 0) {
      return 'At least one image is required';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitState('submitting');
    try {
      if (isEditMode) {
        await updateListing(id, formData, imageFiles);
      } else {
        await createListing(formData, imageFiles);
      }
      setSubmitState('success');
      // Brief pause so the success message is visible before navigating away.
      setTimeout(() => navigate(isEditMode ? `/listings/${id}` : '/my-listings'), 700);
    } catch (err) {
      setSubmitState('error');
      setFormError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  if (pageStatus === 'loading') return <Loader message="Loading listing…" />;
  if (pageStatus === 'notfound') {
    return (
      <div className="page-container">
        <p>This listing doesn&apos;t exist or may have been removed.</p>
      </div>
    );
  }
  if (pageStatus === 'forbidden') {
    return (
      <div className="page-container">
        <p>You can only edit your own listings.</p>
      </div>
    );
  }

  const wordCount = countWords(formData.description);

  return (
    <div className="page-container listing-create-page">
      <div className="form-header-area">
        <h1 className="editorial-title">{isEditMode ? 'Edit Listing' : 'List an Item'}</h1>
        <p className="editorial-subtitle">Add a piece to the ReWear exchange.</p>
      </div>

      {formError && <p className="form-error">{formError}</p>}
      {submitState === 'success' && (
        <p className="form-success">
          Listing {isEditMode ? 'updated' : 'created'} successfully! Redirecting…
        </p>
      )}

      <form className="listing-form-editorial" onSubmit={handleSubmit}>
        
        {/* 1. PHOTOS */}
        <div className="form-section">
          <h2 className="section-title">01. Photos</h2>
          <p className="section-hint">High-quality photos increase your chances of a successful swap.</p>
          <ImageUploadPreview existingImages={existingImages} onChange={setImageFiles} />
        </div>

        {/* 2. ITEM INFORMATION */}
        <div className="form-section">
          <h2 className="section-title">02. Item Information</h2>
          
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" type="text" placeholder="e.g. Vintage Levis 501 Denim Jacket" value={formData.title} onChange={handleChange} required minLength={10} maxLength={100} />
          </div>

          <div className="form-row-editorial">
            <div className="form-group">
              <label htmlFor="brand">Brand</label>
              <input id="brand" name="brand" type="text" placeholder="e.g. Levi's, Zara, No Brand" value={formData.brand} onChange={handleChange} required minLength={2} maxLength={50} />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description
              <span className="field-hint">Describe fit, material, and any noticeable wear.</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="e.g. Great condition denim jacket from the 90s. Fits slightly oversized. Small scuff on the left cuff but otherwise perfect."
              value={formData.description}
              onChange={handleChange}
              maxLength={1000}
              required
            />
            <div className={`word-count ${wordCount < 30 ? 'word-count-error' : 'word-count-success'}`}>
              {wordCount} / 30 words minimum {wordCount >= 30 && '✓'}
            </div>
          </div>
        </div>

        {/* 3. CONDITION & SIZE */}
        <div className="form-section">
          <h2 className="section-title">03. Condition & Size</h2>
          <div className="form-row-editorial">
            <div className="form-group">
              <label htmlFor="size">Size</label>
              <select id="size" name="size" value={formData.size} onChange={handleChange} required>
                <option value="">Select size</option>
                {SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <select id="condition" name="condition" value={formData.condition} onChange={handleChange} required>
                <option value="">Select condition</option>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. VALUE / SWAP INFORMATION */}
        <div className="form-section">
          <h2 className="section-title">04. Swap Value</h2>
          <div className="form-group">
            <label htmlFor="estimatedValue">
              Estimated Exchange Value (₹)
              <span className="field-hint">Used for barter matching only, not a cash price.</span>
            </label>
            <div className="value-input-row">
              <input
                id="estimatedValue"
                name="estimatedValue"
                type="number"
                min="0"
                placeholder="e.g. 1500"
                value={formData.estimatedValue}
                onChange={handleChange}
                required
              />
              <button type="button" className="btn btn-secondary value-suggest-btn" onClick={handleSuggestValue} disabled={suggesting}>
                {suggesting ? 'Calculating…' : 'Suggest Value'}
              </button>
            </div>
          </div>
        </div>

        {/* 5. LOCATION */}
        <div className="form-section">
          <h2 className="section-title">05. Location</h2>
          <div className="form-row-editorial">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input id="city" name="city" type="text" placeholder="e.g. Mumbai" value={formData.city} onChange={handleChange} required minLength={2} maxLength={100} />
            </div>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input id="state" name="state" type="text" placeholder="e.g. Maharashtra" value={formData.state} onChange={handleChange} required minLength={2} maxLength={100} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input id="country" name="country" type="text" placeholder="e.g. India" value={formData.country} onChange={handleChange} required minLength={2} maxLength={100} />
          </div>
        </div>

        {/* 6. PUBLISH */}
        <div className="form-publish-actions">
          <button className="btn btn-primary btn-block btn-publish" type="submit" disabled={submitState === 'submitting'}>
            {submitState === 'submitting' ? 'Publishing…' : isEditMode ? 'Update Listing' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateEditListingPage;
