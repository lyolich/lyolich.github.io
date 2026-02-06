(function () {
    'use strict';

    function addActorsButton() {
        const btn = $(`
            <li class="menu__item selector actors-btn">
                <div class="menu__ico">🎭</div>
                <div class="menu__text">Актори</div>
            </li>
        `);

        btn.on('hover:enter', () => {
            alert('Кнопка працює!');
        });

        // Додаємо кнопку після того, як меню повністю готове
        const menuList = $('.menu .menu__list').eq(0);
        if (menuList.length) menuList.append(btn);
    }

    function start() {
        if (window.appready) {
            // меню ще може не бути
            setTimeout(addActorsButton, 500); // невелика затримка для безпечного рендеру
        } else {
            Lampa.Listener.follow('app', e => {
                if (e.type === 'ready') setTimeout(addActorsButton, 500);
            });
        }
    }

    start();
})();
