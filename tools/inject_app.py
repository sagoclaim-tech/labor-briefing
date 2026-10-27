"""데일리 브리핑에 청아 노무수첩 배너와 계산기 바로가기 스크립트를 넣는다.

사용: python tools/inject_app.py daily/2026-10-28.html [...]
이미 들어 있는 파일(표시 주석 APP-LINK 존재)은 건드리지 않는다.
기사 본문, 기존 스타일, 푸터 내용은 바꾸지 않고 아래 세 곳에 덧붙이기만 한다.
  1) </style> 바로 앞: 배너·버튼 스타일
  2) 푸터 주석(또는 <div class="footer">) 바로 앞: 배너
  3) </body> 바로 앞: 계산기 바로가기 스크립트
"""
import re
import sys

MARK = "<!-- APP-LINK v1 -->"
APP = "https://app.xn--o80bq8pj4a8ztxwcn2k.com/"

CSS = """  /* 청아 노무수첩 연결 (APP-LINK) */
  .app-chip{display:flex;justify-content:flex-end;margin:-4px 2px 12px;text-decoration:none}
  .app-chip span{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--firm-blue);background:#EAF1F9;border:1px solid #CFDDF0;border-radius:20px;padding:6px 12px;letter-spacing:-.2px}
  .app-banner{display:block;margin-top:28px;padding:18px 18px 16px;background:linear-gradient(135deg,#1A4FA0,#123A78);border-radius:14px;color:#fff;text-decoration:none}
  .app-banner-label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.14em;opacity:.75}
  .app-banner-title{font-size:17px;font-weight:900;margin-top:4px;letter-spacing:-.4px}
  .app-banner-desc{font-size:12.5px;line-height:1.6;margin-top:6px;opacity:.92}
  .app-banner-btn{display:inline-block;margin-top:12px;background:#fff;color:#1A4FA0;font-size:12.5px;font-weight:800;padding:8px 16px;border-radius:20px}
"""

BANNER = f"""  {MARK}
  <a class="app-banner" href="{APP}?utm_source=briefing&amp;utm_medium=banner" target="_blank" rel="noopener">
    <div class="app-banner-label">FREE LABOR APP</div>
    <div class="app-banner-title">청아 노무수첩</div>
    <div class="app-banner-desc">최저임금·실업급여·육아휴직 급여·퇴직금·대지급금 계산기와<br>개정 법령·시행 예정 제도, 고용지원금, 행정해석을 한곳에서 확인하세요.</div>
    <span class="app-banner-btn">무료로 열기</span>
  </a>

"""

SCRIPT = '<script src="../assets/app-link.js?v=1" defer></script>\n'


def inject(path):
    s = open(path, encoding="utf-8").read()
    if "APP-LINK" in s:
        return "skip (already)"
    if "</style>" not in s or "</body>" not in s:
        return "skip (no style/body)"
    m = re.search(r"[ \t]*<!-- =+ -->\s*\n[ \t]*<!-- 푸터", s)
    if m:
        pos = m.start()
    else:
        pos = s.find('<div class="footer"')
        if pos < 0:
            return "skip (no footer)"
        pos = s.rfind("\n", 0, pos) + 1
    s = s[:pos] + BANNER + s[pos:]
    s = s.replace("</style>", CSS + "</style>", 1)
    i = s.rfind("</body>")
    s = s[:i] + SCRIPT + s[i:]
    open(path, "w", encoding="utf-8").write(s)
    return "injected"


if __name__ == "__main__":
    for p in sys.argv[1:]:
        if re.search(r"daily/\d{4}-\d{2}-\d{2}\.html$", p.replace("\\", "/")):
            print(p, inject(p))
        else:
            print(p, "skip (not a daily file)")
