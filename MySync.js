(function () {
    'use strict';

    // --- ПЕРЕВІРКА ПЛАТФОРМИ ---
    // Перевіряємо, чи це Windows
    var isWindows = navigator.platform.indexOf('Win') > -1 || navigator.userAgent.indexOf('Windows') > -1;
    
    // Перевіряємо наявність середовища Node.js (NW.js / Electron), яке є тільки в програмі для ПК
    var req = window.require || window.nodeRequire;
    var node_cp = null;

    if (isWindows && req) {
        try {
            node_cp = req('child_process');
        } catch (e) {}
    }

    // Якщо це не Windows або це просто браузер/ТВ/Андроїд — повністю виходимо з плагіна.
    // Це збереже стандартний плеєр Lampa на інших пристроях недоторканим.
    if (!isWindows || !node_cp) {
        console.log('MPC-BE Plugin: Запуск скасовано. Це не Windows PC середовище.');
        return;
    }

    // --- НАЛАШТУВАННЯ ---
    var MPC_PATH = 'C:\\Program Files\\MPC-BE\\mpc-be64.exe'; // Вкажіть правильний шлях до вашого плеєру!!!
    var NODE_EXE_PATH = 'C:\\Program Files\\nodejs\\node.exe'; // Вкажіть правильний шлях до вашого node.exe !!!
    var PROXY_SCRIPT_PATH = 'X:\\Lampa\\SCRIPTS\\mpc-proxy.js'; // Вкажіть правильний шлях до вашого проксі !!!
    var PROXY_URL = 'http://localhost:8080';
    var MAX_FAILS = 1;

    // --- Системні змінні ---
    var pollingInterval = null;
    var currentTimeline = null;
    var failCount = 0;
    var proxyProcess = null;

    function timeToSeconds(timeStr) {
        if (!timeStr) return 0;
        var parts = timeStr.trim().split(':').reverse();
        var seconds = 0;
        if (parts[0]) seconds += parseInt(parts[0], 10);
        if (parts[1]) seconds += parseInt(parts[1], 10) * 60;
        if (parts[2]) seconds += parseInt(parts[2], 10) * 3600;
        return seconds;
    }

    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
            Lampa.Noty.show('MPC-BE: Синхронізацію зупинено');
        }
        if (proxyProcess) {
            try {
                proxyProcess.kill();
            } catch (err) {}
            proxyProcess = null;
        }
    }
    
    async function pollMpcViaProxy() {
        try {
            const response = await fetch(PROXY_URL);
            if (!response.ok) throw new Error();
            
            const data = await response.text();
            const posMatch = data.match(/id="positionstring"[^>]*>\s*(.*?)\s*</i);
            const durMatch = data.match(/id="durationstring"[^>]*>\s*(.*?)\s*</i);

            if (posMatch && posMatch[1]) {
                failCount = 0;
                const curSec = timeToSeconds(posMatch[1]);
                const durSec = (durMatch && durMatch[1]) ? timeToSeconds(durMatch[1]) : 0;

                if (curSec >= 0 && currentTimeline) {
                    currentTimeline.time = curSec;
                    if (durSec > 0) {
                        currentTimeline.duration = durSec;
                        currentTimeline.percent = (curSec / durSec) * 100;
                    }
                    Lampa.Timeline.update(currentTimeline);
                }
            } else {
                throw new Error();
            }
        } catch (error) {
            failCount++;
            if (failCount > MAX_FAILS) stopPolling();
        }
    }

    function startPolling() {
        if (pollingInterval) clearInterval(pollingInterval);
        failCount = 0;
        pollingInterval = setInterval(pollMpcViaProxy, 2000);
        pollMpcViaProxy();
    }

    function initExternalPlayer() {
        // Підміняємо плеєр ТІЛЬКИ на Windows
        Lampa.Player.play = function (data) {
            stopPolling(); 
            
            //var videoUrl = data.url || data.file || "";
            var videoUrl = "";
            if (data.url) {
                videoUrl = data.url;
            } else if (data.file) {
                videoUrl = data.file;
            } else if (data.torrent_hash) {
                videoUrl = 'http://127.0.0.1:8090/stream?link=' + data.torrent_hash + '&index=' + (data.torrent_index || 0) + '&play';
            }

            // --- МАГІЯ ВИПРАВЛЕННЯ ПОСИЛАННЯ ---
            if (videoUrl) {
                videoUrl = videoUrl.replace('localhost', '127.0.0.1');
                videoUrl = videoUrl.replace('preload', 'play');
            }

            if (!videoUrl) return;

            //Lampa.Noty.show('Лінк у плеєр: ' + videoUrl, { time: 10000 });

            currentTimeline = data.timeline;
            var targetTimeSec = (currentTimeline && currentTimeline.time) ? currentTimeline.time : 0;

            try {
                proxyProcess = node_cp.spawn(NODE_EXE_PATH, [PROXY_SCRIPT_PATH], { detached: true, stdio: 'ignore' });
                if (proxyProcess.unref) proxyProcess.unref();

                setTimeout(function() {
                    var args = [videoUrl];
                    if (targetTimeSec > 5) {
                        args.push('/start', targetTimeSec * 1000);
                    }
                    var playerProcess = node_cp.spawn(MPC_PATH, args, { detached: true, stdio: 'ignore' });
                    if (playerProcess.unref) playerProcess.unref();

                    setTimeout(startPolling, 2000);
                }, 1000);
            } catch (err) {
                stopPolling();
            }
        };
    }

    Lampa.Player.listener.follow('destroy', stopPolling);
    if (window.appready) initExternalPlayer();
    else Lampa.Listener.follow('app', (e) => { if (e.type == 'ready') initExternalPlayer(); });

})();
