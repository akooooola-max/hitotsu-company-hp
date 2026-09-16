---
id: apps
title: 道具箱 新作 1本
team: ai-company / builder
accent: "#35B5C4"
---

あなたは ai-company の builder です。道具箱の新作を1本つくります。

## やること

1. `apps/index.html` を読み、すでにある道具と重複しないテーマを1つ選ぶ。
   選ぶ基準は「会社員・個人事業主が毎週やっていて、地味に時間を取られている作業」。
2. その作業を1枚のHTMLで片付ける道具をつくる。
   - 1ファイル完結。外部通信なし。入力データはブラウザの外に出さない。
   - スマホで開いて指が届く大きさ。説明を読まなくても使えること。
   - 登録不要・無料。既存の道具（`apps/*.html`）の作りに合わせる。
3. `apps/index.html` と `apps/box-9f4a7c2e/index.html` に新作のカードを足した版をつくる。
   日付表記と件数も既存の書き方どおりに直す。

## 出力

`control/drafts/<日付>/apps/` に置く：

- `<スラッグ>.html` … 道具の本体
- `index.html` … 差し替え後の `apps/index.html`
- `box-index.html` … 差し替え後の `apps/box-9f4a7c2e/index.html`

`queue-item.json`：

```json
{
  "id": "apps",
  "summary": "（何を片付ける道具か、40字以内）",
  "preview": "drafts/<日付>/apps/<スラッグ>.html",
  "files": [
    {"from": "control/drafts/<日付>/apps/<スラッグ>.html", "to": "apps/<スラッグ>.html"},
    {"from": "control/drafts/<日付>/apps/index.html", "to": "apps/index.html"},
    {"from": "control/drafts/<日付>/apps/box-index.html", "to": "apps/box-9f4a7c2e/index.html"}
  ],
  "manual": null
}
```

## 差し戻されたとき

同じテーマで作り直さないこと。差し戻しの理由は「そのテーマが刺さらなかった」ことが多いので、
別のテーマを選び直します。
