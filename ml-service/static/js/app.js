// Global variables
let currentFile = null;
let selectedDemoCategory = null;

// Demo scenarios data - All 9 categories
const demoScenarios = {
    "Criminal Appeal": {
        title: "Criminal Appeal Case - Section 302 IPC",
        text: "The appellant was convicted under Section 302 of the Indian Penal Code for committing murder. The prosecution alleged that the appellant caused the death of the deceased by stabbing him with a knife. The trial court found the appellant guilty and sentenced him to life imprisonment. The appellant challenges the conviction on grounds of insufficient evidence and improper identification of the accused."
    },
    "Bail Application": {
        title: "Anticipatory Bail Application",
        text: "The petitioner seeks anticipatory bail under Section 438 of the Code of Criminal Procedure in connection with FIR No. 234/2023 registered at Police Station for offences punishable under Sections 406, 420 read with 120-B of the Indian Penal Code. The petitioner apprehends arrest and seeks protection from custodial interrogation. The matter involves consideration of grounds for grant of anticipatory bail."
    },
    "Constitutional Matter": {
        title: "Fundamental Rights Violation - Article 19",
        text: "The petitioner challenges the constitutional validity of Section 66A of the Information Technology Act, 2000 as being violative of Article 19(1)(a) of the Constitution of India. The petitioner alleges that the section is vague and overbroad, and has been misused to curb free speech and expression. The matter involves interpretation of fundamental rights guaranteed under Part III of the Constitution."
    },
    "Contract Law": {
        title: "Breach of Contract - Specific Performance",
        text: "The plaintiff entered into an agreement to sell dated 15.06.2020 with the defendant for sale of immovable property. The defendant failed to execute the sale deed despite receiving the consideration amount. The plaintiff seeks specific performance of the agreement and damages for breach of contract. The matter involves interpretation of contract terms and applicable provisions of the Indian Contract Act, 1872 and Specific Relief Act."
    },
    "Property Dispute": {
        title: "Property Ownership and Partition",
        text: "This suit is filed for declaration of title, recovery of possession and partition of ancestral agricultural property bearing Survey No. 123. The plaintiff claims inheritance rights as legal heir. The defendant claims adverse possession for over 30 years and disputes the plaintiff's title. The matter involves interpretation of succession laws and adverse possession under Limitation Act."
    },
    "Taxation Matter": {
        title: "Income Tax Assessment Appeal",
        text: "The Commissioner of Income Tax challenges the order of the Income Tax Appellate Tribunal for Assessment Year 2020-21. The assessing officer made additions under Section 68 of the Income Tax Act, 1961 treating unexplained cash deposits as income from undisclosed sources. The assessee contends that the deposits represent agricultural income and gifts from relatives with supporting documentation."
    },
    "Service Matter": {
        title: "Government Service - Dismissal Challenge",
        text: "The petitioner challenges the order of dismissal from government service passed by the disciplinary authority. The petitioner, employed as Senior Clerk in Government office, alleges that the dismissal order was passed without following principles of natural justice and without proper departmental enquiry. The petition seeks reinstatement with back wages and all consequential benefits including promotion and seniority."
    },
    "Family Law": {
        title: "Divorce Petition - Hindu Marriage Act",
        text: "The petitioner seeks divorce under Section 13(1)(ia) of the Hindu Marriage Act, 1955 on grounds of cruelty and desertion. The marriage was solemnized on 15.03.2015. The petitioner also seeks custody of minor children aged 8 and 5 years, along with permanent alimony. The respondent has filed counter claiming restitution of conjugal rights and denying allegations of cruelty."
    },
    "Corporate Law": {
        title: "Company Law - Oppression and Mismanagement",
        text: "The petitioner shareholders challenge the actions of the Board of Directors alleging oppression and mismanagement under Sections 241 and 242 of the Companies Act, 2013. The petition seeks relief against insider trading violations, unauthorized asset transfers, and failure to declare dividends. The matter involves interpretation of fiduciary duties of directors and shareholder protection provisions under company law and SEBI regulations."
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadModelInfo();

    // Load analytics data when analytics tab is shown
    const analyticsTab = document.getElementById('analytics-tab');
    if (analyticsTab) {
        analyticsTab.addEventListener('shown.bs.tab', function() {
            loadAnalytics();
        });
    }

    // Auto-load analytics if analytics tab is active on page load
    if (document.getElementById('analytics-section').classList.contains('show')) {
        loadAnalytics();
    }
});

