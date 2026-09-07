/* Exit Desk v0 acquisition attribution. No email, answers, pixels, or open tracking. */
(function () {
  'use strict';
  if (window.ExitDeskCampaign) return;
  var key='exitdesk_acquisition_v1', ttl=30*86400000, now=Date.now();
  var p=new URLSearchParams(location.search), state={};
  try { var saved=JSON.parse(localStorage.getItem(key)||'{}'); if(saved.expires>now)state=saved; } catch (_) {}
  var ref=p.get('ref');
  if(ref && /^[a-zA-Z0-9_-]{1,64}$/.test(ref)) state.ref=ref;
  var token=p.get('se_token');
  if(token && /^[a-zA-Z0-9_.-]{20,500}$/.test(token))state.token=token;
  if (ref || token || !state.expires) state.expires=now+ttl;
  try { localStorage.setItem(key,JSON.stringify(state)); } catch (_) {}
  var visit;
  try {visit=sessionStorage.getItem('exitdesk_visit');} catch (_) {}
  if(!visit){visit='v_'+(window.crypto&&crypto.randomUUID?crypto.randomUUID().replace(/-/g,''):Math.random().toString(36).slice(2));try{sessionStorage.setItem('exitdesk_visit',visit);}catch(_){}}
  var emitted={};
  function decorate(url){
    try {
      var u=new URL(url,location.href);
      if(!['www.mikeye.com','mikeye.com',location.hostname].includes(u.hostname)||u.origin!==location.origin)return url;
      if(!/^\/exit(?:\/|$)/.test(u.pathname))return url;
      if(state.ref&&!u.searchParams.has('ref'))u.searchParams.set('ref',state.ref);
      if(state.token&&!u.searchParams.has('se_token'))u.searchParams.set('se_token',state.token);
      return u.href;
    }catch(_){return url;}
  }
  function track(kind){
    if(!state.token||emitted[kind])return;
    emitted[kind]=true;
    fetch('https://my-exitdesk.vercel.app/api/stalled/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:kind,token:state.token,visit:visit}),keepalive:true}).catch(function(){});
  }
  window.ExitDeskCampaign={decorate:decorate,track:track,ref:state.ref||'',token:state.token||''};
  function links(){document.querySelectorAll('a[href]').forEach(function(a){var old=a.getAttribute('href'),updated=decorate(old);if(updated!==old)a.setAttribute('href',updated);});}
  links();
  // Covers dynamically generated checkout URLs and preserves WebMCP's visible link contract.
  new MutationObserver(links).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a)a.href=decorate(a.href);},true);
  var path=location.pathname.replace(/\/$/,'');
  if(path==='/exit/score'||path==='/exit/stalled')track('landing_visit');
  if(path==='/exit/valuation')track('valuation_visit');
  if(path.indexOf('/exit/sample')===0)track('sample_visit');
  if(path==='/exit/partners')track('partner_visit');
})();
