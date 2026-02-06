(function () {
    'use strict';

    var ActorsUA = {
        settings: {
            show_button: true
        },

        init: function () {
            this.loadSettings();
            this.registerTemplates();
            this.createSettings();
            this.addActorsButton();
            this.initStorageListener();
        },

        registerTemplates: function () {
            Lampa.Template.add('settings_actors_ua', `
                <div class="settings-param">
                    <div class="settings-param__name">Показувати кнопку «Актори»</div>
                </div>
            `);
        },

        loadSettings: function () {
            let saved = Lampa.Storage.get('actors_ua_settings');
            if (saved) {
                this.settings.show_button = saved.show_button !== false;
            }
        },

        saveSettings: function () {
            Lampa.Storage.set('actors_ua_settings', this.settings);
        },

        createSettings: function () {
            Lampa.SettingsApi.addParam({
                component: 'interface',
                param: {
                    type: 'button',
                    component: 'actors_ua'
                },
                field: {
                    name: 'Актори',
                    description: 'Налаштування розділу акторів'
                },
                onChange: () => {
                    Lampa.Settings.create('actors_ua', {
                        title: 'Актори',
                        template: 'settings_actors_ua',
                        onBack: () => Lampa.Settings.create('interface')
                    });
                }
            });

            Lampa.SettingsApi.addParam({
                component: 'actors_ua',
                param: {
                    name: 'actors_ua_show_button',
                    type: 'trigger',
                    default: this.settings.show_button
                },
                field: {
                    name: 'Показувати кнопку акторів'
                }
            });
        },

        initStorageListener: function () {
            Lampa.Storage.listener.follow('change', e => {
                if (e.name === 'actors_ua_show_button') {
                    this.settings.show_button = Lampa.Storage.get('actors_ua_show_button', true);
                    this.saveSettings();
                    this.toggleButton();
                }
            });
        },

        addActorsButton: function () {
            let ico = `
            <svg xmlns="http://www.w3.org/2000/svg" width="2.2em" height="2.2em" viewBox="0 0 48 48">
                <g fill="none" stroke="currentColor" stroke-width="4">
                    <circle cx="24" cy="14" r="6"/>
                    <path d="M8 40c0-8 32-8 32 0"/>
                </g>
            </svg>`;

            this.button = $(`
                <li class="menu__item selector actors-ua-button" data-action="actors">
                    <div class="menu__ico">${ico}</div>
                    <div class="menu__text">Актори</div>
                </li>
            `);

            this.button.on('hover:enter', this.openActors.bind(this));
            $('.menu .menu__list').eq(0).append(this.button);

            this.toggleButton();
        },

        toggleButton: function () {
            $('.actors-ua-button').toggle(this.settings.show_button);
        },

        openActors: function () {
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

    function startPlugin() {
        if (window.ActorsUA) return;
        window.ActorsUA = ActorsUA;

        if (window.appready) {
            ActorsUA.init();
        } else {
            Lampa.Listener.follow('app', e => {
                if (e.type === 'ready') ActorsUA.init();
            });
        }
    }

    startPlugin();
})();
