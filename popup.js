// 获取DOM元素
const imageUrlInput = document.getElementById("image-url");
const imagePreview = document.getElementById("image-preview");
const saveButton = document.getElementById("save-button");
const resetButton = document.getElementById("reset-button");
const tipsSpan = document.getElementById("tips");

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
    // saveButton.innerText = "恢复默认头像";
    saveButton.disabled = true;
  }
  
  // imagePreview.style.backgroundImage = `url(${imageUrl})`;
  imagePreview.src = imageUrl;
}, 500));

function changeAvatar(url) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const message = {
      type: 'replace-image',
      imageDataUrl: null,
      imageUrl: null
    };
    
    message.imageUrl = url;

    chrome.storage.local.set({ url }, () => {
      console.log(`${message.imageUrl}`);
    });

    if (!tabs[0].url.startsWith("https://chat.openai.com")) {
      tipsSpan.innerText = "请切换至 ChatGPT Tab 下再替换哟";
      tipsSpan.style.color = "red";
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, message);

    if (url) {
      tipsSpan.innerText = "替换成功！";
    } else {
      tipsSpan.innerText = "恢复成功！";
    }
    tipsSpan.style.color = "#7f7f7f";
  });
}

// 替换逻辑
saveButton.addEventListener('click', () => {
  changeAvatar(imageUrlInput.value);
});

resetButton.addEventListener('click', () => {
  changeAvatar("");
});

// document.addEventListener('DOMContentLoaded', function() {
  // 读取缓存
  chrome.storage.local.get(["url", "ori"], (data) => {
    console.log("local: ", data.url, data.ori);
    
    if (data.url) {
      imageUrlInput.value = data.url;
      imagePreview.src = data.url;
      imagePreview.style.display = "block";
      saveButton.disabled = false;
    }

    if (data.ori) {
      resetButton.disabled = false;
    }
  });
// });

