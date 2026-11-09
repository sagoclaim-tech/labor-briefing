"""데일리 브리핑에 청아 노무수첩 연결 스크립트 한 줄을 넣는다.

사용: python tools/inject_app.py daily/2026-10-28.html [...]
     python tools/inject_app.py --canonical-only daily/*.html   (예전 브리핑에 대표 주소만 넣을 때)

- 파일에는 </body> 바로 앞에 주석과 스크립트 한 줄만 추가한다. 기사, 스타일, 푸터는 바꾸지 않는다.
- 배너와 계산기 버튼은 assets/app-link.js가 GitHub Pages 브리핑 화면에서만 그려 준다.
  그래서 같은 파일을 홈페이지 등 다른 곳에 옮겨 게시하면 기존과 같은 디자인으로 보인다.
- 이미 들어 있는 파일(APP-LINK 표시 존재)은 건드리지 않는다.
- head에는 대표 주소(canonical) 한 줄을 넣는다: https://app.청아노무법인.com/news/YYYY-MM-DD.html
  청아 노무수첩이 같은 브리핑을 news/ 주소로 게시하므로, 포털이 github.io 사본 대신 청아노무법인 도메인을 검색 결과로 쓰게 한다.
  화면에는 보이지 않고, 홈페이지 노동뉴스(본문·스타일만 가져감)와 카카오톡 미리보기(og 태그 사용)에도 영향이 없다.
"""
import re
import sys

LINE = '<!-- APP-LINK v2 --><script src="../assets/app-link.js?v=2" defer></script>\n'


CANON = '<link rel="canonical" href="https://app.xn--o80bq8pj4a8ztxwcn2k.com/news/{day}.html">\n'


def inject(path, canonical_only=False):
    s = open(path, encoding="utf-8").read()
    done = []
    if 'rel="canonical"' not in s:
        m = re.search(r"(\d{4}-\d{2}-\d{2})\.html$", path.replace("\\", "/"))
        j = s.find("</head>")
        if m and j >= 0:
            s = s[:j] + CANON.format(day=m.group(1)) + s[j:]
            done.append("canonical")
    if "APP-LINK" not in s and not canonical_only:
        i = s.rfind("</body>")
        if i >= 0:
            s = s[:i] + LINE + s[i:]
            done.append("app-link")
    if not done:
        return "skip (already)"
    open(path, "w", encoding="utf-8").write(s)
    return "injected " + ", ".join(done)


if __name__ == "__main__":
    args = sys.argv[1:]
    only = "--canonical-only" in args
    for p in [a for a in args if a != "--canonical-only"]:
        if re.search(r"daily/\d{4}-\d{2}-\d{2}\.html$", p.replace("\\", "/")):
            print(p, inject(p, only))
        else:
            print(p, "skip (not a daily file)")
