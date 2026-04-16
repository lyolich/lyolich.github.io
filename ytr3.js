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

    function isGoodDuration(sec) {
        return sec > 60 && sec < 300;
    }

    function rate(item, query) {
        var t = item.title.toLowerCase();
        var score = 0;

        if (t.includes("официальный")) score += 200;
        if (t.includes(query)) score += 300;
        if (t.includes("hd") || t.includes("1080")) score += 50;
        if (t.includes("тизер")) score -= 100;

        return score;
    }

    function searchYouTube(query, success, fail) {

        // ✅ Invidious API (без ключа)
        var url = "https://yewtu.be/api/v1/search?q=" + encodeURIComponent(query) + "&type=video";

        var network = new Lampa.Reguest();

        network.native(url, function (data) {

            if (!data || !data.length) return fail();

            var results = data
                .map(function (v) {
                    return {
                        title: v.title,
                        id: v.videoId,
                        duration: v.lengthSeconds,
                        thumbnail: v.videoThumbnails[0].url
                    };
                })
                .filter(v => isValid(v.title))
                .filter(v => isRussian(v.title))
                .filter(v => isGoodDuration(v.duration))
                .sort((a, b) => rate(b, query) - rate(a, query));

            if (!results.length) return fail();

            success(results);

        }, fail);
    }

    function loadTrailers(event, success, fail) {
        if (!event.data || !event.data.movie) return;

        var movie = event.data.movie;
        var title = movie.title || movie.name || "";

        if (!title) return;

        var query = title + " трейлер русский официальный";

        searchYouTube(query, function (data) {

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
