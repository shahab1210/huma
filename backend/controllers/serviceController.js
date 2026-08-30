const Service = require('../models/Service');
const Design = require('../models/Design');
const Category = require('../models/Category');
const ServiceArea = require('../models/ServiceArea');
const Review = require('../models/Review');
const BusinessSettings = require('../models/BusinessSettings');
const { ApiError } = require('../middleware/errorHandler');

/* ═══════════════════════════════════════════════════
   CATEGORIES
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/categories
 * List active categories, optionally filtered by serviceType
 */
const getCategories = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.serviceType) {
      filter.serviceType = req.query.serviceType.toUpperCase();
    }
    const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   SERVICES (Makeup / Parlour)
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/services
 * Browse available services with optional filters
 */
const getServices = async (req, res, next) => {
  try {
    const filter = { isAvailable: true };

    if (req.query.serviceType) filter.serviceType = req.query.serviceType.toUpperCase();
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === 'true') filter.isFeatured = true;

    let query = Service.find(filter).populate('category', 'name serviceType');

    // Search by name
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    query = query.sort({ [sortBy]: sortOrder });

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    const [services, total] = await Promise.all([
      query,
      Service.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/services/:id
 */
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('category', 'name serviceType');
    if (!service) throw new ApiError(404, 'Service not found.');
    res.json({ success: true, data: { service } });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   DESIGNS (Mehendi)
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/designs
 */
const getDesigns = async (req, res, next) => {
  try {
    const filter = { isAvailable: true };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

    let query = Design.find(filter).populate('category', 'name');

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    query = query.sort({ [sortBy]: sortOrder });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    query = query.skip((page - 1) * limit).limit(limit);

    const [designs, total] = await Promise.all([query, Design.countDocuments(filter)]);

    res.json({
      success: true,
      data: {
        designs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/designs/:id
 */
const getDesignById = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id).populate('category', 'name');
    if (!design) throw new ApiError(404, 'Design not found.');
    res.json({ success: true, data: { design } });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   SERVICE AREAS
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/service-areas
 */
const getServiceAreas = async (req, res, next) => {
  try {
    const areas = await ServiceArea.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: { serviceAreas: areas } });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   PUBLIC REVIEWS
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/reviews
 * Only approved reviews are public
 */
const getPublicReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const reviews = await Review.find({ status: 'APPROVED' })
      .populate('customer', 'fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Review.countDocuments({ status: 'APPROVED' });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   BUSINESS SETTINGS (public)
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/settings
 */
const getBusinessSettings = async (req, res, next) => {
  try {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({});
    }
    res.json({ success: true, data: { settings } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getServices,
  getServiceById,
  getDesigns,
  getDesignById,
  getServiceAreas,
  getPublicReviews,
  getBusinessSettings,
};
