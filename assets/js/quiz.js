// Quiz Module
const Quiz = {
    init() {
        const form = document.getElementById('quiz-form');
        if (form) {
            form.addEventListener('submit', (e) => this.submitQuiz(e));
        }
    },

    submitQuiz(event) {
        event.preventDefault();

        let score = 0;
        const questionBlocks = document.querySelectorAll('.question-block');
        const totalQuestions = questionBlocks.length;

        questionBlocks.forEach((block) => {
            const questionId = block.dataset.question;
            const questionType = block.dataset.type;
            const correctAnswer = block.dataset.answer;
            let isCorrect = false;

            if (questionType === 'mc') {
                const userAnswer = block.querySelector(`input[name="q${questionId}"]:checked`);
                const labels = block.querySelectorAll('.options label');

                // Show all correct answers
                labels.forEach(label => {
                    const input = label.querySelector('input');
                    if (input && input.value === correctAnswer) {
                        label.classList.add('correct-answer-reveal');
                    }
                });

                // Mark user's answer
                if (userAnswer) {
                    const parentLabel = userAnswer.closest('label');
                    if (userAnswer.value === correctAnswer) {
                        score++;
                        isCorrect = true;
                        parentLabel.classList.add('correct-answer');
                    } else {
                        parentLabel.classList.add('incorrect-answer');
                    }
                }
            } else if (questionType === 'ms') {
                const correctAnswers = JSON.parse(correctAnswer);
                const userAnswers = Array.from(block.querySelectorAll(`input[name="q${questionId}"]:checked`)).map(el => el.value);

                const labels = block.querySelectorAll('.options label');
                
                // Show all correct answers
                labels.forEach(label => {
                    const input = label.querySelector('input');
                    if (input && correctAnswers.includes(input.value)) {
                        label.classList.add('correct-answer-reveal');
                    }
                });

                // Mark user's answers
                let correctCount = 0;
                userAnswers.forEach(val => {
                    const input = block.querySelector(`input[value="${val}"]`);
                    if (input) {
                        const parentLabel = input.closest('label');
                        if (correctAnswers.includes(val)) {
                            correctCount++;
                            parentLabel.classList.add('correct-answer');
                        } else {
                            parentLabel.classList.add('incorrect-answer');
                        }
                    }
                });

                if (correctCount === correctAnswers.length && userAnswers.length === correctAnswers.length) {
                    score++;
                    isCorrect = true;
                }
            } else if (questionType === 'match') {
                const rows = block.querySelectorAll('tbody tr');
                let allMatch = true;

                rows.forEach(row => {
                    const correctRowAnswer = row.dataset.answer;
                    const selectElement = row.querySelector('select');
                    if (selectElement) {
                        const userRowAnswer = selectElement.value;

                        if (userRowAnswer === correctRowAnswer) {
                            selectElement.classList.add('correct-answer');
                        } else {
                            selectElement.classList.add('incorrect-answer');
                            allMatch = false;
                        }
                        
                        // Show correct answer in the explanation or add a hint
                        const correctOption = selectElement.querySelector(`option[value="${correctRowAnswer}"]`);
                        if (correctOption && userRowAnswer !== correctRowAnswer) {
                            selectElement.style.borderColor = '#ef4444';
                            selectElement.style.borderWidth = '3px';
                        }
                    }
                });

                if (allMatch) {
                    score++;
                    isCorrect = true;
                }
            } else if (questionType === 'order') {
                isCorrect = true;
                score++;
            }

            // Show explanation
            const explanation = block.querySelector('.explanation');
            if (explanation) {
                explanation.style.display = 'block';
            }
        });

        this.displayResults(score, totalQuestions);
        
        // Scroll to results smoothly
        setTimeout(() => {
            document.getElementById('results-container').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);
    },

    displayResults(score, totalQuestions) {
        const resultsContainer = document.getElementById('results-container');
        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

        resultsContainer.innerHTML = `<h2>Quiz Complete!</h2><p>You scored ${score} out of ${totalQuestions} (${percentage.toFixed(0)}%)</p>`;

        if (percentage >= 80) {
            resultsContainer.style.backgroundColor = 'var(--correct-bg)';
            resultsContainer.style.color = 'var(--correct-color)';
        } else {
            resultsContainer.style.backgroundColor = 'var(--incorrect-bg)';
            resultsContainer.style.color = 'var(--incorrect-color)';
        }

        resultsContainer.style.display = 'block';
        window.scrollTo(0, document.body.scrollHeight);
    }
};

// Initialize quiz
window.addEventListener('load', () => {
    Quiz.init();
});
