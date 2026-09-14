# 館めぐり型サイト用 場面画像の生成プロンプト（ChatGPTに貼るだけ）

作成：2026-09-12。`_preview/tour.html` の各場面の背景用。
ChatGPT Images（gpt-image-2）で生成し、**`_preview/assets/scene-01.webp` 〜 `scene-06.webp`** の名前で保存すれば、ページが自動で写真的な夜景に切り替わります（無い間はCSSの夜空で表示）。

- 推奨モード：**Thinking**（構図と光の安定に効きます）
- 推奨サイズ：横長 1920×1080（16:9）。保存後、私に「置いた」と伝えていただければWebPへ変換・軽量化します
- 共通の世界観：**夜9時、鹿児島。あたたかい灯りのある、少し不思議なAIの相談室**。参考サイトの「館」を、和風モダンの一軒家＋オフィスに置き換えています

## 共通の指示（各プロンプトの末尾に必ず付ける）

```
Style: cinematic night photography, soft amber and gold lights against deep navy blue (#100F22) darkness, gentle mist near the ground, tiny floating light particles, shallow depth of field, warm and welcoming atmosphere, subtle magic. No people, no faces, no text, no letters, no logos, no watermark. Leave the left third of the frame darker and calmer so headline text can be placed there. 16:9 landscape, photorealistic, high detail.
```

## scene-01 入口（今夜、面倒な仕事を手放して。）

```
A modern Japanese house at night seen from the front gate, warm golden light glowing from the windows, a soft full moon above, a stone path leading to the entrance lined with small paper lanterns, a laptop-shaped glow faintly visible through one window, Kagoshima cityscape lights far in the background, Sakurajima volcano silhouette on the horizon.
```

## scene-02 庭（灯りが、道しるべ。）

```
A small Japanese garden at night, a winding stone path lit by a row of low warm lanterns, moss and maple leaves, a wooden gate ajar at the end of the path, light mist drifting over the ground, a faint trail of floating golden particles following the path as if guiding the visitor.
```

## scene-03 扉（扉の向こうは、無料の道具箱。）

```
A beautiful wooden sliding door slightly open at night, warm light spilling out through the gap onto a wooden floor, silhouettes of neatly arranged tools and glowing tablets on shelves visible inside, a small wooden sign hanging beside the door with no readable text, cozy and inviting.
```

## scene-04 ホール（ようこそ、メニューと料金。）

```
A warm modern Japanese-style lounge at night, low wooden tables, a long wooden counter with five soft pendant lamps evenly spaced above it, paper lantern light, a large window showing the night sky, an empty welcoming space ready for guests, subtle gold accents.
```

## scene-05 階段（作って、動いています。）

```
A wooden staircase inside a modern Japanese house at night, warm wall lamps at each landing, framed abstract glowing screens on the wall along the stairs like a small gallery, soft light from above inviting the viewer upward, polished wood reflecting the lamps.
```

## scene-06 バルコニー（夜9時、Zoomでお会いしましょう。）

```
A quiet wooden balcony at night overlooking the lights of Kagoshima city and Sakurajima under a starry sky, a small table with a softly glowing laptop and a cup of tea, a warm lantern, a comfortable chair turned toward the view, gentle breeze suggested by a slightly moving curtain, peaceful late evening around 9 pm.
```

## 一言Tips

- 6枚を**同じセッションで続けて生成**すると色味が揃います。「前と同じ世界観で」と添えてください
- 人物・文字は入れない指示にしています。案内役は本物の3Dキャラをサイト側で重ねるためです
- 明るすぎたら「darker, more night」、寂しすぎたら「warmer lights」と1語足すだけで直ります
