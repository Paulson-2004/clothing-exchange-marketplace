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

const CATEGORIES = ['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'activewear', 'other'];
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

  const validate = () => {
    if (!formData.title || !formData.category || !formData.brand || !formData.size || !formData.condition || !formData.description) {
      return 'Please fill in all required fields';
    }
    if (formData.description.length > 1000) {
      return 'Description cannot exceed 1000 characters';
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

  return (
    <div className="page-container">
      <form className="listing-form" onSubmit={handleSubmit}>
        <h1>{isEditMode ? 'Edit Listing' : 'Create a Listing'}</h1>

        {formError && <p className="form-error">{formError}</p>}
        {submitState === 'success' && (
          <p className="form-success">
            Listing {isEditMode ? 'updated' : 'created'} successfully! Redirecting…
          </p>
        )}

        <label htmlFor="title">Title</label>
        <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} required />

        <div className="form-row">
          <div>
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
          <div>
            <label htmlFor="brand">Brand</label>
            <input id="brand" name="brand" type="text" value={formData.brand} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div>
            <label htmlFor="size">Size</label>
            <select id="size" name="size" value={formData.size} onChange={handleChange} required>
              <option value="">Select size</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="condition">Condition</label>
            <select id="condition" name="condition" value={formData.condition} onChange={handleChange} required>
              <option value="">Select condition</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          maxLength={1000}
          required
        />

        <label htmlFor="estimatedValue">
          Estimated swap value (₹) <span className="field-hint">— reference estimate for barter comparison only, not a cash price</span>
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
          <button type="button" className="btn btn-secondary" onClick={handleSuggestValue} disabled={suggesting}>
            {suggesting ? 'Calculating…' : 'Suggest Value'}
          </button>
        </div>

        <div className="form-row">
          <div>
            <label htmlFor="city">City</label>
            <input id="city" name="city" type="text" value={formData.city} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="state">State</label>
            <input id="state" name="state" type="text" value={formData.state} onChange={handleChange} />
          </div>
        </div>

        <label htmlFor="country">Country</label>
        <input id="country" name="country" type="text" value={formData.country} onChange={handleChange} />

        <label>Images {isEditMode && '(optional — adds to existing photos)'}</label>
        <ImageUploadPreview existingImages={existingImages} onChange={setImageFiles} />

        <button className="btn btn-primary" type="submit" disabled={submitState === 'submitting'}>
          {submitState === 'submitting' ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}

export default CreateEditListingPage;
