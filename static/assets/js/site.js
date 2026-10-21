// Mobile menu
(function () {
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });
})();

// Doctoral candidate filters (theme + university), also reads ?theme= / ?host= from the URL
(function () {
  var grid = document.getElementById('dc-grid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.dc-card'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  var count = document.querySelector('.filter-count');
  var state = { theme: 'all', host: 'all' };
  var params = new URLSearchParams(location.search);
  if (params.get('theme')) state.theme = params.get('theme');
  if (params.get('host')) state.host = params.get('host');

  function apply() {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (state.theme === 'all' || c.dataset.theme === state.theme) && (state.host === 'all' || c.dataset.host === state.host);
      c.hidden = !ok; if (ok) shown++;
    });
    chips.forEach(function (ch) {
      var on = state[ch.dataset.filter] === ch.dataset.value;
      ch.classList.toggle('is-on', on); ch.setAttribute('aria-pressed', String(on));
    });
    if (count) count.textContent = shown === cards.length ? 'Showing all ' + shown + ' projects' : 'Showing ' + shown + ' of ' + cards.length + ' projects';
    var q = new URLSearchParams();
    if (state.theme !== 'all') q.set('theme', state.theme);
    if (state.host !== 'all') q.set('host', state.host);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  }
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () { state[ch.dataset.filter] = ch.dataset.value; apply(); });
  });
  apply();
})();
