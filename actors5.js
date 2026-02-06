(function () {
    'use strict';

    const ActorsPlugin = {

        init() {
            this.addButton();
        },

        addButton() {
            const btn = $(`
                <li class="menu__item selector actors-btn">
                    <div class="menu__ico">🎭</div>
                    <div class="menu__text">Актори</div>
                </li>
            `);

            btn.on('hover:enter', () => this.openActors());
            $('.menu .menu__list').eq(0).append(btn);
        },

        openActors() {
            Lampa.Activity.push({
                component: 'category_full',
                source: 'tmdb',
                url: 'person/popular',
                title: 'Популярні актори',
                card_type: 'person',
                page: 1,
                onSelect: (card) => {
                    this.openFilmography(card.id, card.title);
                }
            });
        },

        openFilmography(id, name) {
            Lampa.Activity.push({
                component: 'category_full',
                source: 'tmdb',
                url: `person/${id}/movie_credits`,
                title: 'Фільми: ' + name,
                card_type: 'movie',
                page: 1
            });
        }
    };

    function start() {
        if (window.ActorsPlugin) return;
        window.ActorsPlugin = ActorsPlugin;

        if (window.appready) ActorsPlugin.init();
        else {
            Lampa.Listener.follow('app', e => {
                if (e.type === 'ready') ActorsPlugin.init();
            });
        }
    }

    start();
})();
