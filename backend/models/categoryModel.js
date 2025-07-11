const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category can not be empty!'],
      unique: true,
      trim: true,
    },
    subcategory: [
      {
        type: String,
        required: [true, 'Subcategory can not be empty!'],
      },
    ],
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

categorySchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
