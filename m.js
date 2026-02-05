/*!
 * Online Watch Plugin for Lampa
 * 
 * This plugin provides UI integration for online sources via Lampa Online API.
 * 
 * License: MIT
 * 
 * NOTE:
 * - This plugin does NOT host or distribute any content.
 * - All streams are provided by third-party sources configured in Lampa.
 */

(function () {
    'use strict';

    if (!window.Lampa) return;

    var plugin_name = 'watch_online_clean';

    function start() {
        if (!Lampa.Activity || !Lampa.Online) return;

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;

            var item = e.data.movie;
            if (!item) return;

            Lampa.Template.add('watch_online_button', `
                <div class="full-start__button selector">
                    <span>Онлайн</span>
                </div>
            `);

            var button = $(Lampa.Template.get('watch_online_button'));

            button.on('hover:enter', function () {
                Lampa.Activity.push({
                    url: 'online',
                    title: item.title || item.name,
                    component: 'online',
                    page: 1,
                    movie: item
                });
            });

            e.object.activity.render().find('.full-start').append(button);
        });
    }

    if (window.appready) start();
    else Lampa.Listener.follow('app', start);

})();
