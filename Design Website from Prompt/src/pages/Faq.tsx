import { useState } from "react";
import SEOHead from "../components/SEOHead";

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const FAQS = [
    {
      q: "How does the booking payment work?",
      a: "To confirm any appointment, we require a standard online deposit of ₹1,500 via UPI QR code or UPI ID, which you submit directly on the website for admin verification. If your total service booking value is less than or equal to ₹1,500, you pay only that lower subtotal online. The remaining balance amount is paid directly to the artist post-service."
    },
    {
      q: "Are there travel fees for out-of-town locations?",
      a: "No! There is no separate travel charge across our standard coverage cities, including Lucknow, Kanpur, Raebareli, Bachhrawan, Lalganj, and neighboring towns around Raebareli."
    },
    {
      q: "What products are used for makeup services?",
      a: "We only use premium, dermatologically tested cosmetics such as MAC, Huda Beauty, Kryolan, Estée Lauder, and Smashbox. All services include custom consultations regarding skin type and preferences."
    },
    {
      q: "How organic is the mehendi henna paste?",
      a: "We prepare our henna paste freshly using 100% organic Sojat henna leaves, essential oils (tea tree, eucalyptus), and lemon juice water. It contains zero chemicals, PPD, or synthetic dyes, making it safe for children and pregnant individuals."
    },
    {
      q: "Can I reschedule my appointment?",
      a: "Yes! You can request a reschedule through your Customer Dashboard up to 48 hours prior to your slot. The rescheduling is subject to availability and requires manual approval from our admin team."
    },
    {
      q: "What is the cancellation policy?",
      a: "If we cancel your slot, you get a full refund of your ₹1,500 deposit. If you cancel, a standard ₹500 cancellation fee applies. Bookings cancelled within 5 days of the appointment date are generally non-refundable."
    },
    {
      q: "Can I book multiple services in one slot?",
      a: "Yes, you can add multiple designs, makeup packages, or parlour treatments to your cart and book them together under a single ₹1,500 deposit slot."
    }
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-24 lg:px-8">
      <SEOHead
        title="Frequently Asked Questions | Huma Mehendi & Beauty Artist"
        description="Find answers to common questions about booking bridal mehendi, travel fees in Lucknow & Raebareli, organic henna quality, and makeup products used by Huma Mehendi."
        canonicalUrl="https://humamehendi.in/faq"
        structuredData={faqSchema}
      />
      {/* Title */}
      <div className="mb-12 text-center">
        <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
          <span className="h-px w-6 bg-gold" aria-hidden />
          Booking Guide
          <span className="h-px w-6 bg-gold" aria-hidden />
        </p>
        <h1 className="mt-4 font-display text-4xl text-brand sm:text-5xl font-semibold">FAQs</h1>
      </div>

      <div className="divide-y divide-hairline border-y border-hairline bg-surface rounded-xl border px-6">
        {FAQS.map((f, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={f.q}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-display text-lg text-brand font-medium">{f.q}</span>
                <span
                  className={
                    "shrink-0 text-xl text-gold transition-transform " +
                    (isOpen ? "rotate-45" : "")
                  }
                  aria-hidden
                >
                  +
                </span>
              </button>
              <div
                className={
                  "grid transition-all duration-300 " +
                  (isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0")
                }
              >
                <p className="overflow-hidden text-[15px] leading-relaxed text-muted">{f.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
