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

serviceSchema.index({ serviceType: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ isAvailable: 1 });
serviceSchema.index({ isFeatured: 1 });

serviceSchema.pre('save', function (next) {
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

module.exports = mongoose.model('Service', serviceSchema);
