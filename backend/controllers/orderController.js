const Order = require('./../models/orderModel');
const factory = require('./handlerFactory');

exports.setRequiredIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.rider) req.body.rider = req.params.rider.id;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllOrders = factory.getAll(Order);
exports.getOrder = factory.getOne(Order);
exports.createOrder = factory.createOne(Order);
exports.updateOrder = factory.updateOne(Order);
exports.deleteOrder = factory.deleteOne(Order);
