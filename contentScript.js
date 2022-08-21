(() => {
  let youtubeRightControls, youtubePlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];

  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;

    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoaded();
    } else if (type === "PLAY") {
      youtubePlayer.currentTime = value;
    } else if (type === "DELETE") {
      currentVideoBookmarks = currentVideoBookmarks.filter(
        (b) => b.time != value
      );
      chrome.storage.sync.set({
        [currentVideo]: JSON.stringify(currentVideoBookmarks),
      });
      console.table(currentVideoBookmarks);
      response(currentVideoBookmarks);
    }
  });

  const fetchBookmarks = () => {
    everyTimePageLoads();
    return new Promise((resolve) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const newVideoLoaded = async () => {
    const bookmarkBtnExists =
      document.getElementsByClassName("bookmark-btn")[0];

    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
      const bookmarkBtn = document.createElement("img");

      bookmarkBtn.src = chrome.runtime.getURL("assets/book.png");
      bookmarkBtn.className = "ytp-button " + "bookmark-btn";
      bookmarkBtn.title = "Click to bookmark current timestamp";

      youtubeRightControls =
        document.getElementsByClassName("ytp-right-controls")[0];
      youtubePlayer = document.getElementsByClassName("video-stream")[0];

      youtubeRightControls.prepend(bookmarkBtn);
      bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
    }
  };

  const addNewBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: "Bookmark at " + getTime(currentTime),
    };
    currentVideoBookmarks = await fetchBookmarks();

    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(
        [...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time)
      ),
    });

    let object = chrome.storage.sync.get([currentVideo], function (result) {
      console.table(result.value);
    });
  };
  newVideoLoaded();
  console.log("current video in CS: " + currentVideo);
})();

const getTime = (t) => {
  let date = new Date(0);
  date.setSeconds(t);
  return date.toISOString().slice(11, 19);
};

function everyTimePageLoads() {
  // console.log("GOT BOOKMARKS FROM STORAGE!");
}
