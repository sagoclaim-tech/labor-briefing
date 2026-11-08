/* 청아노무법인 홈페이지 관리자 로그인 유지
   - 홈페이지 환경설정(cf_add_script)에서 이 파일을 불러온다.
   - 최고관리자로 로그인한 상태(g5_is_admin === 'super')에서만 동작한다. 일반 방문자에게는 아무 동작도 하지 않는다.
   - 홈페이지 탭이 하나라도 열려 있으면 10분마다 가벼운 요청(/bbs/ajax.filter.php)을 보내 서버 세션(기본 3시간)이 만료되지 않게 한다.
   - 관리자 화면(/adm)에는 환경설정 추가 코드가 붙지 않으므로, 사무실 PC 크롬에 홈페이지 탭(예: 청아소식 목록)을 고정 탭으로 열어 둔다.
   - 같은 브라우저의 여러 탭이 동시에 보내지 않도록 localStorage에 마지막 전송 시각을 기록한다.
*/
(function () {
  if (typeof g5_is_admin === 'undefined' || g5_is_admin !== 'super') return;
  if (window.__caKeepAlive) return;
  window.__caKeepAlive = true;

  var INTERVAL = 10 * 60 * 1000; // 10분
  var KEY = 'caKeepAliveAt';
  var url = (typeof g5_bbs_url !== 'undefined' ? g5_bbs_url : location.origin + '/bbs') + '/ajax.filter.php';

  function lastAt() {
    try { return parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch (e) { return 0; }
  }
  function mark() {
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
  }

  function ping() {
    if (Date.now() - lastAt() < INTERVAL - 30000) return;
    mark();
    var fd = new FormData();
    fd.append('subject', '');
    fd.append('content', '');
    fetch(url, { method: 'POST', body: fd, credentials: 'same-origin', cache: 'no-store' })
      .catch(function () {});
  }

  mark(); // 페이지를 연 것 자체가 세션을 갱신하므로 지금 시각을 기록
  setInterval(ping, 60 * 1000); // 1분마다 확인하고 10분이 지났을 때만 전송
})();
