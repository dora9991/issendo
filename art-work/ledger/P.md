# バッチ P 画像台帳

| ID | ねらい | 状態 |
| --- | --- | --- |
| h_idle | 右向きの戦闘構え。両手で刀を前に構え、きりっとした顔。 | 完了 |
| h_run | 右足を前に出して右へ走る1コマ目。刀を低く片手で持つ。 | 完了 |
| h_run2 | 左足を前に出して右へ走る2コマ目。刀を低く片手で持つ。 | 完了 |
| h_slash1 | 右斜め下への振り下ろし。前足に体重を乗せて叫ぶ。 | 完了 |
| h_slash2 | 右斜め上への斬り上げ。頭の右上に刀を構えて叫ぶ。 | 完了。刀身が二本に見えた初回生成を差し替え。 |
| h_thrust | 低く踏み込み、刀を右へ水平に伸ばす。 | 完了 |
| h_jump | 空中で膝を曲げ、両手で刀を頭上に構える。 | 完了 |
| h_hurt | 後ろへのけぞり、目をぎゅっとつぶる被弾リアクション。 | 完了 |
| h_charge | 低くしゃがみ、両手の刀を体の後ろ下に構える。 | 完了 |
| h_dash | 右へ前傾して突進し、刀を水平に後ろへ伸ばす。 | 完了 |
| h_finish | 斬り抜け後に立ち、刀を右下に下げて目を閉じて微笑む。 | 完了 |
| h_lose | しりもち、ぐるぐる目と小さな星、刀を脇に置くコミカルな敗北。 | 完了 |

組み込み画像生成を各IDに使用。`art-work/ref/hero_ref.png` を造形と配色、`art-work/ref/hero_style.png` を頭身と線、`art-work/sheets/pilot.png` を塗りと明るさの参照にした。すべて `python3 art-work/process.py ui <生成PNG> <ID>` で処理し、元画像を `art-work/raw/<ID>.png`、ゲーム用画像を `img/ui/<ID>.webp` に保存した。

`python3 art-work/sheet.py P h_idle h_run h_run2 h_slash1 h_slash2 h_thrust h_jump h_hurt h_charge h_dash h_finish h_lose` で `art-work/sheets/P.png` を作成して目視比較した。`h_idle` は表情をきりっとさせるため再生成。全12点の透明アルファと透明な四隅、全身・刀の収まりを確認した。
