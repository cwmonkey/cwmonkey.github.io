{% unless included_showToast %}{% assign included_showToast = true %}

{% include greasemonkey/_shared/addStyle.js %}

function showToast(message, event, type) {
  type = type || 'success';
  let isShadow = false;
  let root;
  let undefined;

  if (event.target) {
    root = event.target.getRootNode();
    isShadow = root instanceof ShadowRoot;
  }

  if (!(isShadow ? root : document).querySelector('#__toast_notification')) {
    addStyle(/* css */`
      .__toast_notification {
        position: fixed;
        top: 50%;
        left: 50%;
        display: block;
        z-index: 100001;
        pointer-events: none;

        color: white;
        font-size: 14px;
        font-family: sans-serif;

        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

        max-width: 200px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;

        animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;

        &:not(.__toast_positioned) {
          transform: translate(-50%, -50%);
        }

        &.__toast-fade-out {
          animation: slideOut 0.3s ease forwards;
        }

        &.__success {
          background-color: #00a971;
        }

        &.__fail {
          background-color: #a90071;
        }
      }

      /* Slide In & Fade In Animation */
      @keyframes slideIn {
        from {
          transform: translateY(100px) scale(0.9);
          opacity: 0;
        }
        to {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        to {
          transform: translateY(-20px) scale(0.95);
          opacity: 0;
        }
      }
    `, (isShadow ? root : undefined), '__toast_notification');
  }

  const toast = document.createElement('div');
  toast.className = `__toast_notification __${type}`;
  toast.textContent = message;

  if (event) {
    toast.classList.add('__toast_positioned');
    toast.style.left = event.clientX + "px";
    toast.style.top = event.clientY + "px";
  }

  (isShadow ? root : document.body).appendChild(toast);

  setTimeout(() => {
    toast.classList.add('__toast-fade-out');
    
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 1000);
}

{% endunless %}