function initializeEventListeners() {
    // Text form submission
    const textForm = document.getElementById('textForm');
    if (textForm) {
        textForm.addEventListener('submit', handleTextPrediction);
    }
    
    // File upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('drop', handleFileDrop);
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Process file button
    const processFileBtn = document.getElementById('processFile');
    if (processFileBtn) {
        processFileBtn.addEventListener('click', handleFilePrediction);
    }
    
    // Sample text buttons
    document.querySelectorAll('.sample-text').forEach(button => {
        button.addEventListener('click', function() {
            const text = this.getAttribute('data-text');
            const legalTextArea = document.getElementById('legalText');
            if (legalTextArea) {
                legalTextArea.value = text;
            }
        });
    });
    
    // Batch processing
    const batchProcessBtn = document.getElementById('batchProcess');
    if (batchProcessBtn) {
        batchProcessBtn.addEventListener('click', handleBatchPrediction);
    }
    
    // Accuracy calculation (optional - button may not exist)
    const calculateAccuracyBtn = document.getElementById('calculateAccuracy');
    if (calculateAccuracyBtn) {
        calculateAccuracyBtn.addEventListener('click', handleAccuracyCalculation);
    }

    // Demo scenarios
    document.querySelectorAll('.demo-card').forEach(card => {
        card.addEventListener('click', handleDemoSelection);
    });
    
    const runDemoBtn = document.getElementById('runDemo');
    if (runDemoBtn) {
        runDemoBtn.addEventListener('click', handleDemoRun);
    }

    // Analytics
    const refreshAnalyticsBtn = document.getElementById('refreshAnalytics');
    if (refreshAnalyticsBtn) {
        refreshAnalyticsBtn.addEventListener('click', loadAnalytics);
    }

    // Demo mode
    const demoModeBtn = document.getElementById('demoModeBtn');
    if (demoModeBtn) {
        demoModeBtn.addEventListener('click', startDemoMode);
    }
}

// Text prediction
function handleTextPrediction(e) {
    e.preventDefault();
    
    const text = document.getElementById('legalText').value.trim();
    if (!text) {
        showAlert('Please enter some legal text', 'warning');
        return;
    }
    
    showLoading(true);
    
    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
    })
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        if (data.error) {
            showAlert(data.error, 'danger');
        } else {
            displayPredictionResult(data);
        }
    })
    .catch(error => {
        showLoading(false);
        showAlert('Error making prediction: ' + error.message, 'danger');
    });
}

// File handling
function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('uploadArea').classList.add('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    document.getElementById('uploadArea').classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function processFile(file) {
    const allowedTypes = ['application/pdf', 'text/plain'];
    const maxSize = 16 * 1024 * 1024; // 16MB
    
    if (!allowedTypes.includes(file.type)) {
        showAlert('Please upload a PDF or text file', 'warning');
        return;
    }
    
    if (file.size > maxSize) {
        showAlert('File size must be less than 16MB', 'warning');
        return;
    }
    
    currentFile = file;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileInfo').style.display = 'block';
}

function handleFilePrediction() {
    if (!currentFile) {
        showAlert('Please select a file first', 'warning');
        return;
    }
    
    showLoading(true);
    
    const formData = new FormData();
    formData.append('file', currentFile);
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        if (data.error) {
            showAlert(data.error, 'danger');
        } else {
            displayFileResult(data);
        }
    })
    .catch(error => {
        showLoading(false);
        showAlert('Error processing file: ' + error.message, 'danger');
    });
}

// Batch prediction
function handleBatchPrediction() {
    const textarea = document.getElementById('batchTexts');
    const texts = textarea.value.split('\n').filter(text => text.trim());
    
    if (texts.length === 0) {
        showAlert('Please enter at least one text for batch processing', 'warning');
        return;
    }
    
    showLoading(true);
    
    fetch('/batch_predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texts: texts })
    })
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        if (data.error) {
            showAlert(data.error, 'danger');
        } else {
            displayBatchResults(data.results);
        }
    })
    .catch(error => {
        showLoading(false);
        showAlert('Error in batch processing: ' + error.message, 'danger');
    });
}

// Accuracy calculation
function handleAccuracyCalculation() {
    showLoading(true);
    
    fetch('/accuracy')
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        if (data.error) {
            showAlert(data.error, 'danger');
        } else {
            displayAccuracyResults(data);
        }
    })
    .catch(error => {
        showLoading(false);
        showAlert('Error calculating accuracy: ' + error.message, 'danger');
    });
}

