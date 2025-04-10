/// <reference types="chrome" />

// Simple email regex that's less likely to cause issues
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Validate if a string looks like a real email
 */
const isValidEmail = (email) => {
  // Common image extensions to filter out
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '@1x', '@2x', '@3x'];
  
  // Check if the email contains any image extensions
  if (imageExtensions.some(ext => email.toLowerCase().includes(ext))) {
    return false;
  }

  // Basic email structure validation
  if (!email.includes('@') || !email.includes('.')) {
    return false;
  }

  // Check for common email domains
  const commonDomains = ['.com', '.org', '.net', '.edu', '.gov', '.co', '.io'];
  if (!commonDomains.some(domain => email.toLowerCase().endsWith(domain))) {
    return false;
  }

  // Must have characters before @ and between @ and domain
  const [localPart, domainPart] = email.split('@');
  if (!localPart || !domainPart || localPart.length < 2 || domainPart.length < 4) {
    return false;
  }

  return true;
};

/**
 * Extract emails from text content with validation
 */
const extractEmailsFromText = (text) => {
  if (!text) return [];
  const matches = text.match(EMAIL_REGEX) || [];
  return matches.filter(isValidEmail);
};

/**
 * Extract emails from hidden elements
 */
const extractHiddenEmails = () => {
  const hiddenElements = document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], [hidden]');
  let emails = [];
  
  hiddenElements.forEach(element => {
    const text = element.textContent;
    const foundEmails = extractEmailsFromText(text);
    emails = [...emails, ...foundEmails];
  });

  return emails;
};

/**
 * Apply premium bypass styles
 */
const applyPremiumBypass = () => {
  // Create style element
  const style = document.createElement('style');
  style.textContent = `
    .premium-feature, 
    .contact-info, 
    .pv-contact-info,
    [data-section="contact-info"],
    .pv-profile-section,
    .artdeco-modal__content,
    .pv-contact-info__contact-type,
    .pv-profile-section__section-info {
      display: block !important; 
      visibility: visible !important; 
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);

  // Override premium checks using MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const element = mutation.target;
        if (element.classList.contains('premium-feature') || 
            element.classList.contains('contact-info') ||
            element.classList.contains('pv-contact-info')) {
          element.style.display = 'block';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
        }
      }
    });
  });

  // Start observing the document
  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ['class']
  });
};

/**
 * Main function to extract profile information
 */
const extractProfileInfo = async () => {
  try {
    // Apply premium bypass first
    applyPremiumBypass();

    // Wait a moment for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get basic profile info from the page
    const profileInfo = {
      name: document.querySelector('.text-heading-xlarge')?.textContent?.trim() || '',
      title: document.querySelector('.text-body-medium')?.textContent?.trim() || '',
      location: document.querySelector('.text-body-small.inline')?.textContent?.trim() || '',
      emails: [],
      timestamp: Date.now(),
      url: window.location.href
    };

    // Try multiple methods to find emails
    const methods = [
      // Method 1: Check contact info section
      () => {
        const contactSections = document.querySelectorAll('.pv-contact-info__contact-type, .pv-profile-section__section-info');
        let emails = [];
        contactSections.forEach(section => {
          if (section.textContent.toLowerCase().includes('email')) {
            const foundEmails = extractEmailsFromText(section.textContent);
            emails.push(...foundEmails);
          }
        });
        return emails;
      },
      
      // Method 2: Check mailto links
      () => {
        const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
        return Array.from(mailtoLinks)
          .map(link => link.href.replace('mailto:', ''))
          .filter(isValidEmail);
      },
      
      // Method 3: Check data attributes
      () => {
        const elements = document.querySelectorAll('[data-email], [data-contact]');
        return Array.from(elements)
          .map(el => el.getAttribute('data-email') || el.getAttribute('data-contact'))
          .filter(isValidEmail);
      },
      
      // Method 4: Check hidden elements as last resort
      () => extractHiddenEmails()
    ];

    // Apply all methods
    for (const method of methods) {
      try {
        const foundEmails = method();
        profileInfo.emails.push(...foundEmails);
      } catch (error) {
        console.log('Method failed:', error);
      }
    }

    // Remove duplicates and ensure valid emails
    profileInfo.emails = [...new Set(profileInfo.emails)]
      .filter(isValidEmail);

    console.log('Extracted profile info:', profileInfo);
    return profileInfo;
  } catch (err) {
    console.error('Error in extractProfileInfo:', err);
    return {
      name: '',
      title: '',
      location: '',
      emails: [],
      timestamp: Date.now(),
      url: window.location.href
    };
  }
};

// Initialize content script
console.log('Ghost Ping content script loaded on:', window.location.href);

// Message handling
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    
    if (request.action === 'ping') {
      console.log('Received ping from popup');
      sendResponse({ pong: true });
      return true;
    }
    
    if (request.action === 'extractInfo') {
      console.log('Starting info extraction...');
      extractProfileInfo()
        .then(profileInfo => {
          console.log('Sending profile info back to popup:', profileInfo);
          sendResponse(profileInfo);
        })
        .catch(err => {
          console.error('Error extracting info:', err);
          sendResponse({ error: err.message });
        });
      return true;
    }
  });
}
