/**
 * MessageBanner component for displaying status messages
 * @param {Object} props - Component props
 * @param {string} props.message - The message to display
 * @param {string} props.type - The type of message (info, success, warning, error)
 * @param {string} props.className - Additional class names
 */
const MessageBanner = ({ message, type = 'info', className = '' }) => {
  if (!message) return null;

  const baseClasses = "text-sm px-3 py-2 rounded-lg";
  
  const typeClasses = {
    info: "bg-gray-800 border-l-4 border-blue-500 text-gray-200",
    success: "bg-gray-800 border-l-4 border-green-500 text-gray-200",
    warning: "bg-gray-800 border-l-4 border-yellow-500 text-gray-200",
    error: "bg-gray-800 border-l-4 border-red-500 text-gray-200",
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type] || typeClasses.info} ${className}`}>
      {message}
    </div>
  );
};

export default MessageBanner; 