document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Survey form functionality
    const surveyForm = document.getElementById('ice-cream-survey');
    const surveyResults = document.getElementById('survey-results');
    const firstChoice = document.getElementById('first-choice');
    const secondChoice = document.getElementById('second-choice');
    const thirdChoice = document.getElementById('third-choice');

    // Prevent duplicate selections
    function updateSelectOptions() {
        const selects = [firstChoice, secondChoice, thirdChoice];
        const selectedValues = selects.map(select => select.value).filter(value => value);
        
        selects.forEach(select => {
            const options = select.querySelectorAll('option');
            options.forEach(option => {
                if (option.value && selectedValues.includes(option.value) && option.value !== select.value) {
                    option.disabled = true;
                } else {
                    option.disabled = false;
                }
            });
        });
    }

    // Add event listeners to update options when selections change
    [firstChoice, secondChoice, thirdChoice].forEach(select => {
        select.addEventListener('change', updateSelectOptions);
    });

    // Handle form submission
    surveyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const name = formData.get('name') || 'Anonymous';
        const firstChoice = formData.get('first-choice');
        const secondChoice = formData.get('second-choice');
        const thirdChoice = formData.get('third-choice');
        const suggestion = formData.get('suggestion');
        
        // Validate that at least first choice is selected
        if (!firstChoice) {
            showToast('Please select at least your first choice!', 'error');
            return;
        }
        
        // Check for duplicate selections (shouldn't happen with disabled options, but good to double-check)
        const choices = [firstChoice, secondChoice, thirdChoice].filter(choice => choice);
        const uniqueChoices = new Set(choices);
        if (choices.length !== uniqueChoices.size) {
            showToast('Please select different flavors for each ranking!', 'error');
            return;
        }
        
        // Submit to Google Sheets and fetch real-time results
        submitToGoogleSheets(name, firstChoice, secondChoice, thirdChoice, suggestion)
            .then((response) => {
                // Parse the response to get real-time results
                try {
                    const data = JSON.parse(response);
                    if (data.success && data.results) {
                        // Show success message
                        surveyForm.style.display = 'none';
                        surveyResults.style.display = 'block';
                        
                        // Display real-time results from Google Sheets
                        updateVoteResults(data.results);
                        
                        showToast('Thank you for your ranked vote!', 'success');
                    } else {
                        throw new Error('Invalid response format');
                    }
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    // Fallback: fetch results separately
                    fetchAndDisplayResults();
                }
            })
            .catch((error) => {
                console.error('Error submitting vote:', error);
                showToast('Error submitting vote: ' + error.message, 'error');
            });
    });

    // Google Apps Script integration using form submission method
    function submitToGoogleSheets(name, firstChoice, secondChoice, thirdChoice, suggestion) {
        return new Promise((resolve, reject) => {
            const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyHDur20Pb4kDKU9K_trfnUWgfifEUzhzlNicXSL-Zq6VBdRRMDNoi-ORXQR0z2Tstag/exec';
            
            // Create a temporary form to submit data
            const form = document.createElement('form');
            form.action = APPS_SCRIPT_URL;
            form.method = 'POST';
            form.style.display = 'none';
            
            // Add form fields
            const fields = {
                name: name || 'Anonymous',
                firstChoice: firstChoice || '',
                secondChoice: secondChoice || '',
                thirdChoice: thirdChoice || '',
                suggestion: suggestion || ''
            };
            
            Object.keys(fields).forEach(key => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = fields[key];
                form.appendChild(input);
            });
            
            // Create hidden iframe to submit form
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = 'submitFrame';
            form.target = 'submitFrame';
            
            document.body.appendChild(iframe);
            document.body.appendChild(form);
            
            // Handle completion
            iframe.onload = () => {
                document.body.removeChild(iframe);
                document.body.removeChild(form);
                resolve('success');
            };
            
            iframe.onerror = () => {
                document.body.removeChild(iframe);
                document.body.removeChild(form);
                reject(new Error('Failed to submit to Google Sheets'));
            };
            
            // Submit the form
            setTimeout(() => {
                form.submit();
            }, 100);
        });
    }

    // Fetch results from Google Sheets (fallback function)
    async function fetchAndDisplayResults() {
        try {
            const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyHDur20Pb4kDKU9K_trfnUWgfifEUzhzlNicXSL-Zq6VBdRRMDNoi-ORXQR0z2Tstag/exec';
            
            const response = await fetch(APPS_SCRIPT_URL + '?action=getResults', {
                method: 'GET',
                mode: 'cors'
            });
            
            const data = await response.json();
            
            if (data.success && data.results) {
                surveyForm.style.display = 'none';
                surveyResults.style.display = 'block';
                updateVoteResults(data.results);
                showToast('Thank you for your ranked vote!', 'success');
            } else {
                throw new Error('Could not load results');
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            surveyForm.style.display = 'none';
            surveyResults.style.display = 'block';
            document.getElementById('results-display').innerHTML = '<p>Vote submitted successfully! Results will be updated soon.</p>';
            showToast('Thank you for your ranked vote!', 'success');
        }
    }

    // Toast notification system
    function showToast(message, type = 'info') {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '10px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // Set background color based on type
        switch(type) {
            case 'success':
                toast.style.background = '#4caf50';
                break;
            case 'error':
                toast.style.background = '#f44336';
                break;
            case 'warning':
                toast.style.background = '#ff9800';
                break;
            default:
                toast.style.background = '#2196f3';
        }
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Update vote results display
    function updateVoteResults(results) {
        const resultsDisplay = document.getElementById('results-display');
        
        // Results comes as array from Google Sheets: [{flavor: 'name', points: 123}, ...]
        let resultsHTML = '<div class="vote-results">';
        
        // Calculate total points for percentages
        const totalPoints = results.reduce((sum, item) => sum + item.points, 0);
        
        results.slice(0, 6).forEach((item, index) => {
            const percentage = totalPoints > 0 ? Math.round((item.points / totalPoints) * 100) : 0;
            const emoji = getFlavorEmoji(item.flavor);
            
            const rankEmojis = ['🥇', '🥈', '🥉'];
            const rankEmoji = index < 3 ? rankEmojis[index] : `#${index + 1}`;
            
            resultsHTML += `
                <div class="result-item">
                    <div class="result-header">
                        <span class="rank">${rankEmoji}</span>
                        <span class="flavor">${emoji} ${item.flavor}</span>
                        <span class="points">${item.points} points</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        
        resultsHTML += '</div>';
        resultsDisplay.innerHTML = resultsHTML;
        
        // Add CSS for results display
        if (!document.getElementById('results-styles')) {
            const style = document.createElement('style');
            style.id = 'results-styles';
            style.textContent = `
                .vote-results {
                    margin-top: 2rem;
                    text-align: left;
                }
                .result-item {
                    margin-bottom: 1rem;
                    background: white;
                    padding: 1rem;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .result-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                .rank {
                    font-weight: bold;
                    color: #ff6b6b;
                    font-size: 1.1rem;
                }
                .flavor {
                    flex: 1;
                    margin: 0 1rem;
                    font-weight: bold;
                }
                .points {
                    color: #666;
                    font-size: 0.9rem;
                    font-weight: bold;
                }
                .progress-bar {
                    background: #f0f0f0;
                    border-radius: 10px;
                    height: 8px;
                    overflow: hidden;
                }
                .progress {
                    background: linear-gradient(90deg, #ff6b6b, #ffa8a8);
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.5s ease;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Get emoji for flavor
    function getFlavorEmoji(flavor) {
        const emojiMap = {
            // Normal Flavors
            'Strawberry Buttermilk': '🍓',
            'Sweet Cream & Blackberry Jam': '🍦',
            'Mint Fudge Brownie': '🍃',
            'Salted Caramel': '🍯',
            'Death by Vanilla': '🍦',
            // Unusual Flavors
            'Spruce Tips': '🌲',
            'Parmesan': '🧀',
            'Lovage Ginger & Rum Raisin': '🌿',
            'Sour Cherry Lambic': '🍒',
            'Ylang Ylang with Clove & Honeycomb': '🌺',
            'Tiramisu': '☕',
            'Star Anise Black Pepper': '⭐',
            'Orange-Szechuan': '🍊'
        };
        return emojiMap[flavor] || '🍦';
    }

    // Add floating animation to menu items
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });

    // Add intersection observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe menu items and form elements
    document.querySelectorAll('.menu-item, .survey-form').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Show current vote results on page load if any exist
    const existingVotes = JSON.parse(localStorage.getItem('iceCreamVotes') || '{}');
    if (Object.keys(existingVotes).length > 0) {
        // Add a "View Results" button
        const viewResultsBtn = document.createElement('button');
        viewResultsBtn.textContent = 'View Current Results';
        viewResultsBtn.className = 'submit-button';
        viewResultsBtn.style.marginTop = '1rem';
        viewResultsBtn.style.background = 'linear-gradient(135deg, #4caf50, #66bb6a)';
        
        viewResultsBtn.addEventListener('click', () => {
            updateVoteResults(existingVotes);
            surveyResults.style.display = 'block';
            viewResultsBtn.style.display = 'none';
        });
        
        surveyForm.appendChild(viewResultsBtn);
    }
});