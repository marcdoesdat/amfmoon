import { F135_EXAM_DURATION_MINUTES, F135_EXAM_QUESTIONS } from '../data/f135ExamQuestions.js';

const questions = [...F135_EXAM_QUESTIONS];
const totalQuestions = questions.length;
const durationSeconds = F135_EXAM_DURATION_MINUTES * 60;

const themeLabels = {
  contrat: 'Contrat',
  parties: 'Parties',
  obligations: 'Obligations',
  sinistre: 'Sinistre',
  resiliation: 'Resiliation',
  intermediaires: 'Intermediaires',
  prescription: 'Prescription',
  ldpsf: 'LDPSF / Deontologie',
};

const formatLabels = {
  court: 'Question courte',
  situation: 'Mise en situation',
};

let currentIndex = 0;
let remainingSeconds = durationSeconds;
let timerId = null;
let started = false;
let finished = false;

const draftSelections = {};
const responses = {};

const STORAGE_KEY = 'f135_exam_state';

function saveState() {
  if (!started || finished) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentIndex,
    remainingSeconds,
    draftSelections,
    responses,
  }));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStats() {
  const answeredCount = Object.keys(responses).length;
  const correctCount = Object.values(responses).filter((response) => response.correct).length;
  const wrongCount = answeredCount - correctCount;
  const remainingCount = totalQuestions - answeredCount;
  const pct = Math.round((correctCount / totalQuestions) * 100);

  return {
    answeredCount,
    correctCount,
    wrongCount,
    remainingCount,
    pct,
  };
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getAnsweredOptionLabel(question, chosenIndex) {
  if (chosenIndex === undefined || chosenIndex === null) return 'Non repondu';
  const letters = ['A', 'B', 'C', 'D'];
  return `${letters[chosenIndex]}. ${question.opts[chosenIndex]}`;
}

function updateTimerDisplay() {
  const timer = document.getElementById('examTimer');
  if (!timer) return;

  timer.textContent = formatTime(remainingSeconds);
  timer.classList.toggle('warning', remainingSeconds <= 15 * 60 && remainingSeconds > 5 * 60);
  timer.classList.toggle('danger', remainingSeconds <= 5 * 60);
}

function updateDashboard() {
  const stats = getStats();

  document.getElementById('statAnswered').textContent = stats.answeredCount;
  document.getElementById('statCorrect').textContent = stats.correctCount;
  document.getElementById('statWrong').textContent = stats.wrongCount;
  document.getElementById('statRemaining').textContent = stats.remainingCount;
  document.getElementById('questionPosition').textContent = `Question ${currentIndex + 1} sur ${totalQuestions}`;
  document.getElementById('progressBar').style.width = `${(stats.answeredCount / totalQuestions) * 100}%`;

  updateTimerDisplay();
}

function renderQuestion() {
  const question = questions[currentIndex];
  const savedResponse = responses[question.id];
  const selectedIndex = savedResponse ? savedResponse.chosen : draftSelections[question.id];
  const isLocked = Boolean(savedResponse);
  const container = document.getElementById('examQuestionCard');

  container.innerHTML = `
    <div class="question-card exam-question-card">
      <div class="q-meta">
        <span class="q-number">Q${currentIndex + 1}</span>
        <span class="q-theme">${themeLabels[question.theme] || question.theme}</span>
        <span class="q-diff">${question.diff}</span>
      </div>

      <div class="question-kind-row">
        <span class="question-kind-badge ${question.format === 'situation' ? 'scenario' : ''}">${formatLabels[question.format] || 'Question'}</span>
        <span class="answer-state-badge ${isLocked ? '' : 'pending'}">${isLocked ? 'Reponse enregistree' : 'A valider'}</span>
      </div>

      ${question.caseStudy ? `
        <div class="case-study">
          <div class="case-study-label">Mise en situation</div>
          <p>${question.caseStudy}</p>
        </div>
      ` : ''}

      <div class="q-text">${question.q}</div>

      <div class="options" id="exam-options-${question.id}">
        ${question.opts.map((option, index) => {
          const letters = ['A', 'B', 'C', 'D'];
          const selectedClass = selectedIndex === index ? ' selected' : '';
          return `
            <button
              class="option-btn${selectedClass}"
              onclick="selectExamOption(${question.id}, ${index})"
              ${isLocked ? 'disabled' : ''}
            >
              <span class="option-letter">${letters[index]}.</span>
              <span>${option}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="validate-wrap">
        <button
          class="validate-btn"
          onclick="validateExamAnswer(${question.id})"
          ${isLocked || selectedIndex === undefined ? 'disabled' : ''}
          ${isLocked ? 'style="display:none"' : ''}
        >
          Valider la reponse
        </button>
      </div>

      <div class="exam-note">
        ${isLocked
          ? 'Cette reponse est verrouillee. La correction detaillee apparaitra a la fin de la simulation.'
          : 'La bonne reponse n\'apparaitra qu\'a la fin de la simulation.'}
      </div>
    </div>
  `;

  document.getElementById('prevBtn').disabled = currentIndex === 0;
  document.getElementById('nextBtn').disabled = currentIndex === totalQuestions - 1;
}

function getResultMessage(stats) {
  if (stats.pct >= 90) return { medal: '🥇', text: 'Excellent resultat. Vous etes tres proche du niveau attendu pour l examen.' };
  if (stats.pct >= 75) return { medal: '🥈', text: 'Bonne simulation. Revisez surtout les questions scenario et les themes ou vous avez hesite.' };
  if (stats.pct >= 60) return { medal: '🥉', text: 'Resultat encourageant, mais plusieurs notions doivent etre consolidees avant l examen reel.' };
  return { medal: '📚', text: 'Cette simulation montre qu une revision structuree est encore necessaire avant l examen.' };
}

function renderReview() {
  const reviewList = document.getElementById('reviewList');

  reviewList.innerHTML = questions.map((question, index) => {
    const response = responses[question.id];
    const chosenIndex = response?.chosen;
    const answeredLabel = getAnsweredOptionLabel(question, chosenIndex);
    const isUnanswered = chosenIndex === undefined;

    return `
      <article class="review-card${isUnanswered ? ' unanswered' : ''}">
        <div class="q-meta">
          <span class="q-number">Q${index + 1}</span>
          <span class="q-theme">${themeLabels[question.theme] || question.theme}</span>
          <span class="q-diff">${formatLabels[question.format] || 'Question'}</span>
        </div>

        ${question.caseStudy ? `
          <div class="case-study">
            <div class="case-study-label">Mise en situation</div>
            <p>${question.caseStudy}</p>
          </div>
        ` : ''}

        <div class="q-text">${question.q}</div>

        <div class="options">
          ${question.opts.map((option, optionIndex) => {
            const letters = ['A', 'B', 'C', 'D'];
            let optionClass = '';

            if (optionIndex === question.ans) {
              optionClass = ' correct';
            } else if (chosenIndex === optionIndex) {
              optionClass = ' wrong';
            }

            return `
              <button class="option-btn${optionClass}" disabled>
                <span class="option-letter">${letters[optionIndex]}.</span>
                <span>${option}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="review-answer-line"><strong>Votre reponse :</strong> ${answeredLabel}</div>
        <div class="explanation visible"><strong>Correction :</strong> ${question.expl}</div>
      </article>
    `;
  }).join('');
}

function finishExam(autoSubmitted = false) {
  if (finished) return;

  if (!autoSubmitted && !window.confirm('Terminer la simulation maintenant? Les reponses non validees seront comptees comme non repondues.')) {
    return;
  }

  finished = true;
  window.clearInterval(timerId);
  clearState();

  document.getElementById('examShell').style.display = 'none';
  document.getElementById('examResults').style.display = 'block';

  const stats = getStats();
  const unansweredCount = totalQuestions - stats.answeredCount;
  const resultMessage = getResultMessage(stats);

  document.getElementById('resultsMedal').textContent = autoSubmitted ? '⏱️' : resultMessage.medal;
  document.getElementById('resultsScore').textContent = `${stats.pct}%`;
  document.getElementById('resultsMessage').textContent = autoSubmitted
    ? `Le temps est ecoule. Vous avez ${stats.correctCount} bonne${stats.correctCount > 1 ? 's' : ''} reponse${stats.correctCount > 1 ? 's' : ''} sur ${totalQuestions}. ${unansweredCount} question${unansweredCount > 1 ? 's sont restees' : ' est restee'} sans reponse.`
    : `${resultMessage.text} Vous avez ${stats.correctCount} bonne${stats.correctCount > 1 ? 's' : ''} reponse${stats.correctCount > 1 ? 's' : ''} sur ${totalQuestions}.`;

  document.getElementById('summaryCorrect').textContent = stats.correctCount;
  document.getElementById('summaryWrong').textContent = stats.wrongCount;
  document.getElementById('summaryBlank').textContent = unansweredCount;
  document.getElementById('progressBar').style.width = '100%';

  renderReview();
}

function resumeExam(saved) {
  currentIndex = saved.currentIndex ?? 0;
  remainingSeconds = saved.remainingSeconds ?? durationSeconds;
  Object.assign(draftSelections, saved.draftSelections ?? {});
  Object.assign(responses, saved.responses ?? {});

  started = true;
  document.getElementById('examIntro').style.display = 'none';
  document.getElementById('examShell').style.display = 'block';

  updateDashboard();
  renderQuestion();

  timerId = window.setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updateTimerDisplay();
      clearState();
      finishExam(true);
      return;
    }

    updateTimerDisplay();
    saveState();
  }, 1000);
}

