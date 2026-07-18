(function(){
  const out=[]; let ng=0;
  const fail=(m)=>{ng++;out.push("NG: "+m);};
  const $=(id)=>document.getElementById(id);
  const items=[...document.querySelectorAll("#langMenu li")];
  out.push("メニュー項目数: "+items.length+" → "+items.map(li=>li.textContent).join(" / "));
  items.forEach(li=>{
    const c=li.lang;
    li.click();
    if(document.documentElement.lang!==c) fail(`${c}: html lang が ${document.documentElement.lang}`);
    const dir=document.documentElement.dir;
    if(c==="ar" && dir!=="rtl") fail("ar: dir=rtl になっていない");
    if(c!=="ar" && dir!=="ltr") fail(`${c}: dir=${dir}`);
    const empties=[...document.querySelectorAll("[data-i18n],[data-i18n-html]")].filter(e=>!e.textContent.trim());
    if(empties.length) fail(`${c}: 空表示 ${empties.length}件（${empties[0].getAttribute("data-i18n")||empties[0].getAttribute("data-i18n-html")}）`);
    ["message","extMessage","extChartTitle","extTheory","simStatus","extSimStatus","footerLab","langBtnLabel"].forEach(id=>{
      if(!$(id).textContent.trim()) fail(`${c}: #${id} が空`);
    });
    const body=document.querySelector("main").textContent;
    const left=body.match(/\{[a-z]+\}/g);
    if(left) fail(`${c}: 未置換 ${[...new Set(left)].join(",")}`);
    if(c!=="ja"&&c!=="zh-Hans"&&c!=="zh-Hant"){
      const kana=(body.match(/[ぁ-んァ-ヶ]/g)||[]);
      if(kana.length>2) fail(`${c}: 仮名残存 ${kana.length}文字（${kana.slice(0,8).join("")}）`);
    }
    if($("footerLab").textContent.indexOf("tsuji-lab.net")<0) fail(`${c}: 研究室表記にURLがない`);
    // 扉のラベルと賞品名が言語ごとに入っているか
    const label=document.querySelector(".door-label").textContent.trim();
    const prize=document.querySelector(".prize-name").textContent.trim();
    if(!label||!prize) fail(`${c}: 扉ラベルまたは賞品名が空`);
    out.push(`${c}: ${label} / ${prize} / ${$("langBtnLabel").textContent} / ${document.title.slice(0,30)}`);
  });
  out.push(ng===0?"RESULT: ALL PASS":`RESULT: ${ng} 件の不具合`);
  const p=document.createElement("pre");p.id="testlog";p.textContent=out.join("\n");document.body.appendChild(p);
})();