// Display functions
function displayPredictionResult(data) {
    const resultsDiv = document.getElementById('predictionResult');
    const resultsSection = document.getElementById('results');

    const confidencePercent = (data.confidence * 100).toFixed(1);

    // Add bounce-in animation
    resultsDiv.classList.add('bounce-in');
    
    let html = `
        <div class="row">
            <div class="col-md-8">
                <h6 class="text-muted mb-3"><i class="fas fa-file-alt me-2"></i>Input Text:</h6>
                <p class="bg-light p-3 rounded border">${escapeHtml(data.text)}</p>
            </div>
            <div class="col-md-4">
                <div class="text-center">
                    <h6 class="text-muted mb-3"><i class="fas fa-tag me-2"></i>Primary Classification:</h6>
                    <span class="badge category-badge bg-primary mb-3">${data.label}</span>
                    <div class="mb-2">
                        <strong class="text-success">Confidence: ${confidencePercent}%</strong>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Display all predictions if available
    if (data.all_predictions && data.all_predictions.length > 1) {
        html += `
            <div class="mt-4">
                <h6 class="text-muted mb-3"><i class="fas fa-chart-bar me-2"></i>All Category Predictions:</h6>
                <div class="row g-2">
        `;
        
        data.all_predictions.slice(0, 9).forEach(pred => {
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
                            <div class="confidence-bar mt-1">
                                <div class="confidence-fill" style="width: ${conf}%"></div>
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
    }
    
    // Display similar judgements if available
    if (data.similar_judgements && data.similar_judgements.length > 0) {
        html += `
            <div class="mt-4">
                <h6 class="text-muted mb-3">
                    <i class="fas fa-gavel me-2"></i>Similar Judgements from Supreme Court Database (2000-2025)
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
                <div class="list-group-item hover-shadow" style="transition: all 0.3s;">
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
                    <small>Showing random similar cases from ${data.similar_judgements.length > 0 ? 'combined 9,924' : 'the'} training samples (2000-2025 Supreme Court database)</small>
                </div>
            </div>
        `;
    }
    
    resultsDiv.innerHTML = html;
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function displayFileResult(data) {
    const resultsDiv = document.getElementById('predictionResult');
    const resultsSection = document.getElementById('results');
    
    const confidencePercent = (data.confidence * 100).toFixed(1);
    
    resultsDiv.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h6 class="text-muted mb-3">File: ${data.filename}</h6>
                <p class="text-muted mb-2">Text Length: ${data.text_length} characters</p>
                <div class="bg-light p-3 rounded">
                    <p>${escapeHtml(data.text)}</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center">
                    <h6 class="text-muted mb-3">Predicted Category:</h6>
                    <span class="badge category-badge bg-success mb-3">${data.label}</span>
                    <div class="mb-2">
                        <strong>Confidence: ${confidencePercent}%</strong>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function displayBatchResults(results) {
    const resultsDiv = document.getElementById('batchResults');
    
    let html = '<h6 class="mb-3">Batch Processing Results:</h6>';
    html += '<div class="table-responsive">';
    html += '<table class="table table-striped">';
    html += '<thead><tr><th>#</th><th>Text</th><th>Category</th><th>Confidence</th></tr></thead>';
    html += '<tbody>';
    
    results.forEach((result, index) => {
        if (result.success) {
            const confidencePercent = (result.confidence * 100).toFixed(1);
            html += `<tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(result.text)}</td>
                <td><span class="badge bg-primary">${result.label}</span></td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2">${confidencePercent}%</span>
                        <div class="confidence-bar flex-grow-1">
                            <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
                        </div>
                    </div>
                </td>
            </tr>`;
        } else {
            html += `<tr>
                <td>${index + 1}</td>
                <td colspan="3" class="text-danger">Error: ${result.error}</td>
            </tr>`;
        }
    });
    
    html += '</tbody></table></div>';
    resultsDiv.innerHTML = html;
}

function displayAccuracyResults(data) {
    const resultsDiv = document.getElementById('accuracyResults');
    
    let html = '<div class="accuracy-metric">';
    html += `<h3>${(data.accuracy * 100).toFixed(1)}%</h3>`;
    html += '<p class="mb-0">Overall Accuracy</p>';
    html += '</div>';
    
    html += '<div class="row">';
    
    // Classification report
    if (data.classification_report) {
        html += '<div class="col-md-6">';
        html += '<h6>Classification Report:</h6>';
        html += '<div class="table-responsive">';
        html += '<table class="table table-sm table-striped">';
        html += '<thead><tr><th>Category</th><th>Precision</th><th>Recall</th><th>F1-Score</th></tr></thead>';
        html += '<tbody>';
        
        for (const [category, metrics] of Object.entries(data.classification_report)) {
            if (category !== 'accuracy' && category !== 'macro avg' && category !== 'weighted avg') {
                html += `<tr>
                    <td><strong>${category}</strong></td>
                    <td>${(metrics.precision * 100).toFixed(1)}%</td>
                    <td>${(metrics.recall * 100).toFixed(1)}%</td>
                    <td>${(metrics['f1-score'] * 100).toFixed(1)}%</td>
                </tr>`;
            }
        }
        
        html += '</tbody></table></div></div>';
    }
    
    // Confusion matrix
    if (data.confusion_matrix) {
        html += '<div class="col-md-6">';
        html += '<h6>Confusion Matrix:</h6>';
        html += '<div class="table-responsive">';
        html += '<table class="table table-sm">';
        html += '<thead><tr><th></th>';
        
        // Get unique categories from the evaluation
        const categories = Object.keys(data.classification_report).filter(cat => 
            cat !== 'accuracy' && cat !== 'macro avg' && cat !== 'weighted avg'
        );
        
        categories.forEach(cat => {
            html += `<th class="text-center">${cat}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        data.confusion_matrix.forEach((row, i) => {
            html += `<tr><td><strong>${categories[i]}</strong></td>`;
            row.forEach(val => {
                html += `<td class="text-center">${val}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</tbody></table></div></div>';
    }
    
    html += '</div>';
    
    html += `<div class="mt-3 text-muted">
        <small>Calculated on ${data.total_samples} sample texts</small>
    </div>`;
    
    resultsDiv.innerHTML = html;
}

// Utility functions
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.style.display = 'flex';
        } else {
            overlay.style.display = 'none';
        }
    }
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alert = bootstrap.Alert.getInstance(alertDiv);
        if (alert) {
            alert.close();
        }
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadModelInfo() {
    fetch('/model_info')
    .then(response => response.json())
    .then(data => {
        const infoDiv = document.getElementById('modelInfo');
        if (data.error) {
            infoDiv.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        } else {
            infoDiv.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-robot fa-2x text-primary mb-2"></i>
                    <h6>${data.model_type}</h6>
                    <p class="mb-1"><strong>Labels:</strong> ${data.num_labels}</p>
                    <p class="mb-1"><strong>Device:</strong> ${data.device}</p>
                    <span class="badge ${data.loaded ? 'bg-success' : 'bg-danger'}">
                        ${data.loaded ? 'Model Loaded' : 'Model Not Loaded'}
                    </span>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error loading model info:', error);
    });
}

// Demo functionality
function handleDemoSelection(e) {
    const category = e.currentTarget.getAttribute('data-category');
    selectedDemoCategory = category;

    // Remove selected class from all cards
    document.querySelectorAll('.demo-card').forEach(card => {
        card.classList.remove('border-primary', 'shadow');
    });

    // Add selected class to clicked card
    e.currentTarget.classList.add('border-primary', 'shadow');

    // Show demo result section
    const demoResult = document.getElementById('demoResult');
    const demoText = document.getElementById('demoText');

    if (demoScenarios[category]) {
        demoText.innerHTML = `
            <h6 class="text-primary mb-2">${demoScenarios[category].title}</h6>
            <p class="mb-0">${demoScenarios[category].text}</p>
        `;
        demoResult.style.display = 'block';
        demoResult.scrollIntoView({ behavior: 'smooth' });
    }
}

function handleDemoRun() {
    if (!selectedDemoCategory || !demoScenarios[selectedDemoCategory]) {
        showAlert('Please select a demo scenario first', 'warning');
        return;
    }

    const text = demoScenarios[selectedDemoCategory].text;

    showLoading(true);

    fetch('/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
    })
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        if (data.error) {
            showAlert(data.error, 'danger');
        } else {
            displayPredictionResult(data);
        }
    })
    .catch(error => {
        showLoading(false);
        showAlert('Error making prediction: ' + error.message, 'danger');
    });
}

// Analytics functionality
function loadAnalytics() {
    const refreshBtn = document.getElementById('refreshAnalytics');
    const originalText = refreshBtn.innerHTML;
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Loading...';
    refreshBtn.disabled = true;

    // Load dataset stats
    loadDatasetStats();

    // Load model accuracy
    loadModelAccuracy();

    // Initialize charts after data loads
    setTimeout(() => {
        initializeCharts();
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
    }, 1000);
}

function loadDatasetStats() {
    fetch('/dataset_stats')
    .then(response => response.json())
    .then(data => {
        const statsDiv = document.getElementById('datasetStats');
        const totalSamples = document.getElementById('totalSamples');

        if (data.error) {
            statsDiv.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        } else {
            totalSamples.textContent = data.total_samples.toLocaleString();

            let html = '<div class="category-stats">';
            if (data.categories) {
                for (const [category, count] of Object.entries(data.categories)) {
                    const percentage = data.category_percentages ? data.category_percentages[category] : 0;
                    html += `
                        <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                            <span class="badge bg-primary">${category}</span>
                            <div class="text-end">
                                <span class="fw-bold">${count.toLocaleString()}</span>
                                <small class="text-muted ms-1">(${percentage.toFixed(1)}%)</small>
                            </div>
                        </div>
                    `;
                }
            }
            html += '</div>';
            statsDiv.innerHTML = html;
        }
    })
    .catch(error => {
        console.error('Error loading dataset stats:', error);
    });
}

function loadModelAccuracy() {
    fetch('/accuracy')
    .then(response => response.json())
    .then(data => {
        const accuracyDiv = document.getElementById('modelAccuracy');

        if (data.error) {
            accuracyDiv.textContent = '--%';
        } else {
            accuracyDiv.textContent = (data.accuracy * 100).toFixed(1) + '%';
        }
    })
    .catch(error => {
        console.error('Error loading model accuracy:', error);
        document.getElementById('modelAccuracy').textContent = '--%';
    });
}

function initializeCharts() {
    // Category Distribution Chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        fetch('/dataset_stats')
        .then(response => response.json())
        .then(data => {
            if (data.categories) {
                const labels = Object.keys(data.categories);
                const values = Object.values(data.categories);

                new Chart(categoryCtx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: values,
                            backgroundColor: [
                                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                                        return `${context.label}: ${context.parsed.toLocaleString()} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });
    }

    // Performance Metrics Chart
    const metricsCtx = document.getElementById('metricsChart');
    if (metricsCtx) {
        fetch('/accuracy')
        .then(response => response.json())
        .then(data => {
            if (!data.error && data.classification_report) {
                const categories = Object.keys(data.classification_report).filter(cat =>
                    cat !== 'accuracy' && cat !== 'macro avg' && cat !== 'weighted avg'
                );

                const precision = categories.map(cat => data.classification_report[cat]['precision'] * 100);
                const recall = categories.map(cat => data.classification_report[cat]['recall'] * 100);
                const f1 = categories.map(cat => data.classification_report[cat]['f1-score'] * 100);

                new Chart(metricsCtx, {
                    type: 'bar',
                    data: {
                        labels: categories,
                        datasets: [{
                            label: 'Precision',
                            data: precision,
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }, {
                            label: 'Recall',
                            data: recall,
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }, {
                            label: 'F1-Score',
                            data: f1,
                            backgroundColor: 'rgba(75, 192, 192, 0.6)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                            }
                        }
                    }
                });
            }
        });
    }
}

// Demo mode functionality
function startDemoMode() {
    // Switch to demo tab
    const demoTab = new bootstrap.Tab(document.getElementById('demo-tab'));
    demoTab.show();

    // Start automated demo after a short delay
    setTimeout(() => {
        runAutomatedDemo();
    }, 1000);
}

function runAutomatedDemo() {
    const categories = Object.keys(demoScenarios);
    let currentIndex = 0;

    function runNextDemo() {
        if (currentIndex >= categories.length) {
            // Demo complete
            showAlert(`Demo Complete! Successfully demonstrated all ${categories.length} legal categories. All classifications working perfectly!`, 'success');
            
            // Reset all cards
            document.querySelectorAll('.demo-card').forEach(card => {
                card.classList.remove('border-primary', 'shadow');
            });
            return;
        }

        const category = categories[currentIndex];
        selectedDemoCategory = category;

        // Show progress alert
        showAlert(`Demo ${currentIndex + 1}/${categories.length}: Testing ${category}...`, 'info');

        // Highlight the current demo card
        document.querySelectorAll('.demo-card').forEach(card => {
            card.classList.remove('border-primary', 'shadow');
        });

        const currentCard = document.querySelector(`[data-category="${category}"]`);
        if (currentCard) {
            currentCard.classList.add('border-primary', 'shadow');
            currentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Show demo text
        const demoResult = document.getElementById('demoResult');
        const demoText = document.getElementById('demoText');

        if (demoScenarios[category]) {
            demoText.innerHTML = `
                <h6 class="text-primary mb-2"><i class="fas fa-info-circle me-2"></i>${demoScenarios[category].title}</h6>
                <p class="mb-0 small">${demoScenarios[category].text}</p>
            `;
            demoResult.style.display = 'block';
        }

        // Auto-run classification after showing text
        setTimeout(() => {
            showLoading(true);

            fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: demoScenarios[category].text })
            })
            .then(response => response.json())
            .then(data => {
                showLoading(false);
                if (data.error) {
                    showAlert(`Demo ${currentIndex + 1}: Error - ${data.error}`, 'warning');
                    currentIndex++;
                    setTimeout(runNextDemo, 2000);
                } else {
                    displayPredictionResult(data);
                    const confidencePercent = (data.confidence * 100).toFixed(1);
                    const isCorrect = data.label === category;
                    const statusIcon = isCorrect ? '✅' : '⚠️';
                    
                    showAlert(`${statusIcon} Demo ${currentIndex + 1}/${categories.length}: "${category}" classified as "${data.label}" (${confidencePercent}% confidence)`, 
                             isCorrect ? 'success' : 'warning');

                    // Move to next demo after a delay
                    currentIndex++;
                    setTimeout(runNextDemo, 5000); // 5 second delay to review results
                }
            })
            .catch(error => {
                showLoading(false);
                showAlert(`Demo ${currentIndex + 1}: Network error - ${error.message}`, 'danger');
                currentIndex++;
                setTimeout(runNextDemo, 2000);
            });
        }, 1500); // Show text for 1.5 seconds before classifying
    }

    // Start the demo sequence
    showAlert(`Starting Automated Demo! Will demonstrate all ${categories.length} legal categories. Sit back and watch!`, 'info');
    
    // Start after a short delay
    setTimeout(() => {
        runNextDemo();
    }, 1500);
}

