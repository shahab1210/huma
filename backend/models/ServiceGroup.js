const mongoose = require('mongoose');

const serviceGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Service group name is required'], trim: true, unique: true },
    slug: { type: String, required: [true, 'Slug is required'], unique: true, lowercase: true, trim: true },
    parentType: { type: String, required: [true, 'Parent type is required'], enum: ['MEHENDI', 'MAKEUP', 'PARLOUR'] },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

serviceGroupSchema.index({ parentType: 1 });
serviceGroupSchema.index({ isActive: 1 });
serviceGroupSchema.index({ isFeatured: 1 });

serviceGroupSchema.pre('validate', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('ServiceGroup', serviceGroupSchema);
