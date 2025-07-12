// 一時的にJSONチェック結果を保存する変数
let lastJsonCheckResult = null;

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
    let errorMessage = '';
    try {
      // 空文字列や空白のみの文字列はJSONとしてパースさせないようにする
      if (selectedText.trim() === '') {
        errorMessage = "選択されたテキストが空または空白のみです。";
      } else {
        JSON.parse(selectedText);
        isValid = true;
      }
    } catch (e) {
      errorMessage = e.message;
    }

    // 結果を一時保存
    lastJsonCheckResult = {
      type: "jsonCheckResult",
      isValid,
      message: isValid ? "選択されたテキストは有効なJSONです。" : `無効なJSONです: ${errorMessage}`,
      originalText: selectedText
    };

    // ポップアップを開く (メッセージはポップアップから要求する)
    chrome.action.openPopup();
  }
});


// ポップアップからのメッセージ要求を処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "requestJsonCheckResult") {
    // 保存しておいた結果をポップアップに送り返す
    sendResponse(lastJsonCheckResult);
    // 結果を一度送ったらクリアしても良いが、再度ポップアップが開かれる可能性を考慮して残しておく
    // lastJsonCheckResult = null; // 必要であればクリア
  }
});
