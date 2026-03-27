import { restoreSavedIcon } from "./association.js";

let color = "#3aa757";
chrome.runtime.onInstalled.addListener(() => {
  console.log("onInstalled");
  chrome.storage.sync.set({ color });
  console.log("Default background color set to %cgreen", `color: ${color}`);
});

// Restore custom icon each time the service worker starts up
restoreSavedIcon();
