const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      enum: ['MAKEUP', 'PARLOUR'],
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
    duration: {
      type: String,
      default: '',
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

serviceSchema.index({ serviceType: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ isAvailable: 1 });
serviceSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Service', serviceSchema);
