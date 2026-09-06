const Location = require('../models/Location');
const { ApiError } = require('../middleware/errorHandler');

exports.getLocations = async (req, res, next) => {
  try {
    const locations = await Location.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .populate('availableServiceGroups', 'name slug parentType isActive');

    res.status(200).json({
      success: true,
      data: { locations }
    });
  } catch (error) {
    next(error);
  }
};

exports.getLocationBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const location = await Location.findOne({ slug, isActive: true })
      .populate('availableServiceGroups', 'name slug parentType shortDescription heroImage isActive isFeatured displayOrder');

    if (!location) {
      throw new ApiError(404, 'Location not found');
    }

    res.status(200).json({
      success: true,
      data: { location }
    });
  } catch (error) {
    next(error);
  }
};

exports.createLocation = async (req, res, next) => {
  try {
    const {
      name, slug, shortDescription, description, heroImage, 
      gallery, seoTitle, seoDescription, seoKeywords, 
      nearbyAreas, availableServiceGroups, isActive, displayOrder
    } = req.body;

    if (!name) {
      throw new ApiError(400, 'Name is required');
    }

    const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existingLocation = await Location.findOne({ slug: generatedSlug });
    if (existingLocation) {
      throw new ApiError(400, 'Location with this slug already exists');
    }

    const location = await Location.create({
      name,
      slug: generatedSlug,
      shortDescription,
      description,
      heroImage,
      gallery,
      seoTitle,
      seoDescription,
      seoKeywords,
      nearbyAreas,
      availableServiceGroups,
      isActive,
      displayOrder
    });

    res.status(201).json({
      success: true,
      data: { location }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      throw new ApiError(404, 'Location not found');
    }

    if (req.body.slug && req.body.slug !== location.slug) {
      const existingLocation = await Location.findOne({ slug: req.body.slug });
      if (existingLocation && existingLocation._id.toString() !== req.params.id) {
        throw new ApiError(400, 'Location with this slug already exists');
      }
    }

    Object.assign(location, req.body);
    await location.save();

    res.status(200).json({
      success: true,
      data: { location }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      throw new ApiError(404, 'Location not found');
    }

    location.isActive = false;
    await location.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
