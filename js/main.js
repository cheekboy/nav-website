document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');

    function renderWebsites() {
        websiteData.categories.forEach(category => {
            const categorySection = document.createElement('section');
            categorySection.className = 'category';
            
            categorySection.innerHTML = `
                <h2 class="category-title">${category.name}</h2>
                <div class="sites-grid">
                    ${category.sites.map(site => `
                        <a href="${site.url}" target="_blank" class="site-card">
                            <i class="${site.icon} site-icon"></i>
                            <div class="site-info">
                                <h3>${site.title}</h3>
                                <p>${site.description}</p>
                            </div>
                        </a>
                    `).join('')}
                </div>
            `;
            
            mainContent.appendChild(categorySection);
        });
    }

    renderWebsites();
}); 