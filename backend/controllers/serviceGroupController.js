const ServiceGroup = require('../models/ServiceGroup');
const Design = require('../models/Design');
const Service = require('../models/Service');
const { ApiError } = require('../middleware/errorHandler');

exports.getServiceGroups = async (req, res, next) => {
  try {
    const query = { isActive: true };
    if (req.query.parentType) {
      query.parentType = req.query.parentType;
    }

    const serviceGroups = await ServiceGroup.find(query)
      .sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: { serviceGroups }
    });
  } catch (error) {
    next(error);
  }
};

exports.getServiceGroupBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const serviceGroup = await ServiceGroup.findOne({ slug, isActive: true });

    if (!serviceGroup) {
      throw new ApiError(404, 'Service group not found');
    }

    const designs = await Design.find({ serviceGroups: serviceGroup._id, isAvailable: true })
      .populate('category', 'name');
      
    const services = await Service.find({ serviceGroups: serviceGroup._id, isAvailable: true })
      .populate('category', 'name');

    res.status(200).json({
      success: true,
      data: { serviceGroup, designs, services }
    });
  } catch (error) {
    next(error);
  }
};

exports.createServiceGroup = async (req, res, next) => {
  try {
    const {
      name, slug, parentType, shortDescription, description,
      heroImage, seoTitle, seoDescription, isActive, displayOrder, isFeatured
    } = req.body;

    if (!name || !parentType) {
      throw new ApiError(400, 'Name and parentType are required');
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existingGroup = await ServiceGroup.findOne({ slug: generatedSlug });
    if (existingGroup) {
      throw new ApiError(400, 'Service group with this slug already exists');
    }

    const serviceGroup = await ServiceGroup.create({
      name,
      slug: generatedSlug,
      parentType,
      shortDescription,
      description,
      heroImage,
      seoTitle,
      seoDescription,
      isActive,
      displayOrder,
      isFeatured
    });

    res.status(201).json({
      success: true,
      data: { serviceGroup }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateServiceGroup = async (req, res, next) => {
  try {
    const serviceGroup = await ServiceGroup.findById(req.params.id);

    if (!serviceGroup) {
      throw new ApiError(404, 'Service group not found');
    }

    if (req.body.slug && req.body.slug !== serviceGroup.slug) {
      const existingGroup = await ServiceGroup.findOne({ slug: req.body.slug });
      if (existingGroup && existingGroup._id.toString() !== req.params.id) {
        throw new ApiError(400, 'Service group with this slug already exists');
      }
    }

    Object.assign(serviceGroup, req.body);
    await serviceGroup.save();

    res.status(200).json({
      success: true,
      data: { serviceGroup }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteServiceGroup = async (req, res, next) => {
  try {
    const serviceGroup = await ServiceGroup.findById(req.params.id);

    if (!serviceGroup) {
      throw new ApiError(404, 'Service group not found');
    }

    serviceGroup.isActive = false;
    await serviceGroup.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
