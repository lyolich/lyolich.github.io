(function () {
    'use strict';

    const ActorsUA = {
        api: 'https://api.themoviedb.org/3/',
        langPriority: ['uk-UA', 'ru-RU', 'en-US'],

        init() {
            this.addMenu();
        },

        /* ================= MENU ================= */

        addMenu() {
            const icon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="2.2em" height="2.2em" viewBox="0 0 48 48">
                <circle cx="24" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="4"/>
                <path d="M8 40c0-8 32-8 32 0" fill="none" stroke="currentColor" stroke-width="4"/>
            </svg>`;

            const menu = $(`
                <li class="menu__item selector actors-ua">
                    <div class="menu__ico">${icon}</div>
                    <div class="menu__text">Актори</div>
                </li>
            `);

            menu.on('hover:enter', () => this.openActors());
            $('.menu .menu__list').eq(0).append(menu);
        },

        /* ================= ACTORS LIST ================= */

        openActors(sort = 'popularity.desc') {
            Lampa.Activity.push({
                component: 'list',
                title: 'Актори',
                source: 'tmdb',
                url: 'discover/person',
                params: {
                    sort_by: sort
                },
                card: 'person',
                onCardClick: (card) => this.openPerson(card.id)
            });
        },

        /* ================= SEARCH ================= */

        searchActors(query) {
            Lampa.Activity.push({
                component: 'list',
                title: 'Пошук акторів',
                source: 'tmdb',
                url: 'search/person',
                params: { query },
                card: 'person',
                onCardClick: (card) => this.openPerson(card.id)
            });
        },

        /* ================= PERSON PAGE ================= */

        openPerson(id) {
            this.loadBiography(id, (bio) => {
                Lampa.Activity.push({
                    component: 'person',
                    source: 'tmdb',
                    id: id,
                    biography: bio,
                    onLoad: (person) => {
                        this.addTabs(person);
                        this.addFavorite(person);
                    }
                });
            });
        },

        /* ================= BIOGRAPHY ================= */

        loadBiography(id, callback) {
            let index = 0;
            const tryLoad = () => {
                if (index >= this.langPriority.length) {
                    callback('');
                    return;
                }

                const lang = this.langPriority[index++];
                Lampa.Api.tmdb(
                    `person/${id}`,
                    { language: lang },
                    (data) => {
                        if (data.biography) callback(data.biography);
                        else tryLoad();
                    },
                    tryLoad
                );
            };
            tryLoad();
        },

        /* ================= TABS ================= */

        addTabs(person) {
            person.tabs = [
                {
                    title: 'Фільми',
                    onSelect: () => this.openCredits(person.id, 'movie')
                },
                {
                    title: 'Серіали',
                    onSelect: () => this.openCredits(person.id, 'tv')
                }
            ];
        },

        openCredits(id, type) {
            Lampa.Activity.push({
                component: 'list',
                source: 'tmdb',
                url: `person/${id}/${type}_credits`,
                card: type,
                filter: (item) => item.release_date || item.first_air_date
            });
        },

        /* ================= FAVORITES ================= */

        addFavorite(person) {
            const favKey = 'actors_favorites';
            let favs = Lampa.Storage.get(favKey, []);

            person.favorite = favs.some(a => a.id === person.id);

            person.onFavorite = () => {
                favs = favs.filter(a => a.id !== person.id);
                favs.push(person);
                Lampa.Storage.set(favKey, favs);
            };
        }
    };

    function start() {
        if (window.ActorsUA) return;
        window.ActorsUA = ActorsUA;

        if (window.appready) ActorsUA.init();
        else {
            Lampa.Listener.follow('app', e => {
                if (e.type === 'ready') ActorsUA.init();
            });
        }
    }

    start();
})();
 