function startExam() {
  if (started) return;

  clearState();
  started = true;
  document.getElementById('examIntro').style.display = 'none';
  document.getElementById('examShell').style.display = 'block';

  updateDashboard();
  renderQuestion();

  timerId = window.setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updateTimerDisplay();
      clearState();
      finishExam(true);
      return;
    }

    updateTimerDisplay();
    saveState();
  }, 1000);
}

window.selectExamOption = function selectExamOption(questionId, chosenIndex) {
  if (finished || responses[questionId]) return;
  draftSelections[questionId] = chosenIndex;
  renderQuestion();
};

window.validateExamAnswer = function validateExamAnswer(questionId) {
  if (finished || responses[questionId]) return;

  const question = questions.find((entry) => entry.id === questionId);
  const chosenIndex = draftSelections[questionId];

  if (!question || chosenIndex === undefined) return;

  responses[questionId] = {
    chosen: chosenIndex,
    correct: chosenIndex === question.ans,
  };

  saveState();
  updateDashboard();

  if (currentIndex < totalQuestions - 1) {
    currentIndex += 1;
  }

  renderQuestion();
};

window.restartExam = function restartExam() {
  window.location.reload();
};

document.getElementById('startExamBtn').addEventListener('click', startExam);
document.getElementById('finishExamBtn').addEventListener('click', () => finishExam(false));
document.getElementById('restartExamBtn').addEventListener('click', window.restartExam);

