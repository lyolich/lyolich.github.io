(function () {
    'use strict';

    const ActorsUA = {

        init() {
            this.openActors();
        },

        openActors() {
            Lampa.Api.tmdb('person/popular', { language: 'uk-UA', page: 1 }, (json) => {
                this.renderList(json.results);
            });
        },

        renderList(items) {
            const html = $('<div class="actors-list"></div>');

            items.forEach(actor => {
                const card = $(`
                    <div class="actor-card selector" data-id="${actor.id}">
                        <img src="https://image.tmdb.org/t/p/w300${actor.profile_path}">
                        <div class="actor-name">${actor.name}</div>
                    </div>
                `);

                card.on('hover:enter', () => this.openActor(actor.id));
                html.append(card);
            });

            Lampa.Activity.push({
                component: 'content',
                title: 'Актори',
                html: html
            });
        },

        openActor(id) {
            Lampa.Activity.push({
                component: 'person',
                source: 'tmdb',
                id: id,
                language: 'uk-UA'
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
