# バッチ H 画像台帳

| ID | ねらい | 状態 |
| --- | --- | --- |
| cutin | 必殺技のカットイン。主人公が画面右を向く斜めの胸上構図で、両手で日本刀を肩に構え、大きく口を開けて叫ぶ。 | 完了。`art-work/raw/cutin.png` → `img/ui/cutin.webp`。 |
| hero_win | 勝利ポーズ。主人公の全身を描き、片手で日本刀を高く掲げ、もう片手でピースし、満面の笑顔を見せる。 | 完了。`art-work/raw/hero_win.png` → `img/ui/hero_win.webp`。 |
| hero_title | タイトル画面用。主人公が画面右を向いて少し前かがみに日本刀を構え、赤いマフラーとはちまきの尾がなびく全身像。 | 完了。`art-work/raw/hero_title.png` → `img/ui/hero_title.webp`。 |

生成方法: 組み込み画像生成を各IDに1回ずつ使用。`art-work/ref/hero_ref.png` を主人公の造形・配色、`art-work/sheets/pilot.png` を太い濃紫の輪郭・明るいセル塗り・ハイライトの参照として指定した。3点とも赤いはちまきの銀プレートと金の星、藍色の髪、赤いマフラー、白襟の青い道着、黄色い帯、紺のズボン、茶色の靴、大きな青い目を共通にした。

確認: `python3 art-work/process.py ui <生成PNG> <ID>` で各WebPを作成し、透明アルファと透明な四隅を確認。`python3 art-work/sheet.py H cutin hero_win hero_title` で `art-work/sheets/H.png` を作成し、3点の絵柄・配色・構図・全身の収まりを目視比較した。文字・複数人物・床の影はない。
