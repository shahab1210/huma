export default function WhatsAppFab() {
  const whatsappNumber = "918960600371";
  
  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Huma on WhatsApp"
      className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-available text-white shadow-lg transition-transform hover:scale-105 hover:rotate-6 lg:bottom-6"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.32-1.95 1.36-.5.05-.98.24-3.3-.69-2.79-1.1-4.55-3.96-4.69-4.14-.14-.18-1.13-1.5-1.13-2.86 0-1.36.71-2.03.96-2.31.24-.27.53-.34.71-.34.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.79 2 .86 2.14.07.14.11.31.02.5-.09.18-.14.29-.27.45-.14.16-.29.36-.41.48-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.11.59-.07.16-.18.68-.8.86-1.07.18-.27.36-.23.61-.14.24.09 1.55.73 1.82.86.27.14.45.2.51.31.07.11.07.64-.17 1.32Z" />
      </svg>
    </a>
  );
}
