const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, { active: false });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.updateArray = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      {
        $push: { stores: req.body.store },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.updateFavorites = (Model) =>
  catchAsync(async (req, res, next) => {
    let doc;
    if (!req.body.product && !req.body.store) {
      return next(new AppError('Product and Store IDs are required', 400));
    }
    if (req.body.product) {
      doc = await Model.findByIdAndUpdate(
        req.params.id,
        {
          $push: { products: req.body.products },
        },
        {
          new: true,
          runValidators: true,
        },
      );
    } else if (req.body.store) {
      doc = await Model.findByIdAndUpdate(
        req.params.id,
        {
          $push: { stores: req.body.stores },
        },
        {
          new: true,
          runValidators: true,
        },
      );
    }

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on message (hack)
    let filter = {};
    if (req.params.messageId) filter = { message: req.params.messageId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pages();
    let doc;
    if (popOptions) {
      doc = await features.query.populate(popOptions);
    } else {
      doc = await features.query;
    }

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
