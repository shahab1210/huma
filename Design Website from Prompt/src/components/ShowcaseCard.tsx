import { type ShowcaseItem } from "../data/showcaseData";

interface ShowcaseCardProps {
  item: ShowcaseItem;
  onOpenDetail?: (item: ShowcaseItem) => void;
}

export default function ShowcaseCard({ item, onOpenDetail }: ShowcaseCardProps) {
  const whatsappUrl = `https://wa.me/918960600371?text=${encodeURIComponent(
    `Hi Huma Mehendi, I am interested in ${item.title}. Please share the available options, current price and booking details.`
  )}`;

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(item);
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface transition-all duration-300 hover:border-gold hover:shadow-md cursor-pointer"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-gold-soft/30">
        <img
          src={item.image}
          alt={`${item.title} - Huma Mehendi`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
          🔥 Special Offer
        </div>
        {item.highlight && (
          <div className="absolute right-3 top-3 rounded-full bg-brand/90 px-2.5 py-0.5 text-[10px] font-semibold text-cream shadow-sm backdrop-blur-xs">
            {item.highlight}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-6 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {item.category}
        </p>
        <h3 className="mt-1 font-display text-xl text-brand truncate" title={item.title}>
          {item.title}
        </h3>

        <span className="my-4 h-px w-10 bg-gold" aria-hidden />

        <p className="text-sm text-muted leading-relaxed line-clamp-2">{item.description}</p>

        <div className="mt-3 flex flex-col gap-0.5 pt-2 border-t border-hairline/60">
          <span className="text-xs font-semibold text-amber-800">Available on Consultation</span>
          <span className="text-[11px] text-muted">Contact Artist for Current Price &amp; Options</span>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-emerald-800 shadow-sm"
        >
          <span>💬</span> Contact Artist
        </a>
      </div>
    </article>
  );
}
