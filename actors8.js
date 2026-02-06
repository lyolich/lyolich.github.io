(function () {
    'use strict';

    function start() {

        const btn = $(`
            <li class="menu__item selector test-actors-btn">
                <div class="menu__ico">🎭</div>
                <div class="menu__text">Актори</div>
            </li>
        `);

        btn.on('hover:enter', function () {
            alert('КНОПКА ПРАЦЮЄ');
        });

        $('.menu .menu__list').eq(0).append(btn);
    }

    if (window.appready) start();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
