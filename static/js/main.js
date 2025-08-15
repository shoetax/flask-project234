 const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('overlay');
    
    hamburger.addEventListener('click', function() {
        this.classList.toggle('open');
        mobileNav.classList.toggle('open');
        overlay.classList.toggle('open');
    });
    
    overlay.addEventListener('click', function() {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        this.classList.remove('open');
    });
    
    // Email Marketing Functionality
    let uploadedEmails = [];
    let adImages = [
        { img: "https://tempshoetax.netlify.app/image2.jpg", url: "https://instagram.com/shoetaxinsta" },
        { img: "https://tempshoetax.netlify.app/image3.jpg", url: "https://t.me/shoetaxchat" }
    ];
    let currentAdIndex = 0;
    let adTimeouts = [];
    let isAdVisible = false;
    let sendingInterval = null;
    
    function updateStatus(message) {
        document.getElementById('statusBox').textContent = message;
    }
    
    function handleFileUpload() {
        const fileInput = document.getElementById('emailFile');
        const file = fileInput.files[0];
        
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        updateStatus('Processing file...');
        
        fetch('/upload_emails', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                uploadedEmails = data.emails;
                displayEmailList();
                updateStatus(data.message);
            } else {
                updateStatus(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            updateStatus(`Error: ${error.message}`);
        });
    }
    
    function displayEmailList() {
        const emailList = document.getElementById('emailList');
        
        if (uploadedEmails.length === 0) {
            emailList.innerHTML = '<p style="text-align: center; color: #AAA;">No emails uploaded yet</p>';
            return;
        }
        
        emailList.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        uploadedEmails.slice(0, 50).forEach(email => {
            const div = document.createElement('div');
            div.className = 'email-item';
            div.textContent = email;
            fragment.appendChild(div);
        });
        
        if (uploadedEmails.length > 50) {
            const div = document.createElement('div');
            div.className = 'email-item';
            div.textContent = `...and ${uploadedEmails.length - 50} more`;
            fragment.appendChild(div);
        }
        
        emailList.appendChild(fragment);
    }
    
    function clearEmailList() {
        uploadedEmails = [];
        displayEmailList();
        updateStatus('Email list cleared.');
    }
    
    function startSendingEmails() {
        const gmail = document.getElementById('gmail').value.trim();
        const password = document.getElementById('password').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const body = document.getElementById('emailBody').value.trim();
        
        if (!gmail || !password || !subject || !body) {
            updateStatus('Please fill in all fields before sending emails.');
            return;
        }
        
        if (uploadedEmails.length === 0) {
            updateStatus('No emails to send. Please upload an email list first.');
            return;
        }
        
        // Show progress bar
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = `Sending emails: 0/${uploadedEmails.length}`;
        
        // Clear any existing interval
        if (sendingInterval) {
            clearInterval(sendingInterval);
        }
        
        // Send data to server
        fetch('/send_emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                gmail: gmail,
                password: password,
                subject: subject,
                body: body,
                emails: uploadedEmails
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateStatus(data.message);
                const totalEmails = data.total_emails;
                let sent = 0;
                
                // Create progress updater (1 email every 4 seconds)
                sendingInterval = setInterval(() => {
                    sent += 1;
                    if (sent > totalEmails) {
                        sent = totalEmails;
                        clearInterval(sendingInterval);
                        sendingInterval = null;
                    }
                    
                    const percent = Math.min(100, (sent / totalEmails) * 100);
                    progressBar.style.width = `${percent}%`;
                    progressText.textContent = `Sending emails: ${sent}/${totalEmails}`;
                    
                    if (sent >= totalEmails) {
                        clearInterval(sendingInterval);
                        sendingInterval = null;
                        updateStatus(`All emails sent successfully! Total sent: ${totalEmails}`);
                    }
                }, 4000); // Changed to 4000ms (4 seconds)
            } else {
                updateStatus(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            updateStatus(`Error: ${error.message}`);
        });
    }
    
    function showAdPopup() {
        if (isAdVisible) return;
        
        const popup = document.getElementById('adPopup');
        const img = popup.querySelector('img');
        
        img.src = adImages[currentAdIndex].img;
        img.onclick = () => window.open(adImages[currentAdIndex].url, '_blank');
        
        popup.classList.remove('closing');
        popup.style.display = 'block';
        isAdVisible = true;
        
        currentAdIndex = (currentAdIndex + 1) % adImages.length;
    }
    
    function closeAdPopup() {
        if (!isAdVisible) return;
        
        const popup = document.getElementById('adPopup');
        popup.classList.add('closing');
        isAdVisible = false;
        
        setTimeout(() => {
            popup.style.display = 'none';
            popup.classList.remove('closing');
        }, 500);
    }
    
    function setupAdTimers() {
        // Clear any existing timeouts
        adTimeouts.forEach(timeout => clearTimeout(timeout));
        adTimeouts = [];
        
        // First popup after 30 seconds
        adTimeouts.push(setTimeout(showAdPopup, 30000));
        
        // Second popup after 2 minutes (120000ms) from now (90 seconds after first)
        adTimeouts.push(setTimeout(showAdPopup, 120000));
        
        // Third popup after 10 minutes (600000ms) from now (8 minutes after second)
        adTimeouts.push(setTimeout(showAdPopup, 600000));
        
        // Subsequent popups every 1 hour (3600000ms)
        adTimeouts.push(setTimeout(function runHourlyAd() {
            showAdPopup();
            adTimeouts.push(setTimeout(runHourlyAd, 3600000));
        }, 3600000));
    }
    
    // Start the ad sequence when page loads
    document.addEventListener('DOMContentLoaded', function() {
        setupAdTimers();
    });