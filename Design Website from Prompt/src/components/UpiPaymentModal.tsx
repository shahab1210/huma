import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  bookingId: string;
  onlineBookingAmount: number;
}

export default function UpiPaymentModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  bookingId,
  onlineBookingAmount,
}: UpiPaymentModalProps) {
  const { businessSettings, submitPaymentProof, showToast } = useApp();
  const [transactionId, setTransactionId] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [screenshotName, setScreenshotName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const upiId = businessSettings?.upiId || "demo@upi";
  const upiQrImage = businessSettings?.upiQrImage || "/demo/demo-upi-qr.png";
  const paymentWhatsApp = businessSettings?.paymentWhatsApp || "8960600371";

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    showToast("UPI ID copied to clipboard!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Only JPG, JPEG, PNG, and WEBP screenshots are allowed.", "error");
      return;
    }

    // Validate size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("Screenshot file size cannot exceed 5MB.", "error");
      return;
    }

    setScreenshotName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setScreenshotBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotBase64("");
    setScreenshotName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId && !screenshotBase64) {
      showToast("Please provide either a Transaction ID or upload a screenshot.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitPaymentProof(bookingId, transactionId, screenshotBase64);
      if (res.success) {
        showToast("Payment proof submitted successfully!");
        onSubmitSuccess();
      } else {
        showToast(res.message || "Failed to submit payment proof", "error");
      }
    } catch {
      showToast("Failed to connect to server. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="my-8 relative w-full max-w-[440px] overflow-hidden rounded-2xl bg-surface border border-hairline shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="bg-brand px-6 py-5 text-cream border-b border-hairline">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">Secure Booking Payment</p>
              <h3 className="font-display text-2xl text-cream font-semibold mt-0.5">
                ₹{onlineBookingAmount.toLocaleString("en-IN")}
              </h3>
            </div>
            <span className="rounded bg-gold/20 px-2.5 py-1 text-[9px] font-bold tracking-wider text-gold uppercase border border-gold/30">
              DEMO PAYMENT DETAILS
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-sm text-ink max-h-[75vh] overflow-y-auto">
          {/* Instructions */}
          <div className="rounded-xl bg-cream/30 p-4 border border-hairline space-y-1.5 text-xs text-brand leading-relaxed">
            <p className="font-semibold text-gold uppercase tracking-wider text-[10px]">Steps to pay:</p>
            <p>1. Scan the QR code or copy the UPI ID below.</p>
            <p>2. Complete the ₹{onlineBookingAmount.toLocaleString("en-IN")} payment in your UPI app.</p>
            <p>3. Take a screenshot or copy the UTR / Transaction ID.</p>
            <p>4. Enter the details below and submit your proof.</p>
          </div>

          {/* QR Code and UPI ID */}
          <div className="flex flex-col items-center justify-center py-2 space-y-4">
            <div className="relative rounded-xl border border-hairline bg-cream/10 p-2 shadow-sm">
              <img
                src={upiQrImage}
                alt="UPI Payment QR Code"
                className="h-44 w-44 object-contain rounded-lg"
                onError={(e) => {
                  // Fallback if demo QR image is not found
                  (e.target as HTMLImageElement).src =
                    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
                    encodeURIComponent(`upi://pay?pa=${upiId}&pn=Huma%20Mehendi&am=${onlineBookingAmount}&cu=INR`);
                }}
              />
            </div>
            
            <div className="w-full text-center space-y-2">
              <p className="text-[11px] font-semibold text-gold uppercase tracking-wider">Scan QR with Google Pay, PhonePe, Paytm, BHIM</p>
              <div className="flex items-center justify-center gap-2 rounded-lg border border-hairline bg-cream/25 px-3 py-2 max-w-xs mx-auto">
                <span className="font-mono text-xs text-brand font-medium truncate select-all">{upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpiId}
                  className="rounded bg-brand/5 border border-hairline px-2 py-1 text-[10px] font-semibold text-brand hover:bg-brand hover:text-cream transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* User inputs */}
          <div className="space-y-4 border-t border-hairline pt-4">
            {/* UTR */}
            <div>
              <label htmlFor="tx-id" className="block text-[11px] font-semibold text-gold uppercase tracking-wider">
                UPI Transaction ID / UTR
              </label>
              <input
                id="tx-id"
                type="text"
                placeholder="Enter 12-digit transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-hairline bg-cream/20 px-3 py-2.5 text-xs text-brand focus:border-gold focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-muted">You can copy this number from your payment app history.</p>
            </div>

            {/* Screenshot upload */}
            <div>
              <label className="block text-[11px] font-semibold text-gold uppercase tracking-wider mb-1">
                Payment Screenshot
              </label>
              
              {!screenshotBase64 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-cream/10 p-6 text-center hover:bg-cream/20 transition-colors"
                >
                  <span className="text-2xl">📸</span>
                  <p className="mt-2 text-xs font-semibold text-brand">Upload Screenshot</p>
                  <p className="text-[10px] text-muted mt-1">Supports JPG, PNG, WEBP up to 5MB</p>
                </div>
              ) : (
                <div className="rounded-xl border border-hairline bg-cream/5 p-3 space-y-3">
                  <div className="relative mx-auto max-w-[200px] rounded-lg border border-hairline overflow-hidden shadow-sm bg-black/5">
                    <img src={screenshotBase64} alt="Screenshot Preview" className="max-h-36 mx-auto object-contain" />
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-hairline pt-2 mt-2">
                    <span className="text-muted truncate max-w-[180px] font-mono">{screenshotName}</span>
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="text-[10px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting || (!transactionId && !screenshotBase64)}
              className="w-full rounded-md bg-brand py-3 text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-cream" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting Payment Proof...
                </>
              ) : (
                "Submit Payment Proof"
              )}
            </button>
            
            <p className="text-[10px] text-muted text-center leading-relaxed">
              Your booking will remain in <strong className="text-gold">Verification Pending</strong> state until Huma checks the transaction in her bank. We appreciate your patience.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-hairline bg-cream/15 p-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-muted hover:text-brand transition-colors"
          >
            Cancel &amp; Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
