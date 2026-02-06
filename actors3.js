(function () {
    'use strict';

    const ActorsUA = {

        init() {
            this.addButton();
        },

        addButton() {
            const icon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="2.2em" height="2.2em" viewBox="0 0 48 48">
                <circle cx="24" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="4"/>
                <path d="M8 40c0-8 32-8 32 0" fill="none" stroke="currentColor" stroke-width="4"/>
            </svg>`;

            const btn = $(`
                <li class="menu__item selector actors-ua">
                    <div class="menu__ico">${icon}</div>
                    <div class="menu__text">Актори</div>
                </li>
            `);

            btn.on('hover:enter', () => this.openPopular());
            $('.menu .menu__list').eq(0).append(btn);
        },

        openPopular() {
            Lampa.Activity.push({
                component: 'category_full',
                source: 'tmdb',
                url: 'person/popular',
                title: 'Популярні актори',
                language: 'uk-UA',
                region: 'UA',
                card_type: 'person',
                page: 1
            });
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
