(function () {
  // 如果已登录，直接跳转首页
  if (localStorage.getItem('hms_user')) {
    location.replace('index.html');
    return;
  }

  var msg = document.getElementById('msg');

  function doLogin() {
    var account = document.getElementById('account').value.trim();
    var password = document.getElementById('password').value;
    if (!account) {
      setMsg(msg, '请输入账号', true);
      return;
    }
    api('/login', {
      method: 'POST',
      body: JSON.stringify({ account: account, password: password }),
    })
      .then(function (data) {
        // 将用户信息存入 localStorage
        localStorage.setItem(
          'hms_user',
          JSON.stringify({ account: data.account, perm_type: data.perm_type })
        );
        localStorage.setItem('hms_token', data.account); // 简易token
        setMsg(msg, '登录成功，正在跳转…', false);
        setTimeout(function () {
          location.href = 'index.html';
        }, 600);
      })
      .catch(function (e) {
        setMsg(msg, e.message, true);
      });
  }

  document.getElementById('btn-login').onclick = doLogin;

  // 支持回车登录
  document.getElementById('login-form').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doLogin();
  });
})();
