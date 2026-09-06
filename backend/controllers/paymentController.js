const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const TimeSlot = require('../models/TimeSlot');
const BusinessSettings = require('../models/BusinessSettings');
const PaymentAuditLog = require('../models/PaymentAuditLog');
const { sendBookingConfirmation, sendPaymentRejection } = require('../utils/whatsappService');
const { ApiError } = require('../middleware/errorHandler');
const User = require('../models/User');

/**
 * Helper: Validate base64 image screenshot.
 */
const validateScreenshot = (base64Str) => {
  const matches = base64Str.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!matches) {
    throw new ApiError(400, 'Invalid screenshot format. Only base64 image strings are accepted.');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new ApiError(400, 'Invalid image type. Only JPG, JPEG, PNG, and WEBP screenshots are allowed.');
  }

  // Enforce size limit (5MB by default, configurable via environment)
  const sizeInBytes = (base64Data.length * 3) / 4;
  const maxMb = parseInt(process.env.MAX_PAYMENT_PROOF_SIZE_MB, 10) || 5;
  const maxBytes = maxMb * 1024 * 1024;
  if (sizeInBytes > maxBytes) {
    throw new ApiError(400, `Screenshot size exceeds the limit of ${maxMb}MB.`);
  }
};

/**
 * POST /api/payments/submit-proof
 * Submit UPI payment proof (Transaction ID / UTR or Screenshot).
 * Requires customer authentication.
 */
