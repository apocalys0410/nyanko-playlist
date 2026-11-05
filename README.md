# nyanko-playlist
A cozy playlist of Japanese, Jazz, K-indie &amp; more — with Nyanko-sensei floating by ☕🐾

## 維護

歌單和歌手資料都在 `js/data.js`。新增或刪除之後，跑一次連結檢查：

```sh
node scripts/check-links.mjs --quiet
```

它會透過 Spotify 的公開 oEmbed 檢查每個 ID（不需要 API key）。✗ 代表已下架，~ 代表歌單在 Spotify 上改名了（可能被換了內容）；有失效、重複或無法檢查的 ID 時會以 exit code 1 結束。
