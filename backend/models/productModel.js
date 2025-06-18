const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'A product must have a name'],
      maxlength: [
        50,
        'A product name must have less or equal then 50 characters',
      ],
      minlength: [
        10,
        'A product name must have more or equal then 10 characters',
      ],
    },
    store: {
      type: mongoose.Schema.ObjectId,
      ref: 'Store',
      required: [true, 'Product should have a Store'],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Product should have a category'],
    },
    subcategory: {
      type: String,
      required: [true, 'Product should have a sub-category'],
    },
    duration: {
      type: Number,
      required: [true, 'A product must have a packing duration'],
    },
    stock: {
      type: Number,
      required: [true, 'A product must have a stock'],
    },
    maxOrder: {
      type: Number,
      required: [true, 'A product must have a max order'],
    },
    price: {
      type: Number,
      required: [true, 'A product must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A product must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },

    images: [
      {
        type: String,
        required: [true, 'A product must have at least one image'],
      },
    ],
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
    },
    productoptions: [
      {
        name: {
          type: String,
          required: [true, 'Product Options must have a name'],
        },
        options: [
          {
            name: {
              type: String,
              required: [true, 'Product Option must have a name'],
            },
            additionalCost: {
              type: Number,
              required: [true, 'Product Option must have an additional cost'],
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

    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    secretProduct: {
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

productSchema.index({ price: 1 });

productSchema.pre(/^find/, function (next) {
  this.finalprice = this.priceDiscount * 1.08 || this.price * 1.08;
  next();
});

productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

productSchema.pre(/^find/, function (next) {
  this.find({ secretProduct: { $ne: true } });
  this.find({ active: { $ne: false } });

  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
