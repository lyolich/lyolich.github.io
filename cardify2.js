(function () {

    if (!window.Lampa) return;

    function Player(container, videoId, onReady) {
        var iframe = document.createElement('iframe');
        iframe.src = "https://www.youtube.com/embed/" + videoId +
            "?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1";
        iframe.allow = "autoplay";
        iframe.frameBorder = "0";
        iframe.style.width = "100%";
        iframe.style.height = "100%";

        container.innerHTML = '';
        container.appendChild(iframe);

        if (onReady) setTimeout(onReady, 1000);
    }

    function Trailer() {
        this.container = null;
        this.videoId = null;
    }

    Trailer.prototype.init = function (element, videoId) {
        this.container = element;
        this.videoId = videoId;
    };

    Trailer.prototype.play = function () {
        if (!this.videoId) return;
        Player(this.container, this.videoId);
    };

    Trailer.prototype.hide = function () {
        if (this.container) this.container.innerHTML = '';
    };

    function startPlugin() {

        Lampa.Template.add('cardify_full', '\
            <div class="cardify-wrapper">\
                <div class="cardify-background"></div>\
                <div class="cardify-trailer"></div>\
            </div>\
        ');

        Lampa.Listener.follow('full', function (e) {

            if (e.type !== 'complite') return;

            var data = e.data;
            if (!data) return;

            var trailerKey = null;

            if (data.trailer && data.trailer.key) {
                trailerKey = data.trailer.key;
            }

            if (!trailerKey) return;

            var trailerElement = document.querySelector('.cardify-trailer');
            if (!trailerElement) return;

            var trailer = new Trailer();
            trailer.init(trailerElement, trailerKey);

            setTimeout(function () {
                trailer.play();
            }, 1500);
        });

        Lampa.Template.add('cardify_style', '\
            <style>\
                .cardify-wrapper {\
                    position: absolute;\
                    top: 0;\
                    left: 0;\
                    width: 100%;\
                    height: 100%;\
                    overflow: hidden;\
                }\
                .cardify-background {\
                    position: absolute;\
                    width: 100%;\
                    height: 100%;\
                    background-size: cover;\
                    background-position: center;\
                    opacity: 0.4;\
                }\
                .cardify-trailer {\
                    position: absolute;\
                    top: 0;\
                    left: 0;\
                    width: 100%;\
                    height: 100%;\
                }\
            </style>\
        ');
    }

    startPlugin();

})();
