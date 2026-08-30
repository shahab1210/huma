const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Design = require('../models/Design');
const TimeSlot = require('../models/TimeSlot');
const BusinessSettings = require('../models/BusinessSettings');
const generateBookingId = require('../utils/generateBookingId');
const { ApiError } = require('../middleware/errorHandler');

/**
 * POST /api/bookings
 * Create a new booking. Requires authenticated customer.
 *
 * Body: { items: [{ itemType, itemId, quantity }], serviceArea, address, bookingDate, timeSlotId, customerNotes }
 */
const createBooking = async (req, res, next) => {
  try {
    const { items, serviceArea, address, bookingDate, timeSlotId, customerNotes } = req.body;

    if (!items || !items.length) throw new ApiError(400, 'At least one item is required.');
    if (!serviceArea) throw new ApiError(400, 'Service area is required.');
    if (!address) throw new ApiError(400, 'Address is required.');
    if (!bookingDate) throw new ApiError(400, 'Booking date is required.');
    if (!timeSlotId) throw new ApiError(400, 'Time slot is required.');

    // ── 1. Validate & snapshot items ──
    const bookingItems = [];
    let subtotal = 0;

    for (const item of items) {
      let doc;
      let categoryName = '';

      if (item.itemType === 'SERVICE') {
        doc = await Service.findById(item.itemId).populate('category', 'name');
        if (!doc || !doc.isAvailable) throw new ApiError(400, `Service "${item.itemId}" is not available.`);
        categoryName = doc.category?.name || '';
      } else if (item.itemType === 'DESIGN') {
        doc = await Design.findById(item.itemId).populate('category', 'name');
        if (!doc || !doc.isAvailable) throw new ApiError(400, `Design "${item.itemId}" is not available.`);
        categoryName = doc.category?.name || '';
      } else {
        throw new ApiError(400, `Invalid item type: ${item.itemType}`);
      }

      const qty = item.quantity || 1;
      subtotal += doc.price * qty;

      bookingItems.push({
        itemType: item.itemType,
        itemId: doc._id,
        nameSnapshot: doc.name,
        priceSnapshot: doc.price,
        quantity: qty,
        durationSnapshot: doc.duration || '',
        categorySnapshot: categoryName,
      });
    }

    // ── 2. Calculate amounts (server-side truth) ──
    const settings = (await BusinessSettings.findOne()) || { bookingAmount: 1500 };
    const totalAmount = subtotal;
    const onlineBookingAmount = Math.min(settings.bookingAmount, totalAmount);
    const remainingAmount = totalAmount - onlineBookingAmount;

    // ── 3. Reserve the time slot atomically ──
    const reservationExpiry = new Date(Date.now() + (settings.reservationExpiryMinutes || 15) * 60 * 1000);

    const slot = await TimeSlot.findOneAndUpdate(
      { _id: timeSlotId, status: 'AVAILABLE' },
      {
        status: 'RESERVED',
        reservedBy: req.user._id,
        reservedAt: new Date(),
        reservationExpiry,
      },
      { new: true }
    );

    if (!slot) {
      throw new ApiError(409, 'This time slot is no longer available. Please choose another slot.');
    }

    // ── 4. Generate unique booking ID ──
    let bookingIdStr;
    let attempts = 0;
    do {
      bookingIdStr = generateBookingId();
      const exists = await Booking.findOne({ bookingId: bookingIdStr });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    // ── 5. Create booking ──
    const booking = await Booking.create({
      bookingId: bookingIdStr,
      customer: req.user._id,
      items: bookingItems,
      serviceArea,
      address,
      bookingDate: new Date(bookingDate),
      timeSlot: `${slot.startTime} - ${slot.endTime}`,
      timeSlotId: slot._id,
      subtotal,
      totalAmount,
      onlineBookingAmount,
      paidAmount: 0,
      remainingAmount,
      paymentStatus: 'PENDING',
      bookingStatus: 'PENDING_PAYMENT',
      customerNotes: customerNotes || '',
    });

    // Link slot to booking
    slot.booking = booking._id;
    await slot.save();

    res.status(201).json({
      success: true,
      message: 'Booking created. Please complete payment to confirm.',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings
 * List current customer's bookings
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('customer', 'fullName mobileNumber');

    res.json({ success: true, data: { bookings } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id
 * Get a specific booking (must be the owner)
 */
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'fullName mobileNumber email');

    if (!booking) throw new ApiError(404, 'Booking not found.');

    // Ensure the customer can only see their own bookings
    if (booking.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'You can only view your own bookings.');
    }

    res.json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/cancel
 * Customer-initiated cancellation
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found.');

    if (booking.customer.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only cancel your own bookings.');
    }

    if (['CANCELLED', 'COMPLETED'].includes(booking.bookingStatus)) {
      throw new ApiError(400, `Cannot cancel a ${booking.bookingStatus.toLowerCase()} booking.`);
    }

    const settings = (await BusinessSettings.findOne()) || {
      cancellationCharge: 500,
      cancellationWindowDays: 5,
    };

    // Calculate refund
    const daysUntilAppointment = Math.ceil(
      (new Date(booking.bookingDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    let refundAmount = 0;
    if (daysUntilAppointment <= settings.cancellationWindowDays) {
      // Within cancellation window — generally non-refundable
      refundAmount = 0;
    } else {
      // Apply cancellation charge
      refundAmount = Math.max(0, booking.paidAmount - settings.cancellationCharge);
    }

    booking.bookingStatus = 'CANCELLED';
    booking.cancellationReason = req.body.reason || 'Customer requested cancellation';
    booking.cancelledBy = 'CUSTOMER';
    booking.cancelledAt = new Date();
    booking.refundAmount = refundAmount;

    if (refundAmount > 0) {
      booking.paymentStatus = 'REFUNDED';
    }

    await booking.save();

    // Release the time slot
    if (booking.timeSlotId) {
      await TimeSlot.findByIdAndUpdate(booking.timeSlotId, {
        status: 'AVAILABLE',
        booking: null,
        reservedBy: null,
        reservedAt: null,
        reservationExpiry: null,
      });
    }

    res.json({
      success: true,
      message: `Booking cancelled.${refundAmount > 0 ? ` Refund of ₹${refundAmount} will be processed.` : ' No refund applicable.'}`,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/reschedule
 * Customer submits reschedule request (does NOT automatically change booking)
 */
const requestReschedule = async (req, res, next) => {
  try {
    const { requestedDate, requestedSlot, reason } = req.body;

    if (!requestedDate || !requestedSlot) {
      throw new ApiError(400, 'Requested date and slot are required.');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new ApiError(404, 'Booking not found.');

    if (booking.customer.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only reschedule your own bookings.');
    }

    if (!['CONFIRMED', 'PENDING_PAYMENT'].includes(booking.bookingStatus)) {
      throw new ApiError(400, 'This booking cannot be rescheduled.');
    }

    if (booking.rescheduleRequest && booking.rescheduleRequest.status === 'PENDING') {
      throw new ApiError(400, 'A reschedule request is already pending.');
    }

    booking.rescheduleRequest = {
      requestedDate: new Date(requestedDate),
      requestedSlot,
      reason: reason || '',
      status: 'PENDING',
      requestedAt: new Date(),
    };

    await booking.save();

    res.json({
      success: true,
      message: 'Reschedule request submitted. Admin will review shortly.',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/slots
 * Get available time slots for a specific date
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) throw new ApiError(400, 'Date query parameter is required.');

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Release expired reservations
    await TimeSlot.updateMany(
      {
        status: 'RESERVED',
        reservationExpiry: { $lt: new Date() },
      },
      {
        status: 'AVAILABLE',
        booking: null,
        reservedBy: null,
        reservedAt: null,
        reservationExpiry: null,
      }
    );

    const slots = await TimeSlot.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ startTime: 1 });

    // Customers only see available slots; admins see all
    const visibleSlots = req.user?.role === 'ADMIN'
      ? slots
      : slots.filter((s) => s.status === 'AVAILABLE');

    res.json({
      success: true,
      data: { slots: visibleSlots, date },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  requestReschedule,
  getAvailableSlots,
};
