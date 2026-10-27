"""데일리 브리핑에 청아 노무수첩 연결 스크립트 한 줄을 넣는다.

사용: python tools/inject_app.py daily/2026-10-28.html [...]

- 파일에는 </body> 바로 앞에 주석과 스크립트 한 줄만 추가한다. 기사, 스타일, 푸터는 바꾸지 않는다.
- 배너와 계산기 버튼은 assets/app-link.js가 GitHub Pages 브리핑 화면에서만 그려 준다.
  그래서 같은 파일을 홈페이지 등 다른 곳에 옮겨 게시하면 기존과 같은 디자인으로 보인다.
- 이미 들어 있는 파일(APP-LINK 표시 존재)은 건드리지 않는다.
"""
import re
import sys

LINE = '<!-- APP-LINK v2 --><script src="../assets/app-link.js?v=2" defer></script>\n'


def inject(path):
    s = open(path, encoding="utf-8").read()
    if "APP-LINK" in s:
        return "skip (already)"
    i = s.rfind("</body>")
    if i < 0:
        return "skip (no body)"
    s = s[:i] + LINE + s[i:]
    open(path, "w", encoding="utf-8").write(s)
    return "injected"


if __name__ == "__main__":
    for p in sys.argv[1:]:
        if re.search(r"daily/\d{4}-\d{2}-\d{2}\.html$", p.replace("\\", "/")):
            print(p, inject(p))
        else:
            print(p, "skip (not a daily file)")
