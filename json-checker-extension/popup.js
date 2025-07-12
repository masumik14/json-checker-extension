document.addEventListener('DOMContentLoaded', () => {
  const resultDiv = document.getElementById('result');
  const originalJsonContainer = document.getElementById('originalJsonContainer');
  const originalJsonPre = document.getElementById('originalJson');

  resultDiv.textContent = "処理中..."; // 初期メッセージ
  resultDiv.className = '';
  originalJsonContainer.style.display = 'none';

  // バックグラウンドスクリプトにJSONチェック結果を要求
  chrome.runtime.sendMessage({ type: "requestJsonCheckResult" }, (response) => {
    if (chrome.runtime.lastError) {
      // エラーが発生した場合（例: バックグラウンドスクリプトが応答しないなど）
      resultDiv.textContent = `エラー: ポップアップへのデータ転送に失敗しました。拡張機能をリロードしてみてください。`;
      resultDiv.className = 'invalid';
      console.error("Error receiving message from background:", chrome.runtime.lastError);
      return;
    }

    if (response && response.type === "jsonCheckResult") {
      resultDiv.textContent = response.message;
      if (response.isValid) {
        resultDiv.className = 'valid';
      } else {
        resultDiv.className = 'invalid';
      }

      // 元のテキストを表示
      originalJsonPre.textContent = response.originalText;
      originalJsonContainer.style.display = 'block';
    } else {
      // 予期しない応答が来た場合、または応答がなかった場合
      resultDiv.textContent = "JSONチェック結果がありません。テキストを選択して再度お試しください。";
      resultDiv.className = '';
      originalJsonContainer.style.display = 'none';
    }
  });
});
