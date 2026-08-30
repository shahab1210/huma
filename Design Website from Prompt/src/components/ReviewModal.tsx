import { useState } from "react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  serviceName: string;
}

export default function ReviewModal({ isOpen, onClose, onSubmit, serviceName }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onSubmit(rating, comment.trim());
    setComment("");
    setRating(5);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <h3 className="font-display text-xl text-brand">Leave a Review</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-brand"
            aria-label="Close review dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gold">Service reviewed</p>
            <p className="text-sm font-medium text-brand mt-1">{serviceName}</p>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gold">Rating</label>
            <div className="flex items-center gap-2 mt-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const starVal = i + 1;
                const active = hoverRating !== null ? starVal <= hoverRating : starVal <= rating;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(null)}
                    className={`text-2xl transition-colors ${active ? "text-gold" : "text-hairline"}`}
                    aria-label={`Rate ${starVal} stars`}
                  >
                    ★
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="review-comment" className="block text-xs font-medium uppercase tracking-wider text-gold">
              Your Review
            </label>
            <textarea
              id="review-comment"
              rows={4}
              required
              placeholder="Share your experience with Huma's service..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2 w-full rounded-xl border border-hairline bg-cream/40 px-4 py-3 text-sm text-ink focus:border-gold focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-hairline py-2.5 text-sm font-medium text-muted hover:text-brand transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md bg-brand py-2.5 text-sm font-medium text-cream hover:bg-brand-700 transition-colors"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
