import React from 'react';
import { useAppContext } from '../context/AppContext';
import { HomeIcon, ArrowLeftIcon } from '../components/icons';

const NotFound: React.FC = () => {
  const { navigate } = useAppContext();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md mx-auto">
        {/* Decorative henna motif */}
        <div className="mb-6">
          <svg className="mx-auto w-32 h-32 text-amber-700/20" viewBox="0 0 200 200" fill="currentColor">
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
            <path d="M100 10 Q115 50 100 100 Q85 50 100 10Z" opacity="0.3" />
            <path d="M190 100 Q150 115 100 100 Q150 85 190 100Z" opacity="0.3" />
            <path d="M100 190 Q85 150 100 100 Q115 150 100 190Z" opacity="0.3" />
            <path d="M10 100 Q50 85 100 100 Q50 115 10 100Z" opacity="0.3" />
            <circle cx="100" cy="100" r="8" opacity="0.4" />
          </svg>
        </div>

        <h1 className="text-6xl font-bold text-amber-800 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-stone-800 mb-3">Page Not Found</h2>
        <p className="text-stone-600 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
          Let's get you back to exploring our beautiful mehendi & beauty services.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-amber-700 text-amber-800 rounded-xl font-medium hover:bg-amber-50 transition-colors"
          >
            <ArrowLeftIcon size={18} />
            Go Back
          </button>
          <button
            onClick={() => navigate('home')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-800 text-white rounded-xl font-medium hover:from-amber-800 hover:to-amber-900 transition-all shadow-lg"
          >
            <HomeIcon size={18} />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
