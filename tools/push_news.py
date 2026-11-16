#!/usr/bin/env python3
"""노동뉴스 브리핑 새 소식 알림(웹 푸시): 브리핑이 올라오면 청아 노무수첩 앱의 알림 구독 기기에 바로 알린다.

- .github/workflows/push-news.yml이 daily/*.html 변경 시 실행한다.
- 알림 대상: 이번 push로 "내용이 처음 채워진" 브리핑(이전에는 없거나 빈 파일, 지금은 본문 있음)만.
  이미 본문이 있던 파일을 고친 경우(오탈자 수정, 배너 자동 삽입)는 다시 알리지 않는다.
- 날짜가 오늘 기준 3일 이내인 파일만 알린다(지난 브리핑을 한꺼번에 올려도 알림이 쏟아지지 않게).
- 발송 전에 공개 주소에 브리핑이 실제로 올라올 때까지 기다린다(알림을 눌렀을 때 바로 보이도록).
- 설정: 환경변수 PUSH_CONFIG(JSON, GitHub Secret): {"key": 구독 저장소 관리 키, "vapid_private": VAPID 개인키}
  cheonga-labor 저장소의 Secret과 같은 값이다. 없으면 보내지 않고 끝낸다.
- 기준 수치·행정해석 알림은 cheonga-labor 저장소의 tools/push_notify.py가 맡는다.

사용
  python3 tools/push_news.py <이전 커밋> <현재 커밋>     변경분에서 새 브리핑을 찾아 발송
  python3 tools/push_news.py --date 2026-11-17 [--dry]   해당 날짜 브리핑을 바로 발송(시험·재발송용)
"""
import base64
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE = "https://script.google.com/macros/s/AKfycbzLIerNJg9LM08LLE70hg60wTEtk9XAlfPWBJwraqfMH4TDvf8SN-S97o1hhRK4Lowk/exec"
LIVE = "https://sagoclaim-tech.github.io/labor-briefing/daily/"
APP = "https://app.xn--o80bq8pj4a8ztxwcn2k.com/"
KST = timezone(timedelta(hours=9))
WD = "월화수목금토일"
MIN_BYTES = 2000  # 이보다 작으면 아직 본문이 없는 빈 파일로 본다


def git(*a):
    r = subprocess.run(["git", *a], cwd=ROOT, capture_output=True)
    return r.stdout if r.returncode == 0 else None


def cut(s, n):
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    return s if len(s) <= n else s[: n - 1] + "…"


def focus(t):
    m = re.search(r'class="summary-bar"[^>]*>([\s\S]*?)</div>', t or "")
    if not m:
        return []
    s = re.sub(r"<strong>[\s\S]*?</strong>", "", m.group(1), count=1)
    s = re.sub(r"<[^>]+>", "", s).replace("&amp;", "&").replace("&middot;", "·")
    return [x for x in re.sub(r"\s+", " ", s).strip().split(" · ") if x]


def new_days(before, after):
    """이번 변경으로 본문이 처음 채워진 날짜 목록."""
    zero = not before or set(before) == {"0"}
    if zero:
        names = git("diff-tree", "--no-commit-id", "--name-only", "-r", after, "--", "daily") or b""
    else:
        names = git("diff", "--name-only", before, after, "--", "daily") or b""
    out = []
    for path in names.decode().split():
        m = re.fullmatch(r"daily/(\d{4}-\d{2}-\d{2})\.html", path)
        if not m:
            continue
        now = git("show", f"{after}:{path}")
        old = None if zero else git("show", f"{before}:{path}")
        if now and len(now) >= MIN_BYTES and (old is None or len(old) < MIN_BYTES):
            out.append(m.group(1))
    return sorted(out)


def message(day, text):
    dt = datetime.strptime(day, "%Y-%m-%d")
    foc = focus(text)[:3]
    return {"title": f"노동뉴스 브리핑 {dt.month}.{dt.day}.({WD[dt.weekday()]})",
            "body": cut(" · ".join(foc), 140) if foc else "오늘의 데일리 브리핑이 올라왔습니다.",
            "url": "./#news", "tab": "news", "tag": "news-" + day}


def wait_live(day, limit=420):
    """공개 주소에 본문이 올라올 때까지 기다린다. 끝내 안 올라와도 발송은 한다."""
    import requests
    end = time.time() + limit
    while time.time() < end:
        try:
            r = requests.get(f"{LIVE}{day}.html?t={int(time.time())}", timeout=20)
            if r.status_code == 200 and len(r.content) >= MIN_BYTES:
                return True
        except Exception:
            pass
        time.sleep(15)
    return False


