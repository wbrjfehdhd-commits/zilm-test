function openWikiMenu(){
  document.getElementById('wiki-sidebar').classList.add('open');
  document.getElementById('wiki-backdrop').classList.add('open');
}
function closeWikiMenu(){
  document.getElementById('wiki-sidebar').classList.remove('open');
  document.getElementById('wiki-backdrop').classList.remove('open');
}
async function submitWikiTicket(formId, category){
  var form = document.getElementById(formId);
  var prefix = formId.replace('-form','');
  var s = document.getElementById(prefix + '-status');
  var btn = document.getElementById(prefix + '-submit');
  var payload = { type: 'wiki-ticket', category: category };
  Array.from(form.elements).forEach(function(el){
    if(el.name) payload[el.name] = el.value;
  });
  btn.disabled = true;
  s.classList.remove('show','ok');
  try {
    var res = await fetch('/api/reports/submit', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    var data = await res.json();
    if(!res.ok){
      s.textContent = data.error || 'Something went wrong submitting that.';
      s.classList.add('show');
      btn.disabled = false;
      return;
    }
    s.textContent = 'Sent — thanks for helping improve the wiki!';
    s.classList.add('show','ok');
    form.reset();
  } catch(err){
    s.textContent = 'Could not reach the server. Is this deployed on Vercel with the API routes live?';
    s.classList.add('show');
  }
  btn.disabled = false;
}

// Populates a "Community Pages" section in the sidebar from pages created in the
// Wiki Editor panel. Runs on every wiki page; does nothing if none exist yet.
async function loadCommunityPages(){
  try {
    var res = await fetch('/api/wiki/list');
    if(!res.ok) return;
    var data = await res.json();
    var pages = data.pages || [];
    if(pages.length === 0) return;

    var sidebar = document.getElementById('wiki-sidebar');
    if(!sidebar) return;

    var label = document.createElement('div');
    label.className = 'wiki-side-label';
    label.textContent = 'Community Pages';
    sidebar.appendChild(label);

    var params = new URLSearchParams(window.location.search);
    var currentSlug = params.get('slug');
    var onCustomPage = window.location.pathname.indexOf('wiki-page.html') !== -1;

    pages.forEach(function(p){
      var a = document.createElement('a');
      var isActive = onCustomPage && p.slug === currentSlug;
      a.className = 'wiki-side-link' + (isActive ? ' active' : '');
      a.href = 'wiki-page.html?slug=' + encodeURIComponent(p.slug);
      a.innerHTML = '<span class="ico">📄</span>' + escapeHtmlShared(p.title);
      sidebar.appendChild(a);
    });
  } catch(err){
    // API not reachable (e.g. static preview without a live deploy) — sidebar just stays as-is.
  }
}

function escapeHtmlShared(str){
  return String(str).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

loadCommunityPages();
