chrome.tabs.onUpdated.addListener(function onUpdate (tabId, tab) {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    try {
      chrome.tabs.sendMessage(tabId, {
        type: "NEW",
        videoId: urlParameters.get("v"),
      });
    } catch {
      console.log("Something went wrong!");
    }
  }
  // chrome.tabs.onUpdated.removeListener(onUpdate);
});
chrome.webNavigation.onCompleted.addListener((tab) => {
  if(tab.frameId === 0 && tab.url.includes("youtube.com/watch")){
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    
    try {
      chrome.tabs.sendMessage(tab.tabId, {
        type: "NEW",
        videoId: urlParameters.get("v"),
      });
    } catch {
      console.log("Something went wrong!");
    }
  }
});
