const Service = require('./../models/serviceModel');
const factory = require('./handlerFactory');

exports.getAllServices = factory.getAll(Service, {
  path: 'artisan artisanShop reviews',
});
exports.getService = factory.getOne(Service, {
  path: 'artisan artisanShop reviews',
});
exports.createService = factory.createOne(Service);
exports.updateService = factory.updateOne(Service);
exports.deleteService = factory.deleteOne(Service);
