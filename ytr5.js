(function () {
    "use strict";

    if (window.youtube_trailer_plugin) return;
    window.youtube_trailer_plugin = true;

    var proxyList = [
        "https://cors.isomorphic-git.org/",
        "https://api.allorigins.win/raw?url=",
        ""
    ];

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

    function search(query, success, fail, proxyIndex) {

        if (proxyIndex >= proxyList.length) return fail();

        var proxy = proxyList[proxyIndex];
        var url = proxy + "https://yewtu.be/api/v1/search?q=" + encodeURIComponent(query) + "&type=video";

        var network = new Lampa.Reguest();

        network.native(url, function (data) {

            try {
                if (typeof data === "string") data = JSON.parse(data);

                if (!data || !data.length) throw "empty";

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
                    .filter(v => isGoodDuration(v.duration));

                if (!results.length) throw "filtered empty";

                success(results);

            } catch (e) {
                search(query, success, fail, proxyIndex + 1);
            }

        }, function () {
            search(query, success, fail, proxyIndex + 1);
        });
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

        }, fail, 0);
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
