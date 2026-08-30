const CATEGORIES = ['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'activewear', 'other'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair'];

function ListingFilters({ filters, onChange, onReset }) {
  const handleFieldChange = (field) => (e) => {
    onChange({ ...filters, [field]: e.target.value });
  };

  return (
    <div className="listing-filters">
      <input
        type="text"
        placeholder="Search by title or brand…"
        value={filters.search}
        onChange={handleFieldChange('search')}
        className="filter-search"
      />

      <select value={filters.category} onChange={handleFieldChange('category')}>
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </option>
        ))}
      </select>

      <select value={filters.size} onChange={handleFieldChange('size')}>
        <option value="">All Sizes</option>
        {SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select value={filters.condition} onChange={handleFieldChange('condition')}>
        <option value="">All Conditions</option>
        {CONDITIONS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="City"
        value={filters.city}
        onChange={handleFieldChange('city')}
        className="filter-location"
      />

      <input
        type="text"
        placeholder="State"
        value={filters.state}
        onChange={handleFieldChange('state')}
        className="filter-location"
      />

      <button type="button" className="btn btn-secondary" onClick={onReset}>
        Reset Filters
      </button>
    </div>
  );
}

export default ListingFilters;
