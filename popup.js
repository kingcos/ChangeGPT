// 获取DOM元素
const imageUrlInput = document.getElementById("image-url");
const imagePreview = document.getElementById("image-preview");
const saveButton = document.getElementById("save-button");

// 节流
function throttle(func, delay) {
  let timer = null;
  return function() {
    if (!timer) {
      timer = setTimeout(() => {
        func.apply(this, arguments);
        timer = null;
      }, delay);
    }
  };
}

// 防抖
function debounce(func, delay) {
  let timer = null;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, arguments);
    }, delay);
  };
}

// 给输入框绑定事件，输入框内容改变时自动渲染图片预览
imageUrlInput.addEventListener("input", debounce(function() {
  console.log("--- input triggered ---");

  // 执行一些操作
  const imageUrl = imageUrlInput.value;

  if (imageUrl) {
    imagePreview.style.display = "block";
    saveButton.disabled = false;
  } else {
    imagePreview.style.display = "none";
    saveButton.disabled = true;
  }
  
  // imagePreview.style.backgroundImage = `url(${imageUrl})`;
  imagePreview.src = imageUrl;
}, 500));

// 替换逻辑
saveButton.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const message = {
      type: 'replace-image',
      imageDataUrl: null,
      imageUrl: null
    };

    if (imageUrlInput.value) {
      message.imageUrl = imageUrlInput.value;
      chrome.tabs.sendMessage(tabs[0].id, message);
    }
  });
});

// document.addEventListener('DOMContentLoaded', function() {
  // 读取缓存
  chrome.storage.local.get("url", (data) => {
    console.log(data.url);
    
    if (!data.url) {
      return;
    }

    imageUrlInput.value = data.url;
    imagePreview.src = data.url;
    imagePreview.style.display = "block";
    saveButton.disabled = false;
  });
// });

