# モンティホール問題 体験シミュレーター / Monty Hall Problem Simulator

**▶ 実際に遊ぶ / Try it now： https://yoshihito-tsuji.github.io/monty-hall/**

12言語対応のブラウザ教材です。インストール不要、単一のHTMLファイルで動きます。
A browser-based teaching tool available in 12 languages. No installation — it is a single, self-contained HTML file.

[日本語の説明](#日本語) ｜ [English documentation](#english)

---

## 日本語

### モンティホール問題とは

3つの扉のうち1つに新車、残り2つにヤギがいます。あなたが1つ選ぶと、答えを知っている司会者が、残りの扉からヤギのいる扉を1つ開けてみせます。ここで「扉を変えますか？」と問われます。

直感は「残り2つなら五分五分」と告げますが、正しくは**変えたほうが2倍あたりやすい**（変える 2/3、変えない 1/3）のです。この直感とのズレを、説明で納得させるのではなく、自分の手で確かめられるようにしたのがこの教材です。

### できること

- **手で遊ぶ** — 扉を選び、司会者がハズレを開け、変えるか決める、という一連を体験できます。画面上部の4ステップ表示と司会者の吹き出しが、いま何をする場面かを案内します。
- **記録を見る** — 「変えた場合」と「変えなかった場合」のあたった割合が、遊ぶたびに表に積み上がります。
- **コンピュータに任せる** — 10回・100回・1000回の一括試行を実行し、2つの作戦のあたる割合が 66.7% と 33.3% に近づく様子を棒グラフで確認できます。
- **理由を知る** — 3つの場合分けの図で、なぜ変えたほうがよいのかを説明します。
- **扉の数を増やす** — 扉を3・5・10・100枚（自分で3〜200枚の指定も可）に変えられます。100枚のうち司会者が98枚を開けてみせる様子は、言葉の説明より雄弁です。

### 司会者の開け方は2通り選べます

| 開け方 | 変える | 変えない |
|---|---|---|
| 閉じた扉が残り1枚になるまで開ける | (N−1)/N — 扉100枚なら 99% | 1/N — 扉100枚なら 1% |
| ヤギの扉を1枚だけ開ける | (N−1)/(N(N−2)) — 扉100枚なら 1.01% | 1/N — 扉100枚なら 1.00% |

扉が3枚のときは、どちらの開け方も同じ（変える 66.7%、変えない 33.3%）になります。扉を増やすと差が現れます。前者は「変えれば99%あたる」という劇的な設定、後者は「変えたほうが有利ではあるが、扉が増えるほど差は縮む」という設定です。授業では前者で直感を作り、後者で「何が効いていたのか」を問い直す使い方ができます。

### 対応言語

画面右上の「言語」ボタンから切り替えます。

日本語 ／ English ／ 简体中文 ／ 繁體中文 ／ 한국어 ／ Русский ／ Español ／ ไทย ／ हिन्दी ／ Français ／ العربية ／ Svenska

- 選んだ言語はブラウザに記憶され、次に開いたときも同じ言語で表示されます。
- URLに `?lang=en` のように付けると、その言語で直接開けます（例： `https://yoshihito-tsuji.github.io/monty-hall/?lang=fr`）。授業で特定の言語のリンクを配りたいときに使えます。
- 初回は、URLの指定 → 前回選んだ言語 → ブラウザの言語設定 → 日本語、の順に決まります。
- アラビア語では画面全体が右から左に読む配置に切り替わります。

### 手元で動かす

`index.html` をブラウザで開くだけです。通信も外部ライブラリも使いません。配布するなら、このファイル1つを渡せば足ります。

### 翻訳を直すには

翻訳の正本は `i18n/<言語コード>.json` です。編集したあと、次のコマンドで `index.html` に反映します。

```bash
python3 tools/build_i18n.py
```

日本語版とキー・プレースホルダ（`{n}` など）・HTMLタグが食い違っていると、エラーを表示して書き込みを中止します。

### テストと自動公開

`main` への push とプルリクエストのたびに、GitHub Actions が次を実行します。検証を通ったものだけが公開されます。

```bash
python3 tests/check_i18n.py   # 翻訳の整合と、index.html への反映漏れの検査
./tests/run.sh                # ヘッドレスブラウザで実際に操作する5つのテスト
```

ブラウザテストは、司会者が新車の扉やあなたが選んだ扉を開けないこと、結果表示が実際の中身と一致すること、記録表の数が合うこと、連打で壊れないこと、12言語すべてが表示され遊べることを確認します。手元でも同じコマンドで実行できます（Chrome か Chromium が必要）。

**翻訳の来歴について：** 日本語以外の11言語は生成AI（Claude）が訳し、言語ごとに別のAIが原文と突き合わせて検討・修正したものです。人間の母語話者による確認は経ていません。論理の誤りや文法の破綻は検討の過程で修正しましたが、語感の細部には改善の余地が残っている可能性があります。

### 制作

公立はこだて未来大学　辻研究室（[tsuji-lab.net](https://tsuji-lab.net)）

---

## English

### What is the Monty Hall problem?

Behind one of three doors is a new car; behind the other two are goats. You pick a door. The host, who knows where the car is, opens one of the remaining doors to reveal a goat. Then you are asked: **do you want to switch to the other closed door?**

Intuition says it makes no difference — two doors are left, so surely it is fifty-fifty. Intuition is wrong. Switching wins **two times out of three**; staying wins only one time out of three. This simulator exists so that learners can verify that for themselves by playing, rather than being told to accept it.

Why switching works: your first pick is right 1/3 of the time. The other 2/3 of the time the car is behind one of the two doors you did not pick — and the host, who must reveal a goat, effectively hands you that car by eliminating the other one. So the door you switch to inherits the whole 2/3.

### What the page does

The page is a single scrolling lesson made of five parts.

1. **Play by hand.** Pick a door, watch the host open a losing door, then decide whether to switch. A four-step indicator at the top and the host's speech bubble tell you what is happening at every moment, so the interaction never leaves you guessing what to do next.
2. **Your record.** Every round is tallied into a table, separated by whether you switched or stayed, with the win rate for each. Playing a handful of rounds by hand shows the effect, but noisily — which motivates the next part.
3. **Let the computer play.** Run 10, 100, or 1000 rounds at a time. Results accumulate, and a bar chart shows both strategies converging on 66.7% and 33.3%, with dashed reference lines at those values.
4. **Why switching wins.** A three-case diagram walks through where the car can be, showing that switching wins in two of the three equally likely cases.
5. **Change the number of doors.** This is the part that usually settles the argument. Set the game to 100 doors, pick one, and watch the host open 98 goat doors one after another, leaving your door and exactly one other. Almost nobody wants to stay after seeing that.

### Two host behaviours

The extension section lets you choose how the host behaves, because generalising the puzzle to N doors is ambiguous, and the two readings teach different things.

| Host behaviour | Switching wins | Staying wins |
|---|---|---|
| Opens goat doors until only one other door is left | (N−1)/N — 99% with 100 doors | 1/N — 1% with 100 doors |
| Opens exactly one goat door | (N−1)/(N(N−2)) — 1.01% with 100 doors | 1/N — 1.00% with 100 doors |

With three doors the two behaviours coincide (66.7% versus 33.3%). They diverge as doors are added. The first is the dramatic version that makes the intuition click. In the second, switching is still better — by a factor of (N−1)/(N−2) — but the advantage shrinks as doors are added, which invites the follow-up question: *what was actually doing the work in the original puzzle?* The answer is the host's forced elimination, not the mere act of switching.

For every setting, the page states the exact calculated probability in words and draws it as a dashed line on the chart, so the simulated result can be compared against theory directly.

### Languages

Use the **Language** button at the top right. Available in Japanese, English, Simplified Chinese, Traditional Chinese, Korean, Russian, Spanish, Thai, Hindi, French, Arabic, and Swedish.

- Your choice is remembered in the browser for next time.
- Append `?lang=` to the URL to open the page directly in a given language — for example `https://yoshihito-tsuji.github.io/monty-hall/?lang=fr`. This is convenient for handing a class a link in one specific language.
- On first visit the language is decided in this order: URL parameter → previously chosen language → browser language setting → Japanese.
- Arabic switches the whole layout to right-to-left, including the order of the doors.

### Running it locally

Open `index.html` in any browser. There is no build step, no server, no network access, and no external library. To distribute it, hand over that one file.

### Repository layout

```
index.html              the whole application (self-contained; the built translations live inside it)
i18n/<lang>.json        source of truth for all user-facing text, one file per language
tools/build_i18n.py     writes i18n/*.json into index.html, validating them first
```

### Editing the translations

Edit `i18n/<lang>.json`, then run:

```bash
python3 tools/build_i18n.py
```

The script refuses to write if any language is missing a key, or if its placeholders (`{n}`, `{c}`, …) or HTML tags differ from the Japanese source — those mismatches would otherwise surface as broken sentences at runtime.

### Tests and automated deployment

Every push to `main` and every pull request runs the following through GitHub Actions. Only a revision that passes is published.

```bash
python3 tests/check_i18n.py   # translation consistency, and whether index.html is up to date
./tests/run.sh                # five suites driving the real page in headless Chrome
```

The browser tests confirm that the host never opens the car door or your own door, that the result message matches what is actually behind the chosen door, that the tallies add up, that rapid clicking cannot corrupt the state, and that all twelve languages render and play correctly. The same commands run locally (Chrome or Chromium required).

**Provenance of the translations:** the eleven non-Japanese languages were produced by a generative AI (Claude) and then reviewed against the Japanese source by a separate AI reviewer per language, which corrected mistranslations, grammatical agreement that broke for particular numbers, and inconsistent terminology. They have **not** been checked by human native speakers. Corrections are welcome via issues or pull requests.

### Credits

Built at the Tsuji Laboratory, Future University Hakodate ([tsuji-lab.net](https://tsuji-lab.net)).

---

## ライセンス / License

MIT License — Copyright (c) 2026 Yoshihito Tsuji

全文は [LICENSE](LICENSE) を参照してください。著作権表示を残せば、改変も再配布も自由に行えます。
See [LICENSE](LICENSE) for the full text. You are free to use, modify, and redistribute this work, provided the copyright notice is retained.
