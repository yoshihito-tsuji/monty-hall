// index.html の DOM を実際に操作して、モンティホールのルールが守られているか検証する。
(function () {
  const ROUNDS = 40;
  const log = [];
  let ng = 0;
  const fail = (msg) => { ng++; log.push("NG: " + msg); };

  const $ = (id) => document.getElementById(id);
  const units = () => Array.from(document.querySelectorAll(".door-unit"));
  const prizeOf = (u) => u.querySelector(".prize-name").textContent;   // 新車 / ヤギ
  const isOpen = (u) => u.classList.contains("open");

  // 記録の集計を独立に持ち、画面の表と突き合わせる
  const tally = { switch: { t: 0, w: 0 }, stay: { t: 0, w: 0 } };

  const wait = (cond) => new Promise((res) => {
    const id = setInterval(() => { if (cond()) { clearInterval(id); res(); } }, 30);
  });

  // 司会者のセリフのOK待ちを通過する（AUTOモードでも動くよう両対応）
  async function passGate() {
    await wait(() => $("advanceArea").style.display === "flex" ||
                     $("decisionArea").style.display === "flex");
    if ($("decisionArea").style.display !== "flex") $("btnOk").click();
    await wait(() => $("decisionArea").style.display === "flex");
  }

  async function playRound(i) {
    const doSwitch = i % 2 === 0;
    const us = units();

    // 車がある扉を控えておく（DOM から読める）
    const carIdx = us.findIndex((u) => prizeOf(u) === "新車");
    if (carIdx < 0) return fail(`round${i}: 新車の扉が存在しない`);
    if (us.filter((u) => prizeOf(u) === "新車").length !== 1)
      fail(`round${i}: 新車が複数ある`);

    // 1) 扉を選ぶ
    const pick = i % 3;
    us[pick].querySelector(".door").click();

    // 2) OKで進め、司会者がハズレを開けるのを待つ
    await passGate();
    const opened = units().filter(isOpen);
    if (opened.length !== 1) fail(`round${i}: 開いた扉が ${opened.length} 枚（1枚のはず）`);
    const openedIdx = units().indexOf(opened[0]);
    if (openedIdx === pick) fail(`round${i}: 司会者が選んだ扉を開けた`);
    if (openedIdx === carIdx) fail(`round${i}: 司会者が新車の扉を開けた`);
    if (prizeOf(opened[0]) !== "ヤギ") fail(`round${i}: 開いた扉がヤギでない`);

    // 3) 変える／変えないを決める
    const finalIdx = doSwitch ? [0, 1, 2].find((d) => d !== pick && d !== openedIdx) : pick;
    (doSwitch ? $("btnSwitch") : $("btnStay")).click();

    // 4) 結果の検証
    await wait(() => $("retryArea").style.display === "flex");
    if (units().filter(isOpen).length !== 3) fail(`round${i}: 結果表示で3枚とも開いていない`);
    const won = finalIdx === carIdx;
    const banner = $("resultBanner").textContent;
    if (won && !banner.includes("あたり")) fail(`round${i}: あたりなのに表示が「${banner}」`);
    if (!won && !banner.includes("ざんねん")) fail(`round${i}: はずれなのに表示が「${banner}」`);
    if (!won && !banner.includes(`扉${carIdx + 1} でした`))
      fail(`round${i}: はずれ表示の新車の位置が違う（${banner}）`);

    const k = doSwitch ? "switch" : "stay";
    tally[k].t++; if (won) tally[k].w++;

    $("btnRetry").click();
    await wait(() => $("decisionArea").style.display === "none" &&
                     units().every((u) => !isOpen(u)));
  }

  async function run() {
    for (let i = 0; i < ROUNDS; i++) await playRound(i);

    // 画面の記録表と、独立に数えた集計の一致を確認
    const cell = (id) => parseInt($(id).textContent, 10);
    if (cell("mSwitchTotal") !== tally.switch.t) fail("記録表：変えた回数が不一致");
    if (cell("mSwitchWin") !== tally.switch.w) fail("記録表：変えて勝った回数が不一致");
    if (cell("mStayTotal") !== tally.stay.t) fail("記録表：変えない回数が不一致");
    if (cell("mStayWin") !== tally.stay.w) fail("記録表：変えないで勝った回数が不一致");

    log.push(`手動 ${ROUNDS} 回：変えた ${tally.switch.w}/${tally.switch.t}、変えない ${tally.stay.w}/${tally.stay.t}`);

    // 一括シミュレーション（1000回×3 = 3000回）
    for (let n = 0; n < 3; n++) document.querySelector('[data-trials="1000"]').click();
    const st = cell("sSwitchTotal"), sw = cell("sSwitchWin");
    const yt = cell("sStayTotal"), yw = cell("sStayWin");
    if (st !== 3000 || yt !== 3000) fail(`シミュレーション回数が 3000 でない（${st}, ${yt}）`);
    if (sw + yw !== 3000) fail(`各試行で必ずどちらか一方が勝つはずが、合計 ${sw + yw}`);
    const rate = sw / st;
    if (rate < 0.62 || rate > 0.71) fail(`変える作戦の勝率が理論値2/3から外れる（${(rate * 100).toFixed(1)}%）`);
    log.push(`一括 3000 回：変える ${(100 * sw / st).toFixed(1)}%、変えない ${(100 * yw / yt).toFixed(1)}%`);

    // 棒グラフの幅が勝率と一致するか
    const barW = parseFloat($("barSwitch").style.width);
    if (Math.abs(barW - 100 * rate) > 0.15) fail(`棒グラフの幅 ${barW}% が勝率とずれる`);

    // 記録を消すボタン
    $("btnSimReset").click();
    if (cell("sSwitchTotal") !== 0) fail("「記録を消す」でシミュレーション記録が消えない");

    log.push(ng === 0 ? "RESULT: ALL PASS" : `RESULT: ${ng} 件の不具合`);
    const out = document.createElement("pre");
    out.id = "testlog";
    out.textContent = log.join("\n");
    document.body.appendChild(out);
  }
  run();
})();
