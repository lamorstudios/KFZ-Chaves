(function () {
  var R = window.CHAVES_ROUTES;
  if (!R || typeof window.showPage !== 'function') return;
  var byPath = {};
  Object.keys(R).forEach(function (id) { byPath[R[id].path] = id; });

  function setMeta(id) {
    var r = R[id]; if (!r) return;
    document.title = r.title;
    var set = function (sel, attr, val) { var el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
    var url = 'https://kfz-chaves.de' + r.path;
    set('meta[name="description"]', 'content', r.desc);
    set('link[rel="canonical"]', 'href', url);
    set('meta[property="og:url"]', 'content', url);
    set('meta[property="og:title"]', 'content', r.title);
    set('meta[property="og:description"]', 'content', r.desc);
    set('meta[name="robots"]', 'content', r.noindex ? 'noindex, follow' : 'index, follow');
  }

  var orig = window.showPage;
  var fromPop = false;
  var routed = function (n) {
    orig(n);
    var r = R[n];
    if (r) {
      if (!fromPop && location.pathname !== r.path) history.pushState({ page: n }, '', r.path);
      setMeta(n);
    }
  };
  window.showPage = routed;
  try { showPage = routed; } catch (e) {}

  window.addEventListener('popstate', function () {
    var id = byPath[location.pathname] || byPath[location.pathname + '/'] || 'start';
    fromPop = true; try { window.showPage(id); } finally { fromPop = false; }
  });

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '/') return;
    var id = byPath[href];
    if (!id) return;
    e.preventDefault();
    window.showPage(id);
  });

  history.replaceState({ page: (document.querySelector('.page.active') || {}).id }, '', location.pathname);
})();
