/*
 * Embeddable chat widget.
 * Usage: <script src="https://YOUR-APP/widget.js" data-bot="BOT_PUBLIC_KEY" async></script>
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var key = script.getAttribute("data-bot");
  if (!key) return console.error("[chat-widget] missing data-bot attribute");
  window.__chatWidgetLoaded = window.__chatWidgetLoaded || {};
  if (window.__chatWidgetLoaded[key]) return; // already on this page: never show two bubbles
  window.__chatWidgetLoaded[key] = true;
  var api = new URL(script.src).origin + "/api/widget/chat";
  var color = script.getAttribute("data-color") || "#2b50ff";
  var title = script.getAttribute("data-title") || "Chat with us";
  var storeKey = "chatwidget:" + key;

  var conversationId = null;
  try {
    conversationId = localStorage.getItem(storeKey);
  } catch (e) {}

  var host = document.createElement("div");
  host.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483647;";
  var root = host.attachShadow({ mode: "open" });

  root.innerHTML =
    "<style>" +
    "*{box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
    ".btn{width:56px;height:56px;border-radius:50%;border:0;background:" + color + ";color:#fff;font-size:26px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    ".panel{display:none;position:absolute;right:0;bottom:70px;width:340px;max-width:calc(100vw - 40px);height:480px;max-height:calc(100vh - 110px);background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);flex-direction:column;overflow:hidden}" +
    ".panel.open{display:flex}" +
    ".head{background:" + color + ";color:#fff;padding:14px 16px;font-weight:600;font-size:15px}" +
    ".msgs{flex:1;overflow-y:auto;padding:12px;background:#f9fafb;display:flex;flex-direction:column;gap:8px}" +
    ".m{max-width:82%;padding:8px 12px;border-radius:12px;font-size:14px;line-height:1.4;white-space:pre-wrap;word-wrap:break-word}" +
    ".m.bot{background:#fff;color:#111;border:1px solid #e5e7eb;align-self:flex-start}" +
    ".m.me{background:" + color + ";color:#fff;align-self:flex-end}" +
    ".m.agent{background:#e2eee8;color:#111;border:1px solid #c9e0d5;align-self:flex-start}" +
    ".form{display:flex;gap:6px;padding:10px;border-top:1px solid #e5e7eb;background:#fff}" +
    "input{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:9px 10px;font-size:14px;outline:none;color:#111;background:#fff}" +
    ".send{border:0;background:" + color + ";color:#fff;border-radius:8px;padding:0 14px;font-size:14px;cursor:pointer}" +
    ".send:disabled{opacity:.5;cursor:default}" +
    ".foot{font-size:11px;color:#9ca3af;text-align:center;padding:0 0 6px;background:#fff}" +
    "</style>" +
    '<div class="panel" id="panel">' +
    '<div class="head"></div>' +
    '<div class="msgs" id="msgs"></div>' +
    '<form class="form" id="form"><input id="input" placeholder="Type a message..." maxlength="1000" autocomplete="off" />' +
    '<button class="send" id="send" type="submit">Send</button></form>' +
    '<div class="foot">AI assistant. Answers may be imperfect.</div>' +
    "</div>" +
    '<button class="btn" id="toggle" aria-label="Open chat">💬</button>';

  root.querySelector(".head").textContent = title;
  var panel = root.getElementById("panel");
  var msgs = root.getElementById("msgs");
  var form = root.getElementById("form");
  var input = root.getElementById("input");
  var send = root.getElementById("send");
  var toggle = root.getElementById("toggle");

  function add(text, who) {
    var d = document.createElement("div");
    d.className = "m " + who;
    d.textContent = text; // textContent: never render HTML from the bot or user
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  var greeting = "Hi! How can I help you today?";
  add(greeting, "bot");

  // --- sync with the server: restore history + show replies from a human agent ---
  var seen = {};
  var pollUrl = api.replace(/\/chat$/, "/poll");
  function sync(initial) {
    if (!conversationId) return;
    fetch(pollUrl + "?key=" + encodeURIComponent(key) + "&conversationId=" + encodeURIComponent(conversationId))
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (d) {
        if (!d || !d.messages) return;
        if (initial) {
          msgs.innerHTML = "";
          add(greeting, "bot");
          d.messages.forEach(function (m) {
            seen[m.id] = 1;
            add(m.content, m.role === "customer" ? "me" : m.role === "agent" ? "agent" : "bot");
          });
          return;
        }
        d.messages.forEach(function (m) {
          if (seen[m.id]) return;
          seen[m.id] = 1;
          if (m.role === "agent") add(m.content, "agent");
        });
      })
      .catch(function () {});
  }
  if (conversationId) sync(true);
  setInterval(function () {
    if (!document.hidden) sync(false);
  }, 5000);

  toggle.addEventListener("click", function () {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) input.focus();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || send.disabled) return;
    input.value = "";
    add(text, "me");
    var typing = add("...", "bot");
    send.disabled = true;

    fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: key, message: text, conversationId: conversationId }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || "Error");
        typing.textContent = res.data.reply;
        if (res.data.conversationId) {
          conversationId = res.data.conversationId;
          try {
            localStorage.setItem(storeKey, conversationId);
          } catch (e) {}
        }
      })
      .catch(function (err) {
        typing.textContent = err.message || "Something went wrong. Please try again.";
      })
      .finally(function () {
        send.disabled = false;
        msgs.scrollTop = msgs.scrollHeight;
      });
  });

  function mount() {
    document.body.appendChild(host);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
