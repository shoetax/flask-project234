  let currentPlatform = "site:linkedin.com/in";
        
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentPlatform = this.getAttribute('data-platform');
            });
        });
        
        // Format email domain input
        function formatEmailDomain(domain) {
            if (!domain) return '';
            
            // Remove any existing @ symbols
            domain = domain.replace(/@/g, '');
            
            // If domain is empty after removing @, return empty
            if (!domain.trim()) return '';
            
            return `("@${domain}" OR "email:${domain}" OR "mail:${domain}")`;
        }
        
        // Generate optimized dork with + between terms
        function generateDork() {
            const keyword = document.getElementById('keyword').value.trim();
            const location = document.getElementById('location').value.trim();
            const domain = document.getElementById('email-domain').value.trim();
            const additionalTerms = document.getElementById('additional-terms').value.trim();
            
            let dorkParts = [currentPlatform];
            
            // Add profession/job title
            if (keyword) {
                dorkParts.push(`"${keyword}"`);
                
                // Add variations for better results
                if (keyword.includes(" ")) {
                    const words = keyword.split(' ');
                    if (words.length > 1) {
                        dorkParts.push(`"${words[0]}"`);
                    }
                }
            }
            
            // Add location
            if (location) {
                dorkParts.push(`"${location}"`);
            }
            
            // Format email domain with multiple variations
            const formattedDomain = formatEmailDomain(domain);
            if (formattedDomain) {
                dorkParts.push(formattedDomain);
            } else if (currentPlatform.includes("youtube.com")) {
                // Default email patterns for YouTube if no domain specified
                dorkParts.push('("@gmail.com" OR "@yahoo.com" OR "@outlook.com" OR "@hotmail.com")');
            }
            
            // Add additional terms if provided
            if (additionalTerms) {
                dorkParts.push(`"${additionalTerms}"`);
            }
            
            // For YouTube, add common contact sections
            if (currentPlatform.includes("youtube.com")) {
                dorkParts.push('("contact" OR "email" OR "business" OR "collab")');
            }
            
            // For LinkedIn, add common profile sections
            if (currentPlatform.includes("linkedin.com")) {
                dorkParts.push('("contact info" OR "about" OR "summary" OR "connect" OR "message")');
            }
            
            // Join with + between terms
            document.getElementById('generated-dork').value = dorkParts.join(' + ');
            
            // Scroll to the query output box
            document.getElementById('query-output').scrollIntoView({
                behavior: 'smooth'
            });
        }
        
        // Copy Dork to clipboard
        function copyDork() {
            const dorkInput = document.getElementById('generated-dork');
            dorkInput.select();
            document.execCommand('copy');
            
            // Show temporary feedback
            const copyBtn = document.querySelector('button[onclick="copyDork()"]');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check" style="margin-right: 8px;"></i>Copied!';
            copyBtn.style.backgroundColor = 'var(--success)';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.backgroundColor = 'var(--primary)';
            }, 2000);
        }
        
        // Search on Google
        function searchGoogle() {
            const dork = document.getElementById('generated-dork').value;
            if (dork) {
                window.open('https://www.google.com/search?q=' + encodeURIComponent(dork), '_blank');
            } else {
                alert('Please generate a search query first!');
            }
        }
        
        // Clear the generated dork
        function clearDork() {
            document.getElementById('generated-dork').value = '';
        }
        
        // FAQ Accordion functionality
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                question.classList.toggle('active');
                answer.classList.toggle('show');
                
                // Close other open answers
                document.querySelectorAll('.faq-question').forEach(q => {
                    if (q !== question && q.classList.contains('active')) {
                        q.classList.remove('active');
                        q.nextElementSibling.classList.remove('show');
                    }
                });
            });
        });
        
        // Add animation to elements when they come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = 1;
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.card, .feature-card, .faq-section').forEach(el => {
            el.style.opacity = 0;
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });