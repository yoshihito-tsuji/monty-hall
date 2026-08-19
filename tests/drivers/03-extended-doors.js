(function () {
  const log = []; let ng = 0;
  const fail = (m) => { ng++; log.push("NG: " + m); };
  const $ = (id) => document.getElementById(id);
  const tiles = () => [...document.querySelectorAll("#extStage .mini")];
  const focusUnits = () => [...document.querySelectorAll("#extFocus .door-unit")];
  const wait = (c) => new Promise((r) => { const i = setInterval(() => { if (c()) { clearInterval(i); r(); } }, 20); });
  const setMode = (m) => document.querySelector(`[data-mode="${m}"]`).click();
  const N = 100;   // 扉は100枚固定

  // 扉をえらんで、司会者が開け終わる（決断できる状態になる）まで進める
  async function toDecide(pick) {
    tiles()[pick].click();
    await wait(() => $("extAdvanceArea").style.display === "flex" ||
                     $("extActions").style.display === "flex");
    if ($("extActions").style.display !== "flex") $("btnExtOk").click();
    await wait(() => $("extActions").style.display === "flex");
  }

  // how: "focus"（取り出した扉をクリックして変える）/ "grid"（グリッドの扉で変える）/ "stay"（変えない）
  async function round(mode, how) {
    const ts = tiles();
    if (ts.length !== N) return fail(`扉が ${ts.length} 枚（${N} 枚のはず）`);
    const pick = 0;
    await toDecide(pick);

    const opened = tiles().filter((t) => t.classList.contains("open"));
    const openedIdx = opened.map((t) => tiles().indexOf(t));
    if (openedIdx.includes(pick)) fail(`${mode}: 司会者が選んだ扉を開けた`);
    if (opened.some((t) => t.textContent.includes("🚗"))) fail(`${mode}: 司会者が新車の扉を開けた`);
    if (opened.some((t) => !t.textContent.includes("🐐"))) fail(`${mode}: 開いた扉がヤギでない`);
    const expected = mode === "all" ? N - 2 : 1;
    if (opened.length !== expected) fail(`${mode}: 開いた枚数 ${opened.length}（${expected} のはず）`);

    const closed = tiles().map((t, i) => i).filter((i) => i !== pick && !openedIdx.includes(i));
    const closedExpected = mode === "all" ? 1 : N - 2;
    if (closed.length !== closedExpected) fail(`${mode}: 閉じた他の扉が ${closed.length} 枚（${closedExpected} のはず）`);

    if (mode === "all") {
      // 閉じた2枚がグリッドの外に取り出されていること
      const fu = focusUnits();
      if (fu.length !== 2) return fail(`all: 取り出した扉が ${fu.length} 枚（2枚のはず）`);
      if ($("extFocus").style.display === "none") fail("all: 取り出した扉が表示されていない");
      const idx = fu.map((u) => parseInt(u.dataset.index, 10));
      if (idx[0] !== pick || idx[1] !== closed[0]) fail(`all: 取り出した扉が ${idx}（[${pick},${closed[0]}] のはず）`);
      if (!fu[0].querySelector(".tag").textContent.trim()) fail("all: あなたの扉のキャプションが空");

      // 番号バッジが司会者のセリフの扉番号と一致すること（100枚での最大の欠陥の回帰点）
      const speech = $("extMessage").textContent;
      fu.forEach((u, k) => {
        const badge = u.querySelector(".door-label").textContent.trim();
        if (!badge) fail(`all: 取り出した扉${k}の番号バッジが空`);
        else if (!speech.includes(badge)) fail(`all: バッジ「${badge}」がセリフにない（${speech.slice(0, 60)}）`);
      });
      // 開いた98枚は背景へ下げる（決断の場面が1画面に収まるように）
      if (!$("extStage").classList.contains("compact")) fail("all: decide でグリッドが縮んでいない");
    } else {
      if (focusUnits().length !== 0) fail("one: 取り出しは all のときだけのはず");
      if ($("extStage").classList.contains("compact")) fail("one: one モードでグリッドを縮めている");
    }

    // 決断する
    const finalIdx = how === "stay" ? pick : closed[0];
    if (how === "focus") {
      focusUnits().find((u) => parseInt(u.dataset.index, 10) === closed[0]).querySelector(".door").click();
    } else if (how === "grid") {
      tiles()[closed[0]].click();
    } else {
      $("btnExtStay").click();
    }
    await wait(() => $("extRetryArea").style.display === "flex");

    if (tiles().some((t) => !t.classList.contains("open"))) fail(`${mode}/${how}: 結果表示で閉じた扉が残る`);
    const cars = tiles().filter((t) => t.textContent.includes("🚗")).length;
    if (cars !== 1) fail(`${mode}/${how}: 新車が ${cars} 枚`);
    if (mode === "all" && focusUnits().some((u) => !u.classList.contains("open"))) {
      fail(`${mode}/${how}: 取り出した扉が開いていない`);
    }
    const banner = $("extBanner").textContent;
    const won = tiles()[finalIdx].textContent.includes("🚗");
    if (won !== banner.includes("あたり")) fail(`${mode}/${how}: 結果表示が実際と食い違う（${banner}）`);

    $("btnExtRetry").click();
    await wait(() => tiles().every((t) => !t.classList.contains("open")));
  }

  // 決断の途中で言語を切り替えても、取り出した扉が古いまま残らないこと
  async function langSwitchDuringDecide() {
    setMode("all");
    await toDecide(0);
    if (focusUnits().length !== 2) return fail("言語切替: 前提の取り出しができていない");
    [...document.querySelectorAll("#langMenu li")].forEach((li) => { if (li.lang === "en") li.click(); });
    if (focusUnits().length !== 0) fail("言語切替: 取り出した扉が残っている");
    if ($("extFocus").style.display !== "none") fail("言語切替: 取り出しの枠が表示されたまま");
    if ($("extStage").classList.contains("compact")) fail("言語切替: グリッドが縮んだまま");
    if (tiles().some((t) => t.classList.contains("open"))) fail("言語切替: 開いた扉が残っている");
    [...document.querySelectorAll("#langMenu li")].forEach((li) => { if (li.lang === "ja") li.click(); });
    log.push("言語切替：decide 中に切り替えても取り残しなし");
  }

  async function run() {
    for (const mode of ["all", "one"]) {
      setMode(mode);
      // all では取り出した扉から、one ではグリッドから「変える」
      await round(mode, mode === "all" ? "focus" : "grid");
      if (mode === "all") await round(mode, "grid");   // グリッド経由でも変えられること
      await round(mode, "stay");
      log.push(`扉100枚・${mode}：手動プレイの検証OK`);
    }

    await langSwitchDuringDecide();

    // シミュレーションが理論値と合うか
    for (const [mode, th] of [["all", 0.99], ["one", 0.99 / 98]]) {
      setMode(mode);
      for (let k = 0; k < 10; k++) document.querySelector('[data-ext-trials="1000"]').click();
      const w = parseInt($("extBarSwitchLabel").textContent.match(/（(\d+)勝/)[1], 10);
      const rate = w / 10000;
      // 真の値が小さい one は、割合の絶対差で見ないと甘くなりすぎる
      const tol = Math.max(th < 0.5 ? 0.005 : 0.012, 4 * Math.sqrt(th * (1 - th) / 10000));
      const ok = Math.abs(rate - th) <= tol;
      if (!ok) fail(`扉100枚・${mode}: 変える勝率 実測${(rate * 100).toFixed(2)}% 理論${(th * 100).toFixed(2)}%`);
      log.push(`扉100枚・${mode}：変える 実測${(rate * 100).toFixed(2)}% / 理論${(th * 100).toFixed(2)}% ${ok ? "一致" : "不一致"}`);
    }

    log.push(ng === 0 ? "RESULT: ALL PASS" : `RESULT: ${ng} 件の不具合`);
    const p = document.createElement("pre"); p.id = "testlog"; p.textContent = log.join("\n");
    document.body.appendChild(p);
  }
  run();
})();
