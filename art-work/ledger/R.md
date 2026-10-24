# バッチ R 画像台帳

| ID | ねらい | 状態 |
| --- | --- | --- |
| h_run3 | 主人公の右向き全力疾走の2コマ目。参照の顔・衣装・なびく布・片手で左後方へ流す銀色の日本刀を保ち、足の運びを変える。 | 完了。`art-work/raw/h_run3.png` → `img/ui/h_run3.webp`。ただし、参照コマとの足の前後差は小さく、入れ替わりの視認性には改善余地がある。 |

組み込み画像生成で作成。`hero_ref.png` を主人公のデザイン、`hero_style.png` と `pilot.png` を絵柄、`h_run_ref.png` を走りの対になる構図として参照した。最初の生成で足の差が小さかったため、2回作り直した。

`python3 art-work/process.py ui <生成PNG> h_run3` で WebP 化し、`python3 art-work/sheet.py R h_run3` で `art-work/sheets/R.png` を作成・目視確認。PNG と WebP のアルファ、四隅の透明を確認済み。全身・刀・布は画面内に収まり、文字・床の影・効果線はない。