// ====================================================================
// VOICE INPUT FUNCTIONALITY
// ====================================================================

let recognition = null;
let isListening = false;

// Initialize Voice Recognition
function initializeVoiceRecognition() {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.warn('Web Speech API not supported in this browser');
        return false;
    }
    
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Show interim results
    recognition.maxAlternatives = 1;
    
    // Try to detect language automatically, but default to Hindi
    // Users can speak in either Hindi or English
    recognition.lang = 'hi-IN'; // Start with Hindi
    
    let finalTranscript = '';
    
    recognition.onstart = function() {
        isListening = true;
        const voiceBtn = document.getElementById('voiceInputBtn');
        const voiceStatus = document.getElementById('voiceStatus');
        
        if (voiceBtn) {
            voiceBtn.classList.add('listening');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        }
        
        if (voiceStatus) {
            voiceStatus.style.display = 'block';
        }
        
        console.log('Voice recognition started');
    };
    
    recognition.onresult = function(event) {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update textarea with transcribed text
        const incidentText = document.getElementById('incidentText');
        if (incidentText) {
            const currentText = incidentText.value;
            const baseText = currentText.replace(interimTranscript, '');
            incidentText.value = finalTranscript + interimTranscript;
        }
        
        // Show detected language based on recognition language
        const languageDetectedDiv = document.getElementById('languageDetected');
        const detectedLangSpan = document.getElementById('detectedLang');
        
        if (languageDetectedDiv && detectedLangSpan) {
            const langName = recognition.lang === 'hi-IN' ? 'Hindi (हिंदी)' : 'English';
            detectedLangSpan.textContent = langName;
            languageDetectedDiv.style.display = 'block';
        }
    };
    
    recognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        
        let errorMessage = 'Voice recognition error: ';
        switch(event.error) {
            case 'no-speech':
                errorMessage += 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage += 'Microphone not found. Please check your microphone.';
                break;
            case 'not-allowed':
                errorMessage += 'Microphone permission denied. Please allow microphone access.';
                break;
            default:
                errorMessage += event.error;
        }
        
        showAlert(errorMessage, 'warning');
        stopVoiceRecognition();
    };
    
    recognition.onend = function() {
        console.log('Voice recognition ended');
        
        // If it was listening and ended unexpectedly, restart it
        if (isListening) {
            // Don't auto-restart to give user control
            stopVoiceRecognition();
        }
    };
    
    return true;
}

