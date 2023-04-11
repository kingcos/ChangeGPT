// 获取DOM元素
const imageUrlInput = document.getElementById("image-url");
const imagePreview = document.getElementById("image-preview");
const saveButton = document.getElementById("save-button");
const resetButton = document.getElementById("reset-button");
const tipsSpan = document.getElementById("tips");

// Tab2
const lastUserMessageInput = document.getElementById("last-user-message");
const copyButton = document.getElementById("copy-button");
const tab2ResetButton = document.getElementById("tab2-reset-button");
const tab2TipsSpan = document.getElementById("tab2-tips");
const tab2TipsSpan2 = document.getElementById("tab2-tips2");

// 获取 tab 相关的元素
const tabButtons = document.querySelectorAll('.tab-button');
const tabs = document.querySelectorAll('.tab');

// 点击切换 tab
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // 移除所有 tab 和按钮的 active 类
    tabs.forEach(tab => {
      tab.classList.remove('active');
    });
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });

    // 添加当前按钮和对应的 tab 的 active 类
    const targetTab = button.getAttribute('data-target');
    const tab = document.querySelector(`.tab.${targetTab}`);
    button.classList.add('active');
    tab.classList.add('active');
  });
});

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

// 替换逻辑
saveButton.addEventListener('click', () => {
  changeAvatar(imageUrlInput.value);
});

resetButton.addEventListener('click', () => {
  changeAvatar("");
});

copyButton.addEventListener('click', () => {
  lastUserMessageInput.disabled = false;
  lastUserMessageInput.select();
  document.execCommand('copy')
  lastUserMessageInput.disabled = true;
  tab2TipsSpan.innerText = "复制成功！";
});

tab2ResetButton.addEventListener('click', () => {
  copyButton.disabled = true;
  lastUserMessageInput.value = "";
  tab2TipsSpan2.style.display = "none";
  chrome.storage.local.set({ lastUserMessage: "" }, () => {});
  tab2TipsSpan.innerText = "重置成功！";
});

// 弹出页面后执行
(function () {
  chrome.storage.local.get(["url", "ori", "lastUserMessage", "lastTitle", "lastLink"], (data) => {
    console.log("local: ", data.url, data.ori, data.lastUserMessage);
    
    if (data.url) {
      imageUrlInput.value = data.url;
      imagePreview.src = data.url;
      imagePreview.style.display = "block";
      saveButton.disabled = false;
    }
  
    if (data.ori) {
      resetButton.disabled = false;
    } else {
      resetButton.disabled = true;
    }

    if (data.lastUserMessage) {
      lastUserMessageInput.value = data.lastUserMessage;
      copyButton.disabled = false;
      tab2ResetButton.disabled = false;

      if (data.lastLink) {
        let innerText = "· 链接：" + data.lastLink;
        if (data.lastTitle) {
          innerText =  "· 标题：" + data.lastTitle + "\n" + innerText;
        }
        tab2TipsSpan2.innerText = innerText;
        tab2TipsSpan2.style.display = "block";
      }
    } else {
      copyButton.disabled = true;
      tab2ResetButton.disabled = true;
      tab2TipsSpan2.innerText = ""
      tab2TipsSpan2.style.display = "none";
    }
  });
})();

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
      resetButton.disabled = false;
    } else {
      tipsSpan.innerText = "恢复成功！";
      resetButton.disabled = true;
    }
    tipsSpan.style.color = "#7f7f7f";
  });
}
