const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    mobileNumber: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      default: undefined,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      default: undefined,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    authProviders: {
      type: [String],
      enum: ['PASSWORD', 'GOOGLE'],
      default: ['PASSWORD'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN'],
      default: 'CUSTOMER',
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },
    securityQuestion: {
      type: String,
      default: "What is your husband's school name?",
    },
    securityAnswerHash: {
      type: String,
      default: "",
    },
    securityPinHash: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Compare security answer (defaults to "huma" if not configured)
userSchema.methods.compareSecurityAnswer = async function (candidateAnswer) {
  if (!this.securityAnswerHash) {
    return candidateAnswer.toLowerCase().trim() === 'huma';
  }
  return bcrypt.compare(candidateAnswer.toLowerCase().trim(), this.securityAnswerHash);
};

// Compare security pin
userSchema.methods.comparePin = async function(candidatePin) {
  if (!this.securityPinHash || !candidatePin) return false;
  return bcrypt.compare(String(candidatePin), this.securityPinHash);
};

// Never return passwordHash in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.securityPinHash;
  delete obj.googleId;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
