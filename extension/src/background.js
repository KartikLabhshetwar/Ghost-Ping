// Background script to handle contact info fetching

// Keep track of tabs we've created for contact info
const contactInfoTabs = new Map();

const sendMessageToTab = async (tabId, message) => {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (err) {
    console.warn(`Failed to send message to tab ${tabId}:`, err);
    return null;
  }
};

const createHiddenTab = async (url, originalTabId) => {
  try {
    const tab = await chrome.tabs.create({
      url: url,
      active: false
    });
    contactInfoTabs.set(tab.id, originalTabId);
    return tab;
  } catch (err) {
    console.error('Failed to create hidden tab:', err);
    return null;
  }
};

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.type === "FETCH_CONTACT_INFO" && sender.tab) {
        const tab = await createHiddenTab(request.url, sender.tab.id);
        if (!tab) {
          console.warn('Failed to create hidden tab for contact info');
        }
        sendResponse({ success: !!tab });
      } else if (request.type === "PROFILE_UPDATE" && sender.tab && contactInfoTabs.has(sender.tab.id)) {
        const originalTabId = contactInfoTabs.get(sender.tab.id);
        
        // Forward the contact info to the original tab
        await sendMessageToTab(originalTabId, {
          type: "FOUND_EMAILS",
          emails: request.profileInfo.emails
        });

        // Close the contact info tab
        try {
          await chrome.tabs.remove(sender.tab.id);
          contactInfoTabs.delete(sender.tab.id);
        } catch (err) {
          console.warn('Failed to close contact info tab:', err);
        }
      }
    } catch (err) {
      console.error('Error in message handler:', err);
      sendResponse({ error: err.message });
    }
  })();
  return true; // Keep the message channel open for async response
}); 