const extractEmailFromTwitter = () => {
  const bioElement = document.querySelector('[data-testid="UserDescription"]');
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  return bioElement ? bioElement.textContent.match(emailRegex) : null;
};

const extractEmailFromLinkedIn = () => {
  const contactInfoButton = document.querySelector('a[href*="contact-info"]');
  if (contactInfoButton) {
    contactInfoButton.click();
    setTimeout(() => {
      const modalContent = document.querySelector('.artdeco-modal__content');
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      const emails = modalContent ? modalContent.textContent.match(emailRegex) : null;
      if (emails) {
        chrome.runtime.sendMessage({ type: 'FOUND_EMAILS', emails });
      }
    }, 1000);
  }
};

const extractEmailFromPeerlist = () => {
  const bioElement = document.querySelector('.profile-bio');
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  return bioElement ? bioElement.textContent.match(emailRegex) : null;
};

const extractProfileInfo = () => {
  const currentURL = window.location.href;
  let profileInfo = {
    name: '',
    title: '',
    location: '',
    emails: [],
    currentURL
  };

  if (currentURL.includes('twitter.com') || currentURL.includes('x.com')) {
    profileInfo.name = document.querySelector('[data-testid="UserName"]')?.textContent || '';
    profileInfo.title = document.querySelector('[data-testid="UserProfession"]')?.textContent || '';
    profileInfo.emails = extractEmailFromTwitter() || [];
  } else if (currentURL.includes('linkedin.com')) {
    profileInfo.name = document.querySelector('.text-heading-xlarge')?.textContent || '';
    profileInfo.title = document.querySelector('.text-body-medium')?.textContent || '';
    profileInfo.location = document.querySelector('.text-body-small.inline')?.textContent || '';
    extractEmailFromLinkedIn();
  } else if (currentURL.includes('peerlist.io')) {
    profileInfo.name = document.querySelector('.profile-name')?.textContent || '';
    profileInfo.title = document.querySelector('.profile-headline')?.textContent || '';
    profileInfo.emails = extractEmailFromPeerlist() || [];
  }

  return profileInfo;
};

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractInfo') {
    const profileInfo = extractProfileInfo();
    sendResponse(profileInfo);
  }
  return true;
});

// Observe DOM changes for dynamic content
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      const profileInfo = extractProfileInfo();
      chrome.runtime.sendMessage({ type: 'PROFILE_UPDATE', profileInfo });
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
}); 