const submitProof = async (req, res, next) => {
  try {
    const { bookingId, transactionId, paymentScreenshot } = req.body;

    if (!bookingId) {
      throw new ApiError(400, 'Booking ID is required.');
    }

    if (!transactionId && !paymentScreenshot) {
      throw new ApiError(400, 'Please provide either a Transaction ID or upload a payment screenshot.');
    }

    let booking = null;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingId: bookingId });
    }

    if (!booking) {
      const bd = req.body.bookingDetails;
      if (bd) {
        // Map items
        const mappedItems = (bd.items || []).map((item) => {
          const targetItemId = mongoose.Types.ObjectId.isValid(item.itemId)
            ? item.itemId
            : new mongoose.Types.ObjectId();
          
          let itemType = 'SERVICE';
          if (item.itemType === 'DESIGN' || item.itemType === 'MEHENDI') {
            itemType = 'DESIGN';
          }
          
          return {
            itemType,
            itemId: targetItemId,
            nameSnapshot: item.nameSnapshot || item.name || '',
            priceSnapshot: item.priceSnapshot || item.startingPrice || 0,
            quantity: item.quantity || 1,
            durationSnapshot: item.durationSnapshot || item.duration || '',
            categorySnapshot: item.categorySnapshot || item.category || '',
          };
        });

        // Resolve slot
        let targetSlotId = null;
        const dateOnly = new Date(bd.bookingDate);
        dateOnly.setUTCHours(0, 0, 0, 0);

        const existingSlot = await TimeSlot.findOne({
          date: dateOnly,
          startTime: bd.timeSlot,
        });

        if (existingSlot) {
          targetSlotId = existingSlot._id;
        } else {
          const newSlot = await TimeSlot.create({
            date: dateOnly,
            startTime: bd.timeSlot,
            endTime: bd.timeSlot,
            status: 'RESERVED',
            reservedBy: req.user._id,
            reservedAt: new Date(),
            reservationExpiry: null,
          });
          targetSlotId = newSlot._id;
        }

        const Location = require('../models/Location');
        let locationDoc = null;
        if (bd.location) {
          locationDoc = await Location.findById(bd.location);
        }
        if (!locationDoc && bd.serviceArea) {
          locationDoc = await Location.findOne({ name: new RegExp(`^${bd.serviceArea}$`, 'i') });
        }

        booking = new Booking({
          bookingId: bd.bookingId,
          customer: req.user._id,
          items: mappedItems,
          serviceArea: bd.serviceArea,
          location: locationDoc ? locationDoc._id : bd.location,
          locationName: locationDoc ? locationDoc.name : (bd.locationName || ''),
          locationSlug: locationDoc ? locationDoc.slug : (bd.locationSlug || ''),
          address: bd.address,
          bookingDate: dateOnly,
          timeSlot: bd.timeSlot,
          timeSlotId: targetSlotId,
          subtotal: bd.subtotal || bd.totalAmount || 0,
          totalAmount: bd.totalAmount || 0,
          onlineBookingAmount: bd.onlineBookingAmount || 1500,
          paidAmount: 0,
          remainingAmount: bd.totalAmount || 0,
          paymentStatus: 'PAYMENT_VERIFICATION_PENDING',
          bookingStatus: 'PAYMENT_VERIFICATION_PENDING',
          createdAt: bd.createdAt ? new Date(bd.createdAt) : new Date(),
        });
        
        await booking.save();

        // Ensure slot references this booking
        await TimeSlot.findByIdAndUpdate(targetSlotId, {
          status: 'RESERVED',
          booking: booking._id,
          reservedBy: req.user._id,
          reservedAt: new Date(),
          reservationExpiry: null,
        });
      } else {
        throw new ApiError(404, 'Booking not found.');
      }
    }

    // Verify ownership
    if (booking.customer.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only submit payment proof for your own bookings.');
    }

    // Check booking status
    if (booking.paymentStatus === 'BOOKING_AMOUNT_PAID' && booking.bookingStatus !== 'AWAITING_REMAINING_PAYMENT') {
      throw new ApiError(400, 'Payment has already been verified and completed.');
    }

    if (booking.bookingStatus === 'AWAITING_REMAINING_PAYMENT' && booking.remainingAmount <= 0) {
      throw new ApiError(400, 'No remaining balance to pay.');
    }

    if (booking.bookingStatus === 'CANCELLED') {
      throw new ApiError(400, 'Cannot submit payment proof for a cancelled booking.');
    }

    // Check slot availability & hold status
    const slot = await TimeSlot.findById(booking.timeSlotId);
    if (!slot) {
      throw new ApiError(404, 'Time slot associated with this booking was not found.');
    }

    if (slot.status === 'BOOKED') {
      throw new ApiError(409, 'This slot is already booked by another customer. Please select another slot.');
    }

    if (slot.status === 'RESERVED' && slot.booking && slot.booking.toString() !== booking._id.toString()) {
      throw new ApiError(409, 'This slot is currently held for another customer\'s booking.');
    }

    // Validate screenshot if provided
    if (paymentScreenshot) {
      validateScreenshot(paymentScreenshot);
    }

    // Validate transaction ID if provided (duplicate protection)
    let normalizedTxId = '';
    if (transactionId) {
      normalizedTxId = transactionId.trim();
      if (normalizedTxId.length < 6 || normalizedTxId.length > 32) {
        throw new ApiError(400, 'Transaction ID must be between 6 and 32 characters.');
      }

      // Check for duplicate verified/pending transactions
      const duplicatePayment = await Payment.findOne({
        transactionId: normalizedTxId,
        status: { $in: ['PENDING', 'PAID', 'VERIFIED'] },
        booking: { $ne: booking._id }, // Ignore current booking
      });

      if (duplicatePayment) {
        throw new ApiError(400, 'This Transaction ID / UTR has already been submitted or verified for another booking.');
      }
    }

    // Fetch payment settings
    const settings = (await BusinessSettings.findOne()) || {
      bookingAmount: 1500,
      upiId: 'demo@upi',
    };

    const isRemaining = booking.bookingStatus === 'AWAITING_REMAINING_PAYMENT';
    const requiredAdvance = isRemaining ? booking.remainingAmount : settings.bookingAmount;
    const pType = isRemaining ? 'REMAINING_PAYMENT' : 'BOOKING_AMOUNT';

    // Find or create Payment document
    let payment = await Payment.findOne({ booking: booking._id, paymentType: pType });
    const previousStatus = payment ? payment.status : '';

    if (!payment) {
      payment = new Payment({
        booking: booking._id,
        amount: requiredAdvance,
        paymentMethod: 'UPI_MANUAL',
        upiId: settings.upiId || 'demo@upi',
        transactionId: normalizedTxId,
        paymentScreenshot: paymentScreenshot || '',
        submittedAt: new Date(),
        status: 'PENDING',
        paymentType: pType,
      });
    } else {
      payment.paymentMethod = 'UPI_MANUAL';
      payment.amount = requiredAdvance; // Force correct amount
      payment.upiId = settings.upiId || 'demo@upi';
      payment.transactionId = normalizedTxId;
      payment.paymentScreenshot = paymentScreenshot || '';
      payment.submittedAt = new Date();
      payment.status = 'PENDING';
      payment.paymentType = pType;
    }

    await payment.save();

    // Update Booking statuses to verification pending and record submitted proof details
    booking.paymentStatus = 'PAYMENT_VERIFICATION_PENDING';
    booking.bookingStatus = 'PAYMENT_VERIFICATION_PENDING';
    if (normalizedTxId) {
      booking.transactionId = normalizedTxId;
    }
    if (paymentScreenshot) {
      booking.paymentScreenshot = paymentScreenshot;
    }
    await booking.save();

    // Hold the slot: ensure status is RESERVED and remove reservationExpiry so it isn't auto-released
    slot.status = 'RESERVED';
    slot.booking = booking._id;
    slot.reservedBy = req.user._id;
    slot.reservationExpiry = null; // Infinite hold during pending review
    await slot.save();

    // Write audit log
    await PaymentAuditLog.create({
      payment: payment._id,
      booking: booking._id,
      action: 'SUBMIT_PROOF',
      performedBy: req.user._id,
      previousStatus,
      newStatus: 'PENDING',
      note: transactionId ? `Submitted Transaction ID: ${normalizedTxId}` : 'Submitted Screenshot proof',
    });

    res.json({
      success: true,
      message: 'Payment proof submitted successfully. It is awaiting admin verification.',
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/:id/verify
 * Confirm manual UPI payment (Admin only).
 * Requires admin authentication.
 */
const verifyManualPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNote, pin } = req.body;

    const adminUser = await User.findById(req.user._id);
    if (!adminUser.securityPinHash) {
      throw new ApiError(400, 'Please set your security PIN in Settings first.');
    }
    const pinMatch = await adminUser.comparePin(pin);
    if (!pinMatch) {
      throw new ApiError(403, 'Incorrect security PIN.');
    }

    let payment = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      payment = await Payment.findById(id);
      if (!payment) {
        payment = await Payment.findOne({ booking: id }).sort({ createdAt: -1 });
      }
    }
    if (!payment) {
      const bObj = await Booking.findOne({ bookingId: id });
      if (bObj) {
        payment = await Payment.findOne({ booking: bObj._id }).sort({ createdAt: -1 });
      }
    }

    let booking = null;
    if (payment) {
      booking = await Booking.findById(payment.booking).populate('customer');
    } else {
      booking = await Booking.findOne({ $or: [mongoose.Types.ObjectId.isValid(id) ? { _id: id } : null, { bookingId: id }].filter(Boolean) }).populate('customer');
      if (booking) {
        payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
        if (!payment) {
          payment = new Payment({
            booking: booking._id,
            amount: booking.onlineBookingAmount,
            paymentMethod: 'UPI_MANUAL',
            status: 'PENDING',
          });
        }
      }
    }

    if (!payment || !booking) {
      throw new ApiError(404, 'Payment or Booking record not found.');
    }

    if (booking.bookingStatus === 'CANCELLED' || booking.cancelledBy) {
      throw new ApiError(400, 'This booking was cancelled by the customer and cannot be confirmed.');
    }

    if (payment.status === 'PAID' || payment.status === 'VERIFIED') {
      throw new ApiError(400, 'This payment has already been verified and approved.');
    }

    if (!booking.populated('customer')) {
      await booking.populate('customer');
    }

    const previousStatus = payment.status;

    // Update payment
    payment.status = 'PAID';
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.user._id;
    payment.adminNote = adminNote || '';
    await payment.save();

    // Update booking
    booking.paidAmount = booking.onlineBookingAmount;
    booking.remainingAmount = 0;
    booking.paymentStatus = 'BOOKING_AMOUNT_PAID';
    booking.bookingStatus = 'CONFIRMED';
    await booking.save();

    // Lock time slot permanently
    if (booking.timeSlotId) {
      await TimeSlot.findByIdAndUpdate(booking.timeSlotId, {
        status: 'BOOKED',
        booking: booking._id,
        reservationExpiry: null,
      });
    }

    // Write audit log
    await PaymentAuditLog.create({
      payment: payment._id,
      booking: booking._id,
      action: 'ADMIN_CONFIRM',
      performedBy: req.user._id,
      previousStatus,
      newStatus: 'PAID',
      note: adminNote || 'Payment verified by Admin',
    });

    // Trigger WhatsApp notification (non-blocking)
    try {
      const formattedDate = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      const itemsList = booking.items.map(i => i.nameSnapshot).join(', ');

      await sendBookingConfirmation(booking.customer.mobileNumber, {
        bookingId: booking.bookingId,
        serviceName: itemsList,
        date: formattedDate,
        time: booking.timeSlot,
        advancePaid: booking.paidAmount,
      });
    } catch (wsError) {
      console.error('WhatsApp booking confirmation failed to send:', wsError.message);
    }

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully!',
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/:id/reject
 * Reject manual UPI payment (Admin only).
 * Requires admin authentication.
 */
const rejectManualPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminNote } = req.body;

    if (!rejectionReason) {
      throw new ApiError(400, 'Rejection reason is required.');
    }

    let payment = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      payment = await Payment.findById(id);
      if (!payment) {
        payment = await Payment.findOne({ booking: id });
      }
    }
    if (!payment) {
      const bObj = await Booking.findOne({ bookingId: id });
      if (bObj) {
        payment = await Payment.findOne({ booking: bObj._id });
      }
    }

    if (!payment) {
      throw new ApiError(404, 'Payment record not found.');
    }

    if (payment.status === 'REJECTED') {
      throw new ApiError(400, 'This payment has already been rejected.');
    }

    const booking = await Booking.findById(payment.booking).populate('customer');
    if (!booking) {
      throw new ApiError(404, 'Associated booking not found.');
    }

    const previousStatus = payment.status;

    // Update payment
    payment.status = 'REJECTED';
    payment.rejectionReason = rejectionReason;
    payment.adminNote = adminNote || '';
    await payment.save();

    // Update booking
    booking.paymentStatus = 'REJECTED';
    booking.bookingStatus = 'PAYMENT_REJECTED';
    await booking.save();

    // Release held slot back to AVAILABLE
    if (booking.timeSlotId) {
      await TimeSlot.findByIdAndUpdate(booking.timeSlotId, {
        status: 'AVAILABLE',
        booking: null,
        reservedBy: null,
        reservedAt: null,
        reservationExpiry: null,
      });
    }

    // Write audit log
    await PaymentAuditLog.create({
      payment: payment._id,
      booking: booking._id,
      action: 'ADMIN_REJECT',
      performedBy: req.user._id,
      previousStatus,
      newStatus: 'REJECTED',
      note: `Rejected. Reason: ${rejectionReason}. Note: ${adminNote || 'None'}`,
    });

    // Trigger WhatsApp notification (non-blocking)
    try {
      await sendPaymentRejection(booking.customer.mobileNumber, {
        bookingId: booking.bookingId,
        rejectionReason,
      });
    } catch (wsError) {
      console.error('WhatsApp payment rejection failed to send:', wsError.message);
    }

    res.json({
      success: true,
      message: 'Payment proof rejected and booking cancelled.',
      data: {
        payment,
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyPartialPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verifiedAmount, adminNote } = req.body;

    let payment = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      payment = await Payment.findById(id);
      if (!payment) {
        payment = await Payment.findOne({ booking: id }).sort({ createdAt: -1 });
      }
    }
    if (!payment) {
      const bObj = await Booking.findOne({ bookingId: id });
      if (bObj) {
        payment = await Payment.findOne({ booking: bObj._id }).sort({ createdAt: -1 });
      }
    }

    let booking = null;
    if (payment) {
      booking = await Booking.findById(payment.booking);
    } else {
      booking = await Booking.findOne({ $or: [mongoose.Types.ObjectId.isValid(id) ? { _id: id } : null, { bookingId: id }].filter(Boolean) });
      if (booking) {
        payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
        if (!payment) {
          payment = new Payment({
            booking: booking._id,
            amount: 0,
            paymentMethod: 'UPI_MANUAL',
            status: 'PENDING',
          });
        }
      }
    }

    if (!payment || !booking) {
      throw new ApiError(404, 'Payment or Booking record not found.');
    }
    if (booking.bookingStatus === 'CANCELLED' || booking.cancelledBy) {
      throw new ApiError(400, 'This booking was cancelled by the customer and cannot be confirmed.');
    }
    // Validate amount
    const amount = Number(verifiedAmount);
    if (!amount || amount <= 0) {
      throw new ApiError(400, 'Verified amount must be greater than zero.');
    }
    if (amount > booking.onlineBookingAmount) {
      throw new ApiError(400, 'Verified amount cannot exceed the required booking amount.');
    }
    // Calculate new totals
    const newPaidAmount = (booking.paidAmount || 0) + amount;
    const newRemainingAmount = Math.max(0, booking.onlineBookingAmount - newPaidAmount);
    // Prevent duplicate: check if this specific payment was already verified
    if (payment.status === 'PAID' || payment.status === 'PARTIAL' || payment.status === 'VERIFIED') {
      throw new ApiError(400, 'This payment has already been processed.');
    }
    // Update payment
    payment.status = newRemainingAmount <= 0 ? 'PAID' : 'PARTIAL';
    payment.amount = amount;
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.user._id;
    payment.adminNote = adminNote || '';
    await payment.save();
    // Update booking
    booking.paidAmount = newPaidAmount;
    booking.remainingAmount = newRemainingAmount;
    if (newRemainingAmount <= 0) {
      booking.paymentStatus = 'BOOKING_AMOUNT_PAID';
      booking.bookingStatus = 'CONFIRMED';
      // Lock timeslot
      if (booking.timeSlotId) {
        const TimeSlot = require('../models/TimeSlot');
        await TimeSlot.findByIdAndUpdate(booking.timeSlotId, { status: 'BOOKED', reservationExpiry: null });
      }
    } else {
      booking.paymentStatus = 'PARTIAL_PAYMENT';
      booking.bookingStatus = 'AWAITING_REMAINING_PAYMENT';
    }
    await booking.save();
    // Audit log
    const PaymentAuditLog = require('../models/PaymentAuditLog');
    await PaymentAuditLog.create({
      payment: payment._id,
      booking: booking._id,
      action: 'ADMIN_PARTIAL',
      performedBy: req.user._id,
      previousStatus: 'PENDING',
      newStatus: payment.status,
      note: adminNote || `Partial payment of ₹${amount} verified. Remaining: ₹${newRemainingAmount}`,
    });
    res.json({
      success: true,
      message: newRemainingAmount <= 0
        ? 'Payment fully verified. Order confirmed.'
        : `Partial payment of ₹${amount} verified. Remaining: ₹${newRemainingAmount}`,
      data: {
        payment,
        booking: {
          paidAmount: booking.paidAmount,
          remainingAmount: booking.remainingAmount,
          paymentStatus: booking.paymentStatus,
          bookingStatus: booking.bookingStatus,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refundAmount, adminRefundNote, refundTransactionId, pin } = req.body;

    const adminUser = await User.findById(req.user._id);
    if (!adminUser.securityPinHash) {
      throw new ApiError(400, 'Please set your security PIN in Settings first.');
    }
    const pinMatch = await adminUser.comparePin(pin);
    if (!pinMatch) {
      throw new ApiError(403, 'Incorrect security PIN.');
    }

    const booking = await Booking.findOne({
      $or: [mongoose.Types.ObjectId.isValid(id) ? { _id: id } : null, { bookingId: id }].filter(Boolean),
    }).populate('customer');

    if (!booking) {
      throw new ApiError(404, 'Booking not found.');
    }

    const amount = Number(refundAmount);
    if (isNaN(amount) || amount < 0) {
      throw new ApiError(400, 'Please enter a valid refund amount.');
    }

    booking.refundAmount = amount;
    booking.adminRefundNote = adminRefundNote || '';
    booking.refundTransactionId = refundTransactionId || '';
    booking.refundStatus = 'PROCESSED';
    booking.paymentStatus = 'REFUNDED';
    booking.bookingStatus = 'CANCELLED';
    booking.refundProcessedAt = new Date();
    await booking.save();

    let payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
    if (payment) {
      payment.status = 'REFUNDED';
      payment.adminNote = adminRefundNote || payment.adminNote;
      await payment.save();

      await PaymentAuditLog.create({
        payment: payment._id,
        booking: booking._id,
        action: 'ADMIN_REFUND',
        performedBy: req.user._id,
        previousStatus: payment.status,
        newStatus: 'REFUNDED',
        note: `Refund of ₹${amount} processed. ${adminRefundNote ? `Note: ${adminRefundNote}` : ''}`,
      });
    }

    res.json({
      success: true,
      message: `Refund of ₹${amount} processed successfully for booking ${booking.bookingId}`,
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitProof,
  verifyManualPayment,
  rejectManualPayment,
  verifyPartialPayment,
  processRefund,
};
