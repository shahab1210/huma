const mongoose = require('mongoose');

const designSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Design name is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      default: '',
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    startingPrice: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
      default: '',
    },
    coverage: {
      type: String,
      default: '',
    },
    customizationAvailable: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

designSchema.index({ category: 1 });
designSchema.index({ isAvailable: 1 });
designSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Design', designSchema);
