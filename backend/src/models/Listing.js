const mongoose = require('mongoose');

const CATEGORIES = ['tops', 'bottoms', 'dresses', 'outerwear', 'formalwear', 'footwear', 'accessories', 'activewear', 'other'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair'];
const STATUSES = ['available', 'pending', 'swapped'];

const listingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters long'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORIES, message: 'Invalid category' },
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      minlength: [2, 'Brand must be at least 2 characters long'],
      maxlength: [50, 'Brand cannot exceed 50 characters'],
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      enum: { values: SIZES, message: 'Invalid size' },
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: { values: CONDITIONS, message: 'Invalid condition' },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      validate: {
        validator: function(v) {
          if (!v) return false;
          const words = v.trim().split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w));
          return words.length >= 30;
        },
        message: 'Description must contain at least 30 words'
      }
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one image is required',
      },
    },
    estimatedValue: {
      type: Number,
      required: [true, 'Estimated value is required'],
      min: [0, 'Estimated value cannot be negative'],
      max: [10000, 'Estimated value seems unrealistic - please check the amount'],
    },
    location: {
      city: { type: String, required: [true, 'City is required'], trim: true, minlength: [2, 'City is too short'], maxlength: [100, 'City is too long'], default: '' },
      state: { type: String, required: [true, 'State is required'], trim: true, minlength: [2, 'State is too short'], maxlength: [100, 'State is too long'], default: '' },
      country: { type: String, required: [true, 'Country is required'], trim: true, minlength: [2, 'Country is too short'], maxlength: [100, 'Country is too long'], default: '' },
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Invalid status' },
      default: 'available',
    },
  },
  { timestamps: true }
);

// Supports the marketplace search box (matches title or brand).
listingSchema.index({ title: 'text', brand: 'text' });

listingSchema.statics.CATEGORIES = CATEGORIES;
listingSchema.statics.SIZES = SIZES;
listingSchema.statics.CONDITIONS = CONDITIONS;
listingSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('Listing', listingSchema);
