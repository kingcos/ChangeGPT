console.log('--- Running in content.js ---')

var observer, originUrl, lastUserMessageObserver;

(function () {
  // 读取缓存
  chrome.storage.local.get(["url", "ori"], (data) => {
    console.log("init local: ", data.url, data.ori);

    if (data.ori) {
      originUrl = data.ori;
    }

    if (!data.url) {
      return;
    }

    const images = document.querySelectorAll('img.rounded-sm');
    images.forEach(image => replaceImageSrc(image, data.url));

    observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
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

  // Tab 2
  if (lastUserMessageObserver) {
    lastUserMessageObserver.disconnect();
  }

  lastUserMessageObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(addedNode => {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            const items = addedNode.querySelectorAll("div.items-start");
            var message = null;
            items.forEach(item => {
              if (item.hasChildNodes() && item.childNodes[0].nodeType === 3) {
                // TEXT Node
                message = item.innerText;
              }
            })
            if (message) {
              // 缓存
              chrome.storage.local.set({ lastUserMessage: message }, () => {
                console.log(`${message}`);
              });
            }
          }
        });
      }

      // if (mutation.type === "attributes"
      // && mutation.target.type === "textarea"
      // && mutation.target.innerHTML) {
      //   chrome.storage.local.set({ lastUserMessage: mutation.target.innerHTML }, () => {
      //     console.log(`${mutation.target.innerHTML}`);
      //   });
      // }
    });
  });

  lastUserMessageObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
})();

// 监听用户保存，更改当前头像
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const isOri = !message.imageUrl;
  if (message.type === 'replace-image') {
    const images = document.querySelectorAll('img.rounded-sm');

    if (isOri) {
      message.imageUrl = originUrl;
    }

    images.forEach(image => replaceImageSrc(image, message.imageUrl));

    if (observer) {
      observer.disconnect();
    }

    if (isOri) {
      // 不再监听
      return;
    }
    
    // 开启监听
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
  // 保存原有的链接
  if (!originUrl && img.src.startsWith("https://chat.openai.com")) {
    originUrl = img.src;

    // 缓存
    chrome.storage.local.set({ ori: originUrl }, () => {
      console.log(`${originUrl}`);
    });
  }

  if (url === originUrl) {
    // 清除缓存
    chrome.storage.local.set({ ori: "" }, () => {});
  }

  img.src = url;
  // "xxx 1x, xxx 2x"
  img.srcset = `${url} 1x, ${url} 2x`;
}
