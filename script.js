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
    const checkboxes = document.querySelectorAll('input[name="favorites"]');

    // Limit checkbox selections to 3
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedBoxes = document.querySelectorAll('input[name="favorites"]:checked');
            
            if (checkedBoxes.length > 3) {
                this.checked = false;
                showToast('Please select only 3 favorites!', 'warning');
            }
        });
    });

    // Handle form submission
    surveyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const name = formData.get('name') || 'Anonymous';
        const favorites = formData.getAll('favorites');
        const suggestion = formData.get('suggestion');
        
        // Validate that at least one favorite is selected
        if (favorites.length === 0) {
            showToast('Please select at least one favorite ice cream!', 'error');
            return;
        }
        
        // Simulate form submission (in a real app, you'd send this to a server)
        setTimeout(() => {
            // Store the vote in localStorage for demo purposes
            const votes = JSON.parse(localStorage.getItem('iceCreamVotes') || '{}');
            
            favorites.forEach(flavor => {
                votes[flavor] = (votes[flavor] || 0) + 1;
            });
            
            localStorage.setItem('iceCreamVotes', JSON.stringify(votes));
            
            // Show success message
            surveyForm.style.display = 'none';
            surveyResults.style.display = 'block';
            
            // Update results display
            updateVoteResults(votes);
            
            showToast('Thank you for your vote!', 'success');
        }, 1000);
    });

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
        const resultsContainer = document.getElementById('survey-results');
        
        // Sort flavors by vote count
        const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
        
        let resultsHTML = `
            <h3>Thank you for voting! 🎉</h3>
            <p>Your preferences have been recorded. Here are the current results:</p>
            <div class="vote-results">
        `;
        
        sortedVotes.forEach(([flavor, count], index) => {
            const percentage = Math.round((count / Object.values(votes).reduce((a, b) => a + b, 0)) * 100);
            const emoji = getFlavorEmoji(flavor);
            
            resultsHTML += `
                <div class="result-item">
                    <div class="result-header">
                        <span class="rank">#${index + 1}</span>
                        <span class="flavor">${emoji} ${flavor}</span>
                        <span class="votes">${count} votes (${percentage}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        
        resultsHTML += '</div>';
        resultsContainer.innerHTML = resultsHTML;
        
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
                .votes {
                    color: #666;
                    font-size: 0.9rem;
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