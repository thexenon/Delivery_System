const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'A food must have a name'],
      maxlength: [50, 'A food name must have less or equal then 40 characters'],
      minlength: [10, 'A food name must have more or equal then 10 characters'],
    },
    store: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      required: [true, 'Food should have a Store'],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Food should have a category'],
    },
    subcategory: {
      type: String,
      required: [true, 'Food should have a sub-category'],
    },
    duration: {
      type: Number,
      required: [true, 'A food must have a packing duration'],
    },
    stock: {
      type: Number,
      required: [true, 'A food must have a stock'],
    },
    maxOrder: {
      type: Number,
      required: [true, 'A food must have a max order'],
    },
    price: {
      type: Number,
      required: [true, 'A food must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A food must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },

    varieties: {
      type: [
        {
          name: {
            type: String,
            required: [true, 'Variety must have a name'],
          },
          priceDifference: {
            type: Number,
            required: [true, 'Variety must have a price difference'],
            default: 0,
          },
        },
      ],
      required: [true, 'A food must have at least one variety'],
      validate: [(arr) => arr.length > 0, 'At least one variety is required'],
    },

    foodoptions: [
      {
        name: {
          type: String,
          required: [true, 'Flavor must have a name'],
        },
        options: [
          {
            name: {
              type: String,
              required: [true, 'Flavor must have a name'],
            },
            additionalCost: {
              type: Number,
              required: [true, 'Flavor must have an additional cost'],
              min: [0, 'Additional cost must be >= 0'],
            },
          },
        ],
        required: {
          type: Boolean,
          default: false,
        },
      },
    ],

    images: [
      {
        type: String,
        required: [true, 'A food must have at least one image'],
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    secretFood: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

foodSchema.index({ price: 1 });

foodSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

foodSchema.pre(/^find/, function (next) {
  this.find({ secretFood: { $ne: true } });

  this.start = Date.now();
  next();
});

const Food = mongoose.model('Food', foodSchema);

module.exports = Food;
