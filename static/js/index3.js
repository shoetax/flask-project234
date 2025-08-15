 document.addEventListener('DOMContentLoaded', function() {
            const inputText = document.getElementById('inputText');
            const outputText = document.getElementById('outputText');
            const extractBtn = document.getElementById('extractBtn');
            const copyFloatBtn = document.getElementById('copyFloatBtn');
            const clearBtn = document.getElementById('clearBtn');
            const emailCount = document.getElementById('emailCount');
            const duplicatesCount = document.getElementById('duplicatesCount');
            const charCount = document.getElementById('charCount');
            const notification = document.getElementById('notification');
            
            // Initialize with empty state
            clearAll();
            
            // Extract emails function
            function extractEmails() {
                const text = inputText.value;
                if (!text.trim()) {
                    showNotification('Please enter some text first', 'warning');
                    return;
                }
                
                // Show loading state
                extractBtn.innerHTML = '<div class="loader"></div> Processing...';
                extractBtn.disabled = true;
                
                // Process after small delay to show loading state
                setTimeout(() => {
                    // Improved email regex pattern (RFC 5322 compliant)
                    const emailPattern = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi;
                    const emails = text.match(emailPattern) || [];
                    
                    // Remove duplicates (case insensitive)
                    const uniqueEmails = [];
                    const seenEmails = new Set();
                    
                    emails.forEach(email => {
                        const lowerEmail = email.toLowerCase();
                        if (!seenEmails.has(lowerEmail)) {
                            seenEmails.add(lowerEmail);
                            uniqueEmails.push(email);
                        }
                    });
                    
                    const duplicatesRemoved = emails.length - uniqueEmails.length;
                    
                    // Display extracted emails
                    outputText.value = uniqueEmails.join('\n');
                    
                    // Update stats
                    emailCount.textContent = `${uniqueEmails.length} email${uniqueEmails.length !== 1 ? 's' : ''} found`;
                    duplicatesCount.textContent = `${duplicatesRemoved} duplicate${duplicatesRemoved !== 1 ? 's' : ''} removed`;
                    charCount.textContent = `${text.length.toLocaleString()} characters processed`;
                    
                    // Reset button state
                    extractBtn.innerHTML = '<i class="fas fa-magic"></i> Extract Emails';
                    extractBtn.disabled = false;
                    
                    // Show notification if emails found
                    if (uniqueEmails.length > 0) {
                        showNotification(`${uniqueEmails.length} unique emails extracted`, 'success');
                    } else {
                        showNotification('No email addresses found', 'info');
                    }
                    
                    // Add pulse animation to copy button if emails found
                    if (uniqueEmails.length > 0) {
                        copyFloatBtn.classList.add('pulse');
                        setTimeout(() => {
                            copyFloatBtn.classList.remove('pulse');
                        }, 600);
                    }
                }, 500);
            }
            
            // Copy emails to clipboard
            function copyEmails() {
                if (!outputText.value.trim()) {
                    showNotification('No emails to copy', 'warning');
                    return;
                }
                
                outputText.select();
                document.execCommand('copy');
                
                // Show notification
                showNotification('Emails copied to clipboard!', 'success');
                
                // Change button text temporarily
                const originalText = copyFloatBtn.innerHTML;
                copyFloatBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                
                setTimeout(() => {
                    copyFloatBtn.innerHTML = originalText;
                }, 2000);
            }
            
            // Clear all fields
            function clearAll() {
                inputText.value = '';
                outputText.value = '';
                emailCount.textContent = '0 emails found';
                duplicatesCount.textContent = '0 duplicates removed';
                charCount.textContent = '0 characters processed';
                
                // Reset textarea height
                inputText.style.height = 'auto';
                outputText.style.height = 'auto';
            }
            
            // Show notification
            function showNotification(message, type) {
                const icon = type === 'success' ? 'fa-check-circle' : 
                            type === 'warning' ? 'fa-exclamation-circle' : 
                            type === 'info' ? 'fa-info-circle' : 'fa-check-circle';
                
                const bgColor = type === 'success' ? 'var(--success)' : 
                              type === 'warning' ? 'var(--warning)' : 
                              type === 'info' ? 'var(--primary)' : 'var(--success)';
                
                notification.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
                notification.style.background = bgColor;
                
                notification.classList.add('show');
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 3000);
            }
            
            // Event listeners
            extractBtn.addEventListener('click', extractEmails);
            copyFloatBtn.addEventListener('click', copyEmails);
            clearBtn.addEventListener('click', clearAll);
            
            // Extract when pressing Ctrl+Enter in the input field
            inputText.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.key === 'Enter') {
                    extractEmails();
                }
            });
            
            // Auto-resize textareas
            function autoResize(textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = (textarea.scrollHeight) + 'px';
            }
            
            inputText.addEventListener('input', function() {
                autoResize(this);
            });
            
            outputText.addEventListener('input', function() {
                autoResize(this);
            });
            
            // Show tooltip on float button hover
            copyFloatBtn.addEventListener('mouseenter', function() {
                this.innerHTML = '<i class="fas fa-copy"></i> Copy All';
            });
            
            copyFloatBtn.addEventListener('mouseleave', function() {
                if (!this.innerHTML.includes('Copied!')) {
                    this.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }
            });
        });