(function(){
  const out=[]; let ng=0;
  const fail=(m)=>{ng++;out.push("NG: "+m);};
  const $=(id)=>document.getElementById(id);
  const wait=(c)=>new Promise(r=>{const i=setInterval(()=>{if(c()){clearInterval(i);r();}},20);});
  async function playOne(code){
    [...document.querySelectorAll("#langMenu li")].forEach(li=>{if(li.lang===code)li.click();});
    // 基本ゲームを1回（OK待ちを通過して進める）
    document.querySelectorAll(".door")[0].click();
    await wait(()=>$("advanceArea").style.display==="flex");
    if(!$("btnOk").textContent.trim()) fail(`${code}: OKボタンの表示が空`);
    $("btnOk").click();
    await wait(()=>$("decisionArea").style.display==="flex");
    if(!$("switchNote").textContent.trim()) fail(`${code}: ボタンの補足が空`);
    $("btnSwitch").click();
    await wait(()=>$("retryArea").style.display==="flex");
    if(!$("resultBanner").textContent.trim()) fail(`${code}: 結果表示が空`);
    if(!/[0-9]/.test($("mSwitchTotal").textContent)) fail(`${code}: 記録表に数値がない`);
    // 一括シミュレーション
    document.querySelector('[data-trials="1000"]').click();
    if(!/[0-9]/.test($("barSwitchLabel").textContent)) fail(`${code}: グラフの数値が空`);
    // 拡張版：100枚
    document.querySelector('[data-n="100"]').click();
    document.querySelectorAll("#extStage .mini")[0].click();
    await wait(()=>$("extAdvanceArea").style.display==="flex");
    $("btnExtOk").click();
    await wait(()=>$("extActions").style.display==="flex");
    document.querySelector('[data-ext-trials="1000"]').click();
    const th=$("extTheory").textContent;
    if(!/[0-9]/.test(th)) fail(`${code}: 理論値の説明に数値がない`);
    $("btnExtStay").click();
    await wait(()=>$("extRetryArea").style.display==="flex");
    if(!$("extBanner").textContent.trim()) fail(`${code}: 拡張版の結果表示が空`);
    out.push(`${code}: ${$("resultBanner").textContent.slice(0,34)} ｜ ${$("barSwitchLabel").textContent.slice(0,28)}`);
  }
  (async()=>{
    for(const c of ["ja","en","zh-Hans","zh-Hant","ko","ru","es","th","hi","fr","ar","sv"]) await playOne(c);
    out.push(ng===0?"RESULT: ALL PASS":`RESULT: ${ng} 件の不具合`);
    const p=document.createElement("pre");p.id="testlog";p.textContent=out.join("\n");document.body.appendChild(p);
  })();
})();
