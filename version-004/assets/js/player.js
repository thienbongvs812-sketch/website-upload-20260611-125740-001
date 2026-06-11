function setupPlayer(streamUrl) {
  var video = document.querySelector('[data-video-player]');
  var overlay = document.querySelector('[data-play-overlay]');
  var message = document.querySelector('[data-player-message]');
  var hls = null;
  var attached = false;

  if (!video || !streamUrl) {
    return;
  }

  function setMessage(text) {
    if (message) {
      message.textContent = text || '';
    }
  }

  function attachStream() {
    if (attached) {
      return;
    }

    attached = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      setMessage('');
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        setMessage('');
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          setMessage('播放暂不可用，请稍后再试');
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          }
          if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });
      return;
    }

    video.src = streamUrl;
  }

  function hideOverlay() {
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
  }

  function startPlayback() {
    attachStream();
    hideOverlay();

    var playPromise = video.play();

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        setMessage('轻触播放区域继续观看');
      });
    }
  }

  if (overlay) {
    overlay.addEventListener('click', startPlayback);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      startPlayback();
    }
  });

  video.addEventListener('play', hideOverlay);
  video.addEventListener('loadeddata', function () {
    setMessage('');
  });

  window.addEventListener('beforeunload', function () {
    if (hls) {
      hls.destroy();
    }
  });
}
