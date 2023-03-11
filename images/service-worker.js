function hostStartWithValidProtocol(requestUrl){
    return (requestUrl.indexOf('http') === 0);
}

function webwaveApplicationNonCacheUrls(requestUrl){
    return (requestUrl.indexOf('gui/fileUpload') !== -1
        || requestUrl.indexOf('gui/saveAndPublishService') !== -1
        || requestUrl.indexOf('webmasterPanel/exportWebsite') !== -1
        || requestUrl.indexOf('administration/') !== -1
        || requestUrl.indexOf('webmasterPanel/getWebsiteAccounts') !== -1
        || requestUrl.indexOf('tawk.to') !== -1
        || requestUrl.match(/\.(mp4)$/) !== null);
}

function hostIsValidUrl(requestUrl){
    if (hostStartWithValidProtocol(requestUrl)){
        return webwaveApplicationNonCacheUrls(requestUrl) === false;
    }
    return false;
}

self.addEventListener('install', event => {
    //force new service worker when one is waiting
    self.skipWaiting();
    event.waitUntil(
        caches.open('v1').then(cache => {
            return cache.addAll(['/manifest.json']);
        }, error => {
            console.log(`Installation failed with error: ${error}`);
        }),
    );
});

self.addEventListener('activate', event => {
    let cacheKeepList = ['v1'];
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(function (key){
                if (cacheKeepList.indexOf(key) === -1){
                    return caches.delete(key);
                }
            }));
        }),
    );
});

self.addEventListener('fetch', function (event){
    if (hostIsValidUrl(event.request.url) === false){
        return;
    }
    event.respondWith(
        // Try the network
        fetch(event.request)
            .then(function (res){
                return caches.open('v1')
                    .then(function (cache){
                        // Put in cache if succeeds
                        cache.put(event.request.url, res.clone());
                        return res;
                    });
            })
            .catch(function (err){
                // Fallback to cache
                return caches.match(event.request);
            }),
    );
});