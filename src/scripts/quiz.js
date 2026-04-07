import { ALL_QUESTIONS } from '../data/questions.js';

// STATE
let questions = [...ALL_QUESTIONS];
let visibleCount = 15;
let answered = {};  // { qid: true|false }  – validated answers
let selected = {};  // { qid: chosenIndex } – pending selection, not yet validated
let currentFilter = 'all';

function getStats() {
  const total = Object.keys(answered).length;
  const correct = Object.values(answered).filter(v => v).length;
  const wrong = total - correct;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { total, correct, wrong, pct, remaining: questions.length - total };
}

function updateStats() {
  const s = getStats();
  document.getElementById('statTotal').textContent = s.total;
  document.getElementById('statCorrect').textContent = s.correct;
  document.getElementById('statWrong').textContent = s.wrong;
  document.getElementById('statRemaining').textContent = s.remaining;
  document.getElementById('headerScore').textContent = s.pct + '%';
  document.getElementById('progressBar').style.width = ((s.total / 100) * 100) + '%';
}

function getFiltered() {
  if (currentFilter === 'all') return questions;
  return questions.filter(q => q.theme === currentFilter);
}

function renderQuestions() {
  const container = document.getElementById('quizContainer');
  const toShow = getFiltered().slice(0, visibleCount);
  container.innerHTML = '';

  const themeLabels = {
    contrat: 'Contrat', parties: 'Parties', obligations: 'Obligations',
    sinistre: 'Sinistre', resiliation: 'Résiliation', intermediaires: 'Intermédiaires',
    prescription: 'Prescription', ldpsf: 'LDPSF / Déontologie'
  };

  toShow.forEach(q => {
    const card = document.createElement('div');
    card.className = 'question-card' + (answered[q.id] === true ? ' answered-correct' : answered[q.id] === false ? ' answered-wrong' : '');
    card.id = 'card-' + q.id;

    card.innerHTML = `
      <div class="q-meta">
        <span class="q-number">Q${q.id}</span>
        <span class="q-theme">${themeLabels[q.theme] || q.theme}</span>
        <span class="q-diff">${q.diff}</span>
      </div>
      <div class="q-text">${q.q}</div>
      <div class="options" id="opts-${q.id}">
        ${q.opts.map((opt, i) => {
          const letters = ['A','B','C','D'];
          let cls = '';
          if (answered[q.id] !== undefined) {
            if (i === q.ans) cls = ' correct';
            else if (answered[q.id] === false && i !== q.ans) cls = ' wrong';
          } else if (selected[q.id] === i) {
            cls = ' selected';
          }
          const isDisabled = answered[q.id] !== undefined;
          return `<button class="option-btn${cls}" onclick="selectOption(${q.id}, ${i})" ${isDisabled ? 'disabled' : ''}>
            <span class="option-letter">${letters[i]}.</span>
            <span>${opt}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="validate-wrap">
        <button class="validate-btn" id="validate-${q.id}" onclick="validateAnswer(${q.id})" ${answered[q.id] !== undefined ? 'disabled style="display:none"' : selected[q.id] === undefined ? 'disabled' : ''}>
          Valider la réponse
        </button>
      </div>
      <div class="explanation ${answered[q.id] !== undefined ? 'visible' : ''}" id="expl-${q.id}">
        <strong>${answered[q.id] === true ? '✓ Bonne réponse!' : answered[q.id] === false ? '✗ Réponse incorrecte.' : ''}</strong> ${q.expl}
      </div>
      <div class="card-footer">
        <button class="explain-toggle" onclick="toggleExpl(${q.id})">
          ${answered[q.id] !== undefined ? "Masquer l'explication" : "Voir l'explication"}
        </button>
        <span class="status-icon ${answered[q.id] !== undefined ? 'visible' : ''}">
          ${answered[q.id] === true ? '✅' : answered[q.id] === false ? '❌' : ''}
        </span>
      </div>
    `;
    container.appendChild(card);
  });

  const total = getFiltered().length;
  const loadWrap = document.getElementById('loadMoreWrap');
  if (visibleCount < total) {
    loadWrap.style.display = 'block';
    document.getElementById('loadMoreBtn').textContent = `Charger plus (${Math.min(15, total - visibleCount)} suivantes) ▼`;
  } else {
    loadWrap.style.display = total > 0 ? 'block' : 'none';
    const btn = document.getElementById('loadMoreBtn');
    if (btn) btn.style.display = 'none';
  }

  if (Object.keys(answered).length === 100) showFinalScreen();
}

// Step 1: select an option (no reveal yet)
window.selectOption = function(qid, chosen) {
  if (answered[qid] !== undefined) return;
  selected[qid] = chosen;
  // Update option buttons without full re-render
  const optsContainer = document.getElementById('opts-' + qid);
  if (optsContainer) {
    optsContainer.querySelectorAll('.option-btn').forEach((btn, i) => {
      btn.classList.toggle('selected', i === chosen);
    });
  }
  // Enable the validate button
  const validateBtn = document.getElementById('validate-' + qid);
  if (validateBtn) validateBtn.disabled = false;
};

// Step 2: validate and reveal the answer
window.validateAnswer = function(qid) {
  const q = questions.find(x => x.id === qid);
  if (!q || answered[qid] !== undefined) return;
  const chosen = selected[qid];
  if (chosen === undefined) return;
  answered[qid] = chosen === q.ans;
  delete selected[qid];
  updateStats();
  renderQuestions();
  const card = document.getElementById('card-' + qid);
  if (card) {
    setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  }
};

window.toggleExpl = function(qid) {
  const expl = document.getElementById('expl-' + qid);
  if (expl) expl.classList.toggle('visible');
};

function showFinalScreen() {
  const s = getStats();
  const screen = document.getElementById('finalScreen');
  screen.classList.add('visible');
  document.getElementById('finalScoreBig').textContent = s.pct + '%';
  let medal = '🏆', msg = '';
  if (s.pct === 100) { medal = '🌟'; msg = "Score parfait! Vous êtes prêt(e) pour l'examen AMF F-135."; }
  else if (s.pct >= 90) { medal = '🥇'; msg = 'Excellent! Quelques points à peaufiner mais vous êtes très bien préparé(e).'; }
  else if (s.pct >= 75) { medal = '🥈'; msg = 'Bon résultat! Révisez les questions manquées et vous serez prêt(e).'; }
  else if (s.pct >= 60) { medal = '🥉'; msg = 'Résultat passable. Des révisions supplémentaires sont recommandées.'; }
  else { medal = '📚'; msg = 'Des révisions approfondies sont nécessaires. Consultez les explications pour chaque erreur.'; }
  document.getElementById('finalMedal').textContent = medal;
  document.getElementById('finalMsg').textContent = msg;
}

window.resetAll = function() {
  answered = {};
  selected = {};
  visibleCount = 15;
  document.getElementById('finalScreen').classList.remove('visible');
  updateStats();
  renderQuestions();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// FILTER
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.theme;
    visibleCount = 15;
    renderQuestions();
    window.scrollTo({ top: 120, behavior: 'smooth' });
  });
});

document.getElementById('loadMoreBtn').addEventListener('click', function() {
  visibleCount += 15;
  renderQuestions();
});

document.getElementById('resetBtn').addEventListener('click', window.resetAll);

// INIT
updateStats();
renderQuestions();
