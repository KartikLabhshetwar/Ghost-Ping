/* eslint-env webextensions */
/// <reference types="chrome" />
import { useState, useEffect } from 'react';
import { ClipboardDocumentIcon, EnvelopeIcon, UserIcon, MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import AppHeader from './components/AppHeader';
import MessageBanner from './components/MessageBanner';
import ProfileInfo from './components/ProfileInfo';
import EmailList from './components/EmailList';

// Add Inter font and dark theme styles
const styles = {
  container: "w-[400px] min-h-[300px] bg-[#1e1e1e] text-gray-200 font-['Inter',sans-serif]",
  header: "p-4 border-b border-gray-700",
  headerContent: "flex justify-between items-center",
  title: "text-xl font-bold text-gray-100",
  scanButton: "px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center space-x-2",
  scanningButton: "px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 flex items-center space-x-2",
  content: "p-4 space-y-4",
  message: "text-sm px-3 py-2 bg-gray-800 rounded-lg border-l-4 border-blue-500",
  infoCard: "p-3 bg-gray-800 rounded-lg",
  infoRow: "flex items-start space-x-3 py-1.5",
  infoIcon: "h-5 w-5 text-gray-400 mt-0.5",
  infoText: "text-gray-200 flex-1",
  emailRow: "flex items-center justify-between py-1.5 px-3 bg-gray-700 rounded-lg my-2",
  email: "text-gray-100",
  copyButton: "p-1.5 rounded-lg hover:bg-gray-600 transition-colors",
  copyIcon: "h-4 w-4 text-gray-300",
  noContent: "text-center py-8 text-gray-400",
};

/**
 * Save profile data to chrome.storage.local
 */
const saveProfileData = async (url, data) => {
  if (!url || !data) return;
  
  try {
    // Get existing profiles
    const result = await chrome.storage.local.get('profiles');
    const profiles = result.profiles || {};
    
    // Update with new data
    profiles[url] = {
      ...data,
      timestamp: Date.now()
    };
    
    // Save back to storage
    await chrome.storage.local.set({ profiles });
    console.log('Saved profile data for', url);
    
    // Also save the last URL for quick access next time
    await chrome.storage.local.set({ lastUrl: url });
  } catch (err) {
    console.error('Error saving profile data:', err);
  }
};

/**
 * Load profile data from chrome.storage.local
 */
const loadProfileData = async (url) => {
  if (!url) return null;
  
  try {
    const result = await chrome.storage.local.get('profiles');
    const profiles = result.profiles || {};
    return profiles[url] || null;
  } catch (err) {
    console.error('Error loading profile data:', err);
    return null;
  }
};

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
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState('');

  // Add a useEffect to load data when popup opens
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Try to get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) return;
        
        // Check if we have cached data for this URL
        const cachedData = await loadProfileData(tab.url);
        if (cachedData) {
          console.log('Using cached data for', tab.url);
          setProfileInfo(cachedData);
          setMessage(cachedData.emails?.length ? 'Email found from cache!' : 'No email found.');
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };
    
    loadInitialData();
    
    // Set up listener to keep popup open
    document.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Cleanup
    return () => {
      document.removeEventListener('click', (e) => {
        e.stopPropagation();
      });
    };
  }, []);

  const extractInfo = async () => {
    setLoading(true);
    setIsScanning(true);
    setMessage('');
    try {
      // First check if we're on a supported site
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we're on a valid site first
      if (!tab.url || !tab.url.includes('linkedin.com')) {
        throw new Error('Please open a LinkedIn profile before scanning');
      }
      
      // Check if cached data exists for this URL
      const cachedData = await loadProfileData(tab.url);
      if (cachedData) {
        try {
          if (cachedData && cachedData.emails && cachedData.emails.length > 0) {
            console.log('Using cached data:', cachedData);
            setProfileInfo(cachedData);
            setMessage('Email found from cache!');
            setLoading(false);
            setIsScanning(false);
            return;
          }
        } catch (e) {
          console.warn('Error reading cached data:', e);
          // Continue with live scan if cache read fails
        }
      }
      
      // Try to check if content script is available by sending a ping
      try {
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tab.id, { action: 'ping' }, response => {
            if (chrome.runtime.lastError) {
              reject(new Error('Content script not available. Try refreshing the page.'));
            } else if (response && response.pong) {
              resolve();
            } else {
              reject(new Error('Invalid response from content script'));
            }
          });
          
          // Add timeout to avoid hanging
          setTimeout(() => reject(new Error('Connection timed out')), 2000);
        });
      } catch (pingError) {
        // If ping failed, try injecting the content script
        console.warn('Content script ping failed:', pingError);
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          // Wait a moment for the script to initialize
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (injectError) {
          throw new Error('Could not inject content script: ' + injectError.message);
        }
      }
      
      // Now send the actual extractInfo message
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: 'extractInfo' }, (response) => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          resolve(response);
        });
        
        // Add timeout to avoid hanging
        setTimeout(() => reject(new Error('Extraction timed out')), 10000);
      });
      
      console.log('Response from content script:', response);

      if (response && response.error) {
        setMessage(`Error: ${response.error}`);
      } else if (response) {
        // Save to localStorage for persistence
        if (response.url && (response.emails?.length > 0 || response.name)) {
          await saveProfileData(tab.url, response);
        }
        
        setProfileInfo(response);
        setMessage(response.emails?.length ? 'Email found!' : 'No email found.');
      } else {
        setMessage('No response from content script.');
      }
    } catch (error) {
      console.error('Error in extractInfo:', error);
      setMessage(`Error: ${error.message || 'Could not connect to content script.'}`);
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
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
    <div className={styles.container}>
      <AppHeader 
        isScanning={isScanning} 
        disabled={loading}
        onScanClick={extractInfo}
      />

      <div className={styles.content}>
        {message && <MessageBanner message={message} />}

        {/* Profile Info */}
        {profileInfo.name && (
          <ProfileInfo profile={profileInfo} />
        )}

        {/* Emails Section */}
        {profileInfo.emails.length > 0 && (
          <EmailList 
            emails={profileInfo.emails}
            onCopy={copyToClipboard}
            copied={copied}
          />
        )}

        {/* Empty State */}
        {!profileInfo.name && !message && (
          <div className={styles.noContent}>
            Click "Scan Profile" to extract information
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