def vapid(cfg, endpoint):
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b"=").decode()
    raw = base64.urlsafe_b64decode(cfg["vapid_private"] + "=" * (-len(cfg["vapid_private"]) % 4))
    key = ec.derive_private_key(int.from_bytes(raw, "big"), ec.SECP256R1())
    u = urlsplit(endpoint)
    head = b64(json.dumps({"typ": "JWT", "alg": "ES256"}, separators=(",", ":")).encode())
    body = b64(json.dumps({"aud": f"{u.scheme}://{u.netloc}", "exp": int(time.time()) + 12 * 3600, "sub": APP},
                          separators=(",", ":")).encode())
    r, s = decode_dss_signature(key.sign(f"{head}.{body}".encode(), ec.ECDSA(hashes.SHA256())))
    pub = b64(key.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint))
    return {"Authorization": f"vapid t={head}.{body}.{b64(r.to_bytes(32, 'big') + s.to_bytes(32, 'big'))}, k={pub}"}


def api(cfg, body):
    import requests
    r = requests.post(cfg.get("url") or STORE, data=json.dumps(body).encode("utf-8"),
                      headers={"Content-Type": "text/plain;charset=utf-8"}, timeout=60)
    r.raise_for_status()
    return r.json()


def send(cfg, msgs):
    from pywebpush import webpush, WebPushException
    res = api(cfg, {"action": "list", "key": cfg["key"]})
    if not res.get("ok"):
        raise RuntimeError("구독 목록을 받지 못했습니다: " + str(res.get("error")))
    subs, ok, bad, gone = res.get("subs", []), 0, 0, []
    for s in subs:
        info = {"endpoint": s["endpoint"], "keys": {"p256dh": s["p256dh"], "auth": s["auth"]}}
        for m in msgs:
            try:
                webpush(info, data=json.dumps(m, ensure_ascii=False), headers=vapid(cfg, s["endpoint"]), ttl=86400, timeout=20)
                ok += 1
            except WebPushException as e:
                code = getattr(e.response, "status_code", None)
                if code in (404, 410):
                    gone.append(s["endpoint"])
                    break
                bad += 1
                print(f"발송 실패({code})")
            except Exception as e:
                bad += 1
                print(f"발송 오류: {type(e).__name__}")
    if gone:
        try:
            api(cfg, {"action": "remove", "key": cfg["key"], "endpoints": gone})
        except Exception as e:
            print(f"만료 구독 정리 실패: {type(e).__name__}")
    return len(subs), ok, bad, len(gone)


def main():
    a = sys.argv[1:]
    dry = "--dry" in a
    a = [x for x in a if x != "--dry"]
    today = datetime.now(KST).date()
    if a[:1] == ["--date"] and len(a) > 1 and re.fullmatch(r"\d{4}-\d{2}-\d{2}", a[1]):
        days = [a[1]]
    elif len(a) >= 2:
        lo, hi = (today - timedelta(days=3)).isoformat(), (today + timedelta(days=1)).isoformat()
        days = [d for d in new_days(a[0], a[1]) if lo <= d <= hi]
    else:
        print(__doc__)
        sys.exit(2)
    if not days:
        print("새로 채워진 브리핑이 없습니다.")
        return
    msgs = []
    for d in days:
        p = os.path.join(ROOT, "daily", d + ".html")
        if not os.path.exists(p):
            print(f"{d}: 파일이 없습니다.")
            continue
        msgs.append(message(d, open(p, encoding="utf-8").read()))
        print("알림:", msgs[-1]["title"], "|", msgs[-1]["body"])
    if dry or not msgs:
        return
    try:
        cfg = json.loads(os.environ.get("PUSH_CONFIG", "") or "{}")
    except ValueError:
        cfg = {}
    if not (cfg.get("key") and cfg.get("vapid_private")):
        print("PUSH_CONFIG가 없어 알림을 보내지 않습니다.")
        return
    for d in days:
        print(f"{d}: 공개 주소 반영 {'확인' if wait_live(d) else '미확인(그대로 발송)'}")
    n, ok, bad, gone = send(cfg, msgs)
    print(f"발송: 구독 {n}대, 성공 {ok}건, 실패 {bad}건, 만료 {gone}대")
    if bad and not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
