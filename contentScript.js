const controlsContainer = document.createElement("div");
const buttonsContainer = document.createElement("div");
let bookmarksContainer = null;
let youtubePlayer = null;
let wasPlayingAd = false;
let adCheckInterval = null;
const minBookmarkInterval = 1;
let onLoopCheckInterval = null;
let video = null;

(() => {
  //#region ******************************************************************************** SIDEBAR TEST
  // testbody = document.getElementsByTagName("body")[0];
  // console.log(testbody);
  // sidebar = document.createElement("div");
  // sidebar.className = "sidebar";
  // sidebar.classList.add("closed");
  // sideDetector = document.createElement("div");
  // sideDetector.className = "side-detector";
  // sideDetector.addEventListener("mouseover", () => {
  //   console.log("hover over side detector");
  //   sidebar.classList.remove("closed");
  // });
  // sidebar.addEventListener("mouseleave", () => {
  //   console.log("mouse leave side detector");
  //   sidebar.classList.add("closed");
  // });
  // testbody.appendChild(sidebar);
  // testbody.appendChild(sideDetector);

  //#endregion

  let loopstartTime = 0;
  let loopEndTime = 0;
  const testIsLooping = true;

  let currentVideo = "";
  let currentVideoBookmarks = [];
  let youtubeBottomContainer;
  let allBookmarkElementsArray = [];
  let loopStartAndFinishTimeArray = [];

  //LISTEN FOR COMMANDS FROM POPUP
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;
    switch (type) {
      case "NEW_VIDEO_OPENED":
        currentVideo = videoId;
        newVideoLoaded();
        break;
      //#region ************************************************************************* DONT NEED FOR NOW
      //   case "PLAY_FROM_BOOKMARK":
      //     jumpToTimeInPlayer(value);
      //     break;
      //   case "DELETE_BOOKMARK":
      //     deleteBookmark(value);
      //     response(currentVideoBookmarks);
      //     break;
      //#endregion
    }
  });

  //ON NEW VIDEO PAGE LOADED
  const newVideoLoaded = async () => {
    controlsContainerIsExist = document.getElementsByClassName("bookmark-controls-container")[0];
    youtubeBottomContainer = document.getElementsByClassName("ytp-chrome-bottom")[0];
    youtubePlayer = document.getElementsByClassName("video-stream")[0];
    youtubePlayer.removeEventListener("playing", loopTimeCheck);

    if (bookmarksContainer) bookmarksContainer.innerHTML = "";
    if (!controlsContainerIsExist) {
      createControlsContainer();
    }
    //GET BOOKMARKS AND GENERATE MARKS ON PANEL
    currentVideoBookmarks = await fetchBookmarks();
    generateAllBookmarks();

    //#region **************************************************************************** ADS check, make later
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
    //TODO: how to callback to wait until ads is over
    // if (!isPlayingAd) {
    // }
  };
  function createControlsContainer() {
    controlsContainer.className = "bookmark-controls-container";
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
    buttonsContainer.append(createEditBookmarkButton());
    buttonsContainer.append(createAddVideoToPlaylistButton());

    youtubeBottomContainer.prepend(controlsContainer);
  }
  //#region ------------------------------------------------------------------------------ CONTROL BUTTONS EVENT HADLERS
  const addNewBookmarkEventHandler = () => {
    const currentTime = youtubePlayer.currentTime;
    let canPlace = true;
    for (let i = 0; i < currentVideoBookmarks.length; i++) {
      if (
        currentTime >= currentVideoBookmarks[i].time - minBookmarkInterval &&
        currentTime <= currentVideoBookmarks[i].time + minBookmarkInterval
      ) {
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
  const nextBookmarkEventHandler = () => {
    const currentTime = youtubePlayer.currentTime;
    for (let i = 0; i < currentVideoBookmarks.length; i++) {
      const element = currentVideoBookmarks[i];
      if (element.time > currentTime) {
        youtubePlayer.currentTime = element.time;
        break;
      }
    }
  };
  const prevBookmarkEventHandler = () => {
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
    youtubePlayer.removeEventListener("playing", loopTimeCheck);
    stopLooping();
    showLoopSelectionWindow();
  };

  const editBookmarkButtonEventHandler = () => {};

  const addCurrentVideoToPlaylistHandler = () => {};

  const bookmarkCheckboxSelectionForLooping = () => {};
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
    //3px is half of element width in css styles
    bookmarkItem.style.left = `calc(${(time / videoDuration) * 100}% - 3px)`;
    // bookmarkItem.style.left = `calc(${(time / videoDuration) * 100}%)`;
    bookmarkItem.src = chrome.runtime.getURL("assets/bookmark-item.png");
    bookmarkItem.title = `${description}`;
    bookmarkItem.addEventListener("click", () => {
      playVideoAtBookmark(time);
      bookmarkItem.classList.add("selected");
    });
    return bookmarkItem;
  }

  function showLoopSelectionWindow() {
    const controlsLoopButton = document.querySelector(".start-loop-button");
    const playerOverlayParent = document.querySelector("ytd-app");
    // const body = document.querySelector("body");
    let playerOverlay = null;

    document.body.classList.add("body-no-scroll");
    playerOverlay = document.querySelector(".player-overlay");
    if (!playerOverlay) {
      playerOverlay = document.createElement("div");
    }
    playerOverlay.className = "player-overlay";
    playerOverlay.innerHTML = `
    <div class="modal-window">
      <div class="modal-header">
      </div>
      <div class="modal-main">
      </div>
      <div class="modal-footer">
        <input type="button" value="Cancel" class="cancel-button">
        <input type="button" value="Loop" class="list-loop-button" disabled>
      </div>
    </div>`;
    playerOverlayParent.prepend(playerOverlay);
    const bookmarksList = document.querySelector(".modal-main");
    const loopButton = document.querySelector(".list-loop-button");
    loopButton.addEventListener("click", () => {
      if (loopStartAndFinishTimeArray.length < 2) {
      } else {
        playerOverlay.classList.add("hidden");
        document.body.classList.remove("body-no-scroll");
        loopstartTime = loopStartAndFinishTimeArray[0];
        loopEndTime = loopStartAndFinishTimeArray[1];
        youtubePlayer.currentTime = loopstartTime;

        controlsLoopButton.classList.add("animate-loop-button");

        youtubePlayer.play();
        youtubePlayer.addEventListener("playing", loopTimeCheck);
      }
    });
    allBookmarkElementsArray = [];
    for (let i = 0; i < currentVideoBookmarks.length; i++) {
      const bookmark = createBookmarkListItem(currentVideoBookmarks[i]);
      bookmarksList.append(bookmark);
      allBookmarkElementsArray.push(bookmark);
    }

    document.querySelector(".cancel-button").addEventListener("click", () => {
      controlsLoopButton.classList.remove("animate-loop-button");
      youtubePlayer.removeEventListener("playing", loopTimeCheck);
      document.body.classList.remove("body-no-scroll");
      playerOverlay.classList.add("hidden");
    });
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
  //#region ******************************************************************************* ADS FUNCTIONS
  function adChecker() {
    if (isPlayingAd()) {
      viewBookmarkPanel(false);
      wasPlayingAd = true;
    } else {
      if (wasPlayingAd) {
        removePrevBookmarks();
        viewBookmarkPanel(true);
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

  //#region ******************************************************************************* LOOP CHECKER
  function loopTimeCheck() {
    if (!onLoopCheckInterval) {
      onLoopCheckInterval = setInterval(loopTimeChecker, 100);
    }
  }
  function loopTimeChecker() {
    console.log(youtubePlayer.currentTime);
    if (youtubePlayer.currentTime >= loopEndTime) {
      youtubePlayer.currentTime = loopstartTime;
    }
    if (youtubePlayer.currentTime < loopstartTime) {
      youtubePlayer.currentTime = loopstartTime;
    }
  }
  function stopLooping() {
    if (onLoopCheckInterval) {
      clearInterval(onLoopCheckInterval);
      onLoopCheckInterval = null;
    }
  }
  //#endregion

  function viewBookmarkPanel(display) {
    display
      ? controlsContainer.className.remove("hidden")
      : controlsContainer.className.add("hidden");
  }

  function createBookmarkListItem(bookmarksParameters) {
    const listItem = document.createElement("div");
    listItem.className = "loop-list-item";
    listItem.innerHTML = `
    <div>
      <p>${bookmarksParameters.time}</p>
      <p>${bookmarksParameters.desc}</p>
    </div>
      `;
    console.log(bookmarksParameters);

    const bookmarkChecker = document.createElement("input");
    bookmarkChecker.setAttribute("type", "checkbox");
    bookmarkChecker.setAttribute("id", bookmarksParameters.time);
    listItem.addEventListener("click", (event) => {
      toggleBookmarkSeletionChecker(event, listItem);
    });

    listItem.prepend(bookmarkChecker);
    return listItem;
  }

  function toggleBookmarkSeletionChecker(event, listItem) {
    let checkbox = listItem.childNodes[0];
    if (event.target.type === "checkbox") {
    } else if (!checkbox.disabled) {
      checkbox.checked = !checkbox.checked;
    }
    tempCheckForTwoBookmarks();
  }

  function tempCheckForTwoBookmarks() {
    const loopButton = document.querySelector(".list-loop-button");
    loopButton.disabled = true;

    let checkedCount = 0;
    loopStartAndFinishTimeArray = [];
    for (let j = 0; j < allBookmarkElementsArray.length; j++) {
      const element = allBookmarkElementsArray[j];
      element.firstChild.disabled = false;
    }
    for (let i = 0; i < allBookmarkElementsArray.length; i++) {
      const element = allBookmarkElementsArray[i];
      if (element.firstChild.checked) {
        loopStartAndFinishTimeArray.push(element.firstChild.id);
        checkedCount++;
        if (checkedCount === 2) {
          for (let j = 0; j < allBookmarkElementsArray.length; j++) {
            const element = allBookmarkElementsArray[j];
            if (element.firstChild.checked) {
              continue;
            } else {
              element.firstChild.disabled = true;
            }
          }
          loopButton.disabled = false;
          console.log(loopStartAndFinishTimeArray);
          break;
        }
      }
    }
  }
  //#region ****************************************************************************** CONTROL BUTTONS CREATION
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
    loopBtn.classList.add("bookmark-button", "start-loop-button");
    loopBtn.title = "Loop between two bookmarks";
    loopBtn.addEventListener("click", loopBtnClickEventHandler);
    return loopBtn;
  }
  function createEditBookmarkButton() {
    const editBtn = document.createElement("img");
    editBtn.src = chrome.runtime.getURL("assets/bm-edit.png");
    editBtn.className = "bookmark-button";
    editBtn.title = "Edit bookmark description";
    editBtn.addEventListener("click", editBookmarkButtonEventHandler);
    return editBtn;
  }

  function createAddVideoToPlaylistButton() {
    const addToPlaylistBtn = document.createElement("img");
    addToPlaylistBtn.src = chrome.runtime.getURL("assets/add-to-playlist-icon.png");
    addToPlaylistBtn.className = "bookmark-button";
    addToPlaylistBtn.title = "Add current video to playlist";
    addToPlaylistBtn.addEventListener("click", addCurrentVideoToPlaylistHandler);
    return addToPlaylistBtn;
  }

  //#endregion
  function getVideoDuration() {
    if (youtubePlayer) {
      return parseInt(youtubePlayer.duration);
    }

    return null;
  }
  const fetchBookmarks = () => {
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };
})();

const getTime = (t) => {
  let date = new Date(0);
  date.setSeconds(t);
  return date.toISOString().slice(11, 19);
};
