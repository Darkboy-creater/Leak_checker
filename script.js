// REAL LEAK CHECK TOOL - ADVANCE VERSION
// Uses XposedOrNot API - Shows which breach, what data leaked

const API_BASE = 'https://api.xposedornot.com/v1/';

// Breach data class mapping (what type of data was leaked)
const dataClassIcons = {
    'Email addresses': '📧',
    'Passwords': '🔑',
    'Usernames': '👤',
    'Phone numbers': '📞',
    'Names': '📛',
    'Addresses': '🏠',
    'IP addresses': '🌐',
    'Geolocation': '📍',
    'Dates of birth': '🎂',
    'Social media profiles': '📱'
};

async function checkLeak() {
    const email = document.getElementById('emailInput').value.trim().toLowerCase();
    const resultDiv = document.getElementById('resultMessage');
    const loadingDiv = document.getElementById('loading');
    
    // Validation
    if(!email) {
        resultDiv.innerHTML = '⚠️ Please enter an email address';
        resultDiv.className = 'error-text';
        return;
    }
    
    if(!email.includes('@') || !email.includes('.')) {
        resultDiv.innerHTML = '⚠️ Enter a valid email address (example@gmail.com)';
        resultDiv.className = 'error-text';
        return;
    }
    
    // Show loading
    loadingDiv.className = 'loading-show';
    resultDiv.innerHTML = '';
    
    try {
        // Method 1: Try breach analytics API first (gives detailed info)
        const analyticsUrl = `${API_BASE}breach-analytics?email=${encodeURIComponent(email)}`;
        
        const response = await fetch(analyticsUrl);
        const data = await response.json();
        
        // Check if breaches found
        if(data.Error === "Not found" || !data.ExposedBreaches || !data.ExposedBreaches.breaches_details) {
            // No breach found
            loadingDiv.className = 'loading-hidden';
            resultDiv.innerHTML = `
                <div class="no-breach">
                    <span style="font-size: 48px;">✅</span><br><br>
                    <strong>No leaks found for: ${email}</strong><br><br>
                    Your email appears to be safe in all known data breaches.<br>
                    <span style="font-size: 11px;">✓ Checked against ${new Date().toLocaleString()}</span>
                </div>
            `;
            resultDiv.className = '';
            return;
        }
        
        // BREACH FOUND - Display detailed info
        const breaches = data.ExposedBreaches.breaches_details;
        const metrics = data.BreachMetrics || {};
        const summary = data.BreachesSummary || {};
        
        let html = `
            <div class="breach-header">
                ⚠️🔴⚠️ DATA BREACH FOUND ⚠️🔴⚠️<br>
                📧 Email: ${email}
            </div>
        `;
        
        // Show risk score if available
        if(metrics.risk && metrics.risk[0]) {
            const risk = metrics.risk[0];
            const riskColor = risk.risk_label === 'Low' ? '#2ecc71' : (risk.risk_label === 'Medium' ? '#f39c12' : '#e74c3c');
            html += `
                <div style="background: #0d2f22; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                    <span style="color: ${riskColor};">📊 RISK LEVEL: ${risk.risk_label}</span> | 
                    <span style="color: #f39c12;">Score: ${risk.risk_score}/10</span>
                </div>
            `;
        }
        
        // Total breaches count
        html += `<div style="margin-bottom: 15px;">🔴 Total Breaches Found: <span style="color: #e74c3c; font-weight: bold;">${breaches.length}</span></div>`;
        
        // Show each breach with details
        for(let i = 0; i < breaches.length; i++) {
            const b = breaches[i];
            const dataClasses = b.xposed_data ? b.xposed_data.split(';') : [];
            
            html += `
                <div class="breach-card">
                    <div class="breach-name">📛 ${b.breach || 'Unknown'}</div>
                    <div class="breach-detail">
                        📅 Breach Date: ${b.xposed_date || 'Unknown'}<br>
                        🏢 Domain: ${b.domain || 'Unknown'}<br>
                        📊 Records Exposed: ${(b.xposed_records || 0).toLocaleString()}<br>
                        🏭 Industry: ${b.industry || 'Misc'}<br>
                        🔐 Password Risk: ${b.password_risk || 'Unknown'}
                    </div>
                    <div class="breach-data-classes">
                        📋 Data Exposed: ${dataClasses.map(c => `${dataClassIcons[c.trim()] || '📄'} ${c.trim()}`).join(' • ') || 'Not specified'}
                    </div>
                </div>
            `;
        }
        
        // Show paste exposure if any
        if(data.PastesSummary && data.PastesSummary.cnt > 0) {
            html += `
                <hr>
                <div style="color: #f39c12; margin-top: 10px;">
                    📋 Additional: Email found in ${data.PastesSummary.cnt} paste(s) on public sites
                </div>
            `;
        }
        
        html += `
            <hr>
            <div style="font-size: 10px; color: #1e5631; margin-top: 15px;">
                🔍 Data source: XposedOrNot | Contains real breach data including Instagram 17.5M (2026), LinkedIn, Adobe, and more
            </div>
        `;
        
        loadingDiv.className = 'loading-hidden';
        resultDiv.innerHTML = html;
        resultDiv.className = '';
        
    } catch(error) {
        console.error('API Error:', error);
        loadingDiv.className = 'loading-hidden';
        
        // Fallback: Try simple check API
        try {
            const fallbackUrl = `${API_BASE}check-email/${encodeURIComponent(email)}`;
            const fallbackResponse = await fetch(fallbackUrl);
            const fallbackData = await fallbackResponse.json();
            
            if(fallbackData.Error === "Not found") {
                resultDiv.innerHTML = `
                    <div class="no-breach">
                        ✅ No leak found for: ${email}<br>
                        Your email is safe in known breaches.
                    </div>
                `;
            } else if(fallbackData.breaches && fallbackData.breaches.length > 0) {
                const breachNames = fallbackData.breaches[0] || fallbackData.breaches;
                const breachList = Array.isArray(breachNames) ? breachNames.join(', ') : breachNames;
                resultDiv.innerHTML = `
                    <div class="breach-header">⚠️ BREACH FOUND for ${email}</div>
                    <div class="breach-card">
                        Found in: ${breachList}<br>
                        ⚠️ Change passwords immediately on affected sites
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `⚠️ API limited. Try again or check haveibeenpwned.com manually`;
            }
            resultDiv.className = '';
        } catch(fallbackError) {
            resultDiv.innerHTML = `
                <div class="error-text">
                    ⚠️ API Error: ${error.message}<br><br>
                    Possible fixes:<br>
                    • Wait 1 second and retry (rate limit: 1 req/sec)<br>
                    • Check manually at haveibeenpwned.com<br>
                    • Instagram 17.5M leak (2026) is in our database
                </div>
            `;
        }
    }
}

function printReport() {
    const content = document.getElementById('resultMessage').innerHTML;
    const email = document.getElementById('emailInput').value.trim();
    
    if(!email || content.includes('Enter an email')) {
        alert('No data to print. Search for an email first.');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Breach Report - ${email}</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    background: #0a2f1f;
                    color: #2ecc71;
                    padding: 30px;
                }
                .report {
                    background: #0b3b2a;
                    border: 2px solid #2ecc71;
                    border-radius: 15px;
                    padding: 25px;
                    max-width: 900px;
                    margin: auto;
                }
                h1 { color: #2ecc71; text-align: center; }
                hr { border-color: #2ecc71; }
                .footer { text-align: center; font-size: 10px; margin-top: 30px; }
                .breach-card {
                    background: #0d2f22;
                    border-left: 3px solid #e74c3c;
                    padding: 12px;
                    margin: 12px 0;
                }
            </style>
        </head>
        <body>
            <div class="report">
                <h1>🔐 TDO Data Breach Report</h1>
                <hr>
                ${content}
                <hr>
                <div class="footer">
                    Generated: ${new Date().toLocaleString()}<br>
                    Data Source: XposedOrNot API
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.print();
}

function clearSearch() {
    document.getElementById('emailInput').value = '';
    document.getElementById('resultMessage').innerHTML = '⚡ Enter an email address to check for data breaches';
    document.getElementById('resultMessage').className = 'initial-state';
    document.getElementById('loading').className = 'loading-hidden';
}

// Enter key support
document.getElementById('emailInput').addEventListener('keypress', function(e) {
    if(e.key === 'Enter') checkLeak();
});
