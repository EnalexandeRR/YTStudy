import { getCurrentTabURL } from "./utils.js";
let currentVideo = "";
// adding a new bookmark row to the popup
const addNewBookmark = (bookmarksElement, bookmark) => {
  const bookmarkTitleElement = document.createElement("div");
  const newBookmarkElement = document.createElement("div");
  const controlsElement = document.createElement("div");

  bookmarkTitleElement.textContent = bookmark.desc;
  bookmarkTitleElement.className = "bookmark-title";
  controlsElement.className = "bookmark-controls";

  newBookmarkElement.id = "bookmark-" + bookmark.time;
  newBookmarkElement.className = "bookmark";
  newBookmarkElement.setAttribute("timestamp", bookmark.time);

  setBookmarkAttributes("play", onPlay, controlsElement);
  setBookmarkAttributes("play", sendMessageToContent, controlsElement);
  setBookmarkAttributes("delete", onDelete, controlsElement);

  newBookmarkElement.appendChild(bookmarkTitleElement);
  newBookmarkElement.appendChild(controlsElement);
  bookmarksElement.appendChild(newBookmarkElement);
};

const viewBookmarks = (currentBookmarks = []) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (currentBookmarks.length > 0) {
    for (let i = 0; i < currentBookmarks.length; i++) {
      const bookmark = currentBookmarks[i];
      addNewBookmark(bookmarksElement, bookmark);
    }
  } else {
    bookmarksElement.innerHTML = "<i class='row'>No bookmarks to show</i>";
  }

  const clearButton = document.getElementsByClassName("clear-storage")[0];
  clearButton.addEventListener("click", () => {
    chrome.storage.local.clear(function () {
      let error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      }
      // do something more
    });
    chrome.storage.sync.clear(); // callback is optional
  });
};

const onPlay = async (e) => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getCurrentTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY_FROM_BOOKMARK",
    value: bookmarkTime,
  });
};

const onDelete = async (e) => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  // const activeTab = await getCurrentTabURL();
  let activeTab;
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    activeTab = tabs[0];
    console.log(bookmarkTime);
    chrome.tabs.sendMessage(activeTab.id, {
      type: "DELETE_BOOKMARK",
      value: bookmarkTime,
    });
  });

  const bookmarkElementToDelete = document.getElementById(
    `bookmark-${bookmarkTime}`
  );
  bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);
};

const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("img");

  controlElement.src = `assets/${src}.png`;
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getCurrentTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);

  currentVideo = urlParameters.get("v");

  if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
    chrome.storage.sync.get([currentVideo], (data) => {
      const currentVideoBookmarks = data[currentVideo]
        ? JSON.parse(data[currentVideo])
        : [];

      viewBookmarks(currentVideoBookmarks);
    });
  } else {
    const container = document.getElementsByClassName("container")[0];
    container.innerHTML =
      "<div class='title'>This is not a youtube video!</div>";
  }
});
