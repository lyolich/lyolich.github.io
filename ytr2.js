(function () {
    "use strict";

    if (window.youtube_trailer_plugin) return;
    window.youtube_trailer_plugin = true;

    function clean(str) {
        return (str || "")
            .toLowerCase()
            .replace(/[^a-zа-яё0-9 ]/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

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

        if (t.includes(query)) score += 300;
        if (t.includes("официальный")) score += 200;
        if (t.includes("hd") || t.includes("1080")) score += 50;
        if (t.includes("тизер")) score -= 100;

        return score;
    }

    // ✅ НОВИЙ СТАБІЛЬНИЙ ПАРСЕР
    function parseYouTube(html) {
        var results = [];

        try {
            var matches = html.match(/"videoRenderer":\{.*?\}\}\}/g);

            if (!matches) return [];

            matches.forEach(function (m) {
                try {
                    var obj = JSON.parse("{" + m + "}");
                    var v = obj.videoRenderer;

                    var title = v.title.runs[0].text;
                    var videoId = v.videoId;

                    var duration = 0;
                    if (v.lengthText && v.lengthText.simpleText) {
                        var parts = v.lengthText.simpleText.split(":").map(Number);
                        if (parts.length === 2) duration = parts[0]*60 + parts[1];
                        if (parts.length === 3) duration = parts[0]*3600 + parts[1]*60 + parts[2];
                    }

                    results.push({
                        title: title,
                        id: videoId,
                        duration: duration,
                        thumbnail: v.thumbnail.thumbnails.slice(-1)[0].url
                    });

                } catch(e){}
            });

        } catch(e){}

        return results;
    }

    function searchYouTube(query, success, fail) {
        var url = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);

        var network = new Lampa.Reguest();

        // ✅ ДОДАНО User-Agent
        network.native(
            url,
            function (html) {
                var results = parseYouTube(html);

                if (!results.length) return fail();

                var cleanQuery = clean(query);

                results = results
                    .filter(v => isValid(v.title))
                    .filter(v => isRussian(v.title))
                    .filter(v => isGoodDuration(v.duration))
                    .sort((a, b) => rate(b, cleanQuery) - rate(a, cleanQuery));

                if (!results.length) return fail();

                success(results);
            },
            fail,
            false,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );
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

        // ✅ КНОПКА З ІКОНКОЮ
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
