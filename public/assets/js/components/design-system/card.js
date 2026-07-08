// components/design-system/card.js
// Stat card factory untuk dashboard

export function createStatCard(title, value, icon, variant = 'primary') {
  const card = document.createElement('div');
  card.className = `stat-card stat-card-${variant}`;
  card.innerHTML = `
    <div class="stat-card-icon"><i class="${icon}"></i></div>
    <div class="stat-card-body">
      <p class="stat-card-title">${title}</p>
      <p class="stat-card-value">${value}</p>
    </div>
  `;
  return card;
}
