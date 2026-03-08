/**
 * Dashboard Functions - All Backend Integrations
 * Connects new UI to existing Flask routes
 */

// ============================================
// DOCUMENT CLASSIFICATION (TEXT INPUT)
// ============================================

function initializeTextClassification() {
    const textForm = document.getElementById('textClassifyForm');
    if (textForm) {
        textForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const text = document.getElementById('legalTextInput').value.trim();
            if (!text) {
                window.toast.warning('Please enter some legal text');
                return;
            }
            
            // Show loading
            window.ModernUI.loading.showSpinner(true);
            
            fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            })
            .then(response => response.json())
            .then(data => {
                window.ModernUI.loading.showSpinner(false);
                
                if (data.error) {
                    window.toast.error(data.error);
                } else {
                    displayClassificationResult(data);
                    window.toast.success('Document classified successfully!');
                }
            })
            .catch(error => {
                window.ModernUI.loading.showSpinner(false);
                window.toast.error('Error: ' + error.message);
            });
        });
    }
}

function displayClassificationResult(data) {
    const resultsDiv = document.getElementById('classificationResults');
    if (!resultsDiv) return;
    
    const confidencePercent = (data.confidence * 100).toFixed(1);
    
    let html = `
        <div class="card mt-4 bounce-in">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-check-circle me-2"></i>Classification Result</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h6 class="text-muted mb-3">Input Text:</h6>
                        <p class="bg-light p-3 rounded border">${escapeHtml(data.text)}</p>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center">
                            <h6 class="text-muted mb-3">Predicted Category:</h6>
                            <span class="badge bg-primary" style="font-size: 18px; padding: 12px 24px;">${data.label}</span>
                            <div class="mt-3">
                                <strong class="text-success">Confidence: ${confidencePercent}%</strong>
                            </div>
                            <div class="progress mt-2" style="height: 12px;">
                                <div class="progress-bar bg-success" role="progressbar" style="width: ${confidencePercent}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
    `;
    
    // All predictions
    if (data.all_predictions && data.all_predictions.length > 1) {
        html += `
            <div class="mt-4">
                <h6 class="text-muted mb-3">All Category Scores:</h6>
                <div class="row g-2">
        `;
        
        data.all_predictions.forEach(pred => {
            const conf = (pred.confidence * 100).toFixed(1);
            const bgColor = pred.confidence > 0.7 ? 'success' : pred.confidence > 0.4 ? 'warning' : 'secondary';
            html += `
                <div class="col-md-4">
                    <div class="card border-${bgColor}">
                        <div class="card-body p-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="badge bg-${bgColor}">${pred.label}</span>
                                <strong>${conf}%</strong>
                            </div>
                            <div class="progress mt-1" style="height: 6px;">
                                <div class="progress-bar bg-${bgColor}" style="width: ${conf}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    // Similar judgements
    if (data.similar_judgements && data.similar_judgements.length > 0) {
        html += `
            <div class="mt-4">
                <h6 class="text-muted mb-3">
                    <i class="fas fa-gavel me-2"></i>Similar Supreme Court Cases
                    <span class="badge bg-info ms-2">${data.similar_judgements.length} cases</span>
                </h6>
                <div class="list-group">
        `;
        
        data.similar_judgements.forEach((judgement, idx) => {
            const yearBadge = judgement.year ? 
                `<span class="badge bg-primary">${judgement.year}</span>` : 
                '<span class="badge bg-secondary">Year N/A</span>';
            
            const sourceBadge = judgement.source ? 
                `<span class="badge bg-info">${judgement.source}</span>` : '';
            
            html += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between align-items-start mb-2">
                        <h6 class="mb-0">
                            <i class="fas fa-file-pdf text-danger me-2"></i>
                            ${escapeHtml(judgement.filename)}
                        </h6>
                        <div>
                            ${yearBadge}
                            ${sourceBadge}
                        </div>
                    </div>
                    <p class="mb-2 small text-dark">${escapeHtml(judgement.text_preview)}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-secondary">${judgement.category}</span>
                        <small class="text-muted">Case ${idx + 1} of ${data.similar_judgements.length}</small>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
                <div class="alert alert-info mt-3 mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    <small>Similar cases from 9,924 Supreme Court judgments (2000-2025)</small>
                </div>
            </div>
        `;
    }
    
    html += '</div></div>';
    
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// FIR ASSISTANT
// ============================================

function initializeFIRAssistant() {
    const firForm = document.getElementById('firForm');
    if (firForm) {
        firForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const incidentText = document.getElementById('incidentText').value.trim();
            
            if (!incidentText) {
                window.toast.warning('Please describe the incident');
                return;
            }
            
            if (incidentText.length < 50) {
                window.toast.warning('Please provide a more detailed description (at least 50 characters)');
                return;
            }
            
            // Show loading
            window.ModernUI.loading.showSpinner(true);
            
            try {
                const response = await fetch('/predict_fir_sections', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        incident_text: incidentText
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    displayFIRResults(data);
                    window.toast.success('FIR sections generated successfully!');
                } else {
                    window.toast.error('Error: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                window.toast.error('Network error: ' + error.message);
            } finally {
                window.ModernUI.loading.showSpinner(false);
            }
        });
    }
}

function displayFIRResults(data) {
    const resultsDiv = document.getElementById('firResults');
    const contentDiv = document.getElementById('firResultsContent');
    
    if (!resultsDiv || !contentDiv) return;
    
    const methodBadge = data.used_keyword_matching ? 
        `<span class="badge bg-success">Keyword Match: ${(data.keyword_confidence * 100).toFixed(0)}% Confidence</span>` :
        `<span class="badge bg-warning">Model Prediction</span>`;
    
    let html = `
        <!-- Crime Classification -->
        <div class="alert alert-info mb-4">
            <div class="row">
                <div class="col-md-12 mb-3">
                    <h6 class="fw-bold mb-2">Detection Method</h6>
                    ${methodBadge}
                    <small class="text-muted ms-2">
                        ${data.used_keyword_matching ? 
                            '(Sections detected directly from incident keywords - High Accuracy)' : 
                            '(Using AI model classification - Verify with keywords)'}
                    </small>
                </div>
                <div class="col-md-4">
                    <h6 class="fw-bold mb-1">Crime Type</h6>
                    <p class="mb-0">${escapeHtml(data.crime_type)}</p>
                </div>
                <div class="col-md-4">
                    <h6 class="fw-bold mb-1">Legal Category</h6>
                    <p class="mb-0">${escapeHtml(data.predicted_category)}</p>
                </div>
                <div class="col-md-4">
                    <h6 class="fw-bold mb-1">Overall Confidence</h6>
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar ${data.used_keyword_matching ? 'bg-success' : 'bg-warning'}" role="progressbar" 
                             style="width: ${data.used_keyword_matching ? (data.keyword_confidence * 100).toFixed(0) : (data.confidence * 100).toFixed(0)}%">
                            ${data.used_keyword_matching ? (data.keyword_confidence * 100).toFixed(0) : (data.confidence * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Primary Sections -->
        <div class="mb-4">
            <h5 class="text-danger mb-3">
                <i class="fas fa-exclamation-circle me-2"></i>PRIMARY SECTIONS (Apply These)
            </h5>
            <div class="row">
    `;
    
    data.primary_sections.forEach(section => {
        const bailableClass = section.bailable === false ? 'danger' : 'success';
        const bailableText = section.bailable === false ? 'Non-Bailable' : 'Bailable';
        const bailableIcon = section.bailable === false ? 'fa-ban' : 'fa-check-circle';
        
        html += `
            <div class="col-md-6 mb-3">
                <div class="card border-${bailableClass} h-100">
                    <div class="card-body">
                        <h5 class="card-title fw-bold text-${bailableClass}">
                            <i class="fas fa-gavel me-2"></i>${escapeHtml(section.section)}
                        </h5>
                        <h6 class="card-subtitle mb-2 text-muted">${escapeHtml(section.title)}</h6>
                        ${section.description ? `<p class="small text-muted mb-2">${escapeHtml(section.description)}</p>` : ''}
                        <div class="mt-3">
                            <span class="badge bg-warning text-dark me-2">
                                <i class="fas fa-balance-scale me-1"></i>${escapeHtml(section.penalty)}
                            </span>
                            <span class="badge bg-${bailableClass}">
                                <i class="fas ${bailableIcon} me-1"></i>${bailableText}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    // FIR Draft
    html += `
        <div class="mb-4">
            <h5 class="mb-3">
                <i class="fas fa-file-alt me-2"></i>Auto-Generated FIR Draft
            </h5>
            <textarea class="form-control font-monospace" id="firDraftText" rows="18" readonly style="white-space: pre-wrap;">${escapeHtml(data.fir_draft)}</textarea>
            <div class="mt-3 d-flex gap-2">
                <button class="btn btn-primary" onclick="copyFIRDraft()">
                    <i class="fas fa-copy me-2"></i>Copy Draft
                </button>
                <button class="btn btn-secondary" onclick="downloadFIRDraft()">
                    <i class="fas fa-download me-2"></i>Download as Text
                </button>
            </div>
        </div>
    `;
    
    // Similar Cases
    if (data.similar_cases && data.similar_cases.length > 0) {
        html += `
            <div class="mb-4">
                <h6 class="mb-3">
                    <i class="fas fa-gavel me-2"></i>Similar Supreme Court Cases (Reference)
                </h6>
                <div class="list-group">
        `;
        
        data.similar_cases.forEach((case_, idx) => {
            html += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">
                                <i class="fas fa-file-pdf text-danger me-2"></i>${escapeHtml(case_.filename)}
                            </h6>
                            <p class="mb-1 small">${escapeHtml(case_.text_preview)}</p>
                        </div>
                        <span class="badge bg-info ms-2">${case_.year || 'N/A'}</span>
                    </div>
                    <small class="text-muted">
                        <span class="badge bg-secondary">${escapeHtml(case_.category)}</span>
                        ${case_.source ? `<span class="badge bg-info ms-1">${escapeHtml(case_.source)}</span>` : ''}
                    </small>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    contentDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Copy and Download functions
window.copyFIRDraft = function() {
    const draftText = document.getElementById('firDraftText');
    if (draftText) {
        draftText.select();
        document.execCommand('copy');
        window.toast.success('FIR draft copied to clipboard!');
    }
};

window.downloadFIRDraft = function() {
    const draftText = document.getElementById('firDraftText').value;
    const blob = new Blob([draftText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fir_draft_' + new Date().getTime() + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    window.toast.success('FIR draft downloaded!');
};

// ============================================
// FILE UPLOAD
// ============================================

function initializeFileUpload() {
    const uploadForm = document.getElementById('fileUploadForm');
    const fileInput = document.getElementById('fileInputUpload');
    const uploadZone = document.getElementById('uploadZoneArea');
    
    if (uploadForm && fileInput) {
        uploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!fileInput.files || fileInput.files.length === 0) {
                window.toast.warning('Please select a file');
                return;
            }
            
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append('file', file);
            
            // Show loading
            window.ModernUI.loading.showSpinner(true);
            
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                window.ModernUI.loading.showSpinner(false);
                
                if (data.error) {
                    window.toast.error(data.error);
                } else {
                    displayClassificationResult(data);
                    window.toast.success('File processed successfully!');
                }
            })
            .catch(error => {
                window.ModernUI.loading.showSpinner(false);
                window.toast.error('Error: ' + error.message);
            });
        });
    }
    
    // Drag and drop
    if (uploadZone && fileInput) {
        uploadZone.addEventListener('click', () => fileInput.click());
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                uploadZone.classList.add('drag-over');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
            });
        });
        
        uploadZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                displayFileInfo(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                displayFileInfo(e.target.files[0]);
            }
        });
    }
}

function displayFileInfo(file) {
    const fileInfo = document.getElementById('uploadFileInfo');
    if (fileInfo) {
        fileInfo.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-file-pdf fa-2x text-danger me-3"></i>
                <strong>${file.name}</strong>
                <br>
                <small>${formatFileSize(file.size)}</small>
            </div>
        `;
        fileInfo.style.display = 'block';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// ANALYTICS
// ============================================

function loadAnalyticsData() {
    // Load dataset stats
    fetch('/dataset_stats')
    .then(response => response.json())
    .then(data => {
        if (!data.error && data.categories) {
            createCategoryChart(data);
        }
    })
    .catch(error => console.error('Error loading dataset stats:', error));
    
    // Load model accuracy
    fetch('/accuracy')
    .then(response => response.json())
    .then(data => {
        if (!data.error && data.classification_report) {
            createPerformanceChart(data);
        }
    })
    .catch(error => console.error('Error loading accuracy:', error));
}

function createCategoryChart(data) {
    const ctx = document.getElementById('categoryChartCanvas');
    if (!ctx) return;
    
    const labels = Object.keys(data.categories);
    const values = Object.values(data.categories);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

function createPerformanceChart(data) {
    const ctx = document.getElementById('performanceChartCanvas');
    if (!ctx) return;
    
    const categories = Object.keys(data.classification_report).filter(cat =>
        cat !== 'accuracy' && cat !== 'macro avg' && cat !== 'weighted avg'
    );
    
    const f1Scores = categories.map(cat => 
        (data.classification_report[cat]['f1-score'] * 100).toFixed(1)
    );
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'F1-Score (%)',
                data: f1Scores,
                backgroundColor: 'rgba(102, 126, 234, 0.8)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// FIR TEMPLATES
// ============================================

const FIR_TEMPLATES = {
    'theft': 'Complainant reports that his mobile phone Samsung Galaxy S21 worth Rs. 45,000 was stolen from his pocket while traveling in a crowded metro coach between Rajiv Chowk and Connaught Place station at around 6:30 PM on the date. The complainant suspects a person aged about 25-30 years wearing blue jeans and black t-shirt who was standing very close to him in the crowded coach.',
    
    'assault': 'Complainant states that he was beaten by 3-4 persons with wooden sticks and iron rods near his house. The accused persons were known to the complainant. The incident happened at about 8:00 PM when complainant was returning home. He sustained injuries on his head, back and hands. He was taken to hospital for treatment. The accused threatened to kill him if he reported to police.',
    
    'fraud': 'Complainant was deceived by a person named Ramesh Kumar who promised to provide him a government job in exchange for Rs. 2,50,000. The accused showed fake documents and appointment letter. After taking the money through bank transfer, the accused person stopped answering calls and emails. The complainant later found that the documents were forged and there was no such job.',
    
    'accident': 'A motorcycle bearing registration number DL-8C-1234 was being driven rashly and negligently on the main road at high speed. The rider hit a pedestrian who was crossing the road at zebra crossing. The pedestrian sustained serious injuries on head and legs and was immediately taken to hospital by police. The motorcycle rider fled from the spot without helping the injured person.',
    
    'dowry': 'Complainant (wife) states that her husband and in-laws have been harassing her for additional dowry of Rs. 5 lakhs and a car since the date of marriage. They are constantly taunting her that she did not bring enough dowry. Her husband beats her frequently and threatens to throw her out of the house if she does not bring the demanded money. Her in-laws also threaten to harm her if she tells anyone.'
};

window.loadFIRTemplate = function(type) {
    const template = FIR_TEMPLATES[type];
    const textArea = document.getElementById('incidentText');
    if (template && textArea) {
        textArea.value = template;
        window.toast.info(`Template loaded: ${type.charAt(0).toUpperCase() + type.slice(1)}`);
    }
};

// ============================================
// INITIALIZE ALL FUNCTIONS ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard Functions Initialized!');
    
    // Initialize all features
    initializeTextClassification();
    initializeFIRAssistant();
    initializeFileUpload();
    
    // Load analytics when analytics page is shown
    const analyticsNavItem = document.querySelector('[data-page="analytics"]');
    if (analyticsNavItem) {
        analyticsNavItem.addEventListener('click', function() {
            setTimeout(loadAnalyticsData, 500);
        });
    }
    
    console.log('✅ All backend integrations ready!');
});
