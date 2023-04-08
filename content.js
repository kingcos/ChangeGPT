console.log('--- Running in content.js ---')

var observer, originUrl;

setTimeout(init, 500);

// chrome.storage.sync.clear(function() {
//   console.log("Cache cleared successfully.");
// });

function init() {
  // 读取缓存
  chrome.storage.local.get("ori", (data) => {
    console.log(data.ori);

    if (!data.ori) {
      return;
    }

    originUrl = data.ori;
  });


  chrome.storage.local.get("url", (data) => {
    console.log(data.url);

    if (!data.url) {
      return;
    }

    const images = document.querySelectorAll('img.rounded-sm');
    for (let i = 0; i < images.length; i++) {
      replaceImageSrc(images[i], data.url);
    }

    observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        // 对于大多数节点
        // if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        //   mutation.addedNodes.forEach(addedNode => {
        //     if (addedNode.nodeType === Node.ELEMENT_NODE) {
        //       const images = addedNode.querySelectorAll('img.rounded-sm');
        //       if (images.length) {
        //         // console.log("----------", message.imageUrl);
        //         images.forEach(image => replaceImageSrc(image, data.url));
        //       }
        //     }
        //   });
        // }
        // 对于 Next.js 的优化单独处理：
        if (mutation.type === "attributes" && mutation.target.classList.contains("rounded-sm")) {
          if (mutation.target.src !== data.url) {
            replaceImageSrc(mutation.target, data.url);
          }
        }
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  });
}

// 监听用户保存，更改当前头像
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'replace-image') {
    const images = document.querySelectorAll('img.rounded-sm');
    for (let i = 0; i < images.length; i++) {
      if (message.imageUrl) {
        // 保存原有的链接
        if (!originUrl) {
          originUrl = images[i].src;
        }

        replaceImageSrc(images[i], message.imageUrl);
      }
    }

    // 缓存
    chrome.storage.local.set({ ori: originUrl, url: message.imageUrl }, () => {
      console.log(`${{ ori: originUrl, url: message.imageUrl }}`);
    });

    // 开启监听
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(addedNode => {
            if (addedNode.nodeType === Node.ELEMENT_NODE) {
              const images = addedNode.querySelectorAll('img.rounded-sm');
              // console.log("----------", message.imageUrl);
              images.forEach(image => replaceImageSrc(image, message.imageUrl));
            }
          });
        }
      });
    });
  
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
});

function replaceImageSrc(img, url) {
  img.src = url;
  // "xxx 1x, xxx 2x"
  img.srcset = `${url} 1x, ${url} 2x`;
}
