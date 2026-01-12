// Quiz Module
const Quiz = {
    timerInterval: null,
    timeLeft: 60 * 60, // 60 minutes in seconds

    init() {
        const form = document.getElementById('quiz-form');
        if (form) {
            form.addEventListener('submit', (e) => this.submitQuiz(e));
            // Progress Listener
            form.addEventListener('change', () => this.updateProgress());
        }
        
        // Initial Progress Check
        this.updateProgress();

        // --- Theme Toggle Logic ---
        const toggleBtn = document.getElementById('themeToggle');
        const root = document.documentElement;
        
        // Check saved preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        root.setAttribute('data-theme', savedTheme);
        if(toggleBtn) toggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const currentTheme = root.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                root.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            });
        }

        // Listen for auth success to start timer
        window.addEventListener('quiz-start', () => {
            this.startTimer(this.timeLeft);
        });

        // Initialize Image Zoom
        this.initImageZoom();
        
        // Initialize Drag and Drop
        this.initDragAndDrop();
    },

    startTimer(duration) {
        clearInterval(this.timerInterval);
        this.timeLeft = duration;
        const display = document.querySelector('#time');
        
        // Update immediately
        this.updateTimerDisplay(display);

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay(display);

            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.submitQuiz(new Event('submit')); // Auto-submit
            }
        }, 1000);
    },

    updateTimerDisplay(display) {
        if (!display) return;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;

        const minutesStr = minutes < 10 ? "0" + minutes : minutes;
        const secondsStr = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = `${minutesStr}:${secondsStr}`;
        
        // Add warning class if less than 5 minutes
        const timerContainer = document.getElementById('quiz-timer');
        if (this.timeLeft < 300) {
            timerContainer.classList.add('warning');
        } else {
            timerContainer.classList.remove('warning');
        }
    },

    submitQuiz(event) {
        if (event) event.preventDefault();
        
        // Stop the timer
        clearInterval(this.timerInterval);

        let score = 0;
        const questionBlocks = document.querySelectorAll('.question-block');
        const totalQuestions = questionBlocks.length;

        questionBlocks.forEach((block) => {
            try {
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
                    let correctAnswers = [];
                    try {
                        correctAnswers = correctAnswer ? JSON.parse(correctAnswer) : [];
                    } catch (e) {
                        console.error('Error parsing answers for Q' + questionId, e);
                    }
                    
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

                    if (rows.length === 0) {
                        // Handle matching questions without table structure (visual only)
                        // In this specific quiz, some matching questions are just images/text without interactive validation logic implemented yet.
                        // We count them as correct to avoid frustration, or we could skip scoring them.
                        // Given 'allMatch' defaults to true, we'll award points effectively for participation/self-check.
                    } else {
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
                                
                                // Highlight correct option logic safely
                                // Try finding by value attribute first
                                let correctOption = selectElement.querySelector(`option[value="${CSS.escape(correctRowAnswer)}"]`);
                                
                                // If not found, try finding by text content (common in this quiz)
                                if (!correctOption) {
                                     const options = Array.from(selectElement.options);
                                     correctOption = options.find(opt => opt.text === correctRowAnswer);
                                }

                                if (correctOption && userRowAnswer !== correctRowAnswer) {
                                    selectElement.style.borderColor = '#ef4444';
                                    selectElement.style.borderWidth = '3px';
                                }
                            }
                        });
                    }

                    if (allMatch) {
                        score++;
                        isCorrect = true;
                    }
                } else if (questionType === 'order') {
                    const targetZone = block.querySelector('.target-dropzone');
                    
                    if (targetZone) {
                        const userOrder = Array.from(targetZone.querySelectorAll('.draggable-item')).map(item => item.dataset.id);
                        const correctOrder = correctAnswer ? correctAnswer.split(',') : [];

                        if (userOrder.length === correctOrder.length && userOrder.every((val, index) => val === correctOrder[index])) {
                            score++;
                            isCorrect = true;
                            targetZone.style.borderColor = 'var(--correct-color)';
                            targetZone.style.backgroundColor = 'var(--correct-bg)';
                        } else {
                            targetZone.style.borderColor = 'var(--incorrect-color)';
                            targetZone.style.backgroundColor = 'var(--incorrect-bg)';
                        }
                    } else {
                        // Legacy support for non-drag-and-drop order questions
                        isCorrect = true;
                        score++;
                    }
                }

                // Show explanation
                const explanation = block.querySelector('.explanation');
                if (explanation) {
                    explanation.style.display = 'block';
                }
            } catch (err) {
                console.error("Error processing question block:", block, err);
                // Continue to next question
            }
        });

        this.displayResults(score, totalQuestions);
        
        // Scroll to results smoothly
        setTimeout(() => {
            const results = document.getElementById('results-container');
            if(results) {
                results.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 100);
    },

    displayResults(score, totalQuestions) {
        const resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) return;

        const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

        resultsContainer.innerHTML = `
            <h2>Quiz Complete!</h2>
            <p>You scored ${score} out of ${totalQuestions} (${percentage.toFixed(0)}%)</p>
            <button class="try-again-btn" onclick="Quiz.resetQuiz()">Try Again</button>
        `;

        if (percentage >= 80) {
            resultsContainer.style.backgroundColor = 'var(--correct-bg)';
            resultsContainer.style.color = 'var(--correct-color)';
        } else {
            resultsContainer.style.backgroundColor = 'var(--incorrect-bg)';
            resultsContainer.style.color = 'var(--incorrect-color)';
        }

        resultsContainer.style.display = 'block';
    },

    resetQuiz() {
        // Reset form inputs
        const form = document.getElementById('quiz-form');
        if (form) form.reset();

        // Remove classes and styles
        document.querySelectorAll('.correct-answer, .incorrect-answer, .correct-answer-reveal').forEach(el => {
            el.classList.remove('correct-answer', 'incorrect-answer', 'correct-answer-reveal');
        });
        
        document.querySelectorAll('select').forEach(el => {
            el.style.borderColor = '';
            el.style.borderWidth = '';
            el.classList.remove('correct-answer', 'incorrect-answer');
        });

        // Reset Dropzones
        document.querySelectorAll('.drag-area').forEach(area => {
            const source = area.querySelector('.source-items');
            const items = area.querySelectorAll('.draggable-item');
            items.forEach(item => source.appendChild(item));
            
            const target = area.querySelector('.target-dropzone');
            if (target) {
                target.style.borderColor = '';
                target.style.backgroundColor = '';
            }
        });

        // Hide explanations
        document.querySelectorAll('.explanation').forEach(el => {
            el.style.display = 'none';
        });

        // Hide results
        const resultsContainer = document.getElementById('results-container');
        if(resultsContainer) resultsContainer.style.display = 'none';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Restart timer
        this.startTimer(60 * 60);
    },

    initImageZoom() {
        const zoomableImages = document.querySelectorAll('.zoomable');
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        const closeBtn = document.querySelector('.close-modal');
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const resetZoomBtn = document.getElementById('resetZoom');

        let currentZoom = 1;
        const ZOOM_STEP = 0.5;
        const MAX_ZOOM = 4;
        const MIN_ZOOM = 0.5;

        // Open modal
        zoomableImages.forEach(img => {
            img.addEventListener('click', () => {
                if (modal) {
                    modal.style.display = 'flex';
                    // Trigger reflow
                    modal.offsetHeight;
                    modal.classList.add('visible');
                    if(modalImg) modalImg.src = img.src;
                    currentZoom = 1;
                    updateZoom();
                }
            });
        });

        // Close modal
        const closeModal = () => {
            if (!modal) return;
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.style.display = 'none';
                if(modalImg) modalImg.src = '';
                currentZoom = 1;
                updateZoom();
            }, 300);
        };

        if (closeBtn) closeBtn.onclick = closeModal;
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) closeModal();
            };
        }

        // Zoom Controls
        const updateZoom = () => {
            if (!modalImg) return;
            modalImg.style.transform = `scale(${currentZoom})`;
            
            // Enable/Disable buttons based on limits
            if (zoomInBtn) zoomInBtn.disabled = currentZoom >= MAX_ZOOM;
            if (zoomOutBtn) zoomOutBtn.disabled = currentZoom <= MIN_ZOOM;
        };

        if (zoomInBtn) {
            zoomInBtn.onclick = (e) => {
                e.stopPropagation();
                if (currentZoom < MAX_ZOOM) {
                    currentZoom += ZOOM_STEP;
                    updateZoom();
                }
            };
        }

        if (zoomOutBtn) {
            zoomOutBtn.onclick = (e) => {
                e.stopPropagation();
                if (currentZoom > MIN_ZOOM) {
                    currentZoom -= ZOOM_STEP;
                    updateZoom();
                }
            };
        }

        if (resetZoomBtn) {
            resetZoomBtn.onclick = (e) => {
                e.stopPropagation();
                currentZoom = 1;
                updateZoom();
            };
        }
        
        // Add keyboard support
        document.addEventListener('keydown', (e) => {
            if (modal && modal.style.display === 'flex') {
                if (e.key === 'Escape') closeModal();
                if (e.key === '+' || e.key === '=') {
                    if (currentZoom < MAX_ZOOM) {
                        currentZoom += ZOOM_STEP;
                        updateZoom();
                    }
                }
                if (e.key === '-') {
                    if (currentZoom > MIN_ZOOM) {
                        currentZoom -= ZOOM_STEP;
                        updateZoom();
                    }
                }
                if (e.key === '0') {
                    currentZoom = 1;
                    updateZoom();
                }
            }
        });
    },

    initDragAndDrop() {
        const draggables = document.querySelectorAll('.draggable-item');
        const containers = document.querySelectorAll('.source-items, .target-dropzone');

        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', () => {
                draggable.classList.add('dragging');
            });

            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('dragging');
            });
        });

        containers.forEach(container => {
            container.addEventListener('dragover', e => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(container, e.clientY);
                const draggable = document.querySelector('.dragging');
                if (draggable) {
                    if (afterElement == null) {
                        container.appendChild(draggable);
                    } else {
                        container.insertBefore(draggable, afterElement);
                    }
                    // Update progress on drop movement
                    this.updateProgress();
                }
            });
        });
    },

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.draggable-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    updateProgress() {
        const total = document.querySelectorAll('.question-block').length;
        if(total === 0) return;

        let answeredCount = 0;
        
        document.querySelectorAll('.question-block').forEach(block => {
            let isAnswered = false;
            
            // Check standard inputs
            const inputs = block.querySelectorAll('input, select');
            if (inputs.length > 0) {
                 const checked = block.querySelector('input:checked');
                 const selected = block.querySelector('option:checked');
                 const hasValue = selected && selected.value !== "";
                 if (checked || hasValue) isAnswered = true;
            }
            
            // For Drag and Drop
            const dropzone = block.querySelector('.target-dropzone');
            if (dropzone) {
                 // It's answered if it has more items than just the placeholder (if any)
                 // or simply if it contains a draggable-item
                 if(dropzone.querySelector('.draggable-item')) isAnswered = true;
            }
            
            if (isAnswered) answeredCount++;
        });

        const percent = Math.round((answeredCount / total) * 100);
        const bar = document.getElementById('progressBar');
        if(bar) bar.style.width = percent + '%';
    }
};

// Make Quiz global explicitly
window.Quiz = Quiz;

// Initialize quiz
window.addEventListener('load', () => {
    Quiz.init();
});
