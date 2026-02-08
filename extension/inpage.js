/**
 * Inpage provider: window.aegis.request({ method, params }) -> Promise<result>
 * Supported: eth_requestAccounts -> [address], eth_sendTransaction -> txHash (after user signs in panel).
 */
(function () {
  if (typeof window !== 'undefined' && window.aegis) return;
  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  var provider = {
    request: function (args) {
      var id = uid();
      return new Promise(function (resolve, reject) {
        function handler(ev) {
          if (ev.source !== window || !ev.data || ev.data.type !== 'AEGIS_INPAGE_RESPONSE' || ev.data.id !== id)
            return;
          window.removeEventListener('message', handler);
          if (ev.data.error) {
            var msg = ev.data.error;
            var err = new Error(msg);
            if (msg) {
              if (msg.indexOf('Extension context invalidated') !== -1 || msg.indexOf('reloaded or disabled') !== -1) {
                err.code = 'AEGIS_CONTEXT_INVALIDATED';
              } else if (msg.indexOf('open Aegis from the toolbar') !== -1 || msg.indexOf('puzzle icon') !== -1) {
                err.code = 'AEGIS_OPEN_PANEL';
              }
              if (err.code) err.stack = msg;
            }
            reject(err);
          } else {
            resolve(ev.data.result);
          }
        }
        window.addEventListener('message', handler);
        window.postMessage({ type: 'AEGIS_INPAGE_REQUEST', id: id, payload: args }, '*');
      });
    },
  };
  if (typeof window !== 'undefined') window.aegis = provider;
})();
