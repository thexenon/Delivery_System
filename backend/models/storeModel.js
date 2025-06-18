const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A name must be set'],
      trim: true,
      unique: true,
      minlength: [
        10,
        'A store name must have more or equal than 10 characters',
      ],
      maxlength: [
        70,
        'A store name must have less or equal than 50 characters',
      ],
    },
    merchant: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A merchant ID must be set'],
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
    ratingsQunatity: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    isVerified: { type: Boolean, default: false },
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
        open: { type: String, required: true },
        close: { type: String, required: true },
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
storeSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'store',
  localField: '_id',
});

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
