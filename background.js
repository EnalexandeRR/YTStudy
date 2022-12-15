//ON URL CHANGE EVENT
chrome.tabs.onUpdated.addListener(function onUpdate(tabId, tab) {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    chrome.tabs.sendMessage(
      tabId,
      {
        type: "NEW_VIDEO_OPENED",
        videoId: urlParameters.get("v"),
      },
      function (response) {
        if (!chrome.runtime.lastError) {
          // if you have any response
        } else {
          console.log(chrome.runtime.lastError);
          // if your document doesn’t have any response, it’s fine but you should actually handle
          // it and we are doing this by carefully examining chrome.runtime.lastError
        }
      }
    );
    console.log("URL UPDATED!");
  }
});
//ON PAGE LOAD/RELOAD
chrome.webNavigation.onCompleted.addListener((tab) => {
  if (tab.frameId === 0 && tab.url.includes("youtube.com/watch")) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    chrome.tabs.sendMessage(
      tab.tabId,
      {
        type: "NEW_VIDEO_OPENED",
        videoId: urlParameters.get("v"),
      },
      function (response) {
        if (!chrome.runtime.lastError) {
          // if you have any response
        } else {
          console.log(chrome.runtime.lastError);
          // if your document doesn’t have any response, it’s fine but you should actually handle
          // it and we are doing this by carefully examining chrome.runtime.lastError
        }
      }
    );
    console.log("TAB UPDATED");
  }
});

function getFromStorage(videoId) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([videoId], (obj) => {
      resolve(obj[videoId] ? JSON.parse(obj[videoId]) : []);
    });
  });
}

// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//   if (
//     changeInfo.status == "complete" &&
//     tab.url.includes("youtube.com/watch") &&
//     tab.status == "complete"
//   ) {
//     const queryParams = tab.url.split("?")[1];
//     const urlParams = new URLSearchParams(queryParams);

//     chrome.tabs.sendMessage(tabId, {
//       type: "NEW_VIDEO_OPENED",
//       videoId: urlParams.get("v"),
//     });
//     console.log("NEW VIDEO OPENED!");
//   }
// });
