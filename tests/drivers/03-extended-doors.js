(function () {
  const log = []; let ng = 0;
  const fail = (m) => { ng++; log.push("NG: " + m); };
  const $ = (id) => document.getElementById(id);
  const tiles = () => [...document.querySelectorAll("#extStage .mini")];
  const wait = (c) => new Promise((r) => { const i = setInterval(() => { if (c()) { clearInterval(i); r(); } }, 20); });
  const setN = (n) => { const el=$("extNInput"); el.value=n; el.dispatchEvent(new Event("change")); };
  const setMode = (m) => document.querySelector(`[data-mode="${m}"]`).click();

  async function round(n, mode, doSwitch) {
    const ts = tiles();
    if (ts.length !== n) return fail(`扉が ${ts.length} 枚（${n} 枚のはず）`);
    const pick = 0;
    ts[pick].click();
    // OK待ちを通過してから、司会者が開け終わるのを待つ
    await wait(() => $("extAdvanceArea").style.display === "flex" ||
                     $("extActions").style.display === "flex");
    if ($("extActions").style.display !== "flex") $("btnExtOk").click();
    await wait(() => $("extActions").style.display === "flex");

    const opened = tiles().filter(t => t.classList.contains("open"));
    const openedIdx = opened.map(t => tiles().indexOf(t));
    if (openedIdx.includes(pick)) fail(`${n}枚/${mode}: 司会者が選んだ扉を開けた`);
    if (opened.some(t => t.textContent.includes("🚗"))) fail(`${n}枚/${mode}: 司会者が新車の扉を開けた`);
    if (opened.some(t => !t.textContent.includes("🐐"))) fail(`${n}枚/${mode}: 開いた扉がヤギでない`);
    const expected = mode === "all" ? n - 2 : 1;
    if (opened.length !== expected) fail(`${n}枚/${mode}: 開いた枚数 ${opened.length}（${expected} のはず）`);

    const closed = tiles().map((t,i)=>i).filter(i => i !== pick && !openedIdx.includes(i));
    if (mode === "all" && closed.length !== 1) fail(`${n}枚/all: 閉じた他の扉が ${closed.length} 枚`);
    if (mode === "one" && closed.length !== n - 2) fail(`${n}枚/one: 閉じた他の扉が ${closed.length} 枚`);

    if (doSwitch) tiles()[closed[0]].click(); else $("btnExtStay").click();
    await wait(() => $("extRetryArea").style.display === "flex");
    if (tiles().some(t => !t.classList.contains("open"))) fail(`${n}枚/${mode}: 結果表示で閉じた扉が残る`);
    const cars = tiles().filter(t => t.textContent.includes("🚗")).length;
    if (cars !== 1) fail(`${n}枚/${mode}: 新車が ${cars} 枚`);
    const banner = $("extBanner").textContent;
    const finalIdx = doSwitch ? closed[0] : pick;
    const won = tiles()[finalIdx].textContent.includes("🚗");
    if (won !== banner.includes("あたり")) fail(`${n}枚/${mode}: 結果表示が実際と食い違う（${banner}）`);
    $("btnExtRetry").click();
    await wait(() => tiles().every(t => !t.classList.contains("open")));
  }

  async function run() {
    for (const [n, mode] of [[3,"all"],[10,"all"],[100,"all"],[3,"one"],[10,"one"],[100,"one"]]) {
      setMode(mode); setN(n);
      await round(n, mode, true);
      await round(n, mode, false);
      log.push(`扉${n}枚・${mode}：手動プレイの検証OK`);
    }
    // シミュレーションが理論値と合うか
    for (const [n, mode, th] of [[3,"all",2/3],[10,"all",0.9],[100,"all",0.99],[10,"one",(0.9)/8],[100,"one",(0.99)/98]]) {
      setMode(mode); setN(n);
      for (let k=0;k<10;k++) document.querySelector('[data-ext-trials="1000"]').click();
      const w = parseInt($("extBarSwitchLabel").textContent.match(/（(\d+)勝/)[1], 10);
      const rate = w / 10000;
      const tol = Math.max(0.012, 4 * Math.sqrt(th*(1-th)/10000));
      const ok = Math.abs(rate - th) <= tol;
      if (!ok) fail(`扉${n}枚・${mode}: 変える勝率 実測${(rate*100).toFixed(2)}% 理論${(th*100).toFixed(2)}%`);
      log.push(`扉${n}枚・${mode}：変える 実測${(rate*100).toFixed(2)}% / 理論${(th*100).toFixed(2)}% ${ok?"一致":"不一致"}`);
    }
    log.push(ng === 0 ? "RESULT: ALL PASS" : `RESULT: ${ng} 件の不具合`);
    const p = document.createElement("pre"); p.id="testlog"; p.textContent = log.join("\n");
    document.body.appendChild(p);
  }
  run();
})();
