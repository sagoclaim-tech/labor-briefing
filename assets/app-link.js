/* 청아 노무수첩 계산기 바로가기
   기사 제목에 금전 계산과 직결되는 단어가 있으면 카드 아래에 해당 계산기 버튼을 붙인다.
   한 브리핑에 최대 4개, 같은 계산기는 한 번만. 규칙은 위에서부터 먼저 맞는 것을 쓴다. */
(function () {
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
  function run() {
    if (document.querySelector("a.app-chip")) return;
    var used = {}, n = 0;
    var cards = document.querySelectorAll("a.card");
    for (var i = 0; i < cards.length && n < MAX; i++) {
      var t = cards[i].querySelector(".card-title");
      if (!t) continue;
      var title = t.textContent;
      for (var r = 0; r < RULES.length; r++) {
        var rule = RULES[r];
        if (used[rule[1]] || !rule[0].test(title)) continue;
        var a = document.createElement("a");
        a.className = "app-chip";
        a.href = APP + "?c=" + rule[1] + "&utm_source=briefing&utm_medium=card";
        a.target = "_blank";
        a.rel = "noopener";
        var s = document.createElement("span");
        s.textContent = "🧮 " + rule[2] + " 계산기 열기";
        a.appendChild(s);
        cards[i].parentNode.insertBefore(a, cards[i].nextSibling);
        used[rule[1]] = 1; n++;
        break;
      }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