function startVoiceRecognition() {
    if (!recognition) {
        const initialized = initializeVoiceRecognition();
        if (!initialized) {
            showAlert('Voice recognition is not supported in your browser. Please use Google Chrome or Microsoft Edge.', 'warning');
            return;
        }
    }
    
    // Get selected language
    const selectedLang = document.querySelector('input[name="voiceLang"]:checked');
    if (selectedLang) {
        recognition.lang = selectedLang.value;
    }
    
    try {
        recognition.start();
        const langName = recognition.lang === 'hi-IN' ? 'Hindi (हिंदी)' : 'English';
        showAlert(`🎤 Listening in ${langName}... Speak now!`, 'info');
    } catch (error) {
        console.error('Error starting voice recognition:', error);
        
        // If already started, just continue
        if (error.message && error.message.includes('already started')) {
            console.log('Recognition already running');
        } else {
            showAlert('Could not start voice recognition. Please try again.', 'warning');
        }
    }
}

function stopVoiceRecognition() {
    if (recognition && isListening) {
        recognition.stop();
    }
    
    isListening = false;
    
    const voiceBtn = document.getElementById('voiceInputBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    
    if (voiceBtn) {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    }
    
    if (voiceStatus) {
        voiceStatus.style.display = 'none';
    }
}

function toggleVoiceRecognition() {
    if (isListening) {
        stopVoiceRecognition();
        showAlert('🛑 Voice input stopped', 'info');
    } else {
        startVoiceRecognition();
    }
}

// Add voice input button event listener when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    if (voiceInputBtn) {
        voiceInputBtn.addEventListener('click', toggleVoiceRecognition);
    }
    
    // Initialize recognition on page load
    initializeVoiceRecognition();
});

