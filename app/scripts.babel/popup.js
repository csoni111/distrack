'use strict';
const bg = chrome.extension.getBackgroundPage();
const tabStats = bg.stats;
const requestCounts = bg.requestCounts;

$(document).ready(() => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    let currTab = tabs[0];
    $('#request-count #total').text(tabStats[currTab.id].total);
    $('#request-count #blocked').text(tabStats[currTab.id].blocked);
  });
});
