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
        
        // Submit to Google Sheets and update local storage
        submitToGoogleSheets(name, firstChoice, secondChoice, thirdChoice, suggestion)
            .then(() => {
                // Also store locally for immediate display
                const votes = JSON.parse(localStorage.getItem('iceCreamRankedVotes') || '{}');
                
                // Weighted scoring: 1st choice = 3 points, 2nd choice = 2 points, 3rd choice = 1 point
                if (firstChoice) {
                    votes[firstChoice] = (votes[firstChoice] || 0) + 3;
                }
                if (secondChoice) {
                    votes[secondChoice] = (votes[secondChoice] || 0) + 2;
                }
                if (thirdChoice) {
                    votes[thirdChoice] = (votes[thirdChoice] || 0) + 1;
                }
                
                localStorage.setItem('iceCreamRankedVotes', JSON.stringify(votes));
                
                // Show success message
                surveyForm.style.display = 'none';
                surveyResults.style.display = 'block';
                
                // Update results display
                updateVoteResults(votes);
                
                showToast('Thank you for your ranked vote!', 'success');
            })
            .catch((error) => {
                console.error('Error submitting vote:', error);
                showToast('Vote saved locally, but could not sync to server', 'warning');
                
                // Still update local storage as fallback
                const votes = JSON.parse(localStorage.getItem('iceCreamRankedVotes') || '{}');
                if (firstChoice) votes[firstChoice] = (votes[firstChoice] || 0) + 3;
                if (secondChoice) votes[secondChoice] = (votes[secondChoice] || 0) + 2;
                if (thirdChoice) votes[thirdChoice] = (votes[thirdChoice] || 0) + 1;
                localStorage.setItem('iceCreamRankedVotes', JSON.stringify(votes));
                
                surveyForm.style.display = 'none';
                surveyResults.style.display = 'block';
                updateVoteResults(votes);
            });
    });

    // Google Apps Script integration
    async function submitToGoogleSheets(name, firstChoice, secondChoice, thirdChoice, suggestion) {
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDZkQrMzgvxl6QSUD7ZKgwM-pL4wQF-Kd0z0zMPce6JG-xkcbACfMSvotFvuy4tphfrQ/exec';
        
        const data = {
            name: name || 'Anonymous',
            firstChoice: firstChoice || '',
            secondChoice: secondChoice || '',
            thirdChoice: thirdChoice || '',
            suggestion: suggestion || ''
        };
        
        console.log('Submitting to Apps Script:', data);
        
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log('Apps Script response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Apps Script error:', response.status, errorText);
            throw new Error(`Apps Script error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.text();
        console.log('Apps Script success:', result);
        return result;
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
    function updateVoteResults(votes) {
        const resultsDisplay = document.getElementById('results-display');
        
        // Sort flavors by points (vote count in our weighted system)
        const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
        
        let resultsHTML = '<div class="vote-results">';
        
        sortedVotes.slice(0, 6).forEach(([flavor, points], index) => {
            const totalPoints = Object.values(votes).reduce((a, b) => a + b, 0);
            const percentage = Math.round((points / totalPoints) * 100);
            const emoji = getFlavorEmoji(flavor);
            
            const rankEmojis = ['🥇', '🥈', '🥉'];
            const rankEmoji = index < 3 ? rankEmojis[index] : `#${index + 1}`;
            
            resultsHTML += `
                <div class="result-item">
                    <div class="result-header">
                        <span class="rank">${rankEmoji}</span>
                        <span class="flavor">${emoji} ${flavor}</span>
                        <span class="points">${points} points</span>
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
            'Sweet Cream & Blackberry Jam': '🫒',
            'Mint Fudge Brownie': '🍃',
            'Salted Caramel': '🍯',
            'Salty Vanilla': '🍦',
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