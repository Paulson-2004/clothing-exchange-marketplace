const CATEGORIES = ['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'activewear', 'other'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair'];

function ListingFilters({ filters, onChange, onReset }) {
  const handleFieldChange = (field) => (e) => {
    onChange({ ...filters, [field]: e.target.value });
  };

  return (
    <div className="listing-filters-container">
      <div className="category-pills-bar" role="group" aria-label="Filter listings by category">
        <button
          type="button"
          className={`category-pill ${!filters.category ? 'active' : ''}`}
          onClick={() => onChange({ ...filters, category: '' })}
        >
          All Items
        </button>
        {CATEGORIES.map((c) => {
          const isActive = filters.category === c;
          return (
            <button
              key={c}
              type="button"
              className={`category-pill ${isActive ? 'active' : ''}`}
              onClick={() => onChange({ ...filters, category: isActive ? '' : c })}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          );
        })}
      </div>

      <div className="listing-filters">
        <input
          type="text"
          placeholder="Search by title or brand…"
          value={filters.search}
          onChange={handleFieldChange('search')}
          className="filter-search"
          aria-label="Search listings by title or brand"
        />

      <select
        value={filters.size}
        onChange={handleFieldChange('size')}
        aria-label="Filter by size"
      >
        <option value="">All Sizes</option>
        {SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.condition}
        onChange={handleFieldChange('condition')}
        aria-label="Filter by condition"
      >
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
        aria-label="Filter by city"
      />

      <input
        type="text"
        placeholder="State"
        value={filters.state}
        onChange={handleFieldChange('state')}
        className="filter-location"
        aria-label="Filter by state"
      />

      <button type="button" className="btn btn-secondary" onClick={onReset}>
        Reset Filters
      </button>
      </div>
    </div>
  );
}

export default ListingFilters;
