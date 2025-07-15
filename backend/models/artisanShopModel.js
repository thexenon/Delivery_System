const mongoose = require('mongoose');
const validator = require('validator');

const artisanShopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A name must be set'],
      trim: true,
      unique: true,
      minlength: [
        8,
        'An artisan store name must have more or equal to 8 characters',
      ],
      maxlength: [
        70,
        'An artisan store name must have less or equal to 50 characters',
      ],
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Provide a valid email...'],
    },
    artisan: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Artisan must belong to a User'],
      unique: true,
    },
    profession: {
      type: String,
      required: [true, 'Profession is required for Artisan'],
    },
    bio: {
      type: String,
      required: [true, 'Artisan Bio must be set'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'An image must be set'],
    },
    phone: {
      type: Number,
      required: [true, 'A phone number must be set'],
    },
    experienceYears: {
      type: Number,
      required: [true, 'Experience years must be set'],
      min: 0,
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 1.0,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      trim: true,
      required: [true, 'An address must be set'],
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    available: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    socials: [
      {
        platform: { type: String },
        link: { type: String },
      },
    ],
    top: {
      type: String,
      default: 'no',
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

artisanShopSchema.index({ location: '2dsphere' });

artisanShopSchema.virtual('reviews', {
  ref: 'ArtisanReview',
  foreignField: 'artisanShop',
  localField: '_id',
});

artisanShopSchema.virtual('services', {
  ref: 'Service',
  foreignField: 'artisanShop',
  localField: '_id',
});

artisanShopSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

artisanShopSchema.pre('save', function (next) {
  // Ensure the coordinates are in the correct format
  if (this.location && this.location.coordinates) {
    this.location.coordinates = [
      parseFloat(this.location.coordinates[0]),
      parseFloat(this.location.coordinates[1]),
    ];
  }
  next();
});

const ArtisanShop = mongoose.model('ArtisanShop', artisanShopSchema);
module.exports = ArtisanShop;
