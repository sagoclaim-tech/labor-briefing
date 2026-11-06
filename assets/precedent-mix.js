/* 청아노무법인 홈페이지 판례·해석 게시판 '전체' 탭 섞어 보기
   - 홈페이지 환경설정(cf_add_script)에서 이 파일을 불러온다.
   - bo_table=precedent 이고 분류·검색·정렬 조건이 없을 때만 동작한다.
   - 분류별 최신순 목록을 번갈아(노동판례, 중노위 판정례, 법제처 해석, 행정해석, 민원답변) 배치한다.
     분류가 다 소진되면 남은 분류끼리 번갈아 배치한다. 총 건수는 원래와 같아 페이지 번호도 그대로 맞는다.
   - 분류별 건수는 10분간 sessionStorage에 보관한다. 실패하면 원래 목록을 그대로 둔다. */
(function () {
  var q = new URLSearchParams(location.search);
  if (location.pathname.indexOf("/bbs/board.php") < 0) return;
  if (q.get("bo_table") !== "precedent") return;
  if (q.get("sca") || q.get("stx") || q.get("sst") || q.get("wr_id")) return;
  var body = document.querySelector("#fboardlist tbody");
  if (!body) return;

  var CATS = ["노동판례", "중노위 판정례", "법제처 해석", "행정해석", "민원답변"];
  var PER = 15;
  var page = parseInt(q.get("page") || "1", 10) || 1;
  var AMP = String.fromCharCode(38);

  body.style.opacity = "0";
  var shown = false;
  function show() { if (!shown) { shown = true; body.style.opacity = "1"; } }
  setTimeout(show, 5000);

  function load(cat, p) {
    var url = "/bbs/board.php?bo_table=precedent" + AMP + "sca=" + encodeURIComponent(cat) + AMP + "page=" + p;
    return fetch(url, { credentials: "same-origin" })
      .then(function (r) { return r.text(); })
      .then(function (t) { return new DOMParser().parseFromString(t, "text/html"); });
  }
  function rowsOf(doc) {
    return Array.prototype.slice.call(doc.querySelectorAll("#fboardlist tbody tr"))
      .filter(function (tr) { return tr.querySelector(".td_subject"); });
  }
  function count(cat) {
    return load(cat, 1).then(function (d) {
      var last = 1;
      d.querySelectorAll(".pg_wrap a").forEach(function (a) {
        var m = a.href.match(/page=(\d+)/);
        if (m) last = Math.max(last, +m[1]);
      });
      if (last < 2) return rowsOf(d).length;
      return load(cat, last).then(function (d2) { return (last - 1) * PER + rowsOf(d2).length; });
    });
  }
  function counts() {
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem("caPrecMix") || "null"); } catch (e) {}
    if (cached && Date.now() - cached.t < 600000) return Promise.resolve(cached.c);
    return Promise.all(CATS.map(count)).then(function (c) {
      try { sessionStorage.setItem("caPrecMix", JSON.stringify({ t: Date.now(), c: c })); } catch (e) {}
      return c;
    });
  }

  counts().then(function (c) {
    var total = c.reduce(function (a, b) { return a + b; }, 0);
    var taken = c.map(function () { return 0; });
    var seq = [], i = 0, limit = Math.min(page * PER, total);
    while (seq.length < limit) {
      var j = i % CATS.length; i++;
      if (taken[j] < c[j]) { seq.push([j, taken[j]]); taken[j]++; }
    }
    var need = seq.slice((page - 1) * PER);
    if (!need.length) return show();
    function key(x) { return x[0] + "_" + Math.floor(x[1] / PER); }
    var keys = need.map(key).filter(function (k, n, arr) { return arr.indexOf(k) === n; });
    var got = {};
    return Promise.all(keys.map(function (k) {
      var p = k.split("_");
      return load(CATS[+p[0]], +p[1] + 1).then(function (d) { got[k] = rowsOf(d); });
    })).then(function () {
      var out = need.map(function (x) { return (got[key(x)] || [])[x[1] % PER]; }).filter(Boolean);
      if (out.length === need.length) {
        var keep = Array.prototype.slice.call(body.querySelectorAll("tr")).filter(function (tr) {
          return !tr.querySelector(".td_subject");
        });
        body.innerHTML = "";
        keep.forEach(function (tr) { body.appendChild(tr); });
        out.forEach(function (tr) { body.appendChild(document.importNode(tr, true)); });
      }
      show();
    });
  }).catch(show);
})();
