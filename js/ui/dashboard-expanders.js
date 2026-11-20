export function bindDashboardExpanders(root) {
  root.querySelectorAll('[data-dashboard-expand]').forEach(function(trigger) {
    trigger.addEventListener('click', function() {
      let type = trigger.getAttribute('data-dashboard-expand');
      let card = root.querySelector('[data-dashboard-expand-card="' + type + '"]');
      let details = root.querySelector('[data-dashboard-details="' + type + '"]');
      if (!card || !details) return;
      let expanded = card.getAttribute('aria-expanded') === 'true';
      card.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      details.hidden = expanded;
    });
  });
}