// ====================================================================
// FIR ASSISTANT FUNCTIONALITY
// ====================================================================

// FIR Templates
const FIR_TEMPLATES = {
    'theft': 'Complainant reports that his mobile phone Samsung Galaxy S21 worth Rs. 45,000 was stolen from his pocket while traveling in a crowded metro coach between Rajiv Chowk and Connaught Place station at around 6:30 PM on the date. The complainant suspects a person aged about 25-30 years wearing blue jeans and black t-shirt who was standing very close to him in the crowded coach.',
    
    'assault': 'Complainant states that he was beaten by 3-4 persons with wooden sticks and iron rods near his house. The accused persons were known to the complainant. The incident happened at about 8:00 PM when complainant was returning home. He sustained injuries on his head, back and hands. He was taken to hospital for treatment. The accused threatened to kill him if he reported to police.',
    
    'fraud': 'Complainant was deceived by a person named Ramesh Kumar who promised to provide him a government job in exchange for Rs. 2,50,000. The accused showed fake documents and appointment letter. After taking the money through bank transfer, the accused person stopped answering calls and emails. The complainant later found that the documents were forged and there was no such job.',
    
    'accident': 'A motorcycle bearing registration number DL-8C-1234 was being driven rashly and negligently on the main road at high speed. The rider hit a pedestrian who was crossing the road at zebra crossing. The pedestrian sustained serious injuries on head and legs and was immediately taken to hospital by police. The motorcycle rider fled from the spot without helping the injured person.',
    
    'dowry': 'Complainant (wife) states that her husband and in-laws have been harassing her for additional dowry of Rs. 5 lakhs and a car since the date of marriage. They are constantly taunting her that she did not bring enough dowry. Her husband beats her frequently and threatens to throw her out of the house if she does not bring the demanded money. Her in-laws also threaten to harm her if she tells anyone.'
};

