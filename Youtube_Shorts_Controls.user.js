// ==UserScript==
// @name         Youtube Shorts Controls
// @namespace    Invertex
// @version      0.21
// @description  Allow direct control of Shorts' time and cleanup interface.
// @author       Invertex
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @match        https://*.youtube.com/*
// @grant        GM_addStyle
// @run-at       document-body
// ==/UserScript==

GM_addStyle(`.ytd-reel-video-renderer, .ytd-reel-video-renderer > .ytd-reel-player-overlay-renderer {
    align-items: flex-start !important;
}
.ytd-reel-video-renderer > .ytd-reel-player-overlay-renderer {
    display: flex !important;
    background-image: linear-gradient(180deg,rgba(0,0,0,.4),transparent) !important;
}
ytd-reel-video-renderer.ytd-shorts #overlay {
    align-self: flex-start !important;
}

@keyframes show-detail-overlay {
    0% {
        opacity: 0%;
    }
    1%
    {
        display: block;
        opacity: 1%;
    }
    99% {
        opacity: 99%;
    }
    100% {
        display: block;
        opacity: 100%;
    }
}
@keyframes hide-detail-overlay {
    0% {
        display: block;
        opacity: 100%;
    }
    99% {
        opacity: 1%;
    }
    100% {
        opacity: 0%;
        display: none;
    }
}
ytd-reel-video-renderer.ytd-shorts:hover #overlay {
    display: block;
    animation: show-detail-overlay 0.4s linear;
}
ytd-reel-video-renderer.ytd-shorts:not(:hover) #overlay {
    display: none;
    animation: hide-detail-overlay 0.4s linear;
}
#overlay > reel-player-header-renderer.ytd-reel-player-overlay-renderer {
    padding: 10px !important;
    flex-direction: column-reverse !important;
}
#overlay > dom-if.ytd-reel-player-overlay-renderer, .-internal-media-controls-overflow-button {
    display: none !important;
}
input[aria-label="video time scrubber"] {
    padding-bottom: 0px !important;
}
.html5-main-video::-webkit-media-controls-timeline {
	height: 0.6em;
    padding: 0px !important;
}
#channel-container.ytd-reel-player-header-renderer,.title.ytd-reel-player-header-renderer  {
    visibility: visible !important;
}
#player #channel-container #subscribe-button, #player #channel-container #channel-name, .player-controls:has(> ytd-shorts-player-controls) {
    display: none !important;
}`);


function findElem(rootElem, query, observer, resolve)
{
    const elem = rootElem.querySelector(query);
    if (elem != null && elem != undefined)
    {
        resolve(elem);
        observer?.disconnect();
    }
    return elem;
}

async function awaitElem(root, query, obsArguments)
{
    return new Promise((resolve, reject) =>
    {
        if (findElem(root, query, null, resolve)) { return; }
        const rootObserver = new MutationObserver((mutes, obs) => {
            findElem(root, query, obs, resolve);
        });
        rootObserver.observe(root, obsArguments);
    });
}

async function watchForAddedNodes(root, stopAfterFirstMutation, obsArguments, executeAfter)
{
    const rootObserver = new MutationObserver(
        function (mutations)
        {
            rootObserver.disconnect();
            let continueObserve = true;
            mutations.forEach(function (mutation)
            {
                if (mutation.addedNodes == null || mutation.addedNodes.length == 0) { return; }
                if (stopAfterFirstMutation) { rootObserver.disconnect(); continueObserve = false; }
                executeAfter(mutation.addedNodes);
            });
            if(continueObserve) { rootObserver.observe(root, obsArguments); }
        });

    rootObserver.observe(root, obsArguments);
}

async function processShort(short)
{
    if(short.tagName !== 'YTD-REEL-VIDEO-RENDERER') { return; }
    let vidPlayer = await awaitElem(short, ".html5-video-player video", {subtree: true, childList: true});

    vidPlayer.controls = true;

     vidPlayer.onmouseenter = function() {
         vidPlayer.controls = true;
    };
    vidPlayer.onmousemove = function() {
        vidPlayer.controls = true;
    };
    vidPlayer.onseeked = function()
    {
        vidPlayer.controls = true;
    };
}

function processShorts(shorts)
{
    shorts.forEach(processShort);
}

let vidPaused = false;

(async function() {
    'use strict';

    let shortsContainer = await awaitElem(document.body, 'ytd-shorts.ytd-page-manager div#shorts-inner-container', {attributes: true, childList: true, subtree: true });
    let shorts = shortsContainer.querySelectorAll('ytd-reel-video-renderer');
    processShorts(shorts);
    watchForAddedNodes(shortsContainer, false, {subtree: false, childList: true}, processShorts);
})();