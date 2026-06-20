document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('quizQuestionContainer');
  const prevBtn = document.getElementById('quizPrevBtn');
  const nextBtn = document.getElementById('quizNextBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const loadingSubtext = document.getElementById('loadingSubtext');

  if (!container) return;

  // Question configurations
  const questions = [
    {
      id: 'fullName',
      type: 'text',
      title: 'Ваше имя и фамилия? *',
      placeholder: 'Анна Тютина',
      errorText: 'Пожалуйста, введите ваше имя и фамилию',
      validate: (val) => val.trim().length >= 2
    },
    {
      id: 'email',
      type: 'email',
      title: 'Ваша почта? *',
      placeholder: 'anya7_tyutina@vk.com',
      errorText: 'Введите корректный адрес электронной почты',
      validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
    },
    {
      id: 'phone',
      type: 'tel',
      title: 'Номер телефона для связи? *',
      placeholder: '+7(910)803-18-23',
      errorText: 'Введите корректный номер телефона (не менее 9 цифр)',
      validate: (val) => val.replace(/\D/g, '').length >= 9
    },
    {
      id: 'country',
      type: 'text',
      title: 'В какой стране вы сейчас находитесь? *',
      placeholder: 'Россия',
      errorText: 'Пожалуйста, укажите вашу страну',
      validate: (val) => val.trim().length >= 2
    },
    {
      id: 'telegram',
      type: 'text',
      title: 'Ваш ник в Телеграм? *',
      placeholder: '@tyutina_official1',
      errorText: 'Введите корректный Telegram логин (например, @username)',
      validate: (val) => /^@?[\w]{3,32}$/.test(val.trim())
    },
    {
      id: 'blogStatus',
      type: 'choice',
      title: 'Вы уже ведете блог или только начинаете? *',
      errorText: 'Пожалуйста, выберите один из вариантов',
      choices: [
        { key: 'beginner', letter: 'A', text: 'Только начинаю' },
        { key: 'active', letter: 'B', text: 'Уже веду блог' }
      ]
    }
  ];

  const answers = {};
  let currentIndex = 0;

  // Initialize first question
  renderQuestion();

  // Navigation handlers
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      navigateQuestion(currentIndex - 1);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (validateAndSave()) {
      if (currentIndex < questions.length - 1) {
        navigateQuestion(currentIndex + 1);
      } else {
        submitQuiz();
      }
    }
  });

  // Global keyboard listener for Enter key and Choice Shortcuts (A / B)
  document.addEventListener('keydown', (e) => {
    const activeElement = document.activeElement;
    
    // Ignore key shortcuts if user is typing in inputs but Enter is allowed
    if (e.key === 'Enter') {
      if (activeElement && activeElement.classList.contains('quiz-input')) {
        e.preventDefault();
        nextBtn.click();
      }
    }

    // A/B choice shortcuts when on choice step
    const currentQ = questions[currentIndex];
    if (currentQ.type === 'choice') {
      if (e.key.toLowerCase() === 'a') {
        selectChoice('beginner');
      } else if (e.key.toLowerCase() === 'b') {
        selectChoice('active');
      }
    }
  });

  // Render question DOM content
  function renderQuestion() {
    const q = questions[currentIndex];
    const prevAnswer = answers[q.id] || '';

    let html = `
      <div class="quiz-question-title">
        <span class="question-number-box">${currentIndex + 1}</span>${q.title}
      </div>
    `;

    if (q.type === 'choice') {
      html += `
        <div class="choices-container">
          ${q.choices.map(c => `
            <div class="choice-item ${prevAnswer === c.key ? 'selected' : ''}" data-value="${c.key}">
              <span class="choice-letter">${c.letter}</span>
              <span class="choice-text">${c.text}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      html += `
        <div class="quiz-input-container">
          <input type="${q.type}" id="${q.id}" class="quiz-input" placeholder="${q.placeholder}" value="${prevAnswer}" autocomplete="off">
          <button type="button" class="quiz-ok-btn" id="okBtn">
            ОК <span style="font-size: 0.8rem; margin-left: 2px;">✔</span>
          </button>
          <span class="keyboard-helper">нажмите Enter ↵</span>
        </div>
      `;
    }

    html += `<div class="quiz-error-message" id="quizError">${q.errorText}</div>`;
    container.innerHTML = html;

    // Hook listeners
    if (q.type === 'choice') {
      const items = container.querySelectorAll('.choice-item');
      items.forEach(item => {
        item.addEventListener('click', () => {
          selectChoice(item.getAttribute('data-value'));
        });
      });
    } else {
      const okBtn = document.getElementById('okBtn');
      if (okBtn) {
        okBtn.addEventListener('click', () => {
          nextBtn.click();
        });
      }
      
      // Auto-focus input
      const input = container.querySelector('.quiz-input');
      if (input) {
        input.focus();
      }
    }

    // Update navigation arrows state
    prevBtn.disabled = currentIndex === 0;
    
    const isNextDisabled = q.type === 'choice' && !answers[q.id];
    nextBtn.disabled = isNextDisabled;
    
    if (!isNextDisabled) {
      nextBtn.classList.add('highlighted');
    } else {
      nextBtn.classList.remove('highlighted');
    }
  }

  // Handle choice selection (triggers immediate animation to next question)
  function selectChoice(value) {
    const items = container.querySelectorAll('.choice-item');
    items.forEach(item => {
      if (item.getAttribute('data-value') === value) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    answers[questions[currentIndex].id] = value;
    
    // Smooth delay before advancing
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        navigateQuestion(currentIndex + 1);
      } else {
        submitQuiz();
      }
    }, 250);
  }

  // Navigate with smooth slide transition
  function navigateQuestion(newIndex) {
    container.classList.add('fade-out');
    
    setTimeout(() => {
      currentIndex = newIndex;
      renderQuestion();
      container.classList.remove('fade-out');
      container.classList.add('fade-in');
      
      setTimeout(() => {
        container.classList.remove('fade-in');
      }, 200);
    }, 200);
  }

  // Validate current answer and save to local state
  function validateAndSave() {
    const q = questions[currentIndex];
    const errorEl = document.getElementById('quizError');
    
    if (q.type === 'choice') {
      const hasAnswer = !!answers[q.id];
      if (!hasAnswer && errorEl) {
        errorEl.style.display = 'block';
      }
      return hasAnswer;
    }

    const input = container.querySelector('.quiz-input');
    if (!input) return false;

    const val = input.value.trim();
    const isValid = q.validate(val);

    if (!isValid) {
      if (errorEl) {
        errorEl.style.display = 'block';
      }
      input.style.borderBottomColor = 'var(--color-error)';
      
      // Shake effect
      container.style.transform = 'translateX(6px)';
      setTimeout(() => {
        container.style.transform = 'translateX(-6px)';
        setTimeout(() => {
          container.style.transform = 'translateX(0)';
        }, 80);
      }, 80);

      return false;
    }

    if (errorEl) {
      errorEl.style.display = 'none';
    }

    answers[q.id] = val;
    return true;
  }

  // Submit and Redirect
  async function submitQuiz() {
    const spinner = document.getElementById('loadingSpinner');
    const successIcon = document.getElementById('successIcon');

    // Ensure all data matches key format expected by sale.html
    const leadData = {
      fullName: answers.fullName,
      email: answers.email,
      phone: answers.phone,
      country: answers.country,
      telegram: answers.telegram.startsWith('@') ? answers.telegram : '@' + answers.telegram,
      blogStatus: answers.blogStatus,
      timestamp: new Date().toISOString()
    };

    // Save data
    localStorage.setItem('hustler_lead_data', JSON.stringify(leadData));

    // Show loading overlay
    loadingOverlay.classList.add('active');
    if (spinner) spinner.style.display = 'block';
    if (successIcon) successIcon.style.display = 'none';

    // Progression of loading texts
    const stages = [
      { text: "Сохранение ответов...", sub: "Записываем ваши контактные данные." },
      { text: "Отправка заявки...", sub: "Передаем информацию команде Максима." },
      { text: "Генерация профиля...", sub: "Завершаем обработку данных." }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage++;
      if (currentStage < stages.length) {
        loadingText.innerText = stages[currentStage].text;
        loadingSubtext.innerText = stages[currentStage].sub;
      }
    }, 800);

    const startTime = Date.now();

    // Send form data to maxtyutin@gmail.com via FormSubmit
    try {
      await fetch("https://formsubmit.co/ajax/maxtyutin@gmail.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          "Имя и Фамилия": leadData.fullName,
          "E-mail": leadData.email,
          "Телефон": leadData.phone,
          "Страна": leadData.country,
          "Telegram": leadData.telegram,
          "Статус Блога": leadData.blogStatus === 'active' ? 'Уже ведет блог' : 'Только начинает',
          "_subject": `Новый лид AI Hustlers: ${leadData.fullName} (${leadData.telegram})`,
          "_template": "table",
          "landing_page": window.location.pathname,
          "timestamp": leadData.timestamp
        })
      });
    } catch (err) {
      console.error("Failed sending email", err);
    } finally {
      // Ensure the animation has been playing for at least 2.4 seconds so user sees stages
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 2400 - elapsed);

      setTimeout(() => {
        clearInterval(interval);
        if (spinner) spinner.style.display = 'none';
        if (successIcon) successIcon.style.display = 'flex';
        loadingText.innerText = "Заявка успешно отправлена!";
        loadingSubtext.innerText = "Ожидайте звонка от команды Максима.";
      }, delay);
    }
  }
});
