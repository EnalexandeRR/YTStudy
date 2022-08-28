chrome.tabs.onUpdated.addListener(function onUpdate(tabId, tab) {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    chrome.tabs.sendMessage(tabId, {
      type: "NEW_VIDEO_OPENED",
      videoId: urlParameters.get("v"),
    });
    console.log("URL UPDATED!");
  }
});
chrome.webNavigation.onCompleted.addListener((tab) => {
  if (tab.frameId === 0 && tab.url.includes("youtube.com/watch")) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    chrome.tabs.sendMessage(tab.tabId, {
      type: "NEW_VIDEO_OPENED",
      videoId: urlParameters.get("v"),
    });
    console.log("TAB UPDATED");
  }
});
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
