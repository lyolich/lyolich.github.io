(function () {
    "use strict";

    if (window.youtube_trailer_plugin) return;
    window.youtube_trailer_plugin = true;

    function isRussian(text) {
        return /[а-яё]/i.test(text);
    }

    function isValid(title) {
        var t = title.toLowerCase();

        if (!(t.includes("трейлер") || t.includes("trailer"))) return false;

        if (
            t.includes("clip") ||
            t.includes("scene") ||
            t.includes("reaction") ||
            t.includes("review") ||
            t.includes("обзор")
        ) return false;

        return true;
    }

    function search(query, success, fail) {

        // ⚡ ПУБЛІЧНИЙ ПРОКСІ (працює стабільніше)
        var url = "https://piped.video/api/search?q=" + encodeURIComponent(query) + "&filter=videos";

        var network = new Lampa.Reguest();

        network.native(url, function (data) {

            try {
                if (!data || !data.items) throw "empty";

                var results = data.items
                    .map(function (v) {
                        return {
                            title: v.title,
                            id: v.url.split("v=")[1],
                            duration: v.duration,
                            thumbnail: v.thumbnail
                        };
                    })
                    .filter(v => isValid(v.title))
                    .filter(v => isRussian(v.title));

                if (!results.length) throw "filtered";

                success(results);

            } catch (e) {
                fail();
            }

        }, fail);
    }

    function loadTrailers(event, success, fail) {
        if (!event.data || !event.data.movie) return;

        var movie = event.data.movie;
        var title = movie.title || movie.name || "";

        if (!title) return;

        var query = title + " трейлер русский";

        search(query, function (data) {

            var playlist = data.slice(0, 10).map(function (v) {
                return {
                    title: v.title,
                    url: "https://www.youtube.com/watch?v=" + v.id,
                    icon: '<img src="' + v.thumbnail + '" />',
                    template: "selectbox_icon"
                };
            });

            success(playlist);

        }, fail);
    }

    function startPlugin() {

        var button =
            '<div class="full-start__button selector view--yt_trailer">' +
            '<span style="color:red;font-size:18px;">▶</span> YouTube трейлеры' +
            '</div>';

        Lampa.Listener.follow("full", function (event) {
            if (event.type === "complite") {

                var render = event.object.activity.render();
                var btn = $(button);

                render.find(".full-start__button:last").after(btn);

                var onEnter = function () {
                    Lampa.Noty.show("Поиск трейлеров...");
                };

                btn.on("hover:enter", function () {
                    onEnter();
                });

                loadTrailers(
                    event,
                    function (playlist) {
                        onEnter = function () {
                            Lampa.Select.show({
                                title: "YouTube трейлеры",
                                items: playlist,
                                onSelect: function (a) {
                                    Lampa.Player.play(a);
                                    Lampa.Player.playlist(playlist);
                                }
                            });
                        };
                    },
                    function () {
                        onEnter = function () {
                            Lampa.Noty.show("Трейлеры не найдены");
                        };
                    }
                );
            }
        });
    }

    startPlugin();

})();