document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex -= 1;
    renderQuestion();
    updateDashboard();
  }
});

document.getElementById('nextBtn').addEventListener('click', () => {
  if (currentIndex < totalQuestions - 1) {
    currentIndex += 1;
    renderQuestion();
    updateDashboard();
  }
});

// Restore saved session if one exists
const savedState = loadSavedState();
if (savedState && savedState.remainingSeconds > 0) {
  const answeredCount = Object.keys(savedState.responses ?? {}).length;
  const minutesLeft = Math.floor(savedState.remainingSeconds / 60);
  const secondsLeft = savedState.remainingSeconds % 60;
  const timeLeft = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;

  const introCard = document.querySelector('.intro-card');
  const resumeBanner = document.createElement('div');
  resumeBanner.className = 'resume-banner';
  resumeBanner.innerHTML = `
    <p class="resume-info">Session en cours — ${answeredCount} question${answeredCount !== 1 ? 's' : ''} repondue${answeredCount !== 1 ? 's' : ''}, ${timeLeft} restant</p>
    <div class="resume-actions">
      <button class="start-exam-btn" id="resumeExamBtn">Reprendre la simulation</button>
      <button class="resume-new-btn" id="newExamBtn">Nouvelle simulation</button>
    </div>
  `;
  introCard.appendChild(resumeBanner);

  document.getElementById('resumeExamBtn').addEventListener('click', () => resumeExam(savedState));
  document.getElementById('newExamBtn').addEventListener('click', () => {
    clearState();
    resumeBanner.remove();
  });
}

updateTimerDisplay();