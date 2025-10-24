(function () {
  function setUserName(name) {
    try {
      var elements = document.querySelectorAll('[data-user-fullname]');
      elements.forEach(function (el) {
        el.textContent = name || 'Usuario';
      });
    } catch (_) {}
  }

  function redirectToLogin() {
    var current = window.location.pathname + (window.location.search || '');
    var target = '/login?redirect=' + encodeURIComponent(current);
    window.location.href = target;
  }

  async function loadProfile() {
    try {
      var res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) {
        return;
      }
      var data = await res.json().catch(function () { return {}; });
      var fullName = (data && data.profile && data.profile.fullName) || '';
      if (fullName) {
        setUserName(fullName);
      }
    } catch (err) {
      // Fail silent; header stays with placeholder
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProfile);
  } else {
    loadProfile();
  }
})();