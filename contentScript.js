let controlsContainer = null;
let bookmarksContainer = null;
let youtubePlayer;
let wasPlayingAd = false;
let adCheckInterval = null;

(() => {
  let currentVideo = "";
  let currentVideoBookmarks = [];
  let youtubeBottomContainer;

  //LISTEN FOR COMMANDS FROM POPUP
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;
    switch (type) {
      case "NEW_VIDEO_OPENED":
        currentVideo = videoId;
        newVideoLoaded();
        break;
      case "PLAY_FROM_BOOKMARK":
        jumpToTimeInPlayer(value);
        break;
      case "DELETE_BOOKMARK":
        deleteBookmark(value);
        response(currentVideoBookmarks);
        break;
    }
  });

  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const newVideoLoaded = async () => {
    currentVideoBookmarks = await fetchBookmarks();
    youtubePlayer = document.getElementsByClassName("video-stream")[0];

    if (bookmarksContainer) bookmarksContainer.innerHTML = "";
    youtubeBottomContainer = document.getElementsByClassName("ytp-chrome-bottom")[0];
    controlsContainerIsExist = document.getElementsByClassName("bookmark-controls-container")[0];

    //Ads check
    adCheckInterval = setInterval(adChecker, 500);
    youtubePlayer.addEventListener("playing", function () {
      if (adCheckInterval === null) {
        adCheckInterval = setInterval(adChecker, 500);
      }
    });
    youtubePlayer.addEventListener("ended", clearAdCheckerInterval);
    youtubePlayer.addEventListener("pause", clearAdCheckerInterval);

    if (!controlsContainerIsExist) {
      controlsContainer = document.createElement("div");
      controlsContainer.className = "bookmark-controls-container";

      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "buttons-container";

      bookmarksContainer = document.createElement("div");
      bookmarksContainer.className = "bookmarks-container";
      bookmarksContainer.innerHTML = "";

      const bookmarksBottom = document.createElement("div");
      bookmarksBottom.className = "bookmark-controls-container-bottom";

      controlsContainer.appendChild(buttonsContainer);
      controlsContainer.appendChild(bookmarksContainer);
      controlsContainer.appendChild(bookmarksBottom);

      buttonsContainer.append(createAddBookmarkButton());
      buttonsContainer.append(createPrevBookmarkButton());
      buttonsContainer.append(createNextBookmarkButton());

      youtubeBottomContainer.prepend(controlsContainer);
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }

    generateAllBookmarks();
    //TODO: how to callback to wait until ads is over
    // if (!isPlayingAd) {
    // }
  };

  const playVideoAtBookmark = (time) => {
    youtubePlayer.currentTime = time;
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = Math.floor(youtubePlayer.currentTime);
    console.log(currentTime);
    const newBookmark = {
      time: currentTime,
      desc: "Bookmark at " + getTime(currentTime),
    };

    currentVideoBookmarks.push(newBookmark);
    currentVideoBookmarks.sort((a, b) => a.time - b.time);
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(currentVideoBookmarks),
    });
    bookmarksContainer.appendChild(createBookmark(currentTime));
  };

  function generateAllBookmarks() {
    const videoDuration = getVideoDuration();
    if (videoDuration > 0) {
      currentVideoBookmarks.forEach((element) => {
        bookmarksContainer.appendChild(createBookmark(element.time, videoDuration));
      });
    } else {
      setTimeout(() => {
        generateAllBookmarks();
      }, 500);
    }
  }

  function createBookmark(time, videoDuration) {
    // const videoDuration = getVideoDuration();
    console.log(youtubePlayer, youtubePlayer.duration);
    const bookmarkItem = document.createElement("img");
    bookmarkItem.className = "bookmark-item";
    bookmarkItem.id = "bookmark_" + time;
    bookmarkItem.style.left = `calc(${(time / videoDuration) * 100}% - 3px)`;
    bookmarkItem.src = chrome.runtime.getURL("assets/bookmark-item.png");
    bookmarkItem.addEventListener("click", () => {
      playVideoAtBookmark(time);
    });
    return bookmarkItem;
  }

  function getVideoDuration() {
    if (youtubePlayer) {
      return parseInt(youtubePlayer.duration);
    }

    return null;
  }

  function showPlayerOverlay() {
    const playerOverlayParent = document.querySelector("ytd-app");
    const playerOverlay = document.createElement("div");
    playerOverlay.className = "player-overlay";
    playerOverlayParent.prepend(playerOverlay);
    playerOverlay.addEventListener("click", () => {
      playerOverlay.classList.add("hidden");
    });
  }

  function jumpToTimeInPlayer(time) {
    if (!isPlayingAd()) {
      youtubePlayer.currentTime = time;
    }
  }

  function deleteBookmark(timeStamp) {
    currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != timeStamp);
    let deletedBookmark = document.getElementById("bookmark_" + timeStamp);
    deletedBookmark.remove();
    currentVideoBookmarks.sort((a, b) => a.time - b.time);
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(currentVideoBookmarks),
    });
  }
  function adChecker() {
    if (isPlayingAd()) {
      toggleBookmarkPanel(false);
      wasPlayingAd = true;
    } else {
      if (wasPlayingAd) {
        removePrevBookmarks();
        toggleBookmarkPanel(true);
        wasPlayingAd = false;
      }
    }
    console.log("IS ADS? _" + isPlayingAd());
  }
  /* Check if ad is playing */
  function isPlayingAd() {
    const adOverlay = document.getElementsByClassName("ytp-ad-player-overlay")[0];
    return !!adOverlay;
  }

  /* clear ad checker interval script */
  function clearAdCheckerInterval() {
    clearInterval(adCheckInterval);
    adCheckInterval = null;
  }

  function toggleBookmarkPanel(display) {
    display ? controlsContainer.className.remove("hidden") : controlsContainer.className.add("hidden");
  }
})();

const getTime = (t) => {
  let date = new Date(0);
  date.setSeconds(t);
  return date.toISOString().slice(11, 19);
};

function everyTimePageLoads() {}

function initializePlayerControls() {}

function createAddBookmarkButton() {
  const bookmarkBtn = document.createElement("img");
  bookmarkBtn.src = chrome.runtime.getURL("assets/book.png");
  bookmarkBtn.className = "bookmark-button";
  bookmarkBtn.title = "Click to bookmark current timestamp";
  return bookmarkBtn;
}

function createNextBookmarkButton() {
  const nextBookmarkBtn = document.createElement("img");
  nextBookmarkBtn.src = chrome.runtime.getURL("assets/b-next.png");
  nextBookmarkBtn.className = "bookmark-button";
  nextBookmarkBtn.title = "Go to next bookmark";
  return nextBookmarkBtn;
}

function createPrevBookmarkButton() {
  const nextBookmarkBtn = document.createElement("img");
  nextBookmarkBtn.src = chrome.runtime.getURL("assets/b-prev.png");
  nextBookmarkBtn.className = "bookmark-button";
  nextBookmarkBtn.title = "Go to previous bookmark";
  return nextBookmarkBtn;
}

// clear ad checker interval script when video is paused or has ended
ytPlayer.addEventListener("ended", clearAdCheckerInterval);
ytPlayer.addEventListener("pause", clearAdCheckerInterval);
