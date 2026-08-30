const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Design = require('../models/Design');
const Category = require('../models/Category');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const ServiceArea = require('../models/ServiceArea');
const BusinessSettings = require('../models/BusinessSettings');
const { ApiError } = require('../middleware/errorHandler');

/* ═══════════════════════════════════════════════════
   DASHBOARD STATISTICS
   ═══════════════════════════════════════════════════ */

const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayBookings,
      totalBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalCustomers,
      totalRevenue,
      pendingPayments,
      availableSlots,
      bookedSlots,
    ] = await Promise.all([
      Booking.countDocuments({ bookingDate: { $gte: today, $lt: tomorrow } }),
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'CONFIRMED' }),
      Booking.countDocuments({ bookingStatus: 'COMPLETED' }),
      Booking.countDocuments({ bookingStatus: 'CANCELLED' }),
      User.countDocuments({ role: 'CUSTOMER' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'BOOKING_AMOUNT_PAID' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      Booking.countDocuments({ paymentStatus: 'PENDING' }),
      TimeSlot.countDocuments({ status: 'AVAILABLE', date: { $gte: today } }),
      TimeSlot.countDocuments({ status: 'BOOKED', date: { $gte: today } }),
    ]);

    // Upcoming bookings (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingBookings = await Booking.countDocuments({
      bookingDate: { $gte: today, $lt: nextWeek },
      bookingStatus: { $in: ['CONFIRMED', 'IN_PROGRESS'] },
    });

    res.json({
      success: true,
      data: {
        todayBookings,
        upcomingBookings,
        totalBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalCustomers,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingPayments,
        availableSlots,
        bookedSlots,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   BOOKING MANAGEMENT
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/admin/bookings
 * View all bookings with filters
 */
const getAllBookings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.bookingStatus = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.date) {
      const d = new Date(req.query.date);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.bookingDate = { $gte: d, $lt: nextDay };
    }
    if (req.query.search) {
      filter.$or = [
        { bookingId: { $regex: req.query.search, $options: 'i' } },
        { serviceArea: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('customer', 'fullName mobileNumber email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/bookings/:id
 * Admin updates booking status (confirm, complete, cancel, in-progress)
 */
const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found.');

    const { bookingStatus, cancellationReason } = req.body;

    // Admin cancellation = full refund
    if (bookingStatus === 'CANCELLED') {
      booking.bookingStatus = 'CANCELLED';
      booking.cancelledBy = 'ADMIN';
      booking.cancelledAt = new Date();
      booking.cancellationReason = cancellationReason || 'Cancelled by admin';
      booking.refundAmount = booking.paidAmount; // Full refund
      if (booking.paidAmount > 0) {
        booking.paymentStatus = 'REFUNDED';
      }

      // Release slot
      if (booking.timeSlotId) {
        await TimeSlot.findByIdAndUpdate(booking.timeSlotId, {
          status: 'AVAILABLE',
          booking: null,
          reservedBy: null,
          reservedAt: null,
          reservationExpiry: null,
        });
      }
    } else if (bookingStatus) {
      booking.bookingStatus = bookingStatus;
    }

    // Allow admin to update other fields
    if (req.body.paymentStatus) booking.paymentStatus = req.body.paymentStatus;

    await booking.save();

    res.json({
      success: true,
      message: `Booking ${booking.bookingId} updated.`,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/bookings/:id/respond-reschedule
 * Admin approves or rejects a reschedule request
 */
const respondReschedule = async (req, res, next) => {
  try {
    const { decision, adminResponse, newSlotId } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      throw new ApiError(400, 'Decision must be APPROVED or REJECTED.');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found.');
    if (!booking.rescheduleRequest || booking.rescheduleRequest.status !== 'PENDING') {
      throw new ApiError(400, 'No pending reschedule request.');
    }

    booking.rescheduleRequest.status = decision;
    booking.rescheduleRequest.adminResponse = adminResponse || '';
    booking.rescheduleRequest.respondedAt = new Date();

    if (decision === 'APPROVED') {
      // Release old slot
      if (booking.timeSlotId) {
        await TimeSlot.findByIdAndUpdate(booking.timeSlotId, {
          status: 'AVAILABLE',
          booking: null,
          reservedBy: null,
        });
      }

      // Reserve new slot
      const slotId = newSlotId || booking.rescheduleRequest.requestedSlot;
      if (slotId) {
        const newSlot = await TimeSlot.findOneAndUpdate(
          { _id: slotId, status: 'AVAILABLE' },
          { status: 'BOOKED', booking: booking._id },
          { new: true }
        );
        if (!newSlot) throw new ApiError(409, 'Requested slot is not available.');

        booking.timeSlot = `${newSlot.startTime} - ${newSlot.endTime}`;
        booking.timeSlotId = newSlot._id;
        booking.bookingDate = booking.rescheduleRequest.requestedDate;
      }

      booking.bookingStatus = 'RESCHEDULED';
    }

    await booking.save();

    res.json({
      success: true,
      message: `Reschedule request ${decision.toLowerCase()}.`,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   SERVICE CRUD (Makeup / Parlour)
   ═══════════════════════════════════════════════════ */

const createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, message: 'Service created.', data: { service } });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) throw new ApiError(404, 'Service not found.');
    res.json({ success: true, message: 'Service updated.', data: { service } });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) throw new ApiError(404, 'Service not found.');
    res.json({ success: true, message: 'Service deleted.' });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   DESIGN CRUD (Mehendi)
   ═══════════════════════════════════════════════════ */

const createDesign = async (req, res, next) => {
  try {
    const design = await Design.create(req.body);
    res.status(201).json({ success: true, message: 'Design created.', data: { design } });
  } catch (error) {
    next(error);
  }
};

const updateDesign = async (req, res, next) => {
  try {
    const design = await Design.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!design) throw new ApiError(404, 'Design not found.');
    res.json({ success: true, message: 'Design updated.', data: { design } });
  } catch (error) {
    next(error);
  }
};

const deleteDesign = async (req, res, next) => {
  try {
    const design = await Design.findByIdAndDelete(req.params.id);
    if (!design) throw new ApiError(404, 'Design not found.');
    res.json({ success: true, message: 'Design deleted.' });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   CATEGORY CRUD
   ═══════════════════════════════════════════════════ */

const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, message: 'Category created.', data: { category } });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) throw new ApiError(404, 'Category not found.');
    res.json({ success: true, message: 'Category updated.', data: { category } });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) throw new ApiError(404, 'Category not found.');
    res.json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   TIME SLOT MANAGEMENT
   ═══════════════════════════════════════════════════ */

/**
 * POST /api/admin/slots
 * Create time slots (single or batch)
 */
const createSlots = async (req, res, next) => {
  try {
    const { date, slots } = req.body;

    if (!date) throw new ApiError(400, 'Date is required.');

    // Single slot or batch
    if (slots && Array.isArray(slots)) {
      const created = [];
      for (const s of slots) {
        const slot = await TimeSlot.create({
          date: new Date(date),
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status || 'AVAILABLE',
        });
        created.push(slot);
      }
      return res.status(201).json({
        success: true,
        message: `${created.length} slots created.`,
        data: { slots: created },
      });
    }

    // Single slot
    const { startTime, endTime } = req.body;
    if (!startTime || !endTime) throw new ApiError(400, 'Start time and end time are required.');

    const slot = await TimeSlot.create({
      date: new Date(date),
      startTime,
      endTime,
      status: 'AVAILABLE',
    });

    res.status(201).json({ success: true, message: 'Slot created.', data: { slot } });
  } catch (error) {
    next(error);
  }
};

const updateSlot = async (req, res, next) => {
  try {
    const slot = await TimeSlot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!slot) throw new ApiError(404, 'Slot not found.');
    res.json({ success: true, message: 'Slot updated.', data: { slot } });
  } catch (error) {
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const slot = await TimeSlot.findById(req.params.id);
    if (!slot) throw new ApiError(404, 'Slot not found.');
    if (slot.status === 'BOOKED') {
      throw new ApiError(400, 'Cannot delete a booked slot. Cancel the booking first.');
    }
    await slot.deleteOne();
    res.json({ success: true, message: 'Slot deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/slots/:id/block
 * Block / unblock a slot
 */
const blockSlot = async (req, res, next) => {
  try {
    const slot = await TimeSlot.findById(req.params.id);
    if (!slot) throw new ApiError(404, 'Slot not found.');

    if (slot.status === 'BOOKED') {
      throw new ApiError(400, 'Cannot block a slot that is already booked.');
    }

    slot.status = slot.status === 'BLOCKED' ? 'AVAILABLE' : 'BLOCKED';
    await slot.save();

    res.json({
      success: true,
      message: `Slot ${slot.status === 'BLOCKED' ? 'blocked' : 'unblocked'}.`,
      data: { slot },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   SERVICE AREA MANAGEMENT
   ═══════════════════════════════════════════════════ */

const createServiceArea = async (req, res, next) => {
  try {
    const area = await ServiceArea.create(req.body);
    res.status(201).json({ success: true, message: 'Service area created.', data: { serviceArea: area } });
  } catch (error) {
    next(error);
  }
};

const updateServiceArea = async (req, res, next) => {
  try {
    const area = await ServiceArea.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!area) throw new ApiError(404, 'Service area not found.');
    res.json({ success: true, message: 'Service area updated.', data: { serviceArea: area } });
  } catch (error) {
    next(error);
  }
};

const deleteServiceArea = async (req, res, next) => {
  try {
    const area = await ServiceArea.findByIdAndDelete(req.params.id);
    if (!area) throw new ApiError(404, 'Service area not found.');
    res.json({ success: true, message: 'Service area deleted.' });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   CUSTOMER MANAGEMENT
   ═══════════════════════════════════════════════════ */

const getAllCustomers = async (req, res, next) => {
  try {
    const filter = { role: 'CUSTOMER' };
    if (req.query.search) {
      filter.$or = [
        { fullName: { $regex: req.query.search, $options: 'i' } },
        { mobileNumber: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [customers, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -otp')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   PAYMENT MANAGEMENT
   ═══════════════════════════════════════════════════ */

const getAllPayments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate({
          path: 'booking',
          select: 'bookingId customer totalAmount onlineBookingAmount',
          populate: { path: 'customer', select: 'fullName mobileNumber' },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   REVIEW MODERATION
   ═══════════════════════════════════════════════════ */

const getAllReviews = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const reviews = await Review.find(filter)
      .populate('customer', 'fullName mobileNumber')
      .populate('booking', 'bookingId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { reviews } });
  } catch (error) {
    next(error);
  }
};

const moderateReview = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'HIDDEN'].includes(status)) {
      throw new ApiError(400, 'Status must be APPROVED or HIDDEN.');
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!review) throw new ApiError(404, 'Review not found.');

    res.json({
      success: true,
      message: `Review ${status.toLowerCase()}.`,
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════
   BUSINESS SETTINGS
   ═══════════════════════════════════════════════════ */

const updateSettings = async (req, res, next) => {
  try {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Business settings updated.',
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getAllBookings,
  updateBooking,
  respondReschedule,
  createService,
  updateService,
  deleteService,
  createDesign,
  updateDesign,
  deleteDesign,
  createCategory,
  updateCategory,
  deleteCategory,
  createSlots,
  updateSlot,
  deleteSlot,
  blockSlot,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
  getAllCustomers,
  getAllPayments,
  getAllReviews,
  moderateReview,
  updateSettings,
};
