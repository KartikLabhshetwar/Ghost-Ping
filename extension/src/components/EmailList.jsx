import { useState } from 'react';
import { EnvelopeIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

/**
 * EmailList component for displaying and copying email addresses
 * @param {Object} props - Component props
 * @param {Array} props.emails - Array of email addresses
 * @param {string} props.className - Additional class names
 */
const EmailList = ({ emails = [], className = '' }) => {
  const [copied, setCopied] = useState('');
  
  if (!emails || emails.length === 0) return null;
  
  const copyToClipboard = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(email);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };
  
  const emailRowClasses = "flex items-center justify-between py-1.5 px-3 bg-gray-700 rounded-lg my-2";
  const emailClasses = "text-gray-100";
  const copyButtonClasses = "p-1.5 rounded-lg hover:bg-gray-600 transition-colors";
  const copyIconClasses = "h-4 w-4 text-gray-300";

  return (
    <div className={className}>
      <h2 className="text-sm uppercase text-gray-400 mb-2 font-semibold tracking-wide">
        Email Addresses
      </h2>
      
      {emails.map((email, index) => (
        <div key={index} className={emailRowClasses}>
          <div className={emailClasses}>
            <EnvelopeIcon className="h-4 w-4 inline mr-2 text-gray-400" />
            {email}
          </div>
          <button 
            onClick={() => copyToClipboard(email)}
            className={copyButtonClasses}
            title="Copy to clipboard"
          >
            <ClipboardDocumentIcon className={copyIconClasses} />
            {copied === email && (
              <span className="absolute -top-7 right-0 text-xs bg-gray-700 px-2 py-1 rounded">
                Copied!
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default EmailList; 