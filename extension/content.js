(function () {
  function sendResponse(id, result, error) {
    try {
      window.postMessage(
        { type: 'AEGIS_INPAGE_RESPONSE', id: id, result: result, error: error || null },
        '*'
      );
    } catch (e) {
      // ignore
    }
  }

  window.addEventListener('message', function (ev) {
    if (ev.source !== window || !ev.data || ev.data.type !== 'AEGIS_INPAGE_REQUEST') return;
    var id = ev.data.id;
    var payload = ev.data.payload;
    try {
      chrome.runtime.sendMessage(
        { type: 'AEGIS_FROM_PAGE', id: id, payload: payload },
        function (response) {
          if (chrome.runtime.lastError) {
            var msg = chrome.runtime.lastError.message || 'Extension error';
            if (msg.indexOf('Extension context invalidated') !== -1) {
              msg = 'Extension was reloaded or disabled. Please refresh this page and try again.';
            }
            sendResponse(id, null, msg);
            return;
          }
          var err = response && response.error;
          var result = response && response.result;
          sendResponse(id, result, err || null);
        }
      );
    } catch (e) {
      var msg = e && e.message ? e.message : String(e);
      if (msg.indexOf('Extension context invalidated') !== -1) {
        msg = 'Extension was reloaded or disabled. Please refresh this page and try again.';
      }
      sendResponse(id, null, msg);
    }
  });
})();
