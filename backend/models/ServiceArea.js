const mongoose = require('mongoose');

const serviceAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service area name is required'],
      trim: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    travelCharge: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ServiceArea', serviceAreaSchema);
