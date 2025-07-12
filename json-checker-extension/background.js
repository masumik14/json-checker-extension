
// 拡張機能がインストールされたときに右クリックメニューを作成
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "checkJson",
    title: "選択をJSONとしてチェック",
    contexts: ["selection"] // テキスト選択時のみ表示
  });
});

// 右クリックメニューがクリックされたときの処理
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "checkJson" && info.selectionText) {
    const selectedText = info.selectionText;
    let isValid = false;
    let errorMessage = "";
    try {
      // 空文字列や空白のみの文字列はJSONとしてパースさせない
      if (selectedText.trim() === "") {
        errorMessage = "選択されたテキストが空または空白のみです。";
      } else {
        JSON.parse(selectedText);
        isValid = true;
      }
    } catch (e) {
      errorMessage = e.message;
    }

    // 結果をストレージに保存
    const result = {
      type: "jsonCheckResult",
      isValid,
      message: isValid ? "選択されたテキストは有効なJSONです。" : `無効なJSONです: ${errorMessage}`,
      originalText: selectedText
    };
    chrome.storage.local.set({ lastJsonCheckResult: result }, () => {
      // 保存完了後にポップアップを開く
      chrome.action.openPopup();
    });
  }
});


// ポップアップからのメッセージ要求を処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "requestJsonCheckResult") {
    chrome.storage.local.get("lastJsonCheckResult", (data) => {
      sendResponse(data.lastJsonCheckResult || null);
    });
    // 非同期で応答するためtrueを返す
    return true;
  }
});
