import { useApp } from "../context/AppContext";

export default function Contact() {
  const { serviceAreas } = useApp();
  const phone = "8960600371";
  const whatsapp = "918960600371";
  const instagram = "huma_mehendi_06";
  const email = "humamehendi1210@gmail.com";

  const contacts = [
    {
      label: "Phone Hotline",
      value: phone,
      desc: "Call for quick enquiries and urgent slot availability.",
      href: `tel:${phone}`,
      btnText: "Call Now",
      icon: "📞"
    },
    {
      label: "WhatsApp Chat",
      value: `+91 ${phone}`,
      desc: "Share your custom designs or makeup inspirations.",
      href: `https://wa.me/${whatsapp}`,
      btnText: "Chat on WhatsApp",
      icon: "💬"
    },
    {
      label: "Instagram Portfolio",
      value: `@${instagram}`,
      desc: "Browse our latest real-bride designs and videos.",
      href: `https://instagram.com/${instagram}`,
      btnText: "Follow Us",
      icon: "📸"
    },
    {
      label: "Email Enquiries",
      value: email,
      desc: "Send us a message for business or long-term packages.",
      href: `mailto:${email}`,
      btnText: "Email Us",
      icon: "✉"
    }
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-24 lg:px-8">
      {/* Title */}
      <div className="mb-12 text-center">
        <p className="flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.28em] text-gold">
          <span className="h-px w-6 bg-gold" aria-hidden />
          Get In Touch
          <span className="h-px w-6 bg-gold" aria-hidden />
        </p>
        <h1 className="mt-4 font-display text-4xl text-brand sm:text-5xl font-semibold">Contact Huma</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Ready to secure your special date? Speak to Huma directly or book online.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {contacts.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-hairline bg-surface p-6 flex flex-col justify-between hover:border-gold transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{c.icon}</span>
                <h3 className="font-display text-lg text-brand font-semibold">{c.label}</h3>
              </div>
              <p className="mt-1 text-md font-bold text-brand">{c.value}</p>
              <p className="mt-2 text-xs text-muted leading-relaxed">{c.desc}</p>
            </div>
            <div className="mt-6">
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="inline-block rounded bg-brand px-4 py-2 text-xs font-semibold text-cream hover:bg-brand-700 transition-colors"
              >
                {c.btnText}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Service Area Listing details in Contact */}
      <div className="mt-10 rounded-2xl border border-hairline bg-surface p-6 text-center space-y-3">
        <h3 className="font-display text-lg text-brand font-semibold">Travel &amp; Service Coverage</h3>
        <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
          We travel directly to your venue (home, hotel, marriage hall) within:
        </p>
        <p className="text-sm font-semibold text-brand tracking-wider">
          {serviceAreas.join(" • ")}
        </p>
        <p className="text-[10px] text-available font-semibold uppercase tracking-wider">
          ✓ No travel fee applied for any booking
        </p>
      </div>
    </div>
  );
}
