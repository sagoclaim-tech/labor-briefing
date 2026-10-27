/* 청아 노무수첩 연결 (노동뉴스 브리핑 전용)
   - GitHub Pages 브리핑 화면에서만 동작한다. 홈페이지 등 다른 곳에 옮겨 게시된 경우에는 아무것도 하지 않는다.
   - 하단 배너: 푸터 바로 위에 붙인다.
   - 계산기 바로가기: 기사 제목에 금전 계산과 직결되는 단어가 있으면 카드 아래에 버튼을 붙인다.
     한 브리핑에 최대 4개, 같은 계산기는 한 번만, 규칙은 위에서부터 먼저 맞는 것을 쓴다. */
(function () {
  var host = location.hostname;
  if (host !== "sagoclaim-tech.github.io" && host !== "localhost" && host !== "127.0.0.1") return;
  if (!/\/daily\/[^/]+\.html$/.test(location.pathname)) return;

  var APP = "https://app.xn--o80bq8pj4a8ztxwcn2k.com/";
  var MAX = 4;
  var RULES = [
    [/출국만기/, "sev", "퇴직금"],
    [/대지급금|체당금|임금\s*체불|체불\s*(임금|액|사업주)|원\s*체불/, "dg", "대지급금"],
    [/최저임금/, "mw", "최저임금"],
    [/실업급여|구직급여/, "ui", "실업급여"],
    [/배우자\s*출산/, "sp", "배우자 출산전후휴가 급여"],
    [/출산전후휴가|출산휴가/, "mat", "출산전후휴가 급여"],
    [/육아휴직/, "pl", "육아휴직 급여"],
    [/유족급여|휴업급여|장해급여|산재보험급여|산재\s*승인|업무상\s*재해/, "sj", "산재 보험급여"],
    [/퇴직금|퇴직급여|퇴직연금/, "sev", "퇴직금"],
    [/연차/, "al", "연차일수"],
    [/4대\s*보험|고용보험료|건강보험료|국민연금\s*보험료/, "ins", "4대보험료"],
    [/장애인\s*고용|고용부담금/, "dis", "장애인 고용"]
  ];
  var CSS =
    ".app-chip{display:flex;justify-content:flex-end;margin:-4px 2px 12px;text-decoration:none}" +
    ".app-chip span{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--firm-blue,#1A4FA0);background:#EAF1F9;border:1px solid #CFDDF0;border-radius:20px;padding:6px 12px;letter-spacing:-.2px}" +
    ".app-banner{display:block;margin-top:28px;padding:18px 18px 16px;background:linear-gradient(135deg,#1A4FA0,#123A78);border-radius:14px;color:#fff;text-decoration:none}" +
    ".app-banner-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;opacity:.75}" +
    ".app-banner-title{font-size:17px;font-weight:900;margin-top:4px;letter-spacing:-.4px}" +
    ".app-banner-desc{font-size:12.5px;line-height:1.6;margin-top:6px;opacity:.92;word-break:keep-all}" +
    ".app-banner-btn{display:inline-block;margin-top:12px;background:#fff;color:#1A4FA0;font-size:12.5px;font-weight:800;padding:8px 16px;border-radius:20px}";

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function run() {
    if (document.querySelector(".app-banner,.app-chip")) return;
    var st = el("style");
    st.textContent = CSS;
    document.head.appendChild(st);

    /* 계산기 바로가기 */
    var used = {}, n = 0;
    var cards = document.querySelectorAll("a.card");
    for (var i = 0; i < cards.length && n < MAX; i++) {
      var t = cards[i].querySelector(".card-title");
      if (!t) continue;
      for (var r = 0; r < RULES.length; r++) {
        var rule = RULES[r];
        if (used[rule[1]] || !rule[0].test(t.textContent)) continue;
        var a = el("a", "app-chip");
        a.href = APP + "?c=" + rule[1] + "&utm_source=briefing&utm_medium=card";
        a.target = "_blank";
        a.rel = "noopener";
        a.appendChild(el("span", "", "🧮 " + rule[2] + " 계산기 열기"));
        cards[i].parentNode.insertBefore(a, cards[i].nextSibling);
        used[rule[1]] = 1;
        n++;
        break;
      }
    }

    /* 하단 배너 */
    var footer = document.querySelector(".footer");
    if (footer) {
      var b = el("a", "app-banner");
      b.href = APP + "?utm_source=briefing&utm_medium=banner";
      b.target = "_blank";
      b.rel = "noopener";
      b.appendChild(el("div", "app-banner-label", "FREE LABOR APP"));
      b.appendChild(el("div", "app-banner-title", "청아 노무수첩"));
      var d = el("div", "app-banner-desc");
      d.textContent = "최저임금·실업급여·육아휴직 급여·퇴직금·대지급금 계산기와 개정 법령·시행 예정 제도, 고용지원금, 행정해석을 한곳에서 확인하세요.";
      b.appendChild(d);
      b.appendChild(el("span", "app-banner-btn", "무료로 열기"));
      footer.parentNode.insertBefore(b, footer);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
