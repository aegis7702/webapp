chrome.action.onClicked.addListener(function (tab) {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

var pending = {};

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === 'AEGIS_FROM_PAGE') {
    var tabId = sender.tab && sender.tab.id;
    var windowId = sender.tab && sender.tab.windowId;
    pending[msg.id] = { payload: msg.payload, sendResponse: sendResponse };
    var openOptions = tabId != null ? { tabId: tabId } : (windowId != null ? { windowId: windowId } : null);
    if (openOptions) {
      chrome.sidePanel.open(openOptions).catch(function () {
        // User gesture lost; request stays pending until user opens panel.
      });
    }
    return true;
  }
  if (msg.type === 'getPendingRequest') {
    var id = Object.keys(pending)[0];
    if (!id) {
      sendResponse({ request: null });
      return false;
    }
    sendResponse({
      request: {
        id: id,
        method: pending[id].payload?.method,
        params: pending[id].payload?.params,
      },
    });
    return false;
  }
  if (msg.type === 'resolveRequest') {
    var req = pending[msg.id];
    if (req) {
      req.sendResponse({ result: msg.result, error: msg.error || null });
      delete pending[msg.id];
    }
    return false;
  }
});
