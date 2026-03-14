let currentUser = null;

        // --- AUTHENTICATION LOGIC & W/ ANIMATIONS ---
        function handleSignIn() {
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-pass').value.trim();
            
            // Validation
            if (!email || !password) {
                showAuthError('Please fill in both email and password fields.');
                return;
            }
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAuthError('Please enter a valid email address.');
                return;
            }
            
            const name = email.split('@')[0];
            currentUser = { name: name, email: email };
            updateNavAuth();
            document.getElementById('loginModal').classList.remove('show');
            clearAuthErrors();
        }

        function handleSignUp() {
            const user = document.getElementById('reg-user').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-pass').value.trim();
            
            // Validation
            if (!user || !email || !password) {
                showAuthError('Please fill in all required fields (username, email, and password).');
                return;
            }
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showAuthError('Please enter a valid email address.');
                return;
            }
            
            // Password strength validation
            if (password.length < 6) {
                showAuthError('Password must be at least 6 characters long.');
                return;
            }
            
            currentUser = { name: user, email: email };
            updateNavAuth();
            document.getElementById('loginModal').classList.remove('show');
            clearAuthErrors();
        }

        function handleSignOut() {
            currentUser = null;
            updateNavAuth();
            document.getElementById('loginModal').classList.remove('show');
        }

        // Authentication validation helpers
        function showAuthError(message) {
            let errorDiv = document.getElementById('auth-error-message');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'auth-error-message';
                errorDiv.className = 'auth-error-message';
                const modalContent = document.querySelector('.login-modal');
                modalContent.insertBefore(errorDiv, modalContent.firstChild);
            }
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        function clearAuthErrors() {
            const errorDiv = document.getElementById('auth-error-message');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }

        function updateNavAuth() {
            const container = document.getElementById('nav-auth-container');
            if (currentUser) {
                const initial = currentUser.name.charAt(0).toUpperCase();
                container.innerHTML = `<div onclick="openProfile()" style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #a855f7); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; cursor: pointer; box-shadow: 0 4px 10px rgba(168, 85, 247, 0.4); border: 2px solid rgba(255,255,255,0.5);">${initial}</div>`;
            } else {
                container.innerHTML = `<button class="btn btn-outline" style="padding: 0.5rem 1.2rem; font-size: 0.95rem; border-radius: 8px;" onclick="openLogin()">Login</button>`;
            }
        }

        function openLogin() {
            document.getElementById('loginModal').classList.add('show');
            switchAuthForm('login', true);
        }

        function openProfile() {
            document.getElementById('profile-name-display').innerText = currentUser.name;
            document.getElementById('profile-email-display').innerText = currentUser.email;
            document.getElementById('profile-avatar-large').innerText = currentUser.name.charAt(0).toUpperCase();
            
            document.getElementById('loginModal').classList.add('show');
            switchAuthForm('profile', true);
        }

        function switchAuthForm(targetForm, instant = false) {
            // Clear any previous errors when switching forms
            clearAuthErrors();
            
            const loginForm = document.getElementById('form-login');
            const signupForm = document.getElementById('form-signup');
            const profileForm = document.getElementById('form-profile');
            const brandIcon = document.getElementById('auth-brand-icon');
            
            if (instant) {
                loginForm.style.display = targetForm === 'login' ? 'block' : 'none';
                signupForm.style.display = targetForm === 'signup' ? 'block' : 'none';
                profileForm.style.display = targetForm === 'profile' ? 'block' : 'none';
                brandIcon.style.display = targetForm === 'profile' ? 'none' : 'block';
                loginForm.style.animation = 'none';
                signupForm.style.animation = 'none';
                profileForm.style.animation = 'none';
                return;
            }

            brandIcon.style.display = 'block';

            if(targetForm === 'signup') {
                loginForm.style.animation = 'fadeOutLeft 0.3s forwards';
                setTimeout(() => {
                    loginForm.style.display = 'none';
                    signupForm.style.display = 'block';
                    signupForm.style.animation = 'slideInRight 0.3s forwards';
                }, 250);
            } else {
                signupForm.style.animation = 'fadeOutRight 0.3s forwards';
                setTimeout(() => {
                    signupForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    loginForm.style.animation = 'slideInLeft 0.3s forwards';
                }, 250);
            }
        }

        // --- CALCULATION HISTORY MANAGER ---
        const calcHistory = {
            history: [],
            maxEntries: 50,

            init() {
                this.loadHistory();
                this.renderHistoryPanel();
            },

            saveCalculation(calculator, input, result, timestamp = new Date()) {
                const entry = {
                    id: Date.now(),
                    calculator: calculator,
                    input: input,
                    result: result,
                    timestamp: timestamp.toISOString()
                };

                this.history.unshift(entry);

                // Keep only the most recent entries
                if (this.history.length > this.maxEntries) {
                    this.history = this.history.slice(0, this.maxEntries);
                }

                this.saveToStorage();
                this.renderHistoryPanel();
                this.updateHistoryCount();
            },

            loadHistory() {
                try {
                    const stored = localStorage.getItem('mathCalcHistory');
                    if (stored) {
                        this.history = JSON.parse(stored);
                    }
                } catch (e) {
                    console.warn('Failed to load calculation history:', e);
                    this.history = [];
                }
            },

            saveToStorage() {
                try {
                    localStorage.setItem('mathCalcHistory', JSON.stringify(this.history));
                } catch (e) {
                    console.warn('Failed to save calculation history:', e);
                }
            },

            clearHistory() {
                this.history = [];
                this.saveToStorage();
                this.renderHistoryPanel();
                this.updateHistoryCount();
            },

            deleteEntry(id) {
                this.history = this.history.filter(entry => entry.id !== id);
                this.saveToStorage();
                this.renderHistoryPanel();
                this.updateHistoryCount();
            },

            updateHistoryCount() {
                const countElement = document.getElementById('history-count');
                if (countElement) {
                    const count = this.history.length;
                    countElement.textContent = count > 99 ? '99+' : count;
                    countElement.style.display = count > 0 ? 'flex' : 'none';
                }
            },

            exportToPDF() {
                if (this.history.length === 0) {
                    alert('No calculation history to export.');
                    return;
                }

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // Add title
                doc.setFontSize(20);
                doc.text('Math Calculator History', 20, 30);

                // Add date
                doc.setFontSize(12);
                doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45);

                let yPosition = 65;

                this.history.forEach((entry, index) => {
                    if (yPosition > 270) { // New page if needed
                        doc.addPage();
                        yPosition = 30;
                    }

                    // Entry header
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${entry.calculator} - ${new Date(entry.timestamp).toLocaleString()}`, 20, yPosition);
                    yPosition += 10;

                    // Input
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Input: ${entry.input}`, 25, yPosition);
                    yPosition += 8;

                    // Result
                    doc.text(`Result: ${entry.result}`, 25, yPosition);
                    yPosition += 15;
                });

                // Save the PDF
                doc.save('math-calculator-history.pdf');
            },

            renderHistoryPanel() {
                const panel = document.getElementById('calc-history-panel');
                if (!panel) return;

                if (this.history.length === 0) {
                    panel.innerHTML = `
                        <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
                            <i class="fa-solid fa-history" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <p>No calculations yet. Start calculating to build your history!</p>
                        </div>
                    `;
                    return;
                }

                panel.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0 1rem;">
                        <h3 style="margin: 0; font-size: 1.2rem;">Calculation History</h3>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="calcHistory.exportToPDF()" title="Export as PDF">
                                <i class="fa-solid fa-file-pdf"></i>
                            </button>
                            <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="calcHistory.clearHistory()" title="Clear History">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${this.history.map(entry => `
                            <div class="history-entry glass" style="margin: 0.5rem 1rem; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary);">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                                    <div style="font-weight: 600; color: var(--primary); font-size: 0.9rem;">${entry.calculator}</div>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(entry.timestamp).toLocaleString()}</span>
                                        <button class="icon-btn" style="width: 20px; height: 20px; font-size: 0.7rem;" onclick="calcHistory.deleteEntry(${entry.id})" title="Delete entry">
                                            <i class="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                </div>
                                <div style="font-family: 'Times New Roman', serif; font-size: 1.1rem; margin-bottom: 0.3rem; color: var(--text-main);">
                                    ${entry.input}
                                </div>
                                <div style="font-family: 'Times New Roman', serif; font-size: 1.2rem; font-weight: 600; color: var(--secondary);">
                                    = ${entry.result}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            },

            togglePanel() {
                const panel = document.getElementById('calc-history-panel');
                const button = document.getElementById('history-toggle-btn');

                if (panel.style.display === 'none' || !panel.style.display) {
                    panel.style.display = 'block';
                    button.innerHTML = '<i class="fa-solid fa-times"></i>';
                    button.title = 'Hide History';
                } else {
                    panel.style.display = 'none';
                    button.innerHTML = '<i class="fa-solid fa-history"></i>';
                    button.title = 'Show History';
                }
            }
        };

        // --- REVIEW / FEEDBACK MANAGER ---
        const reviewManager = {
            storageKey: 'mathHubReviews',
            reviews: [],

            init() {
                this.loadReviews();
                this.renderReviews();
            },

            loadReviews() {
                try {
                    const stored = localStorage.getItem(this.storageKey);
                    if (stored) {
                        this.reviews = JSON.parse(stored);
                    }
                } catch (e) {
                    console.warn('Failed to load reviews:', e);
                    this.reviews = [];
                }
            },

            saveReviews() {
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(this.reviews));
                } catch (e) {
                    console.warn('Failed to save reviews:', e);
                }
            },

            addReview(review) {
                this.reviews.unshift(review);
                if (this.reviews.length > 50) {
                    this.reviews = this.reviews.slice(0, 50);
                }
                this.saveReviews();
                this.renderReviews();
            },

            deleteReview(id) {
                this.reviews = this.reviews.filter(r => r.id !== id);
                this.saveReviews();
                this.renderReviews();
            },

            formatTimestamp(ts) {
                const date = new Date(ts);
                return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' • ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            },

            renderReviews() {
                const output = document.getElementById('reviews-output');
                if (!output) return;

                if (this.reviews.length === 0) {
                    output.innerHTML = `
                        <div class="glass" style="padding: 1.5rem; border-radius: 16px; border: 1px solid var(--glass-border); text-align: center; color: var(--text-muted);">
                            <i class="fa-solid fa-comment-dots" style="font-size: 2rem; margin-bottom: 0.75rem; opacity: 0.7;"></i>
                            <p>No reviews yet. Be the first to share one!</p>
                        </div>
                    `;
                    return;
                }

                output.innerHTML = this.reviews.map(review => {
                    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    const displayName = review.name ? review.name : 'Anonymous';
                    return `
                        <div class="glass" style="padding: 1.5rem; border-radius: 18px; border: 1px solid var(--glass-border);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem;">
                                <div>
                                    <div style="font-weight: 700; font-size: 1rem;">${displayName}</div>
                                    <div style="font-size: 0.85rem; color: var(--text-muted);">${this.formatTimestamp(review.timestamp)}</div>
                                </div>
                                <div style="font-size: 0.95rem; color: var(--secondary); letter-spacing: 0.05em;">${stars}</div>
                            </div>
                            <div style="color: var(--text-main); line-height: 1.5;">${review.text}</div>
                        </div>
                    `;
                }).join('');
            }
        };

        function submitReview() {
            const textEl = document.getElementById('review-text');
            const nameEl = document.getElementById('review-name');
            const ratingEl = document.getElementById('review-rating');
            const errorEl = document.getElementById('review-error');

            if (!textEl || !ratingEl || !errorEl) return;

            const text = textEl.value.trim();
            const rating = Number(ratingEl.value);
            const name = nameEl && nameEl.value.trim();

            if (!text) {
                errorEl.textContent = 'Please enter a short review before posting.';
                errorEl.style.display = 'block';
                return;
            }

            const review = {
                id: Date.now(),
                name: name || (currentUser ? currentUser.name : ''),
                rating: rating || 5,
                text: text,
                timestamp: new Date().toISOString(),
            };

            reviewManager.addReview(review);

            // Clear form
            textEl.value = '';
            if (nameEl) nameEl.value = '';
            ratingEl.value = '5';
            errorEl.style.display = 'none';
        }

        // --- ROUTING ---
        function navigateTo(pageId) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const target = document.getElementById(pageId);
            if(target) target.classList.add('active');
            
            document.querySelectorAll('.nav-links a.nav-item').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(pageId)) {
                    link.classList.add('active');
                }
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Initialization triggers for advanced tools
            if(pageId === 'calc-graph') { setTimeout(() => graphApp.init(), 50); } 
            if(pageId === 'calc-matrix') matrixApp.init();
            if(pageId === 'calc-sci') sciApp.init();
            if(pageId === 'calc-num-sys') { setTimeout(() => numSysApp.init(), 50); }
            if(pageId === 'calc-converter') { converterApp.init(); }
            if(pageId === 'calc-misc') { miscApp.init(); }
        }

        function toggleMobileNav() {
            const navLinks = document.getElementById('navLinks');
            if (navLinks) navLinks.classList.toggle('show');
        }

        // --- THEME / DARK MODE ---
        function toggleTheme() {
            const body = document.body;
            const icon = document.querySelector('#themeToggle i');
            
            if (body.getAttribute('data-theme') === 'dark') {
                body.removeAttribute('data-theme');
                if (icon) { icon.className = 'fa-solid fa-moon'; }
                localStorage.setItem('theme', 'light');
            } else {
                body.setAttribute('data-theme', 'dark');
                if (icon) { icon.className = 'fa-solid fa-sun'; }
                localStorage.setItem('theme', 'dark');
            }

            // Instantly redraw plots so they adapt to new dark/light CSS colors
            setTimeout(() => {
                if (document.getElementById('calc-graph').classList.contains('active')) graphApp.plot();
                if (document.getElementById('calc-calculus').classList.contains('active')) {
                    if(document.getElementById('tab-diff').classList.contains('active')) calculateDerivative();
                }
            }, 50);
        }

        if (localStorage.getItem('theme') === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            const icon = document.querySelector('#themeToggle i');
            if (icon) { icon.className = 'fa-solid fa-sun'; }
        }

        // --- 1. FOUR FUNCTION CALCULATOR ---
        const fourCalc = {
            current: '0', previous: '', op: undefined, shouldResetNext: false,
            updateUI() {
                const fourCurrent = document.getElementById('fourCurrent');
                const fourPrev = document.getElementById('fourPrev');
                if (fourCurrent) fourCurrent.innerText = this.current;
                if (fourPrev) fourPrev.innerText = this.previous + (this.op ? ` ${this.op}` : '');
            },
            clear() { this.current = '0'; this.previous = ''; this.op = undefined; this.updateUI(); },
            appendNum(num) {
                if (this.shouldResetNext) { this.current = '0'; this.shouldResetNext = false; }
                if (num === '.' && this.current.includes('.')) return;
                if (this.current === '0' && num !== '.') this.current = num.toString();
                else this.current = this.current.toString() + num.toString();
                this.updateUI();
            },
            appendOp(op) {
                if (this.current === '') return;
                if (this.previous !== '' && !this.shouldResetNext) this.compute(false);
                this.op = op; this.previous = this.current; this.current = '0'; 
                this.shouldResetNext = false; this.updateUI();
            },
            toggleSign() { this.current = (parseFloat(this.current) * -1).toString(); this.updateUI(); },
            compute(final = true) {
                let curr = parseFloat(this.current); let prev = parseFloat(this.previous);
                if (isNaN(prev) || isNaN(curr)) return;
                let result;
                switch (this.op) {
                    case '+': result = prev + curr; break;
                    case '-': result = prev - curr; break;
                    case '*': result = prev * curr; break;
                    case '/': result = curr === 0 ? 'Error' : prev / curr; break;
                    case '%': result = prev % curr; break;
                    default: return;
                }
                
                // Save to history before updating current
                if (final) {
                    const input = `${this.previous} ${this.op} ${this.current}`;
                    calcHistory.saveCalculation('Standard Calculator', input, result.toString());
                }
                
                this.current = result.toString();
                if(final) { this.op = undefined; this.previous = ''; this.shouldResetNext = true; }
                this.updateUI();
            }
        };

        // --- 2. SCIENTIFIC CALCULATOR ---
        const sciApp = {
            expr: '0', ans: 0, angleMode: 'rad',
            init() { this.updateUI(); },
            switchTab(tabId) {
                document.getElementById('vk-main').style.display = tabId === 'main' ? 'grid' : 'none';
                document.getElementById('vk-func').style.display = tabId === 'func' ? 'grid' : 'none';
                document.getElementById('vk-abc').style.display = tabId === 'abc' ? 'block' : 'none';
                document.querySelectorAll('.vk-tab').forEach(el => el.classList.remove('active'));
                document.querySelector(`.vk-tab[onclick*="${tabId}"]`).classList.add('active');
            },
            setAngle(mode) {
                this.angleMode = mode;
                document.getElementById('sci-rad').classList.toggle('active', mode === 'rad');
                document.getElementById('sci-deg').classList.toggle('active', mode === 'deg');
            },
            updateUI() {
                let display = this.expr.replace(/\*/g, '×').replace(/\//g, '÷').replace(/pi/g, 'π');
                document.getElementById('sci-input').innerHTML = display + '<span style="border-right: 2px solid var(--primary); animation: blink 1s step-end infinite;"></span>';
            },
            clearAll() { this.expr = '0'; document.getElementById('sci-history').innerText = ''; this.updateUI(); },
            backspace() { this.expr = this.expr.slice(0, -1); if(this.expr === '') this.expr = '0'; this.updateUI(); },
            type(val) {
                if(this.expr === '0' && val !== '.') this.expr = val; else this.expr += val;
                this.updateUI();
            },
            compute() {
                try {
                    let toEvaluate = this.expr.replace(/ans/g, this.ans.toString());
                    let result = math.evaluate(toEvaluate);
                    if (this.angleMode === 'deg' && this.expr.includes('sin(')) result = math.evaluate(toEvaluate.replace(/sin\(/g, 'sin((pi/180)*'));
                    result = math.format(result, {precision: 10});
                    document.getElementById('sci-history').innerText = this.expr + ' =';
                    
                    // Save to history
                    calcHistory.saveCalculation('Scientific Calculator', this.expr, result);
                    
                    this.expr = result.toString(); this.ans = result; this.updateUI();
                } catch (e) {
                    document.getElementById('sci-input').innerText = 'Error'; setTimeout(() => this.clearAll(), 1500);
                }
            }
        };

        // --- 3. INTERACTIVE GRAPHING CALCULATOR ---
        const graphApp = {
            equations: [
                { id: 1, expr: 'sin(x)', color: '#3b82f6' },
                { id: 2, expr: 'x^2 / 10', color: '#a855f7' }
            ],
            nextId: 3,
            colors: ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'],
            
            init() { this.renderList(); setTimeout(()=> this.plot(), 100); },
            addEquation() {
                this.equations.push({ id: this.nextId++, expr: '', color: this.colors[this.equations.length % this.colors.length] });
                this.renderList();
            },
            clearAll() {
                this.equations = [];
                this.renderList();
                this.plot();
            },
            removeEquation(id) { this.equations = this.equations.filter(eq => eq.id !== id); this.renderList(); this.plot(); },
            updateEquation(id, val) {
                const eq = this.equations.find(e => e.id === id);
                if (eq) { eq.expr = val; this.plot(); }
            },
            renderList() {
                const list = document.getElementById('equation-list'); if (!list) return;
                list.innerHTML = this.equations.map(eq => `
                    <div class="graph-eq-item glass">
                        <div class="graph-eq-color" style="background: ${eq.color}; box-shadow: 0 0 0 3px ${eq.color}40;"><i class="fa-solid fa-wave-square" style="font-size: 0.6rem;"></i></div>
                        <span style="font-family: 'Times New Roman', serif; font-size: 1.4rem; margin-right: 8px; color: var(--text-main); font-style: italic; font-weight:bold;">y = </span>
                        <input type="text" class="graph-eq-input" value="${eq.expr}" oninput="graphApp.updateEquation(${eq.id}, this.value)" placeholder="e.g. cos(x) + 2">
                        <button class="icon-btn" style="color: var(--text-muted); width: 30px; height: 30px;" onclick="graphApp.removeEquation(${eq.id})"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `).join('');
            },
            plot() {
                const graphDiv = document.getElementById('plotly-graph'); if (!graphDiv) return;
                const xValues = math.range(-10, 10, 0.05).toArray(); const data = [];
                
                this.equations.forEach(eq => {
                    if (!eq.expr.trim()) return;
                    try {
                        const compiled = math.compile(eq.expr);
                        const yValues = xValues.map(x => { try { return compiled.evaluate({x: x}); } catch(e) { return null; } });
                        data.push({ x: xValues, y: yValues, type: 'scatter', mode: 'lines', name: `y = ${eq.expr}`, line: { color: eq.color, width: 3 } });
                    } catch(e) {}
                });
                
                const textColor = getComputedStyle(document.body).getPropertyValue('--text-main').trim() || '#0f172a';
                const isDark = document.body.getAttribute('data-theme') === 'dark';
                const gridColor = isDark ? '#334155' : '#e2e8f0'; 

                const layout = {
                    margin: { t: 30, b: 30, l: 30, r: 30 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                    font: { color: textColor },
                    xaxis: { zerolinecolor: textColor, gridcolor: gridColor, dtick: 1 },
                    yaxis: { zerolinecolor: textColor, gridcolor: gridColor, dtick: 1 },
                    showlegend: true, legend: { x: 0, y: 1.1, orientation: 'h' },
                    dragmode: 'pan', hovermode: 'x unified'
                };
                Plotly.newPlot('plotly-graph', data, layout, {
                    responsive: true, 
                    displayModeBar: false,
                    scrollZoom: true,
                    doubleClick: false
                });
            },
            downloadGraph() {
                const graphDiv = document.getElementById('plotly-graph');
                if (!graphDiv) {
                    alert('No graph to download. Please add some equations first.');
                    return;
                }

                // Use Plotly's built-in download functionality
                Plotly.downloadImage(graphDiv, {
                    format: 'png',
                    width: 1200,
                    height: 800,
                    filename: `math-graph-${new Date().toISOString().split('T')[0]}`
                });
            }
        };

        // --- 4. MATRIX CALCULATOR ---
        const matrixApp = {
            mode: 'eval', currentEdit: null, matrices: {}, expr: '', history: [],
            init() { 
                this.matrices = {};
                this.history = [];
                this.expr = '';
                this.mode = 'eval';
                this.renderLeftPanel(); 
                this.renderDisplay(); 
            },
            newMatrix() {
                const names = 'ABCDEFGH'.split(''); let next = names.find(n => !this.matrices[n]) || 'A';
                if(!this.matrices[next]) this.matrices[next] = [[0, 0], [0, 0]];
                this.mode = 'edit'; this.currentEdit = next; this.renderLeftPanel(); this.renderDisplay();
            },
            changeDim(dim, delta) {
                let mat = this.matrices[this.currentEdit];
                if(dim === 'row') { if(delta > 0 && mat.length < 6) mat.push(new Array(mat[0].length).fill(0)); else if(delta < 0 && mat.length > 1) mat.pop(); } 
                else { if(delta > 0 && mat[0].length < 6) mat.forEach(r => r.push(0)); else if(delta < 0 && mat[0].length > 1) mat.forEach(r => r.pop()); }
                this.renderLeftPanel(); this.renderDisplay();
            },
            updateCell(r, c, val) { this.matrices[this.currentEdit][r][c] = parseFloat(val) || 0; },
            type(val) {
                if(this.mode === 'edit') {
                    const active = document.activeElement;
                    if(active && active.classList.contains('matrix-cell-input')) { active.value += val; const [r, c] = active.dataset.pos.split(',').map(Number); this.updateCell(r, c, active.value); }
                } else { this.expr += val; this.renderDisplay(); }
            },
            backspace() {
                if(this.mode === 'edit') {
                    const active = document.activeElement;
                    if(active && active.classList.contains('matrix-cell-input')) { active.value = active.value.slice(0, -1); const [r, c] = active.dataset.pos.split(',').map(Number); this.updateCell(r, c, active.value); }
                } else { this.expr = this.expr.slice(0, -1); this.renderDisplay(); }
            },
            moveCursor(dir) {
                if(this.mode !== 'edit') return;
                const active = document.activeElement;
                if(active && active.classList.contains('matrix-cell-input')) {
                    const inputs = Array.from(document.querySelectorAll('.matrix-cell-input'));
                    const idx = inputs.indexOf(active);
                    if(dir === 'right' && idx < inputs.length - 1) inputs[idx+1].focus();
                    if(dir === 'left' && idx > 0) inputs[idx-1].focus();
                }
            },
            undo() {
                if(this.mode === 'eval') {
                    if (this.expr.length > 0) {
                        this.expr = this.expr.slice(0, -1);
                    } else if (this.history.length > 0) {
                        const lastItem = this.history.pop();
                        if (this.matrices[lastItem.expr] !== undefined) delete this.matrices[lastItem.expr];
                    }
                    this.renderLeftPanel();
                    this.renderDisplay();
                } else if (this.mode === 'edit') {
                    delete this.matrices[this.currentEdit];
                    this.mode = 'eval';
                    this.expr = '';
                    this.renderLeftPanel();
                    this.renderDisplay();
                }
            },
            removeHistory(index) {
                const item = this.history[index];
                if (this.matrices[item.expr] !== undefined) {
                    delete this.matrices[item.expr];
                    this.renderLeftPanel();
                }
                this.history.splice(index, 1);
                this.renderDisplay();
            },
            enter() {
                if(this.mode === 'edit') {
                    this.mode = 'eval'; this.expr = '';
                    const matCopy = this.matrices[this.currentEdit].map(row => [...row]);
                    this.history.push({ expr: this.currentEdit, result: matCopy });
                    this.renderLeftPanel(); this.renderDisplay();
                } else {
                    if(!this.expr.trim()) return;
                    try {
                        let toEval = this.expr.replace(/A²/g, 'A*A').replace(/B²/g, 'B*B').replace(/A⁻¹/g, 'inv(A)').replace(/Aᵀ/g, 'transpose(A)');
                        const scope = { ...this.matrices };
                        const res = math.evaluate(toEval, scope);
                        this.history.push({ expr: this.expr, result: res });
                        this.expr = ''; this.renderDisplay();
                        setTimeout(() => { const disp = document.getElementById('matrix-display-area'); if(disp) disp.scrollTop = disp.scrollHeight; }, 50);
                    } catch(e) {
                        this.expr = 'Error'; this.renderDisplay(); setTimeout(() => { this.expr = ''; this.renderDisplay(); }, 1500);
                    }
                }
            },
            clearAll() { this.matrices = {}; this.history = []; this.expr = ''; this.mode = 'eval'; this.renderLeftPanel(); this.renderDisplay(); },
            renderLeftPanel() {
                const panel = document.getElementById('matrix-left-panel'); if(!panel) return;
                if(this.mode === 'edit') {
                    const mat = this.matrices[this.currentEdit];
                    panel.innerHTML = `
                    <div class="matrix-edit-controls" style="width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <div style="text-align: center; margin-bottom: 15px; color: var(--text-muted); font-weight: 500;">Edit Matrix <span style="color:var(--text-main); font-weight:bold;">${this.currentEdit}</span></div>
                        <div class="matrix-dim-row" style="display:flex; gap:10px; margin-bottom:10px; align-items:center;">
                            <button class="mk-btn mk-white" style="width:40px;height:40px;padding:0;" onclick="matrixApp.changeDim('row', -1)">−</button>
                            <div class="dim-label" style="text-align:center; font-size:0.85rem; color:var(--text-muted); width:60px;">Rows<br><b style="font-size:1.1rem; color:var(--text-main);">${mat.length}</b></div>
                            <button class="mk-btn mk-white" style="width:40px;height:40px;padding:0;" onclick="matrixApp.changeDim('row', 1)">+</button>
                        </div>
                        <div class="matrix-dim-row" style="display:flex; gap:10px; align-items:center;">
                            <button class="mk-btn mk-white" style="width:40px;height:40px;padding:0;" onclick="matrixApp.changeDim('col', -1)">−</button>
                            <div class="dim-label" style="text-align:center; font-size:0.85rem; color:var(--text-muted); width:60px;">Columns<br><b style="font-size:1.1rem; color:var(--text-main);">${mat[0].length}</b></div>
                            <button class="mk-btn mk-white" style="width:40px;height:40px;padding:0;" onclick="matrixApp.changeDim('col', 1)">+</button>
                        </div>
                    </div>`;
                } else {
                    panel.innerHTML = `
                    <div class="matrix-keypad left-eval">
                        <button class="mk-btn mk-white" onclick="matrixApp.type('A')">A</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('B')">B</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('C')">C</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('D')">D</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('E')">E</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('F')">F</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('G')">G</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('H')">H</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('²')">A²</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('⁻¹')">A⁻¹</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('ᵀ')">Aᵀ</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('^')">Aⁿ</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('inv(')">inv</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('det(')">det</button>
                        <button class="mk-btn mk-white" onclick="matrixApp.type('trace(')">trace</button>
                        <button class="mk-btn mk-white" style="visibility:hidden;"></button>
                    </div>`;
                }
            },
            formatMatrixHTML(mat, isEdit = false) {
                if (!mat || !mat[0]) return ''; let html = `<div class="matrix-bracket-wrap"><div class="matrix-grid-display" style="grid-template-columns: repeat(${mat[0].length}, 1fr);">`;
                for(let r=0; r<mat.length; r++) { for(let c=0; c<mat[r].length; c++) { if(isEdit) { html += `<input type="number" class="matrix-cell-input glass" data-pos="${r},${c}" value="${mat[r][c]}" onchange="matrixApp.updateCell(${r},${c},this.value)" onclick="this.select()">`; } else { let val = mat[r][c]; if(typeof val === 'number') val = parseFloat(val.toFixed(4)); html += `<div class="matrix-cell-static">${val}</div>`; } } }
                html += `</div></div>`; return html;
            },
            renderDisplay() {
                const disp = document.getElementById('matrix-display-area'); if(!disp) return; let html = '';
                
                html += `<div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed var(--matrix-border);">`;
                this.history.forEach((item, index) => {
                    html += `<div class="matrix-line" style="justify-content:space-between; margin-bottom:15px; width: 100%; align-items:center;">`;
                    html += `<div style="display:flex; align-items:center;"><span style="font-style:italic; margin-right:10px;">${item.expr}</span>`;
                    let resData = item.result; if (item.result && item.result._data) resData = item.result._data;
                    if(Array.isArray(resData)) { html += `<span style="color:var(--primary);"> = ${this.formatMatrixHTML(resData, false)}</span>`; } else { let val = item.result; if(typeof val === 'number') val = parseFloat(val.toFixed(6)); html += `<span style="color:var(--primary); font-size: 1.5rem; font-family:'Times New Roman',serif;"> = ${val}</span>`; } 
                    html += `</div>`;
                    html += `<button class="icon-btn" style="color: #ef4444; background: rgba(239, 68, 68, 0.1); width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;" onclick="matrixApp.removeHistory(${index})" title="Remove"><i class="fa-solid fa-trash-can" style="font-size: 0.9rem;"></i></button>`;
                    html += `</div>`;
                });
                html += `</div>`;

                if(this.mode === 'edit') {
                    html += `<div class="matrix-line" style="margin-top:20px;">
                        <span style="color:var(--primary); font-style:italic; font-weight:bold; margin-right:10px;">${this.currentEdit} = </span>` + 
                        this.formatMatrixHTML(this.matrices[this.currentEdit], true) + 
                    `</div>`;
                    
                    disp.innerHTML = html; 
                    setTimeout(() => { 
                        const firstInput = disp.querySelector('.matrix-cell-input'); 
                        if(firstInput) firstInput.focus(); 
                    }, 50);
                } else {
                    html += `<div class="matrix-line" style="margin-top:20px; min-height:30px;">
                        <span style="font-family:'Courier New', monospace; font-size:1.3rem;">${this.expr}<span style="border-right: 2px solid var(--primary); animation: blink 1s step-end infinite;"></span></span>
                    </div>`;
                    disp.innerHTML = html;
                }
                setTimeout(() => { disp.scrollTop = disp.scrollHeight; }, 50);
            }
        };

        // --- 5. NUMBER SYSTEM CONVERTER LOGIC ---
        const numSysApp = {
            bitLength: 16,
            value: 0n,
            
            init() {
                this.clear(); 
            },
            changeFormat(bits) {
                this.bitLength = parseInt(bits);
                const maxVal = (1n << BigInt(this.bitLength)) - 1n;
                this.value = this.value & maxVal;
                this.updateAllInputs();
            },
            toggleBit(index) {
                const mask = 1n << BigInt(index);
                this.value ^= mask; 
                this.updateAllInputs();
            },
            convert(source, val) {
                val = val.trim().replace(/\s/g, '');
                if (val === '') {
                    this.clear();
                    return;
                }
                try {
                    let parsed = 0n;
                    if (source === 'dec') parsed = BigInt(val);
                    if (source === 'bin') parsed = BigInt('0b' + val);
                    if (source === 'hex') parsed = BigInt('0x' + val);
                    if (source === 'oct') parsed = BigInt('0o' + val);
                    
                    const maxVal = (1n << BigInt(this.bitLength)) - 1n;
                    this.value = parsed & maxVal;
                    this.updateAllInputs(source);
                } catch(e) {}
            },
            updateAllInputs(exclude = null) {
                if (exclude !== 'dec') document.getElementById('num-dec').value = this.value.toString(10);
                if (exclude !== 'bin') document.getElementById('num-bin').value = this.value.toString(2).padStart(this.bitLength, '0');
                if (exclude !== 'hex') document.getElementById('num-hex').value = this.value.toString(16).toUpperCase().padStart(Math.ceil(this.bitLength / 4), '0');
                if (exclude !== 'oct') document.getElementById('num-oct').value = this.value.toString(8).padStart(Math.ceil(this.bitLength / 3), '0');
                
                this.renderBits();
            },
            clear() {
                this.value = 0n;
                document.getElementById('num-dec').value = '';
                document.getElementById('num-bin').value = '';
                document.getElementById('num-hex').value = '';
                document.getElementById('num-oct').value = '';
                this.renderBits();
            },
            renderBits() {
                const container = document.getElementById('bits-container');
                if(!container) return;
                
                let html = '<div style="display:flex; flex-wrap:wrap; justify-content:flex-end; gap: 8px;">';
                for(let i = this.bitLength - 1; i >= 0; i--) {
                    const isSet = (this.value & (1n << BigInt(i))) !== 0n;
                    if (i === this.bitLength - 1 || (i + 1) % 4 === 0) {
                        html += `<div style="display:flex; border: 1px solid var(--glass-border); border-radius: 8px; overflow: hidden; box-shadow: var(--glass-shadow);">`;
                    }
                    html += `
                        <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer; background: var(--glass-bg); border-right: ${(i%4 !== 0) ? '1px solid var(--glass-border)' : 'none'};" onclick="numSysApp.toggleBit(${i})">
                            <div style="font-size: 0.7rem; color: var(--text-muted); width: 100%; text-align: center; padding: 4px 0; background: var(--glass-panel); border-bottom: 1px solid var(--glass-border); font-weight: 600;">${i}</div>
                            <div class="bit-cell" style="color: ${isSet ? 'white' : 'var(--text-main)'}; background: ${isSet ? 'var(--primary)' : 'transparent'};">
                                ${isSet ? '1' : '0'}
                            </div>
                        </div>
                    `;
                    if (i % 4 === 0) {
                        html += `</div>`; 
                    }
                }
                html += '</div>';
                container.innerHTML = html;
            }
        };

        // --- PRACTICE ZONE ---
        const practiceZone = {
            difficulty: 'medium',
            questionType: 'mixed',
            currentQuestion: null,
            currentAnswer: null,
            score: { correct: 0, incorrect: 0, streak: 0 },

            changeDifficulty(level) {
                this.difficulty = level;
                this.resetScore();
            },

            changeType(type) {
                this.questionType = type;
                this.resetScore();
            },

            generateQuestion() {
                const difficulty = this.difficulty;
                const type = this.questionType;

                let question = {};
                let num1, num2, answer;

                // Generate numbers based on difficulty
                const getNumber = (level) => {
                    switch(level) {
                        case 'easy': return Math.floor(Math.random() * 20) + 1;
                        case 'medium': return Math.floor(Math.random() * 100) + 1;
                        case 'hard': return Math.floor(Math.random() * 1000) + 1;
                        default: return Math.floor(Math.random() * 50) + 1;
                    }
                };

                num1 = getNumber(difficulty);
                num2 = getNumber(difficulty);

                // Ensure num2 is not zero for division
                if (type === 'division') {
                    while (num2 === 0) num2 = getNumber(difficulty);
                }

                switch(type) {
                    case 'addition':
                        answer = num1 + num2;
                        question.text = `${num1} + ${num2} = ?`;
                        question.hint = "Add the two numbers together";
                        break;
                    case 'subtraction':
                        // Ensure positive result
                        if (num1 < num2) [num1, num2] = [num2, num1];
                        answer = num1 - num2;
                        question.text = `${num1} - ${num2} = ?`;
                        question.hint = "Subtract the smaller number from the larger one";
                        break;
                    case 'multiplication':
                        answer = num1 * num2;
                        question.text = `${num1} × ${num2} = ?`;
                        question.hint = "Multiply the two numbers";
                        break;
                    case 'division':
                        answer = Math.round((num1 / num2) * 100) / 100; // Round to 2 decimal places
                        question.text = `${num1} ÷ ${num2} = ?`;
                        question.hint = "Divide the first number by the second";
                        break;
                    case 'algebra':
                        // Simple algebra: x + a = b, find x
                        const a = getNumber(difficulty);
                        const b = getNumber(difficulty) + a;
                        answer = b - a;
                        question.text = `x + ${a} = ${b}, what is x?`;
                        question.hint = "Subtract the known number from both sides";
                        break;
                    case 'mixed':
                    default:
                        const operations = ['addition', 'subtraction', 'multiplication', 'division'];
                        const randomOp = operations[Math.floor(Math.random() * operations.length)];
                        return this.generateQuestionForType(randomOp, difficulty);
                }

                question.answer = answer;
                return question;
            },

            generateQuestionForType(type, difficulty) {
                // Helper method for mixed questions
                const originalType = this.questionType;
                this.questionType = type;
                const question = this.generateQuestion();
                this.questionType = originalType;
                return question;
            },

            newQuestion() {
                this.currentQuestion = this.generateQuestion();
                this.currentAnswer = this.currentQuestion.answer;

                document.getElementById('question-text').textContent = this.currentQuestion.text;
                document.getElementById('question-hint').textContent = this.currentQuestion.hint;
                document.getElementById('practice-answer').value = '';
                document.getElementById('practice-answer').focus();
                document.getElementById('check-answer-btn').disabled = false;
                document.getElementById('practice-feedback').innerHTML = '';
            },

            checkAnswer() {
                const userAnswer = parseFloat(document.getElementById('practice-answer').value.trim());

                if (isNaN(userAnswer)) {
                    this.showFeedback('Please enter a valid number!', 'error');
                    return;
                }

                const isCorrect = Math.abs(userAnswer - this.currentAnswer) < 0.01; // Allow small floating point differences

                if (isCorrect) {
                    this.score.correct++;
                    this.score.streak++;
                    this.showFeedback('Correct! 🎉', 'success');
                } else {
                    this.score.incorrect++;
                    this.score.streak = 0;
                    this.showFeedback(`Incorrect. The answer is ${this.currentAnswer}`, 'error');
                }

                this.updateScore();
                document.getElementById('check-answer-btn').disabled = true;
            },

            showFeedback(message, type) {
                const feedbackDiv = document.getElementById('practice-feedback');
                const color = type === 'success' ? '#10b981' : '#ef4444';
                feedbackDiv.innerHTML = `<div style="font-size: 1.2rem; font-weight: 600; color: ${color}; padding: 1rem; background: rgba(${color === '#10b981' ? '16, 185, 129' : '239, 68, 68'}, 0.1); border-radius: 8px; border: 1px solid rgba(${color === '#10b981' ? '16, 185, 129' : '239, 68, 68'}, 0.2);">${message}</div>`;
            },

            updateScore() {
                const total = this.score.correct + this.score.incorrect;
                const accuracy = total > 0 ? Math.round((this.score.correct / total) * 100) : 0;

                document.getElementById('correct-count').textContent = this.score.correct;
                document.getElementById('incorrect-count').textContent = this.score.incorrect;
                document.getElementById('accuracy-percent').textContent = `${accuracy}%`;
                document.getElementById('streak-count').textContent = this.score.streak;
            },

            resetScore() {
                this.score = { correct: 0, incorrect: 0, streak: 0 };
                this.updateScore();
                document.getElementById('practice-feedback').innerHTML = '';
                document.getElementById('question-text').textContent = 'Click "New Question" to start practicing!';
                document.getElementById('question-hint').textContent = '';
                document.getElementById('practice-answer').value = '';
                document.getElementById('check-answer-btn').disabled = true;
            }
        };

        // --- 6. UNIT CONVERTER LOGIC ---
        const converterApp = {
            currentCategory: 'length',
            data: {
                length: {
                    base: 'meter',
                    units: {
                        meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001,
                        micrometer: 0.000001, nanometer: 0.000000001, mile: 1609.34, 
                        yard: 0.9144, foot: 0.3048, inch: 0.0254, light_year: 9.461e15
                    }
                },
                temperature: {
                    base: 'celsius',
                    units: { celsius: 1, fahrenheit: 1, kelvin: 1 } // Special formulas used
                },
                area: {
                    base: 'square_meter',
                    units: {
                        square_meter: 1, square_kilometer: 1000000, square_centimeter: 0.0001,
                        hectare: 10000, acre: 4046.86, square_mile: 2589990, 
                        square_yard: 0.836127, square_foot: 0.092903, square_inch: 0.00064516
                    }
                },
                volume: {
                    base: 'liter',
                    units: {
                        liter: 1, milliliter: 0.001, cubic_meter: 1000,
                        gallon_us: 3.78541, quart_us: 0.946353, pint_us: 0.473176, cup_us: 0.236588,
                        fluid_ounce_us: 0.0295735, cubic_foot: 28.3168, cubic_inch: 0.0163871
                    }
                },
                weight: {
                    base: 'kilogram',
                    units: {
                        kilogram: 1, gram: 0.001, milligram: 0.000001, metric_ton: 1000,
                        pound: 0.453592, ounce: 0.0283495, stone: 6.35029
                    }
                },
                time: {
                    base: 'second',
                    units: {
                        second: 1, millisecond: 0.001, minute: 60, hour: 3600,
                        day: 86400, week: 604800, month: 2592000, year: 31536000
                    }
                }
            },
            fromUnit: 'meter',
            toUnit: 'kilometer',

            init() {
                this.renderTabs();
                this.switchCategory('length');
            },

            renderTabs() {
                const container = document.getElementById('converter-tabs');
                let html = '';
                for (let cat in this.data) {
                    const label = cat.charAt(0).toUpperCase() + cat.slice(1);
                    html += `<button class="calc-tab-btn ${cat === this.currentCategory ? 'active' : ''}" onclick="converterApp.switchCategory('${cat}')">${label}</button>`;
                }
                container.innerHTML = html;
            },

            switchCategory(category) {
                this.currentCategory = category;
                this.renderTabs();
                
                const units = Object.keys(this.data[category].units);
                this.fromUnit = units[0];
                this.toUnit = units[1] || units[0];
                
                document.getElementById('conv-from-val').value = '1';
                
                this.renderLists();
                this.calculate('from');
            },

            renderLists() {
                const units = Object.keys(this.data[this.currentCategory].units);
                
                const buildList = (type, currentSelection) => {
                    return units.map(u => {
                        const label = u.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        const isActive = u === currentSelection ? 'active' : '';
                        return `<div class="unit-item ${isActive}" onclick="converterApp.selectUnit('${type}', '${u}')">${label}</div>`;
                    }).join('');
                };

                document.getElementById('conv-from-list').innerHTML = buildList('from', this.fromUnit);
                document.getElementById('conv-to-list').innerHTML = buildList('to', this.toUnit);
            },

            selectUnit(type, unit) {
                if (type === 'from') this.fromUnit = unit;
                else this.toUnit = unit;
                this.renderLists();
                this.calculate('from');
            },

            calculate(sourceChanged) {
                const fromInput = document.getElementById('conv-from-val');
                const toInput = document.getElementById('conv-to-val');
                
                let val = parseFloat(sourceChanged === 'from' ? fromInput.value : toInput.value);
                if (isNaN(val)) {
                    if (sourceChanged === 'from') toInput.value = '';
                    else fromInput.value = '';
                    return;
                }

                let result;
                
                if (this.currentCategory === 'temperature') {
                    let inCelsius;
                    const fromU = sourceChanged === 'from' ? this.fromUnit : this.toUnit;
                    const toU = sourceChanged === 'from' ? this.toUnit : this.fromUnit;

                    if (fromU === 'celsius') inCelsius = val;
                    else if (fromU === 'fahrenheit') inCelsius = (val - 32) * 5/9;
                    else if (fromU === 'kelvin') inCelsius = val - 273.15;

                    if (toU === 'celsius') result = inCelsius;
                    else if (toU === 'fahrenheit') result = (inCelsius * 9/5) + 32;
                    else if (toU === 'kelvin') result = inCelsius + 273.15;
                } else {
                    const factors = this.data[this.currentCategory].units;
                    if (sourceChanged === 'from') {
                        const inBase = val * factors[this.fromUnit];
                        result = inBase / factors[this.toUnit];
                    } else {
                        const inBase = val * factors[this.toUnit];
                        result = inBase / factors[this.fromUnit];
                    }
                }

                result = parseFloat(result.toFixed(6));
                if (sourceChanged === 'from') toInput.value = result;
                else fromInput.value = result;
            }
        };

        // --- 7. CALCULUS LOGIC ---
        function switchCalcTab(event, tabId) {
            document.querySelectorAll('.calc-tab-content').forEach(el => el.classList.remove('active')); 
            document.querySelectorAll('.calc-tab-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(`tab-${tabId}`).classList.add('active'); 
            event.currentTarget.classList.add('active');
        }

        function toggleIntType() {
            const isDefinite = document.getElementById('int-type-def').checked;
            document.getElementById('int-bounds-container').style.display = isDefinite ? 'flex' : 'none';
        }

        function calculateDerivative() {
            const expr = document.getElementById('diff-input').value.trim(); 
            const resBox = document.getElementById('diff-result');
            if(!expr) return;
            try {
                const deriv1 = math.derivative(expr, 'x'); 
                const d1Simp = math.simplify(deriv1);
                const d1Str = d1Simp.toString();
                
                const deriv2 = math.derivative(d1Simp, 'x');
                const d2Simp = math.simplify(deriv2);
                const d2Str = d2Simp.toString();
                
                let tex = `\\begin{aligned} `;
                tex += `f(x) &= ${math.parse(expr).toTex()} \\\\ `;
                tex += `f'(x) &= ${math.parse(d1Str).toTex()} \\\\ `;
                tex += `f''(x) &= ${math.parse(d2Str).toTex()} `;
                tex += `\\end{aligned}`;
                
                katex.render(tex, resBox, { displayMode: true, throwOnError: false });
                drawCalculusGraph('diff-plot', expr, d1Str, d2Str);
            } catch (err) { 
                resBox.innerHTML = `<span style="color:#ef4444">Error parsing function. Ensure it uses standard syntax like '(x^2) / (x-1)'.</span>`; 
            }
        }

        function drawCalculusGraph(divId, f0, f1, f2) {
            try {
                const targetDiv = document.getElementById(divId); if (!targetDiv) return;
                const c0 = math.compile(f0); const c1 = math.compile(f1); const c2 = math.compile(f2);
                const xValues = math.range(-10, 10, 0.05).toArray();
                const y0 = xValues.map(x => { try { return c0.evaluate({x: x}); } catch(e){ return null;} });
                const y1 = xValues.map(x => { try { return c1.evaluate({x: x}); } catch(e){ return null;} });
                const y2 = xValues.map(x => { try { return c2.evaluate({x: x}); } catch(e){ return null;} });
                
                const isDark = document.body.getAttribute('data-theme') === 'dark';
                const annotations = [];
                const traces = [
                    { x: xValues, y: y0, type: 'scatter', mode: 'lines', name: "f(x)", line: {color: '#2563eb', width: 3} },
                    { x: xValues, y: y1, type: 'scatter', mode: 'lines', name: "f'(x)", line: {color: '#f59e0b', width: 2} },
                    { x: xValues, y: y2, type: 'scatter', mode: 'lines', name: "f''(x)", line: {color: '#22c55e', width: 2} }
                ];
                
                for(let i=1; i<xValues.length; i++) {
                    if(y1[i] !== null && y1[i-1] !== null && y1[i] * y1[i-1] <= 0) {
                        if(Math.abs(y1[i] - y1[i-1]) < 10) { 
                            let dx = xValues[i] - xValues[i-1]; let dy = y1[i] - y1[i-1];
                            let xExt = xValues[i-1] - y1[i-1] * (dx/dy); let yExt = c0.evaluate({x: xExt}); let d2Val = c2.evaluate({x: xExt});
                            let label = 'INFLECTION'; if(d2Val > 0.1) label = 'LOCAL MIN'; else if(d2Val < -0.1) label = 'LOCAL MAX';
                            traces.push({ x: [xExt], y: [yExt], type: 'scatter', mode: 'markers', showlegend: false, marker: { size: 10, color: '#ffffff', line: {color: '#3b82f6', width: 2} }, hoverinfo: 'none' });
                            annotations.push({ x: xExt, y: yExt, text: label, showarrow: true, arrowhead: 0, ax: 0, ay: label === 'LOCAL MIN' ? 30 : -30, bgcolor: isDark ? '#1e293b' : '#ffffff', bordercolor: '#3b82f6', borderwidth: 1, borderpad: 4, font: {size: 11, color: isDark ? '#f8fafc' : '#0f172a'} });
                        }
                    }
                }
                
                let rootCount = 1;
                for(let i=1; i<xValues.length; i++) {
                    if(y0[i] !== null && y0[i-1] !== null && y0[i] * y0[i-1] <= 0) {
                        if(Math.abs(y0[i] - y0[i-1]) < 10) {
                            let dx = xValues[i] - xValues[i-1]; let dy = y0[i] - y0[i-1];
                            let xRoot = xValues[i-1] - y0[i-1] * (dx/dy);
                            traces.push({ x: [xRoot], y: [0], type: 'scatter', mode: 'markers', showlegend: false, marker: { size: 10, color: '#ffffff', line: {color: '#22c55e', width: 2} }, hoverinfo: 'none' });
                            annotations.push({ x: xRoot, y: 0, text: `ROOT ${rootCount++}`, showarrow: true, arrowhead: 0, ax: 0, ay: 30, bgcolor: isDark ? '#1e293b' : '#ffffff', bordercolor: '#22c55e', borderwidth: 1, borderpad: 4, font: {size: 11, color: isDark ? '#f8fafc' : '#0f172a'} });
                        }
                    }
                }

                const textColor = getComputedStyle(document.body).getPropertyValue('--text-main').trim();
                const gridColor = isDark ? '#334155' : '#e2e8f0'; 
                const layout = { margin: { t: 30, b: 40, l: 40, r: 20 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: textColor }, xaxis: { zerolinecolor: textColor, gridcolor: gridColor, title: 'x' }, yaxis: { zerolinecolor: textColor, gridcolor: gridColor, title: 'y' }, legend: { orientation: "h", y: 1.1, x: 0 }, dragmode: 'pan', hovermode: 'x unified', annotations: annotations };
                Plotly.newPlot(divId, traces, layout, { responsive: true, displayModeBar: false, scrollZoom: true, doubleClick: false });
            } catch(e) {}
        }

        function calculateIntegral() {
            const expr = document.getElementById('int-input').value.trim(); const resBox = document.getElementById('int-result');
            if(!expr) return;
            const isDefinite = document.getElementById('int-type-def').checked;
            try {
                let texExpr = ""; try { texExpr = math.parse(expr).toTex(); } catch(e) { texExpr = expr; }
                if (isDefinite) {
                    const aStr = document.getElementById('int-a').value; const bStr = document.getElementById('int-b').value;
                    const a = math.evaluate(aStr); const b = math.evaluate(bStr);
                    const n = 1000; const h = (b - a) / n; const f = math.compile(expr);
                    let sum = f.evaluate({x: a}) + f.evaluate({x: b});
                    for (let i = 1; i < n; i++) { let x = a + i * h; sum += f.evaluate({x: x}) * (i % 2 === 0 ? 2 : 4); }
                    const result = math.format((h / 3) * sum, {precision: 7});
                    katex.render(`\\int_{${math.parse(aStr).toTex()}}^{${math.parse(bStr).toTex()}} \\left(${texExpr}\\right) dx \\approx ${result}`, resBox, { displayMode: true, throwOnError: false });
                } else {
                    const integral = nerdamer(`integrate(${expr}, x)`); const intTex = nerdamer.convertToLaTeX(integral.text());
                    katex.render(`\\int \\left(${texExpr}\\right) dx = ${intTex} + C`, resBox, { displayMode: true, throwOnError: false });
                }
            } catch (err) { resBox.innerHTML = `<span style="color:#ef4444">Error evaluating integral.</span>`; }
        }

        // --- 8. MISC CALCULATORS LOGIC ---
        const miscApp = {
            init() {
                this.calcBMI();
                this.calcInterest();
                this.calcMortgage();
                this.calcGPA();
            },
            switchTab(event, tabId) {
                document.querySelectorAll('#calc-misc .calc-tab-content').forEach(el => el.classList.remove('active')); 
                document.querySelectorAll('#calc-misc .calc-tab-btn').forEach(el => el.classList.remove('active'));
                document.getElementById(`misc-tab-${tabId}`).classList.add('active'); 
                event.currentTarget.classList.add('active');
            },
            addGpaRow() {
                const container = document.getElementById('gpa-rows-container');
                const row = document.createElement('div');
                row.className = 'gpa-row';
                row.innerHTML = `
                    <div class="math-input-group" style="flex: 1.5; margin:0;"><input type="text" placeholder="Course Name (Optional)"></div>
                    <div class="math-input-group" style="flex: 1; margin:0;"><input type="number" class="gpa-cred" placeholder="Credits" value="3"></div>
                    <div class="math-input-group" style="flex: 1; margin:0;">
                        <select class="glass-select gpa-grade" style="padding: 0.8rem;">
                            <option value="4.0">A+ (4.0)</option>
                            <option value="4.0" selected>A (4.0)</option>
                            <option value="3.7">A- (3.7)</option>
                            <option value="3.3">B+ (3.3)</option>
                            <option value="3.0">B (3.0)</option>
                            <option value="2.7">B- (2.7)</option>
                            <option value="2.3">C+ (2.3)</option>
                            <option value="2.0">C (2.0)</option>
                            <option value="1.7">C- (1.7)</option>
                            <option value="1.3">D+ (1.3)</option>
                            <option value="1.0">D (1.0)</option>
                            <option value="0.0">E (0.0)</option>
                            <option value="0.0">F (0.0)</option>
                        </select>
                    </div>
                    <button class="icon-btn" style="width: 48px; height: 48px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 12px;" onclick="this.parentElement.remove(); miscApp.calcGPA();"><i class="fa-solid fa-xmark"></i></button>
                `;
                container.appendChild(row);
            },
            calcBMI() {
                const w = parseFloat(document.getElementById('bmi-w').value);
                const h = parseFloat(document.getElementById('bmi-h').value);
                const age = parseInt(document.getElementById('bmi-age').value);
                const gender = document.querySelector('input[name="bmi-gender"]:checked').value;
                
                if(!w || !h || !age) return;
                
                const hm = h / 100;
                const bmi = w / (hm * hm);

                let category = "";
                let catColor = "";
                if (bmi < 16) { category = "Severe Thinness"; catColor = "#ef4444"; }
                else if (bmi < 18.5) { category = "Underweight"; catColor = "#f59e0b"; }
                else if (bmi < 25) { category = "Normal"; catColor = "#22c55e"; }
                else if (bmi < 30) { category = "Overweight"; catColor = "#f59e0b"; }
                else if (bmi < 35) { category = "Obesity Class I"; catColor = "#ef4444"; }
                else { category = "Obesity Class II+"; catColor = "#991b1b"; }

                const minWeight = (18.5 * hm * hm).toFixed(1);
                const maxWeight = (25 * hm * hm).toFixed(1);
                const bmiPrime = (bmi / 25).toFixed(2);
                const ponderal = (w / (hm * hm * hm)).toFixed(1);

                // Ideal Body Weight using Devine Formula based on Gender
                let ibw = 0;
                const inches = h / 2.54;
                if (inches > 60) {
                    ibw = (gender === 'male' ? 50.0 : 45.5) + 2.3 * (inches - 60);
                } else {
                    ibw = (gender === 'male' ? 50.0 : 45.5) - 2.3 * (60 - inches); 
                }

                let weightAdvice = "";
                if (bmi > 25) {
                    const toLose = (w - 25 * hm * hm).toFixed(1);
                    weightAdvice = `<li>Lose <strong>${toLose} kg</strong> to reach a healthy BMI of 25 kg/m².</li>`;
                } else if (bmi < 18.5) {
                    const toGain = (18.5 * hm * hm - w).toFixed(1);
                    weightAdvice = `<li>Gain <strong>${toGain} kg</strong> to reach a healthy BMI of 18.5 kg/m².</li>`;
                } else {
                    weightAdvice = `<li>You are at a healthy weight! Maintain your current lifestyle.</li>`;
                }

                let ageNote = age < 20 ? `<li style="color: #f59e0b; font-size: 0.95rem; margin-top: 8px;"><i class="fa-solid fa-circle-info"></i> Note: For age ${age}, pediatric percentile charts are clinically recommended over standard adult BMI.</li>` : "";

                document.getElementById('bmi-title').innerHTML = `BMI = ${bmi.toFixed(1)} kg/m² <span style="color: ${catColor}; font-weight: 800;">(${category})</span>`;
                
                document.getElementById('bmi-bullets').innerHTML = `
                    <ul style="list-style-type: disc; padding-left: 20px;">
                        <li>Healthy BMI range: <strong>18.5 kg/m² - 25 kg/m²</strong></li>
                        <li>Healthy weight for the height: <strong>${minWeight} kg - ${maxWeight} kg</strong></li>
                        <li>Ideal Body Weight (${gender}): <strong>${ibw.toFixed(1)} kg</strong></li>
                        ${weightAdvice}
                        <li>BMI Prime: <strong>${bmiPrime}</strong></li>
                        <li>Ponderal Index: <strong>${ponderal} kg/m³</strong></li>
                    </ul>
                    <ul style="list-style-type: none; padding-left: 0;">${ageNote}</ul>
                `;

                document.getElementById('bmi-result-card').style.display = 'block';

                let tex = `\\begin{aligned} \\text{BMI} &= \\frac{\\text{Weight (kg)}}{\\text{Height (m)}^2} = \\frac{${w}}{(${hm})^2} = \\mathbf{${bmi.toFixed(2)}} \\end{aligned}`;
                katex.render(tex, document.getElementById('bmi-formula'), { displayMode: true, throwOnError: false });

                const textColor = getComputedStyle(document.body).getPropertyValue('--text-main').trim();
                const isDark = document.body.getAttribute('data-theme') === 'dark';
                
                const data = [{
                    type: "indicator",
                    mode: "gauge+number",
                    value: bmi,
                    number: { font: { color: textColor, size: 40 }, valueformat: ".1f" },
                    gauge: {
                        axis: { range: [10, 40], tickwidth: 1, tickcolor: textColor, tickfont: {color: textColor} },
                        bar: { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", thickness: 0.05 },
                        bgcolor: "transparent",
                        borderwidth: 0,
                        steps: [
                            { range: [10, 16], color: "rgba(239, 68, 68, 0.6)" },
                            { range: [16, 18.5], color: "rgba(245, 158, 11, 0.6)" },
                            { range: [18.5, 25], color: "rgba(34, 197, 94, 0.6)" },
                            { range: [25, 30], color: "rgba(245, 158, 11, 0.6)" },
                            { range: [30, 35], color: "rgba(239, 68, 68, 0.6)" },
                            { range: [35, 40], color: "rgba(153, 27, 27, 0.6)" }
                        ]
                    }
                }];
                
                const layout = { 
                    margin: { t: 20, b: 20, l: 30, r: 30 }, 
                    paper_bgcolor: 'transparent', 
                    font: { color: textColor }
                };

                Plotly.newPlot('bmi-gauge-chart', data, layout, {responsive: true, displayModeBar: false});
            },
            calcInterest() {
                const P = parseFloat(document.getElementById('ci-p').value);
                const r = parseFloat(document.getElementById('ci-r').value);
                const t = parseFloat(document.getElementById('ci-t').value);
                const n = parseFloat(document.getElementById('ci-n').value);
                const box = document.getElementById('ci-formula');
                if(isNaN(P) || isNaN(r) || isNaN(t) || isNaN(n)) return;

                const A = P * Math.pow((1 + (r/100)/n), n*t);
                
                let tex = `\\begin{aligned} `;
                tex += `A &= P \\left(1 + \\frac{r}{n}\\right)^{nt} \\\\ `;
                tex += `&= ${P} \\left(1 + \\frac{${r/100}}{${n}}\\right)^{${n} \\times ${t}} \\\\ `;
                tex += `&= \\mathbf{\\$${A.toFixed(2)}} `;
                tex += `\\end{aligned}`;
                katex.render(tex, box, { displayMode: true, throwOnError: false });
            },
            calcMortgage() {
                const P = parseFloat(document.getElementById('mort-p').value);
                const r = parseFloat(document.getElementById('mort-r').value);
                const t = parseFloat(document.getElementById('mort-t').value);
                const box = document.getElementById('mort-formula');
                if(isNaN(P) || isNaN(r) || isNaN(t)) return;

                const monthlyRate = (r / 100) / 12;
                const totalPayments = t * 12;
                const M = P * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
                
                let tex = `\\begin{aligned} `;
                tex += `M &= P \\frac{r(1+r)^n}{(1+r)^n - 1} \\\\ `;
                tex += `&= ${P} \\frac{${monthlyRate.toFixed(4)}(1+${monthlyRate.toFixed(4)})^{${totalPayments}}}{(1+${monthlyRate.toFixed(4)})^{${totalPayments}} - 1} \\\\ `;
                tex += `&= \\mathbf{\\$${M.toFixed(2)} \\text{ / month}} `;
                tex += `\\end{aligned}`;
                katex.render(tex, box, { displayMode: true, throwOnError: false });
            },
            calcGPA() {
                const rows = document.querySelectorAll('.gpa-row');
                const resultContainer = document.getElementById('gpa-result-container');
                const tbody = document.getElementById('gpa-table-body');
                const generalFormulaBox = document.getElementById('gpa-general-formula');
                const finalCalcBox = document.getElementById('gpa-final-calc');
                
                let totalPts = 0;
                let totalCreds = 0;
                let tableHTML = '';
                
                rows.forEach((row, i) => {
                    const courseInput = row.querySelector('input[type="text"]');
                    const credInput = row.querySelector('.gpa-cred');
                    const gradeSelect = row.querySelector('.gpa-grade');
                    
                    const courseName = courseInput.value.trim() || `Course ${i + 1}`;
                    const c = parseFloat(credInput.value);
                    const g = parseFloat(gradeSelect.value);
                    const gradeText = gradeSelect.options[gradeSelect.selectedIndex].text.split(' ')[0];
                    
                    if(!isNaN(c) && !isNaN(g)) {
                        const pts = c * g;
                        totalCreds += c;
                        totalPts += pts;
                        
                        tableHTML += `
                            <tr>
                                <td style="font-weight: 500;">${courseName}</td>
                                <td>${gradeText}</td>
                                <td>${g.toFixed(1)}</td>
                                <td>${c}</td>
                                <td>${pts.toFixed(1)}</td>
                            </tr>
                        `;
                    }
                });

                if(totalCreds === 0) {
                    resultContainer.style.display = 'none';
                    return;
                }

                const gpa = totalPts / totalCreds;
                
                tbody.innerHTML = tableHTML;
                resultContainer.style.display = 'block';

                let generalTex = `\\text{GPA} = \\frac{\\sum(\\text{Grade Point} \\times \\text{Credit Hours})}{\\sum \\text{Credit Hours}}`;
                katex.render(generalTex, generalFormulaBox, { displayMode: true, throwOnError: false });
                
                let finalTex = `\\text{Final GPA} = \\frac{${totalPts.toFixed(1)}}{${totalCreds.toFixed(1)}} = \\mathbf{${gpa.toFixed(2)}}`;
                katex.render(finalTex, finalCalcBox, { displayMode: true, throwOnError: false });
            }
        };

        // --- FAQ ACCORDION FUNCTION ---
        function toggleFAQ(button) {
            const faqItem = button.parentElement;
            const answer = faqItem.querySelector('.faq-answer');
            const arrow = button.querySelector('.faq-arrow');
            
            // Toggle the answer visibility
            if (answer.style.display === 'block') {
                answer.style.display = 'none';
                arrow.style.transform = 'rotate(0deg)';
            } else {
                answer.style.display = 'block';
                arrow.style.transform = 'rotate(180deg)';
            }
        }

        // Initialize App
        document.addEventListener('DOMContentLoaded', () => {
            // Initialize calculation history
            calcHistory.init();
            reviewManager.init();
            
            if(document.getElementById('calc-sci').classList.contains('active')) sciApp.init();
        });