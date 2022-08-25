let controlsContainer = null;
let bookmarksContainer = null;

(() => {
  let youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];
  let youtubeBottomContainer;

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;
    switch (type) {
      case "NEW_VIDEO_OPENED":
        currentVideo = videoId;
        newVideoLoaded();
        break;

      case "PLAY_FROM_BOOKMARK":
        youtubePlayer.currentTime = value;
        break;

      case "DELETE_BOOKMARK":
        console.table(currentVideoBookmarks);
        currentVideoBookmarks = currentVideoBookmarks.filter(
          (b) => b.time != value
        );
        let deletedBookmark = document.getElementById("bookmark_" + value);
        deletedBookmark.remove();
        currentVideoBookmarks.sort((a, b) => a.time - b.time);
        chrome.storage.sync.set({
          [currentVideo]: JSON.stringify(currentVideoBookmarks),
        });
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
    youtubeBottomContainer =
      document.getElementsByClassName("ytp-chrome-bottom")[0];
    controlsContainerIsExist = document.getElementsByClassName(
      "bookmark-controls-container"
    )[0];

    youtubePlayer = document.getElementsByClassName("video-stream")[0];
    currentVideoBookmarks = await fetchBookmarks();

    if (!controlsContainerIsExist) {
      controlsContainer = document.createElement("div");
      controlsContainer.className = "bookmark-controls-container";

      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "buttons-container";

      bookmarksContainer = document.createElement("div");
      bookmarksContainer.className = "bookmarks-container";
      currentVideoBookmarks.forEach((element) => {
        createAndAppendBookmark(element.time);
      });

      const bookmarksBottom = document.createElement("div");
      bookmarksBottom.className = "bookmark-controls-container-bottom";

      controlsContainer.appendChild(buttonsContainer);
      controlsContainer.appendChild(bookmarksContainer);
      controlsContainer.appendChild(bookmarksBottom);

      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/book.png");
      bookmarkBtn.className = "bookmark-button";
      bookmarkBtn.title = "Click to bookmark current timestamp";

      buttonsContainer.prepend(bookmarkBtn);
      youtubeBottomContainer.prepend(controlsContainer);
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
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
    createAndAppendBookmark(currentTime);
  };
  //newVideoLoaded();

  function createAndAppendBookmark(time) {
    const videoDuration = getVideoDuration();
    const bookmarkItem = document.createElement("img");
    bookmarkItem.className = "bookmark-item";
    bookmarkItem.id = "bookmark_" + time;
    bookmarkItem.style.top = 0;
    bookmarkItem.style.left = `calc(${(time / videoDuration) * 100}% - 3px)`;
    bookmarkItem.src = chrome.runtime.getURL("assets/bookmark-item.png");
    bookmarkItem.addEventListener("click", () => {
      playVideoAtBookmark(time);

      bookmarkItem.classList.add("bookmark-selected");
    });

    bookmarksContainer.appendChild(bookmarkItem);
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
})();

const getTime = (t) => {
  let date = new Date(0);
  date.setSeconds(t);
  return date.toISOString().slice(11, 19);
};

function everyTimePageLoads() {}

function initializePlayerControls() {}
