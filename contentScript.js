let controlsContainer = null;
let bookmarksContainer = null;

(() => {
  let youtubePlayer;
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
    console.table(currentVideoBookmarks);
    if (bookmarksContainer) bookmarksContainer.innerHTML = "";
    youtubeBottomContainer =
      document.getElementsByClassName("ytp-chrome-bottom")[0];
    controlsContainerIsExist = document.getElementsByClassName(
      "bookmark-controls-container"
    )[0];

    youtubePlayer = document.getElementsByClassName("video-stream")[0];

    if (!controlsContainerIsExist) {
      controlsContainer = document.createElement("div");
      controlsContainer.className = "bookmark-controls-container";

      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "buttons-container";

      bookmarksContainer = document.createElement("div");
      bookmarksContainer.className = "bookmarks-container";
      bookmarksContainer.innerHTML = "";
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
    } else {
      currentVideoBookmarks.forEach((element) => {
        createAndAppendBookmark(element.time);
      });
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

  function createAndAppendBookmark(time) {
    const videoDuration = getVideoDuration();
    const bookmarkItem = document.createElement("img");
    bookmarkItem.className = "bookmark-item";
    bookmarkItem.id = "bookmark_" + time;
    bookmarkItem.style.left = `calc(${(time / videoDuration) * 100}% - 3px)`;
    bookmarkItem.src = chrome.runtime.getURL("assets/bookmark-item.png");
    bookmarkItem.addEventListener("click", () => {
      playVideoAtBookmark(time);
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

  function jumpToTimeInPlayer(time) {
    youtubePlayer.currentTime = time;
  }

  function deleteBookmark(timeStamp) {
    currentVideoBookmarks = currentVideoBookmarks.filter(
      (b) => b.time != timeStamp
    );
    let deletedBookmark = document.getElementById("bookmark_" + timeStamp);
    deletedBookmark.remove();
    currentVideoBookmarks.sort((a, b) => a.time - b.time);
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(currentVideoBookmarks),
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
