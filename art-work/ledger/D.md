# バッチ D 画像台帳

| ID | ねらい | 状態 |
| --- | --- | --- |
| bg_s2 | ステージ2「ゆうやけ こうや」。オレンジ〜ピンク〜紫の夕空と大きな夕日、遠景のテーブル状岩山、サボテン・岩柱。下約27%は小さなひびのある水平な砂道。 | 完了。`art-work/raw/bg_s2.png` → `img/bg/bg_s2.webp`。 |
| bg_s3 | ステージ3「こおり の やま」。青緑のたそがれ、オーロラと星、雪山、針葉樹、氷の結晶。下約27%は少し光沢のある水平な雪道。 | 完了。`art-work/raw/bg_s3.png` → `img/bg/bg_s3.webp`。 |
| bg_s4 | ステージ4「ほのお の かざん」。赤黒〜オレンジの空、遠景の噴火、溶岩の川と光る岩。下約27%は溶岩の細いすきまが光る水平な黒石道。 | 完了。`art-work/raw/bg_s4.png` → `img/bg/bg_s4.webp`。 |
| bg_s5 | ステージ5「めいおう の しろ」。紫の月と夜空、尖塔の城、光る窓、紫の炎とクリスタル。下約27%は水平な石だたみ。 | 完了。`art-work/raw/bg_s5.png` → `img/bg/bg_s5.webp`。 |
| bg_menu | メニュー「しゅぎょう の ひろば」。青空の昼、木の道場、わら人形の的、練習柱、無地の旗、大木。手前は水平な土の地面。 | 完了。`art-work/raw/bg_menu.png` → `img/bg/bg_menu.webp`。 |
| bg_title | タイトル用の一枚絵。朝日、山上の遠い城のシルエット、桜と草原、花びら、中央奥へ遠近法で続く一本道。上部に広い空。 | 完了。`art-work/raw/bg_title.png` → `img/bg/bg_title.webp`。 |

生成方法: 組み込み画像生成を各IDに1回ずつ使用。`art-work/sheets/pilot.png` の背景タイルを絵柄参照とし、太い濃紫の輪郭、明るいセル塗り、やわらかなハイライト、文字・人物なしを共通指定した。各ステージ・メニューでは足場の上端を高さ約73%に水平配置し、タイトルのみ遠近法の道とした。

確認: `python3 art-work/process.py bg <生成PNG> <ID>` で各WebPを作成（すべて1920×1081）。`python3 art-work/sheet.py D bg_s2 bg_s3 bg_s4 bg_s5 bg_menu bg_title` で `art-work/sheets/D.png` を作成し、6枚の絵柄、構図、文字・人物の不在を目視比較した。
