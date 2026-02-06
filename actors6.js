(function () {
    'use strict';

    const ActorsCustom = {

        api: 'https://api.themoviedb.org/3/',
        langs: ['uk-UA', 'ru-RU', 'en-US'],

        init() {
            this.addButton();
        },

        /* ================= BUTTON ================= */

        addButton() {
            const btn = $(`
                <li class="menu__item selector actors-custom-btn">
                    <div class="menu__ico">🎭</div>
                    <div class="menu__text">Актори</div>
                </li>
            `);

            btn.on('hover:enter', () => this.openActors());
            $('.menu .menu__list').eq(0).append(btn);
        },

        /* ================= ACTORS LIST ================= */

        openActors() {
            Lampa.Api.tmdb('person/popular', { language: 'uk-UA', page: 1 }, (json) => {
                const wrap = $('<div class="actors-custom-list"></div>');

                json.results.forEach(actor => {
                    const item = $(`
                        <div class="actor-item selector">
                            <img src="https://image.tmdb.org/t/p/w185${actor.profile_path}">
                            <div class="actor-name">${actor.name}</div>
                        </div>
                    `);

                    item.on('hover:enter', () => this.openActor(actor.id, actor.name));
                    wrap.append(item);
                });

                Lampa.Activity.push({
                    component: 'content',
                    title: 'Актори',
                    html: wrap
                });
            });
        },

        /* ================= ACTOR PAGE ================= */

        openActor(id, name) {
            this.loadBiography(id, (bio) => {

                const page = $(`
                    <div class="actor-page">
                        <h1>${name}</h1>
                        <div class="actor-bio">${bio || 'Біографія відсутня'}</div>

                        <div class="actor-actions">
                            <button class="actor-movies">Фільми</button>
                            <button class="actor-tv">Серіали</button>
                        </div>
                    </div>
                `);

                page.find('.actor-movies').on('click', () => {
                    this.openCredits(id, name, 'movie');
                });

                page.find('.actor-tv').on('click', () => {
                    this.openCredits(id, name, 'tv');
                });

                Lampa.Activity.push({
                    component: 'content',
                    title: name,
                    html: page
                });
            });
        },

        /* ================= BIOGRAPHY ================= */

        loadBiography(id, callback) {
            let i = 0;

            const tryLoad = () => {
                if (i >= this.langs.length) {
                    callback('');
                    return;
                }

                const lang = this.langs[i++];
                Lampa.Api.tmdb(`person/${id}`, { language: lang }, (data) => {
                    if (data.biography) callback(data.biography);
                    else tryLoad();
                }, tryLoad);
            };

            tryLoad();
        },

        /* ================= CREDITS ================= */

        openCredits(id, name, type) {
            Lampa.Activity.push({
                component: 'category_full',
                source: 'tmdb',
                url: `person/${id}/${type}_credits`,
                title: (type === 'movie' ? 'Фільми: ' : 'Серіали: ') + name,
                card_type: type,
                page: 1
            });
        }
    };

    function start() {
        if (window.ActorsCustom) return;
        window.ActorsCustom = ActorsCustom;

        if (window.appready) ActorsCustom.init();
        else {
            Lampa.Listener.follow('app', e => {
                if (e.type === 'ready') ActorsCustom.init();
            });
        }
    }

    start();
})();