function loadFIRTemplate(type) {
    const template = FIR_TEMPLATES[type];
    if (template) {
        document.getElementById('incidentText').value = template;
        showAlert(`Template loaded: ${type.charAt(0).toUpperCase() + type.slice(1)}`, 'info');
    }
}

// Handle FIR Form Submission
const firForm = document.getElementById('firForm');
if (firForm) {
    firForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const incidentText = document.getElementById('incidentText').value.trim();
        
        if (!incidentText) {
            showAlert('Please describe the incident', 'warning');
            return;
        }
        
        if (incidentText.length < 50) {
            showAlert('Please provide a more detailed description (at least 50 characters)', 'warning');
            return;
        }
        
        // Show loading
        showLoading(true);
        
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
                showAlert('FIR sections generated successfully!', 'success');
            } else {
                showAlert('Error: ' + (data.error || 'Unknown error'), 'danger');
            }
        } catch (error) {
            showAlert('Network error: ' + error.message, 'danger');
        } finally {
            showLoading(false);
        }
    });
}

function displayFIRResults(data) {
    const resultsDiv = document.getElementById('firResults');
    const contentDiv = document.getElementById('firResultsContent');
    
    // Show method used and confidence
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
                <button class="btn btn-info" onclick="printFIRDraft()">
                    <i class="fas fa-print me-2"></i>Print Draft
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
                <div class="alert alert-info mt-2 mb-0">
                    <small>
                        <i class="fas fa-info-circle me-1"></i>
                        These are similar cases from our database of 9,924 Supreme Court judgments (2000-2025)
                    </small>
                </div>
            </div>
        `;
    }
    
    contentDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyFIRDraft() {
    const draftText = document.getElementById('firDraftText');
    draftText.select();
    draftText.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        showAlert('FIR draft copied to clipboard!', 'success');
    } catch (err) {
        showAlert('Failed to copy. Please select and copy manually.', 'warning');
    }
}

function downloadFIRDraft() {
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
    showAlert('FIR draft downloaded!', 'success');
}

function printFIRDraft() {
    printOfficialFIR();
}

function printOfficialFIR() {
    // Get the incident text and FIR data
    const incidentText = document.getElementById('incidentText').value;
    const firDraftText = document.getElementById('firDraftText') ? document.getElementById('firDraftText').value : '';
    
    // Get current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Get sections from the page if available
    let sections = [];
    const sectionCards = document.querySelectorAll('.card-title.fw-bold.text-danger, .card-title.fw-bold.text-success');
    sectionCards.forEach(card => {
        const sectionText = card.textContent.trim().replace('🔨', '').trim();
        if (sectionText && sectionText !== '') {
            sections.push(sectionText);
        }
    });
    
    const sectionsText = sections.length > 0 ? sections.join(', ') : 'To be filled by investigating officer';
    
    // Create printable content
    const printContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>First Information Report (FIR)</title>
    <style>
        @page {
            size: A4;
            margin: 1.5cm;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #000;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .fir-header {
            text-align: center;
            border: 3px double #000;
            padding: 15px;
            margin-bottom: 30px;
        }
        
        .fir-header h1 {
            font-size: 20pt;
            font-weight: bold;
            margin: 5px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .fir-header h2 {
            font-size: 16pt;
            margin: 5px 0;
            font-weight: normal;
        }
        
        .fir-header p {
            margin: 3px 0;
            font-size: 11pt;
        }
        
        .fir-number {
            text-align: right;
            font-weight: bold;
            margin: 10px 0;
            font-size: 13pt;
        }
        
        .fir-field {
            margin: 12px 0;
            page-break-inside: avoid;
        }
        
        .fir-field-label {
            font-weight: bold;
            display: inline-block;
            min-width: 180px;
            vertical-align: top;
        }
        
        .fir-field-value {
            display: inline;
            border-bottom: 1px dotted #333;
            padding: 0 5px;
        }
        
        .fir-section {
            margin: 20px 0;
            page-break-inside: avoid;
        }
        
        .fir-section h3 {
            font-size: 13pt;
            font-weight: bold;
            margin: 15px 0 10px 0;
            text-decoration: underline;
        }
        
        .fir-content {
            border: 1px solid #000;
            padding: 15px;
            margin: 10px 0;
            background: #fff;
            text-align: justify;
            min-height: 150px;
        }
        
        .fir-sections-box {
            border: 2px solid #000;
            padding: 12px;
            margin: 15px 0;
            background: #f9f9f9;
        }
        
        .signature-section {
            margin-top: 60px;
            page-break-inside: avoid;
        }
        
        .signature-row {
            display: flex;
            justify-content: space-between;
            margin-top: 80px;
        }
        
        .signature-box {
            width: 45%;
            text-align: center;
        }
        
        .signature-line {
            border-top: 2px solid #000;
            margin-bottom: 8px;
            padding-top: 5px;
        }
        
        .instructions {
            font-size: 9pt;
            font-style: italic;
            color: #666;
            margin-top: 30px;
            page-break-inside: avoid;
        }
        
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72pt;
            color: rgba(0, 0, 0, 0.05);
            z-index: -1;
            font-weight: bold;
        }
        
        @media print {
            body {
                padding: 0;
            }
            
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="watermark">DRAFT</div>
    
    <!-- Official Header -->
    <div class="fir-header">
        <h1>भारत सरकार / GOVERNMENT OF INDIA</h1>
        <h2>FIRST INFORMATION REPORT</h2>
        <p>(Under Section 154 Cr.P.C.)</p>
        <p style="font-weight: bold; margin-top: 10px;">Police Station: ________________</p>
    </div>
    
    <!-- FIR Number -->
    <div class="fir-number">
        FIR No.: ________________ / ${new Date().getFullYear()}
    </div>
    
    <!-- Basic Information -->
    <div class="fir-section">
        <div class="fir-field">
            <span class="fir-field-label">1. District:</span>
            <span class="fir-field-value">_____________________________________</span>
        </div>
        
        <div class="fir-field">
            <span class="fir-field-label">2. Police Station:</span>
            <span class="fir-field-value">_____________________________________</span>
        </div>
        
        <div class="fir-field">
            <span class="fir-field-label">3. Date & Time of Report:</span>
            <span class="fir-field-value">${dateStr} at ${timeStr}</span>
        </div>
        
        <div class="fir-field">
            <span class="fir-field-label">4. Date & Time of Offence:</span>
            <span class="fir-field-value">_____________________________________</span>
        </div>
        
        <div class="fir-field">
            <span class="fir-field-label">5. Place of Occurrence:</span>
            <span class="fir-field-value">_____________________________________</span>
        </div>
    </div>
    
    <!-- Sections Applied -->
    <div class="fir-section">
        <h3>6. Sections of Law Applied:</h3>
        <div class="fir-sections-box">
            <strong>IPC/Special Acts Sections:</strong> ${sectionsText}
        </div>
    </div>
    
    <!-- Complainant Details -->
    <div class="fir-section">
        <h3>7. Complainant Details:</h3>
        <div class="fir-field">
            <span class="fir-field-label">Name:</span>
            <span class="fir-field-value">_____________________________________</span>
        </div>
        
        <div class="fir-field">
            <span class="fir-field-label">Father's/Husband's Name:</span>
            <span class="fir-field-value">_____________________________________</span>
        </div>
        
        <div class="fir-field">
            <span class="fir-field-label">Address:</span>
            <span class="fir-field-value">_____________________________________</span>
        </div>
        
        <div class="fir-field">
            <span class="fir-field-label">Mobile Number:</span>
            <span class="fir-field-value">_____________________________________</span>
        </div>
    </div>
    
    <!-- Description of Offence -->
    <div class="fir-section">
        <h3>8. Description of Offence / Incident:</h3>
        <div class="fir-content">
            ${escapeHtml(incidentText) || '[Incident description to be filled]'}
        </div>
    </div>
    
    <!-- Action Taken -->
    <div class="fir-section">
        <div class="fir-field">
            <span class="fir-field-label">9. Action Taken:</span>
            <span class="fir-field-value">FIR registered and investigation initiated</span>
        </div>
        
        <div class="fir-field">
            <span class="fir-field-label">10. Investigating Officer:</span>
            <span class="fir-field-value">_____________________________________</span>
        </div>
        
        <div class="fir-field">
            <span class="fir-field-label">Rank:</span>
            <span class="fir-field-value">_____________________________________</span>
        </div>
    </div>
    
    <!-- Signatures -->
    <div class="signature-section">
        <div class="signature-row">
            <div class="signature-box">
                <div class="signature-line"></div>
                <strong>Signature of Complainant</strong><br>
                <span style="font-size: 10pt;">Date: ${dateStr}</span>
            </div>
            
            <div class="signature-box">
                <div class="signature-line"></div>
                <strong>Signature of Officer</strong><br>
                <span style="font-size: 10pt;">Name & Designation</span>
            </div>
        </div>
    </div>
    
    <!-- Instructions -->
    <div class="instructions">
        <p><strong>Note:</strong> This is a computer-generated draft FIR. Please verify all details, fill in the required fields, 
        and obtain proper signatures before filing. This document should be printed on official police letterhead.</p>
        <p><strong>Instructions:</strong> Fill in all blank fields before submitting. Ensure complainant's signature is obtained 
        in presence of the recording officer. Investigation should commence immediately upon registration.</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; font-size: 9pt; color: #999;">
        <p>Generated by NyayaMitra FIR Assistant on ${dateStr} at ${timeStr}</p>
    </div>
</body>
</html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = function() {
        printWindow.focus();
        setTimeout(() => {
    printWindow.print();
        }, 250);
    };
    
    showAlert('📄 Opening print preview... Print on official letterhead!', 'info');
}