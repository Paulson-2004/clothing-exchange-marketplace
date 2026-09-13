import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialFormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  city: '',
  state: '',
  country: '',
};

function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Basic frontend validation. The backend re-validates everything -
    // this is only here for a fast, friendly response before a network call.
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Name, email, and password are required');
      return;
    }
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      location: {
        city: formData.city,
        state: formData.state,
        country: formData.country,
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
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Create an Account</h1>

        {formError && <p className="form-error">{formError}</p>}

        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

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
