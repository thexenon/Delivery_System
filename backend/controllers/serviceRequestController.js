const ServiceRequest = require('./../models/serviceRequestModel');
const factory = require('./handlerFactory');

exports.getAllServiceRequests = factory.getAll(ServiceRequest, {
  path: 'customer service artisan artisanShop',
});
exports.getServiceRequest = factory.getOne(ServiceRequest, {
  path: 'customer service artisan artisanShop',
});
exports.createServiceRequest = factory.createOne(ServiceRequest);
exports.updateServiceRequest = factory.updateOne(ServiceRequest);
exports.deleteServiceRequest = factory.deleteOne(ServiceRequest);
