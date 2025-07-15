const mongoose = require('mongoose');
const validator = require('validator');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A name must be set'],
      trim: true,
      unique: true,
      minlength: [8, 'A store name must have more or equal to 8 characters'],
      maxlength: [70, 'A store name must have less or equal to 50 characters'],
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Provide a valid email...'],
    },
    merchant: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A merchant ID must be set'],
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      unique: true,
    },
    image: {
      type: String,
      required: [true, 'An image must be set'],
    },
    phone: {
      type: Number,
      required: [true, 'A phone number must be set'],
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
        type: [Number],
        required: true,
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.0,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    top: {
      type: String,
      default: 'no',
    },
    isVerified: { type: Boolean, default: false },
    socials: [
      {
        platform: { type: String },
        link: { type: String },
      },
    ],
    workingHours: [
      {
        day: {
          type: String,
          required: true,
          enum: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
        },
        open: { type: String },
        close: { type: String },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ merchant: 1 }, { unique: true });

storeSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'store',
  localField: '_id',
});

storeSchema.virtual('products', {
  ref: 'Product',
  foreignField: 'store',
  localField: '_id',
});

storeSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

storeSchema.pre('save', function (next) {
  // Ensure the coordinates are in the correct format
  if (this.location && this.location.coordinates) {
    this.location.coordinates = [
      parseFloat(this.location.coordinates[0]),
      parseFloat(this.location.coordinates[1]),
    ];
  }
  this.owner = this.merchant;
  next();
});

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
