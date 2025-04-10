import LoadingButton from './LoadingButton';

/**
 * AppHeader component with title and scan button
 * @param {Object} props - Component props
 * @param {string} props.title - The app title
 * @param {Function} props.onScanClick - Function to call when scan button is clicked
 * @param {boolean} props.isScanning - Whether the scan is in progress
 * @param {boolean} props.disabled - Whether the scan button is disabled
 * @param {string} props.className - Additional class names
 */
const AppHeader = ({ 
  title = 'Ghost Ping', 
  onScanClick, 
  isScanning = false, 
  disabled = false,
  className = '' 
}) => {
  const headerClasses = "p-4 border-b border-gray-700";
  const contentClasses = "flex justify-between items-center";
  const titleClasses = "text-xl font-bold text-gray-100";

  return (
    <div className={`${headerClasses} ${className}`}>
      <div className={contentClasses}>
        <h1 className={titleClasses}>{title}</h1>
        <LoadingButton
          onClick={onScanClick}
          loading={isScanning}
          loadingText="Scanning..."
          defaultText="Scan Profile"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default AppHeader; 