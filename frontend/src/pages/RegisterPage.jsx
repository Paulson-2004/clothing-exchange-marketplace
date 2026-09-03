import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  city: '',
  state: '',
  country: '',
};

// Sensible email validation: requires local part, @, domain with a dot and at least 2 char TLD
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Allowed phone characters for international formats (+, digits, spaces, hyphens, parentheses)
const PHONE_CHARS_REGEX = /^[+\d\s\-()]+$/;

function validateField(fieldName, value, formData) {
  const trimmed = typeof value === 'string' ? value.trim() : '';

  switch (fieldName) {
    case 'name':
      if (!trimmed) {
        return 'Name is required';
      }
      if (trimmed.length > 80) {
        return 'Name cannot exceed 80 characters';
      }
      return '';

    case 'email':
      if (!trimmed) {
        return 'Email address is required';
      }
      if (!EMAIL_REGEX.test(trimmed)) {
        return 'Please enter a valid email address (e.g. user@example.com)';
      }
      return '';

    case 'phone':
      if (trimmed) {
        const digitsOnly = trimmed.replace(/\D/g, '');
        if (!PHONE_CHARS_REGEX.test(trimmed) || digitsOnly.length < 7 || digitsOnly.length > 15) {
          return 'Please enter a valid phone number (7 to 15 digits)';
        }
      }
      return '';

    case 'password':
      if (!value) {
        return 'Password is required';
      }
      if (value.length < 6) {
        return 'Password must be at least 6 characters';
      }
      return '';

    case 'confirmPassword':
      if (!value) {
        return 'Please confirm your password';
      }
      if (value !== formData.password) {
        return 'Passwords do not match';
      }
      return '';

    default:
      return '';
  }
}

function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormState);
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Compute validation errors dynamically
  const errors = {
    name: validateField('name', formData.name, formData),
    email: validateField('email', formData.email, formData),
    phone: validateField('phone', formData.phone, formData),
    password: validateField('password', formData.password, formData),
    confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const shouldShowError = (field) => {
    return (touched[field] || hasSubmitted) && Boolean(errors[field]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setHasSubmitted(true);

    // Fast-fail if any field has validation errors
    const hasErrors = Object.values(errors).some((err) => Boolean(err));
    if (hasErrors) {
      return;
    }

    const result = await register({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password,
      location: {
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim(),
      },
    });

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setFormError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1>Create an Account</h1>

        {formError && <p className="form-error" role="alert">{formError}</p>}

        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur('name')}
            className={shouldShowError('name') ? 'input-error' : ''}
            aria-invalid={Boolean(shouldShowError('name'))}
            aria-describedby={shouldShowError('name') ? 'name-error' : undefined}
            required
          />
          {shouldShowError('name') && (
            <span className="field-error" id="name-error" role="alert">
              {errors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur('email')}
            autoComplete="email"
            className={shouldShowError('email') ? 'input-error' : ''}
            aria-invalid={Boolean(shouldShowError('email'))}
            aria-describedby={shouldShowError('email') ? 'email-error' : undefined}
            required
          />
          {shouldShowError('email') && (
            <span className="field-error" id="email-error" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone / Contact Number (Optional)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="e.g. +1 (555) 123-4567 or +91 98765 43210"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur('phone')}
            className={shouldShowError('phone') ? 'input-error' : ''}
            aria-invalid={Boolean(shouldShowError('phone'))}
            aria-describedby={shouldShowError('phone') ? 'phone-error' : undefined}
          />
          {shouldShowError('phone') && (
            <span className="field-error" id="phone-error" role="alert">
              {errors.phone}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur('password')}
            autoComplete="new-password"
            className={shouldShowError('password') ? 'input-error' : ''}
            aria-invalid={Boolean(shouldShowError('password'))}
            aria-describedby={shouldShowError('password') ? 'password-error' : undefined}
            required
          />
          {shouldShowError('password') && (
            <span className="field-error" id="password-error" role="alert">
              {errors.password}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password *</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur('confirmPassword')}
            autoComplete="new-password"
            className={shouldShowError('confirmPassword') ? 'input-error' : ''}
            aria-invalid={Boolean(shouldShowError('confirmPassword'))}
            aria-describedby={shouldShowError('confirmPassword') ? 'confirmPassword-error' : undefined}
            required
          />
          {shouldShowError('confirmPassword') && (
            <span className="field-error" id="confirmPassword-error" role="alert">
              {errors.confirmPassword}
            </span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input id="city" name="city" type="text" value={formData.city} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="state">State</label>
            <input id="state" name="state" type="text" value={formData.state} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="country">Country</label>
          <input id="country" name="country" type="text" value={formData.country} onChange={handleChange} />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
