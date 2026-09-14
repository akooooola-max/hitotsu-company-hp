# 案内役キャラの「本物の動き」用 — 動画生成プロンプト（方法B）

参考サイト（moonveil-manor）の案内役は、透過風の短い動画をブレンド表示していました。
同じ方式にするには、アイコンから **4〜6秒のループ動画** を作ります。私は動画を生成できないので、
Sora（ChatGPT）／Veo／Kling などに、元画像（`画像素材/キャラクター/note_icon_original.png`）を添えて貼ってください。

## 生成の指定（共通）

- 入力：アイコン画像を「参照画像」として添付（キャラを変えないため）
- 尺：4〜6秒、ループ前提（最初と最後のポーズを同じにする）
- 背景：**真っ黒（#000）**で単色 ← サイトでは黒を透かして合成します（参考サイトと同じ手法）
- 画角：胸から上、正面やや斜め、カメラは固定
- 書き出し：MP4（H.264）1080×1080 または 720×720、音声なし

## プロンプト1：待機ループ（基本）

```
A 3D chibi character (reference image attached), brown short hair, black hoodie, holding a small orange card with a white asterisk in front of his mouth.
Idle animation loop, 5 seconds: gentle breathing, slow natural blinks, slight head tilt left then right, the card bobs subtly.
Camera fixed, medium close-up from the chest up, three-quarter front view.
Plain pure black background (#000000), no floor, no shadow on the ground, no text, no logo, no particles.
Pixar-style soft lighting with warm rim light from the upper right. Seamless loop: first and last frames identical.
```

## プロンプト2：手を振る（予約ボタンに触れた時用）

```
Same 3D chibi character (reference image attached). 4-second clip: he lowers the orange card slightly, smiles, winks with his right eye and gives a small peace sign with his free hand, then returns to the starting pose.
Camera fixed, chest-up, three-quarter front view. Pure black background (#000000), no text, no particles, no ground shadow.
Pixar-style soft warm lighting. Start and end on the same pose so it can loop.
```

## 受け取ったら

`night/assets/guide-idle.mp4`（待機）と `guide-wave.mp4`（反応）として置いてください。
サイト側は `<video>` を `mix-blend-mode: screen` で重ね、黒背景を透かして合成します（参考サイトと同じ）。
黒い服の部分は少し透けるので、必要なら背景を濃い紺 (#100F22) にして生成し直します。
