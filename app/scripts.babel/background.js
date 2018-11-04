'use strict';

const sitename = new Sitename;

let stats = {};
let domains = {};
let requestCounts = {};

chrome.runtime.onInstalled.addListener(details => {
  console.log('on installed called');
});

let intervalId = setInterval(function () {
  if (sitename.isInitialized()) {
    clearInterval(intervalId);

    chrome.tabs.query({}, function (tabs) {
      let count = tabs.length;

      for (let tab in tabs) {
        domains[tab.id] = sitename.get(tab.url);
      }
    });
  }
}, 100);

chrome.webRequest.onBeforeRequest.addListener(function (details) {
  const tabId = details.tabId;
  const isParent = details.type === 'main_frame';
  const requestedUrl = details.url;
  const childDomain = sitename.get(requestedUrl);
  if (isParent) {
    domains[tabId] = childDomain;
  }
  const childDomainDetails = blacklist[childDomain];
  const parentDomain = domains[tabId];

  let blockingResponse = {cancel: false};
  let tabStats = stats[tabId] || (stats[tabId] = {total: 0, blocked: 0});
  let totalCount = ++tabStats.total;
  if (childDomainDetails) {
    const parentDomainDetails = blacklist[parentDomain];
    const isContent = childDomainDetails.category === 'content';
    if (
      tabId === -1 || isParent || !parentDomain || childDomain === parentDomain
      || parentDomainDetails && childDomainDetails.name === parentDomainDetails.name
    ) { // The request is allowed: the topmost frame has the same origin.
    }
    // else if (!isContent) { // The request is allowed
    // }
    else {
      blockingResponse = {
        redirectUrl:
          details.type === 'image' ?
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
            : 'about:blank'
      };
      let blockedCount = ++tabStats.blocked;
    } // The request is denied.

    if (blockingResponse.redirectUrl)
      incrementCounter(tabId, childDomainDetails, isContent);
  }
  return blockingResponse;
}, {urls: ['http://*/*', 'https://*/*']}, ['blocking']);


function incrementCounter(tabId, domainDetails, blocked) {
  let tabRequests = requestCounts[tabId] || (requestCounts[tabId] = {});
  let cat = domainDetails.category;
  let catRequests = tabRequests[cat] || (tabRequests[cat] = {});
  let domainRequests = catRequests[domainDetails.name] ||
    (catRequests[domainDetails.name] = {url: domainDetails.url, count: 0});
  ++domainRequests.count;
  safelyUpdateCounter(tabId, getCount(tabRequests), !blocked);
}

function safelyUpdateCounter(tabId, count, deactivated) {
  chrome.tabs.query({}, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabId === tabs[i].id) {
        updateCounter(tabId, count, deactivated);
        break;
      }
    }
  });
}

function getCount(tabRequests) {
  let count = 0;
  for (let categoryName in tabRequests) {
    let category = tabRequests[categoryName];
    for (let domainName in category) count += category[domainName].count;
  }
  return count;
}


function updateCounter(tabId, count, deactivated) {
  chrome.browserAction.setBadgeText({
    tabId: tabId,
    text: count ? count < 100 ? count + '' : '99+' : ''
  });
}
