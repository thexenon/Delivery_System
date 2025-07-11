const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    stores: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Store',
        required: [true, 'Order Item must belong to a store.'],
      },
    ],
    products: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Order Item must belong to a product.'],
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Order Item must belong to a product.'],
      unique: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

favoriteSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;
