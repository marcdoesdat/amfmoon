import { loginWithGoogle, logout, onAuth } from './firebase.js';
import { getPaymentUrl, hasPurchased } from './stripe.js';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

function initAuth() {
  const loginBtn = document.getElementById('authLoginBtn');
  const userMenu = document.getElementById('authUserMenu');
  const userName = document.getElementById('authUserName');
  const userAvatar = document.getElementById('authUserAvatar');
  const logoutBtn = document.getElementById('authLogoutBtn');

  if (!loginBtn || !userMenu) return;

  loginBtn.addEventListener('click', async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        console.error('Login error:', err);
      }
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    await logout();
  });

  onAuth((user) => {
    if (user) {
      loginBtn.style.display = 'none';
      userMenu.style.display = 'flex';
      userName.textContent = user.displayName || user.email;
      if (user.photoURL) {
        userAvatar.src = user.photoURL;
        userAvatar.style.display = 'block';
      }
      updateModuleButtons(user);
    } else {
      loginBtn.style.display = 'flex';
      userMenu.style.display = 'none';
      updateModuleButtons(null);
    }
  });
}

function updateModuleButtons(user) {
  document.querySelectorAll('[data-module-code]').forEach((card) => {
    const code = card.dataset.moduleCode;
    const actionsEl = card.querySelector('.module-actions');
    const lockedEl = card.querySelector('.module-locked-actions');
    const presaleEl = card.querySelector('.module-btn-presale');

    if (!actionsEl && !lockedEl) return;

    // For available modules (like F-135)
    if (actionsEl) {
      const purchased = hasPurchased(code);
      const trialBtn = actionsEl.querySelector('.module-btn-trial');
      const mainBtns = actionsEl.querySelectorAll('.module-btn-secondary, .module-btn:not(.module-btn-trial):not(.module-btn-secondary)');

      if (!user) {
        // Not logged in: only show trial
        if (trialBtn) trialBtn.style.display = '';
        mainBtns.forEach(b => b.style.display = 'none');
        // Show a "buy" button
        let buyBtn = actionsEl.querySelector('.module-btn-buy');
        if (!buyBtn) {
          buyBtn = document.createElement('a');
          buyBtn.className = 'module-btn module-btn-buy';
          buyBtn.textContent = 'Acheter';
          buyBtn.href = '#';
          buyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginWithGoogle();
          });
          actionsEl.appendChild(buyBtn);
        }
        buyBtn.style.display = '';
      } else if (!purchased) {
        // Logged in but not purchased: trial + buy with Stripe link
        if (trialBtn) trialBtn.style.display = '';
        mainBtns.forEach(b => b.style.display = 'none');
        let buyBtn = actionsEl.querySelector('.module-btn-buy');
        if (!buyBtn) {
          buyBtn = document.createElement('a');
          buyBtn.className = 'module-btn module-btn-buy';
          buyBtn.textContent = 'Acheter';
          actionsEl.appendChild(buyBtn);
        }
        const payUrl = getPaymentUrl(code, user.uid);
        buyBtn.href = payUrl || '#';
        buyBtn.style.display = '';
      } else {
        // Purchased: show full access, hide trial and buy
        if (trialBtn) trialBtn.style.display = 'none';
        mainBtns.forEach(b => b.style.display = '');
        const buyBtn = actionsEl.querySelector('.module-btn-buy');
        if (buyBtn) buyBtn.style.display = 'none';
      }
    }
  });
}

initAuth();
