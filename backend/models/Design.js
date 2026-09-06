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
    mrp: {
      type: Number,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ['NONE', 'PERCENTAGE', 'FIXED'],
      default: 'NONE',
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    serviceGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceGroup',
      },
    ],
  },
  {
    timestamps: true,
  }
);

designSchema.index({ category: 1 });
designSchema.index({ isAvailable: 1 });
designSchema.index({ isFeatured: 1 });

designSchema.pre('save', function (next) {
  if (this.mrp > 0) {
    if (this.discountType === 'PERCENTAGE') {
      this.price = Math.round(this.mrp * (1 - this.discountValue / 100));
    } else if (this.discountType === 'FIXED') {
      this.price = Math.max(0, this.mrp - this.discountValue);
    } else {
      this.price = this.mrp;
    }
  }
  next();
});

module.exports = mongoose.model('Design', designSchema);
