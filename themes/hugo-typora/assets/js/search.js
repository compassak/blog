document.addEventListener("DOMContentLoaded", function () {
    const searchInputs = document.querySelectorAll('.custom-search-input');
    const searchResultsContainers = document.querySelectorAll('.custom-search-results');
    
    if (searchInputs.length === 0) return;

    let miniSearch = null;
    let indexLoaded = false;

    // Load search index
    fetch('/minisearch.json')
        .then(response => response.json())
        .then(data => {
            miniSearch = new MiniSearch({
                fields: ['title', 'content', 'category'],
                storeFields: ['title', 'permalink', 'date', 'category'],
                searchOptions: {
                    boost: { title: 3, category: 2 },
                    prefix: true,
                    fuzzy: 0.2
                }
            });
            miniSearch.addAll(data);
            indexLoaded = true;
        })
        .catch(err => console.error("Could not load search index", err));

    searchInputs.forEach((input, index) => {
        const resultsContainer = searchResultsContainers[index];

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (!query || !indexLoaded) {
                resultsContainer.classList.add('hidden');
                resultsContainer.innerHTML = '';
                return;
            }

            const results = miniSearch.search(query);
            
            if (results.length > 0) {
                let html = '';
                results.slice(0, 8).forEach(result => {
                    html += `
                    <a href="${result.permalink}" class="block p-4 border-b border-gray-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors" style="text-decoration:none;">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-[10px] font-sans uppercase tracking-widest text-teal-700 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded">${result.category}</span>
                            <span class="text-[10px] text-stone-400">${result.date}</span>
                        </div>
                        <h4 class="text-sm font-bold text-stone-900 dark:text-stone-100 m-0 p-0">${result.title}</h4>
                    </a>`;
                });
                resultsContainer.innerHTML = html;
                resultsContainer.classList.remove('hidden');
                resultsContainer.classList.add('flex');
            } else {
                resultsContainer.innerHTML = `<div class="p-6 text-center text-sm text-stone-500 dark:text-stone-400">No results found for "${query}"</div>`;
                resultsContainer.classList.remove('hidden');
                resultsContainer.classList.add('flex');
            }
        });

        // Hide when losing focus (with a small timeout so clicks on results register)
        input.addEventListener('blur', () => {
            setTimeout(() => {
                resultsContainer.classList.add('hidden');
                resultsContainer.classList.remove('flex');
            }, 200);
        });

        // Show when focused if there's text
        input.addEventListener('focus', (e) => {
            if (e.target.value.trim() && indexLoaded) {
                input.dispatchEvent(new Event('input'));
            }
        });
    });
});
