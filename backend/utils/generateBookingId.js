/**
 * Generate a unique booking ID in format HM-XXXXXX
 */
const generateBookingId = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `HM-${num}`;
};

module.exports = generateBookingId;
