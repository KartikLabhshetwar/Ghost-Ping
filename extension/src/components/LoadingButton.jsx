import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * LoadingButton component that shows a spinner when loading
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Whether the button is in loading state
 * @param {string} props.loadingText - Text to display when loading
 * @param {string} props.defaultText - Text to display when not loading
 * @param {Function} props.onClick - Function to call when button is clicked
 * @param {string} props.className - Additional class names
 * @param {boolean} props.disabled - Whether the button is disabled
 */
const LoadingButton = ({ 
  loading, 
  loadingText = 'Loading...', 
  defaultText = 'Submit', 
  onClick, 
  className = '',
  disabled = false
}) => {
  const baseClasses = "px-4 py-2 rounded-lg disabled:opacity-50 transition-colors flex items-center space-x-2";
  const loadingClasses = "bg-gray-800 text-gray-300";
  const defaultClasses = "bg-gray-700 text-gray-100 hover:bg-gray-600";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${loading ? loadingClasses : defaultClasses} ${className}`}
    >
      {loading ? (
        <>
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        <span>{defaultText}</span>
      )}
    </button>
  );
};

export default LoadingButton; 