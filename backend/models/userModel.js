const mongoose = require('mongoose');
const crypto = require('crypto');
// const slugify = require('slugify');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A name must be set'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'An email must be set'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Provide a valid email...'],
    },
    age: {
      type: Number,
    },
    birthday: {
      type: Date,
    },
    image: {
      type: String,
      default: 'logo.png' || 'logo.jpg',
    },
    phone: {
      type: Number,
      required: [true, 'A phone number must be set'],
    },
    password: {
      type: String,
      required: [true, 'Password must be set'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Confirm Password must be set'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Confirm Password does not match Password',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    role: {
      type: String,
      default: 'user',
      enum: {
        values: ['admin', 'superadmin', 'creator', 'user', 'rider', 'merchant'],
        message: 'Role is either ||merchant||user||rider||',
      },
    },

    address: {
      type: String,
      trim: true,
      required: [true, 'An address must be set'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    secretUser: {
      type: Boolean,
      default: false,
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpiry: Date,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

userSchema.index({ location: '2dsphere' });
userSchema.index({ role: 1 });
userSchema.index({ secretUser: 1 });

// Document middleware before find()
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// Document middleware for methods
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log(this.passwordChangedAt, JWTTimestamp, changedTimestamp);
    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
