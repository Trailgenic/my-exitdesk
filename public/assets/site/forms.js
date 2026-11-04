/* Native site forms (Acquisition Lens Request, Library Updates).
 * Replaces Webflow's form handling: submissions go to /api/site-form on this
 * site. Runs in the capture phase so Webflow's own handler never fires.
 * The score-page email forms are handled separately by exit-score-native-v2.js.
 */
(function () {
  var FORMS = ["Acquisition Lens Request", "Library Updates"];
  var HONEYPOT = "company_website";

  function addHoneypot(form) {
    if (form.querySelector('[name="' + HONEYPOT + '"]')) return;
    var input = document.createElement("input");
    input.type = "text";
    input.name = HONEYPOT;
    input.tabIndex = -1;
    input.autocomplete = "off";
    input.setAttribute("aria-hidden", "true");
    input.style.cssText = "position:absolute;left:-10000px;width:1px;height:1px;opacity:0";
    form.appendChild(input);
  }

  function prepare() {
    var forms = document.querySelectorAll("form[data-name]");
    for (var i = 0; i < forms.length; i++) {
      if (FORMS.indexOf(forms[i].getAttribute("data-name")) !== -1) addHoneypot(forms[i]);
    }
  }

  function show(el, visible) {
    if (el) el.style.display = visible ? "block" : "none";
  }

  window.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || form.tagName !== "FORM") return;
    var name = form.getAttribute("data-name");
    if (FORMS.indexOf(name) === -1) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    var wrapper = form.closest(".w-form") || form.parentNode;
    var done = wrapper.querySelector(".w-form-done");
    var fail = wrapper.querySelector(".w-form-fail");
    var button = form.querySelector('[type="submit"]');
    var label = button ? button.value : "";
    if (button) {
      button.disabled = true;
      if (button.getAttribute("data-wait")) button.value = button.getAttribute("data-wait");
    }
    show(fail, false);

    var fields = {};
    var data = new FormData(form);
    data.forEach(function (value, key) {
      if (typeof value === "string") fields[key] = value;
    });

    fetch("/api/site-form", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ form: name, page: window.location.pathname, fields: fields }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("status " + res.status);
        form.style.display = "none";
        show(done, true);
      })
      .catch(function () {
        show(fail, true);
        if (button) {
          button.disabled = false;
          button.value = label;
        }
      });
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepare, { once: true });
  } else {
    prepare();
  }
})();
