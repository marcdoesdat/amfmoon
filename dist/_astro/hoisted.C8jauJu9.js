import{A as B}from"./questions.DWJXirOR.js";let p=[...B],a=15,n={},d={},f="all";function b(){const e=Object.keys(n).length,i=Object.values(n).filter(l=>l).length,o=e-i,s=e>0?Math.round(i/e*100):0;return{total:e,correct:i,wrong:o,pct:s,remaining:p.length-e}}function g(){const e=b();document.getElementById("statTotal").textContent=e.total,document.getElementById("statCorrect").textContent=e.correct,document.getElementById("statWrong").textContent=e.wrong,document.getElementById("statRemaining").textContent=e.remaining,document.getElementById("headerScore").textContent=e.pct+"%",document.getElementById("progressBar").style.width=e.total/100*100+"%"}function v(){return f==="all"?p:p.filter(e=>e.theme===f)}function r(){const e=document.getElementById("quizContainer"),i=v().slice(0,a);e.innerHTML="";const o={contrat:"Contrat",parties:"Parties",obligations:"Obligations",sinistre:"Sinistre",resiliation:"Résiliation",intermediaires:"Intermédiaires",prescription:"Prescription",ldpsf:"LDPSF / Déontologie"};i.forEach(t=>{const u=document.createElement("div");u.className="question-card"+(n[t.id]===!0?" answered-correct":n[t.id]===!1?" answered-wrong":""),u.id="card-"+t.id,u.innerHTML=`
      <div class="q-meta">
        <span class="q-number">Q${t.id}</span>
        <span class="q-theme">${o[t.theme]||t.theme}</span>
        <span class="q-diff">${t.diff}</span>
      </div>
      <div class="q-text">${t.q}</div>
      <div class="options" id="opts-${t.id}">
        ${t.opts.map((y,c)=>{const E=["A","B","C","D"];let m="";n[t.id]!==void 0?c===t.ans?m=" correct":n[t.id]===!1&&c!==t.ans&&(m=" wrong"):d[t.id]===c&&(m=" selected");const h=n[t.id]!==void 0;return`<button class="option-btn${m}" onclick="selectOption(${t.id}, ${c})" ${h?"disabled":""}>
            <span class="option-letter">${E[c]}.</span>
            <span>${y}</span>
          </button>`}).join("")}
      </div>
      <div class="validate-wrap">
        <button class="validate-btn" id="validate-${t.id}" onclick="validateAnswer(${t.id})" ${n[t.id]!==void 0?'disabled style="display:none"':d[t.id]===void 0?"disabled":""}>
          Valider la réponse
        </button>
      </div>
      <div class="explanation ${n[t.id]!==void 0?"visible":""}" id="expl-${t.id}">
        <strong>${n[t.id]===!0?"✓ Bonne réponse!":n[t.id]===!1?"✗ Réponse incorrecte.":""}</strong> ${t.expl}
      </div>
      <div class="card-footer">
        <button class="explain-toggle" onclick="toggleExpl(${t.id})">
          ${n[t.id]!==void 0?"Masquer l'explication":"Voir l'explication"}
        </button>
        <span class="status-icon ${n[t.id]!==void 0?"visible":""}">
          ${n[t.id]===!0?"✅":n[t.id]===!1?"❌":""}
        </span>
      </div>
    `,e.appendChild(u)});const s=v().length,l=document.getElementById("loadMoreWrap");if(a<s)l.style.display="block",document.getElementById("loadMoreBtn").textContent=`Charger plus (${Math.min(15,s-a)} suivantes) ▼`;else{l.style.display=s>0?"block":"none";const t=document.getElementById("loadMoreBtn");t&&(t.style.display="none")}Object.keys(n).length===100&&w()}window.selectOption=function(e,i){if(n[e]!==void 0)return;d[e]=i;const o=document.getElementById("opts-"+e);o&&o.querySelectorAll(".option-btn").forEach((l,t)=>{l.classList.toggle("selected",t===i)});const s=document.getElementById("validate-"+e);s&&(s.disabled=!1)};window.validateAnswer=function(e){const i=p.find(l=>l.id===e);if(!i||n[e]!==void 0)return;const o=d[e];if(o===void 0)return;n[e]=o===i.ans,delete d[e],g(),r();const s=document.getElementById("card-"+e);s&&setTimeout(()=>s.scrollIntoView({behavior:"smooth",block:"nearest"}),100)};window.toggleExpl=function(e){const i=document.getElementById("expl-"+e);i&&i.classList.toggle("visible")};function w(){const e=b();document.getElementById("finalScreen").classList.add("visible"),document.getElementById("finalScoreBig").textContent=e.pct+"%";let o="🏆",s="";e.pct===100?(o="🌟",s="Score parfait! Vous êtes prêt(e) pour l'examen AMF F-135."):e.pct>=90?(o="🥇",s="Excellent! Quelques points à peaufiner mais vous êtes très bien préparé(e)."):e.pct>=75?(o="🥈",s="Bon résultat! Révisez les questions manquées et vous serez prêt(e)."):e.pct>=60?(o="🥉",s="Résultat passable. Des révisions supplémentaires sont recommandées."):(o="📚",s="Des révisions approfondies sont nécessaires. Consultez les explications pour chaque erreur."),document.getElementById("finalMedal").textContent=o,document.getElementById("finalMsg").textContent=s}window.resetAll=function(){n={},d={},a=15,document.getElementById("finalScreen").classList.remove("visible"),g(),r(),window.scrollTo({top:0,behavior:"smooth"})};document.querySelectorAll(".filter-btn").forEach(e=>{e.addEventListener("click",function(){document.querySelectorAll(".filter-btn").forEach(i=>i.classList.remove("active")),this.classList.add("active"),f=this.dataset.theme,a=15,r(),window.scrollTo({top:120,behavior:"smooth"})})});document.getElementById("loadMoreBtn").addEventListener("click",function(){a+=15,r()});document.getElementById("resetBtn").addEventListener("click",window.resetAll);g();r();
