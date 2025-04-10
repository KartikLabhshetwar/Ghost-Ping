import { UserIcon, MapPinIcon } from '@heroicons/react/24/outline';

/**
 * ProfileInfo component for displaying user profile details
 * @param {Object} props - Component props
 * @param {Object} props.profile - The profile data
 * @param {string} props.profile.name - The user's name
 * @param {string} props.profile.title - The user's title
 * @param {string} props.profile.location - The user's location
 * @param {string} props.className - Additional class names
 */
const ProfileInfo = ({ profile, className = '' }) => {
  if (!profile || !profile.name) return null;
  
  const { name, title, location } = profile;
  
  const baseClasses = "p-3 bg-gray-800 rounded-lg";
  const rowClasses = "flex items-start space-x-3 py-1.5";
  const iconClasses = "h-5 w-5 text-gray-400 mt-0.5";
  const textClasses = "text-gray-200 flex-1";

  return (
    <div className={`${baseClasses} ${className}`}>
      {name && (
        <div className={rowClasses}>
          <UserIcon className={iconClasses} />
          <div className={textClasses}>
            <div className="font-medium">{name}</div>
            {title && <div className="text-sm text-gray-400 mt-0.5">{title}</div>}
          </div>
        </div>
      )}

      {location && (
        <div className={rowClasses}>
          <MapPinIcon className={iconClasses} />
          <span className={textClasses}>{location}</span>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo; 