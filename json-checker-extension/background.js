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
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "checkJson" && info.selectionText) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getSelectedTextAndSendMessage // この関数が選択テキストを返す
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error("Scripting error:", chrome.runtime.lastError);
        // エラーが発生した場合もポップアップを開いてユーザーに通知できるようにする
        lastJsonCheckResult = {
          type: "jsonCheckResult",
          isValid: false,
          message: `テキストの取得に失敗しました: ${chrome.runtime.lastError.message}`,
          originalText: info.selectionText // 取得できなかったが、元の選択テキストは分かる
        };
        chrome.action.openPopup();
        return;
      }

      if (results && results[0] && results[0].result !== undefined) {
        const selectedText = results[0].result;
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
          isValid: isValid,
          message: isValid ? "選択されたテキストは有効なJSONです。" : `無効なJSONです: ${errorMessage}`,
          originalText: selectedText // 元のテキストも保存
        };
      } else {
         // results[0].result が undefined の場合 (選択テキストがないなど)
         lastJsonCheckResult = {
            type: "jsonCheckResult",
            isValid: false,
            message: "選択されたテキストが取得できませんでした。",
            originalText: info.selectionText || "" // info.selectionTextがあればそれを使う
         };
      }
      
      // ポップアップを開く (メッセージはポップアップから要求する)
      chrome.action.openPopup();
    });
  }
});

// コンテンツスクリプトとして注入される関数
// 選択されたテキストを取得して、背景スクリプトに返す
function getSelectedTextAndSendMessage() {
  return window.getSelection().toString();
}

// ポップアップからのメッセージ要求を処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "requestJsonCheckResult") {
    // 保存しておいた結果をポップアップに送り返す
    sendResponse(lastJsonCheckResult);
    // 結果を一度送ったらクリアしても良いが、再度ポップアップが開かれる可能性を考慮して残しておく
    // lastJsonCheckResult = null; // 必要であればクリア
  }
});
