const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Location name is required'], trim: true, unique: true },
    slug: { type: String, required: [true, 'Slug is required'], unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    gallery: { type: [String], default: [] },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoKeywords: { type: String, default: '' },
    nearbyAreas: { type: [String], default: [] },
    availableServiceGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceGroup' }],
    minimumBookingAmount: { type: Number, default: 2999 },
    homeVisitEnabled: { type: Boolean, default: false },
    homeVisitMinimumAmount: { type: Number, default: 999 },
    homeVisitFee: { type: Number, default: 399 },
    homeVisitFreeThreshold: { type: Number, default: 2999 },
    artistVisitEnabled: { type: Boolean, default: true },
    artistVisitMinimumAmount: { type: Number, default: 2999 },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

locationSchema.index({ isActive: 1, displayOrder: 1 });

locationSchema.pre('validate', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Location', locationSchema);
