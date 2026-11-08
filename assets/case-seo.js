/* 청아노무법인 홈페이지 사례 글(수행사례 case, HR컨설팅 hrcase) 검색 노출 보강
   - 홈페이지 환경설정(cf_add_script)에서 불러온다. 글 보기 화면에서만 동작한다.
   1) 글마다 고유한 설명문(meta description, og:description)과 og:title, og:url을 넣는다.
   2) 대표 주소(canonical)를 bo_table과 wr_id만 남긴 주소로 지정해 같은 글의 여러 주소가 하나로 묶이게 한다.
   3) 사례 분야에 맞는 업무 안내 페이지로 가는 '관련 업무 안내' 링크를 글 끝에 붙인다(내부 링크). */
(function () {
  var q = new URLSearchParams(location.search);
  var bo = q.get("bo_table"), id = q.get("wr_id");
  if (location.pathname.indexOf("/bbs/board.php") < 0) return;
  if (!id || (bo !== "case" && bo !== "hrcase")) return;
  var con = document.querySelector("#bo_v_con");
  if (!con) return;

  var AMP = String.fromCharCode(38);
  var ORIGIN = "https://xn--o80bq8pj4a8ztxwcn2k.com";
  var url = ORIGIN + "/bbs/board.php?bo_table=" + bo + AMP + "wr_id=" + id;
  var titleEl = document.querySelector("#bo_v_title .bo_v_tit");
  var title = (titleEl ? titleEl.textContent : document.title.split(" > ")[0]).replace(/\s+/g, " ").trim();

  function clean(t) { return (t || "").replace(/\s+/g, " ").trim(); }
  function cut(t, n) { t = clean(t); return t.length > n ? t.slice(0, n - 1).replace(/[\s,·.]+\S*$/, "") + "…" : t; }

  // 설명문: 표·태그·안내문을 뺀 본문 첫 서술 문단에서 뽑는다.
  var paras = Array.prototype.slice.call(con.querySelectorAll("p, div"))
    .filter(function (el) {
      if (el.closest("table")) return false;
      if (el.querySelector("p, div, table")) return false;
      var t = clean(el.textContent);
      if (t.length < 40) return false;
      if (/^※|010-|바로가기|^#/.test(t)) return false;
      return true;
    })
    .map(function (el) { return clean(el.textContent); });
  var body = paras.slice(0, 2).join(" ");
  var label = bo === "hrcase" ? "HR컨설팅 사례" : "노무사 수행사례";
  var desc = cut(title + ". " + body, 150) + " 청아노무법인 " + label + ".";

  function meta(attr, key, val) {
    var m = document.head.querySelector("meta[" + attr + '="' + key + '"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute(attr, key); document.head.appendChild(m); }
    m.setAttribute("content", val);
  }
  meta("name", "description", desc);
  meta("property", "og:title", title + " | 청아노무법인");
  meta("property", "og:description", desc);
  meta("property", "og:url", url);
  meta("property", "og:type", "article");
  var can = document.head.querySelector('link[rel="canonical"]');
  if (!can) { can = document.createElement("link"); can.rel = "canonical"; document.head.appendChild(can); }
  can.href = url;

  // 관련 업무 안내 (내부 링크)
  var text = title + " " + clean(con.textContent).slice(0, 600);
  var P = function (co, name) { return { href: "/bbs/content.php?co_id=" + co, name: name }; };
  var links = [];
  if (bo === "hrcase") {
    links = [{ href: "/bbs/board.php?bo_table=hrcase", name: "HR컨설팅 사례 전체 보기" }, P("work_innovation", "일터혁신 컨설팅 안내"), P("advisory", "인사노무 자문 안내")];
  } else if (/대지급금|체당금/.test(text)) {
    links = [P("wage_arrears", "임금체불·대지급금 상담 안내")];
  } else if (/손해사정|근재보험|초과손해/.test(text)) {
    links = [P("sanjae_info", "산재·손해사정 안내")];
  } else if (/산재|업무상 재해|업무상 질병|요양급여|유족급여/.test(text)) {
    links = [P("sanjae_info", "산재보험 노무사 상담 안내")];
  } else if (/괴롭힘|성희롱/.test(text)) {
    links = [P("harassment", "직장 내 괴롭힘 대응 안내"), P("sexual_harassment", "직장 내 성희롱 대응 안내")];
  } else if (/임금체불|체불|연장수당|퇴직금/.test(text)) {
    links = [P("wage_arrears", "임금체불·대지급금 상담 안내")];
  } else if (/해고|징계|계약 만료|본채용/.test(text)) {
    links = [P("dismissal", "부당해고 구제신청 안내"), P("discipline", "징계 절차·징계위원회 안내")];
  } else {
    links = [P("advisory", "인사노무 자문 안내")];
  }
  links.push({ href: "/bbs/content.php?co_id=consult", name: "상담신청" });
  // 본문(연락처 박스 포함)에 이미 같은 페이지로 가는 링크가 있으면 빼고, 남는 것이 없으면 박스를 만들지 않는다.
  var have = Array.prototype.slice.call(con.querySelectorAll("a[href]")).map(function (a) {
    var m = a.getAttribute("href").match(/co_id=([\w-]+)|bo_table=(\w+)(?!.*wr_id)/);
    return m ? (m[1] || m[2]) : "";
  });
  links = links.filter(function (l) {
    var m = l.href.match(/co_id=([\w-]+)|bo_table=(\w+)/);
    return !(m && have.indexOf(m[1] || m[2]) >= 0);
  });
  if (links.length === 1 && /co_id=consult/.test(links[0].href)) links = [];
  // 본문 끝에 연락처 박스(전화 링크)가 있는 글은 안내가 겹치므로 관련 업무 안내를 붙이지 않는다.
  if (con.querySelector('a[href^="tel:"]')) links = [];
  if (links.length && !con.querySelector(".ca-related")) {
    var box = document.createElement("div");
    box.className = "ca-related";
    box.setAttribute("style", "margin-top:24px;padding:14px 16px;border-top:1px solid #d9e0e8;font-size:15px;line-height:1.9;");
    box.innerHTML = '<p style="margin:0 0 6px;font-weight:bold;color:#1f5fa6;">관련 업무 안내</p>' +
      links.map(function (l) {
        return '<a href="' + l.href + '"' + (l.ext ? ' target="_blank" rel="noopener"' : "") +
          ' style="display:inline-block;margin:0 14px 4px 0;color:#1f5fa6;text-decoration:underline;">' + l.name + "</a>";
      }).join("");
    con.appendChild(box);
  }

})();
