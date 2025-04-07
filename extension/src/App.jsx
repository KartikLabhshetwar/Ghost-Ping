import { useState, useEffect } from 'react';
import { ClipboardDocumentIcon, EnvelopeIcon, UserIcon, MapPinIcon } from '@heroicons/react/24/outline';

function App() {
  const [profileInfo, setProfileInfo] = useState({
    name: '',
    title: '',
    location: '',
    emails: [],
    currentURL: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const extractInfo = async () => {
    setLoading(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractInfo' });
      if (response) {
        setProfileInfo(response);
        setMessage(response.emails.length ? 'Email found!' : 'No email found.');
      }
    } catch (error) {
      setMessage('Error extracting information.');
      console.error(error);
    }
    setLoading(false);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('Failed to copy.');
    }
  };

  useEffect(() => {
    const handleMessage = (request) => {
      if (request.type === 'PROFILE_UPDATE') {
        setProfileInfo(request.profileInfo);
      } else if (request.type === 'FOUND_EMAILS') {
        setProfileInfo(prev => ({ ...prev, emails: request.emails }));
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  return (
    <div className="w-[400px] min-h-[300px] p-4 bg-white">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">ghostPing</h1>
          <button
            onClick={extractInfo}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Scanning...' : 'Scan Profile'}
          </button>
        </div>

        {message && (
          <div className="text-sm text-center p-2 bg-gray-100 rounded-lg">
            {message}
          </div>
        )}

        <div className="space-y-3">
          {profileInfo.name && (
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-800">{profileInfo.name}</span>
            </div>
          )}

          {profileInfo.title && (
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600">{profileInfo.title}</span>
            </div>
          )}

          {profileInfo.location && (
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600">{profileInfo.location}</span>
            </div>
          )}

          {profileInfo.emails.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700">Email Addresses:</h2>
              {profileInfo.emails.map((email, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-800">{email}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(email)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Copy to clipboard"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
