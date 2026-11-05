/* Builds the "Contents" rail from the long-form page's section headings. */
(function(){
  var rail=document.querySelector("[data-lg-rail]"); if(!rail) return;
  var heads=document.querySelectorAll(".lg-prose h2, .lg-prose .lg-section-label, .lg-prose [class$=\"-section-label\"]");
  if(heads.length<2) return;
  heads.forEach(function(h,i){
    if(!h.id) h.id="s-"+(i+1)+"-"+h.textContent.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);
    var a=document.createElement("a"); a.href="#"+h.id; a.textContent=h.textContent.trim(); rail.appendChild(a);
  });
  rail.classList.add("lg-has-items");
})();
