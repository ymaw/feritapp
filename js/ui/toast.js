export function showToast(msg, duration, {
  documentRef = document,
  setTimeoutRef = setTimeout
} = {}) {
  const toast = documentRef.getElementById('toast');
  toast.classList.remove('has-action');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeoutRef(function() {
    if (!toast.classList.contains('has-action')) {
      toast.classList.remove('show');
    }
  }, duration || 2200);
}
