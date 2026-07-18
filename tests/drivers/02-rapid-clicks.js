// 連打・順不同の操作に対して壊れないかを確認する
(function () {
  const log = []; let ng = 0;
  const fail = (m) => { ng++; log.push("NG: " + m); };
  const $ = (id) => document.getElementById(id);
  const units = () => Array.from(document.querySelectorAll(".door-unit"));
  const doors = () => Array.from(document.querySelectorAll(".door"));
  const wait = (c) => new Promise((r) => { const i = setInterval(() => { if (c()) { clearInterval(i); r(); } }, 30); });

  async function run() {
    // 1) 同じ扉を連打 → 二重進行しないこと
    doors()[0].click(); doors()[0].click(); doors()[0].click();
    // 2) 司会者が開ける前に別の扉を押す → 選択が乗り換わらないこと
    doors()[1].click(); doors()[2].click();
    await wait(() => $("decisionArea").style.display === "flex");
    const chosen = units().filter((u) => u.classList.contains("chosen"));
    if (chosen.length !== 1) fail(`選択中の扉が ${chosen.length} 枚（連打で二重選択）`);
    if (units().indexOf(chosen[0]) !== 0) fail("あとから押した扉に選択が乗り換わった");
    if (units().filter((u) => u.classList.contains("open")).length !== 1)
      fail("連打で司会者が2枚以上開けた");

    // 3) 決定ボタンを連打 → 記録が二重計上されないこと
    $("btnSwitch").click(); $("btnSwitch").click(); $("btnStay").click();
    await wait(() => $("retryArea").style.display === "flex");
    const tot = parseInt($("mSwitchTotal").textContent, 10) + parseInt($("mStayTotal").textContent, 10);
    if (tot !== 1) fail(`1回のゲームで記録が ${tot} 件計上された`);

    // 4) 結果表示中に扉を押す → 何も起きないこと
    doors()[1].click();
    if (parseInt($("mSwitchTotal").textContent, 10) + parseInt($("mStayTotal").textContent, 10) !== 1)
      fail("結果表示中の扉クリックで記録が増えた");

    // 5) もう一度あそぶ を連打 → 状態が初期化されること
    $("btnRetry").click(); $("btnRetry").click();
    if (units().some((u) => u.classList.contains("open"))) fail("再開後も扉が開いたまま");
    if (units().some((u) => u.classList.contains("chosen"))) fail("再開後も選択が残っている");
    if ($("resultBanner").textContent !== "") fail("再開後も結果表示が残っている");
    if (doors().length !== 3) fail("再開後の扉が3枚でない");

    // 6) キーボード操作（Enter）で扉を選べること
    doors()[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await wait(() => $("decisionArea").style.display === "flex");
    if (units().indexOf(units().filter((u) => u.classList.contains("chosen"))[0]) !== 2)
      fail("Enterキーで扉を選べない");

    log.push(ng === 0 ? "RESULT: ALL PASS" : `RESULT: ${ng} 件の不具合`);
    const p = document.createElement("pre"); p.id = "testlog"; p.textContent = log.join("\n");
    document.body.appendChild(p);
  }
  run();
})();
