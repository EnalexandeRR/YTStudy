let controlsContainer = null;
let bookmarksContainer = null;
let youtubePlayer;
let wasPlayingAd = false;
let adCheckInterval = null;
const minBookmarkInterval = 1;
let video = null;

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
    //#region ADS check, make later
    //Ads check
    // adCheckInterval = setInterval(adChecker, 500);
    // youtubePlayer.addEventListener("playing", function () {
    //   if (adCheckInterval === null) {
    //     adCheckInterval = setInterval(adChecker, 500);
    //   }
    // });
    // youtubePlayer.addEventListener("ended", clearAdCheckerInterval);
    // youtubePlayer.addEventListener("pause", clearAdCheckerInterval);
    //#endregion

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
      buttonsContainer.append(createLoopButton());

      youtubeBottomContainer.prepend(controlsContainer);
    }

    generateAllBookmarks();
    //TODO: how to callback to wait until ads is over
    // if (!isPlayingAd) {
    // }
  };

  const playVideoAtBookmark = (time) => {
    youtubePlayer.currentTime = time;
  };
  //#region CONTROL BUTTONS EVENT HADLERS
  const addNewBookmarkEventHandler = () => {
    const currentTime = youtubePlayer.currentTime;
    let canPlace = true;
    for (let i = 0; i < currentVideoBookmarks.length; i++) {
      if (currentTime >= currentVideoBookmarks[i].time - minBookmarkInterval && currentTime <= currentVideoBookmarks[i].time + minBookmarkInterval) {
        canPlace = false;
        break;
      }
    }

    if (canPlace) {
      const newBookmark = {
        time: currentTime,
        desc: "Bookmark at " + getTime(currentTime),
      };
      currentVideoBookmarks.push(newBookmark);
      currentVideoBookmarks.sort((a, b) => a.time - b.time);
      bookmarksContainer.appendChild(createBookmark(currentTime, newBookmark.desc));

      chrome.storage.sync.set({
        [currentVideo]: JSON.stringify(currentVideoBookmarks),
      });
    }
  };
  const nextBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    for (let i = 0; i < currentVideoBookmarks.length; i++) {
      const element = currentVideoBookmarks[i];
      if (element.time > currentTime) {
        youtubePlayer.currentTime = element.time;
        break;
      }
    }
  };
  const prevBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    for (let i = currentVideoBookmarks.length - 1; i >= 0; i--) {
      const element = currentVideoBookmarks[i];
      if (element.time < currentTime - 0.9) {
        youtubePlayer.currentTime = element.time;
        break;
      }
    }
  };
  const loopBtnClickEventHandler = () => {
    if (!youtubePlayer.paused) youtubePlayer.pause();
    showLoopSelectionOverlay();
  };

  //#endregion

  function generateAllBookmarks() {
    const videoDuration = getVideoDuration();
    if (videoDuration > 0) {
      currentVideoBookmarks.forEach((element) => {
        bookmarksContainer.appendChild(createBookmark(element.time, element.desc));
      });
    } else {
      setTimeout(() => {
        generateAllBookmarks();
      }, 500);
    }
  }

  function createBookmark(time, description) {
    const videoDuration = getVideoDuration();
    const bookmarkItem = document.createElement("img");
    bookmarkItem.className = "bookmark-item";
    bookmarkItem.id = "bookmark_" + time;
    bookmarkItem.style.left = `calc(${(time / videoDuration) * 100}% - 3px)`;
    bookmarkItem.src = chrome.runtime.getURL("assets/bookmark-item.png");
    bookmarkItem.title = `${description}`;
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

  function showLoopSelectionOverlay() {
    const body = document.querySelector("body");
    body.classList.add("body-no-scroll");

    const playerOverlayParent = document.querySelector("ytd-app");
    const playerOverlay = document.createElement("div");
    playerOverlay.className = "player-overlay";
    playerOverlayParent.prepend(playerOverlay);
    playerOverlay.innerHTML = `
    <div class="modal-window">
      <div class="modal-header">
      </div>
      <div class="modal-main">
        <ul class="bookmarks-list">
        </ul>
      </div>
      <div class="modal-footer">
        <input type="button" value="Close!" class="close-button">
      </div>
    </div>`;
    console.log(currentVideoBookmarks);
    const sectionUl = document.querySelector(".bookmarks-list");
    for (let i = 0; i < currentVideoBookmarks.length; i++) {
      sectionUl.append(createBookmarkListItem(currentVideoBookmarks[0]));
    }

    document.querySelector(".close-button").addEventListener("click", () => {
      playerOverlay.classList.add("hidden");
      body.classList.remove("body-no-scroll");
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
  //#region ADS FUNCTIONS
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
  //#endregion

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

function createBookmarkListItem(bookmarksParameters) {
  const listItem = document.createElement("div");
  listItem.className = "loop-list-item";
  listItem.innerHTML = `
    <input type="checkbox" name="" id="">
    <p>${bookmarksParameters.time}<p>
    <p>${bookmarksParameters.desc}<p>
    `;
  return listItem;
}
//#region CONTROL BUTTONS CREATION
function createAddBookmarkButton() {
  const bookmarkBtn = document.createElement("img");
  bookmarkBtn.src = chrome.runtime.getURL("assets/book.png");
  bookmarkBtn.className = "bookmark-button";
  bookmarkBtn.title = "Add bookmark at current time";
  bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
  return bookmarkBtn;
}
function createNextBookmarkButton() {
  const nextBookmarkBtn = document.createElement("img");
  nextBookmarkBtn.src = chrome.runtime.getURL("assets/b-next.png");
  nextBookmarkBtn.className = "bookmark-button";
  nextBookmarkBtn.title = "Go to next bookmark";
  nextBookmarkBtn.addEventListener("click", nextBookmarkEventHandler);
  return nextBookmarkBtn;
}
function createPrevBookmarkButton() {
  const nextBookmarkBtn = document.createElement("img");
  nextBookmarkBtn.src = chrome.runtime.getURL("assets/b-prev.png");
  nextBookmarkBtn.className = "bookmark-button";
  nextBookmarkBtn.title = "Go to previous bookmark";
  nextBookmarkBtn.addEventListener("click", prevBookmarkEventHandler);
  return nextBookmarkBtn;
}
function createLoopButton() {
  const loopBtn = document.createElement("img");
  loopBtn.src = chrome.runtime.getURL("assets/loop-icon.png");
  loopBtn.className = "bookmark-button";
  loopBtn.title = "Loop between two bookmarks";
  loopBtn.addEventListener("click", loopBtnClickEventHandler);
  return loopBtn;
}
//#endregion
