from flask import Flask, render_template, request, jsonify, flash, redirect, url_for
from flask_cors import CORS
import os
import os
import pandas as pd
from werkzeug.utils import secure_filename
import PyPDF2
import io
import numpy as np
import threading
from datetime import datetime
import json

# Import FIR section mapping
from quick_prototype_category_to_sections import (
    CATEGORY_TO_SECTIONS,
    get_sections_for_category,
    search_sections_by_keywords,
    get_direct_ipc_sections  # NEW: Direct keyword-based section recommendation
)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])
app.secret_key = 'your-secret-key-here'

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'txt'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Global variables for model and data
classifier = None
dataset_stats = {}
model_metrics = {}

# Load model on startup
MODEL_PATH = "saved_model_balanced_extended"

def load_model():
    """Load the trained model"""
    global classifier
    try:
        print("Importing PyTorch and Transformers (this may take a moment)...")
        import torch
        from transformers import pipeline
        
        device = 0 if torch.cuda.is_available() else -1
        print(f"Loading model from {MODEL_PATH}...")
        classifier = pipeline("text-classification", model=MODEL_PATH, device=device)
        print("Model successfully loaded!")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_stream):
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        return f"Error extracting text: {str(e)}"

def get_dataset_stats():
    """Get dataset statistics"""
    try:
        df = pd.read_csv('data/prepared_dataset.csv')
        stats = {
            'total_samples': len(df),
            'categories': df['label'].value_counts().to_dict(),
            'category_percentages': (df['label'].value_counts(normalize=True) * 100).round(2).to_dict()
        }
        return stats
    except Exception as e:
        return {'error': str(e)}

def find_similar_judgements(category, input_text):
    """Find similar judgements from the same category - Using COMBINED dataset"""
    try:
        # Load BOTH datasets for complete coverage
        dfs = []
        
        # Load 2020-2025 dataset
        if os.path.exists('data/dataset_2020_2025_improved.csv'):
            try:
                df1 = pd.read_csv('data/dataset_2020_2025_improved.csv')
                df1 = df1[df1['label'] != 'Uncategorized']
                dfs.append(df1)
            except Exception as e:
                print(f"Error loading 2020-2025: {e}")
        
        # Load 2000-2019 dataset
        if os.path.exists('data/dataset_2000_2019_labeled.csv'):
            try:
                df2 = pd.read_csv('data/dataset_2000_2019_labeled.csv')
                df2 = df2[df2['label'] != 'Uncategorized']
                dfs.append(df2)
            except Exception as e:
                print(f"Error loading 2000-2019: {e}")
        
        # If no datasets loaded, try prepared_dataset
        if len(dfs) == 0:
            if os.path.exists('data/prepared_dataset.csv'):
                try:
                    df = pd.read_csv('data/prepared_dataset.csv')
                    df = df[df['label'] != 'Uncategorized']
                    dfs.append(df)
                except:
                    pass
        
        if len(dfs) == 0:
            return []
        
        # Combine all datasets for complete coverage (2000-2025)
        df_combined = pd.concat(dfs, ignore_index=True)
        
        # Filter by category
        category_df = df_combined[df_combined['label'] == category]
        
        if len(category_df) == 0:
            return []
        
        # Get random samples from same category across all years
        sample_size = min(10, len(category_df))
        similar_cases = category_df.sample(n=sample_size, random_state=None)  # Use None for truly random samples each time
        
        judgements = []
        for idx, row in similar_cases.iterrows():
            year = int(row.get('year', 0)) if 'year' in row and pd.notna(row.get('year')) else None
            
            judgements.append({
                'filename': row.get('filename', 'Unknown Case'),
                'year': year,
                'text_preview': str(row['text'])[:200] + "..." if len(str(row['text'])) > 200 else str(row['text']),
                'category': category,
                'source': '2020-2025' if year and year >= 2020 else '2000-2019' if year else 'Unknown'
            })
        
        # Sort by year (most recent first)
        judgements.sort(key=lambda x: x['year'] if x['year'] else 0, reverse=True)
        
        return judgements
    except Exception as e:
        print(f"Error finding similar judgements: {e}")
        return []

def predict_text(text, return_all_scores=False):
    """Make prediction on text"""
    global classifier
    if classifier is None:
        return {'error': 'Model not loaded'}
    
    try:
        # Limit text length to avoid memory issues
        if len(text) > 10000:
            text = text[:10000] + "..."
        
        # Get prediction with all scores
        prediction = classifier(text, return_all_scores=True)[0]
        
        # Sort by confidence
        prediction_sorted = sorted(prediction, key=lambda x: x['score'], reverse=True)
        
        # Top prediction
        top_pred = prediction_sorted[0]
        
        result = {
            'text': text[:200] + "..." if len(text) > 200 else text,
            'label': top_pred['label'],
            'confidence': round(top_pred['score'], 4),
            'success': True
        }
        
        # Add all predictions if requested
        if return_all_scores:
            result['all_predictions'] = [
                {'label': p['label'], 'confidence': round(p['score'], 4)}
                for p in prediction_sorted
            ]
        
        return result
    except Exception as e:
        return {'error': str(e)}

@app.route('/api/health')
def health_check():
    """Health check endpoint for service discovery"""
    return jsonify({
        'status': 'ok',
        'service': 'NyayaMitra ML Service',
        'model_loaded': classifier is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html', 
                         dataset_stats=dataset_stats,
                         model_metrics=model_metrics)

@app.route('/predict', methods=['POST'])
def predict():
    """Predict endpoint for text input"""
    data = request.get_json()
    text = data.get('text', '')
    
    if not text.strip():
        return jsonify({'error': 'Please enter some text'})
    
    result = predict_text(text, return_all_scores=True)
    
    # Add similar judgements if prediction successful
    if 'label' in result and 'error' not in result:
        result['similar_judgements'] = find_similar_judgements(result['label'], text)
    
    return jsonify(result)

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and prediction"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'})
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only PDF and TXT files are allowed.'})
    
    try:
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(io.BytesIO(file.read()))
        else:  # txt file
            text = file.read().decode('utf-8')
        
        if not text or text.startswith('Error'):
            return jsonify({'error': 'Could not extract text from file'})
        
        # Make prediction
        result = predict_text(text)
        result['filename'] = secure_filename(file.filename)
        result['text_length'] = len(text)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'})

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Predict multiple texts"""
    data = request.get_json()
    texts = data.get('texts', [])
    
    if not texts:
        return jsonify({'error': 'No texts provided'})
    
    results = []
    for text in texts:
        if text.strip():
            result = predict_text(text)
            results.append(result)
    
    return jsonify({'results': results})

@app.route('/model_info')
def model_info():
    """Get model information"""
    try:
        # Load model config
        config_path = os.path.join(MODEL_PATH, 'config.json')
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        info = {
            'model_type': config.get('model_type', 'BertForSequenceClassification'),
            'num_labels': config.get('num_labels', 9),
            'architecture': config.get('architectures', ['Legal-BERT'])[0],
            'loaded': classifier is not None,
            'device': 'CPU/GPU',
            'model_name': 'Extended Model (2000-2025)',
            'training_samples': '9,924'
        }
        
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/dataset_stats')
def dataset_stats_endpoint():
    """Get dataset statistics - Combined dataset for extended model"""
    try:
        # Load BOTH datasets to show complete extended model stats
        dfs = []
        
        # Load 2020-2025 dataset
        if os.path.exists('data/dataset_2020_2025_improved.csv'):
            try:
                df1 = pd.read_csv('data/dataset_2020_2025_improved.csv')
                df1 = df1[df1['label'] != 'Uncategorized']
                dfs.append(df1)
            except:
                pass
        
        # Load 2000-2019 dataset
        if os.path.exists('data/dataset_2000_2019_labeled.csv'):
            try:
                df2 = pd.read_csv('data/dataset_2000_2019_labeled.csv')
                df2 = df2[df2['label'] != 'Uncategorized']
                dfs.append(df2)
            except:
                pass
        
        # If no datasets found, try prepared_dataset
        if len(dfs) == 0:
            if os.path.exists('data/prepared_dataset.csv'):
                df = pd.read_csv('data/prepared_dataset.csv')
                df = df[df['label'] != 'Uncategorized']
                dfs.append(df)
        
        if len(dfs) == 0:
            return jsonify({'error': 'No dataset files found'})
        
        # Combine all datasets
        df_combined = pd.concat(dfs, ignore_index=True)
        
        # Filter out uncategorized
        df_combined = df_combined[df_combined['label'] != 'Uncategorized']
        
        stats = {
            'total_samples': len(df_combined),
            'categories': df_combined['label'].value_counts().to_dict(),
            'category_percentages': (df_combined['label'].value_counts(normalize=True) * 100).round(2).to_dict()
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/accuracy')
def accuracy_endpoint():
    """Display extended model accuracy - Using known test results"""
    try:
        # Return the actual test results from the extended model
        # These are the real metrics from test_model_accuracy.py
        metrics = {
            'accuracy': 0.7352,  # 73.52% accuracy on 2020-2025 test set
            'total_samples': 355,  # Test set size
            'model_name': 'Extended Model (2000-2025)',
            'training_samples': 9924,
            'classification_report': {
                'Criminal Appeal': {
                    'precision': 0.9681,
                    'recall': 0.9192,
                    'f1-score': 0.9430,
                    'support': 99
                },
                'Bail Application': {
                    'precision': 0.7308,
                    'recall': 0.8261,
                    'f1-score': 0.7755,
                    'support': 23
                },
                'Constitutional Matter': {
                    'precision': 0.5811,
                    'recall': 0.7818,
                    'f1-score': 0.6667,
                    'support': 55
                },
                'Contract Law': {
                    'precision': 0.7045,
                    'recall': 0.5254,
                    'f1-score': 0.6019,
                    'support': 59
                },
                'Property Dispute': {
                    'precision': 0.4773,
                    'recall': 0.8077,
                    'f1-score': 0.6000,
                    'support': 26
                },
                'Taxation Matter': {
                    'precision': 0.7222,
                    'recall': 0.6500,
                    'f1-score': 0.6842,
                    'support': 20
                },
                'Service Matter': {
                    'precision': 0.9032,
                    'recall': 0.6222,
                    'f1-score': 0.7368,
                    'support': 45
                },
                'Family Law': {
                    'precision': 0.8889,
                    'recall': 0.5333,
                    'f1-score': 0.6667,
                    'support': 15
                },
                'Corporate Law': {
                    'precision': 0.4667,
                    'recall': 0.5385,
                    'f1-score': 0.5000,
                    'support': 13
                }
            }
        }
        
        return jsonify(metrics)
            
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/predict_fir_sections', methods=['POST'])
def predict_fir_sections():
    """Predict IPC sections for FIR based on incident description"""
    try:
        data = request.json
        incident_text = data.get('incident_text', '')
        
        if not incident_text:
            return jsonify({'error': 'No incident text provided'}), 400
        
        # ===================================================================
        # ENHANCED ACCURACY: Use keyword-based matching as PRIMARY method
        # ===================================================================
        
        # Step 1: Get direct IPC section recommendations based on keywords (PRIMARY)
        keyword_sections = get_direct_ipc_sections(incident_text)
        
        # Step 2: Use AI model to classify (SECONDARY - for validation and similar cases)
        category_result = predict_text(incident_text, return_all_scores=True)
        
        # Gracefully handle model not loaded
        if 'error' in category_result:
            primary_category = 'Uncategorized'
            confidence = 0.5
        else:
            primary_category = category_result['label']
            confidence = category_result['confidence']
        
        # Step 3: Decide which sections to show
        if keyword_sections:
            # Keyword matching found specific sections - USE THESE (more accurate for FIR)
            primary_sections = keyword_sections[:3]  # Top 3 keyword-matched sections
            secondary_sections = keyword_sections[3:6] if len(keyword_sections) > 3 else []
            
            # IMPROVED: Only add model sections if they're contextually similar
            # Don't mix unrelated sections (e.g., don't add murder to theft cases)
            model_sections = get_sections_for_category(primary_category)
            if model_sections and len(secondary_sections) < 3:
                keyword_section_nums = [s['section'] for s in keyword_sections]
                
                # Define section compatibility - which sections can be related
                section_groups = {
                    'property': ['IPC 379', 'IPC 380', 'IPC 411', 'IPC 420', 'IPC 406', 'IPC 403', 'IPC 415'],
                    'violence': ['IPC 302', 'IPC 304', 'IPC 307', 'IPC 323', 'IPC 325', 'IPC 326', 'IPC 506'],
                    'fraud': ['IPC 420', 'IPC 415', 'IPC 463', 'IPC 467', 'IPC 468', 'IPC 471'],
                    'accident': ['IPC 279', 'IPC 304A', 'IPC 337', 'IPC 338'],
                    'dowry': ['IPC 498A', 'IPC 304B', 'IPC 494', 'IPC 323', 'IPC 354']
                }
                
                # Find which group the primary sections belong to
                primary_group = None
                for group_name, group_sections in section_groups.items():
                    if any(s['section'] in group_sections for s in primary_sections):
                        primary_group = group_name
                        break
                
                # Only add model sections from the same group
                if primary_group:
                    for model_sec in model_sections.get('primary_sections', []):
                        if (model_sec['section'] not in keyword_section_nums and 
                            model_sec['section'] in section_groups[primary_group] and
                            len(secondary_sections) < 5):
                            # Add confidence marker to show it's model-suggested
                            model_sec_copy = model_sec.copy()
                            model_sec_copy['confidence'] = 0.50  # Lower confidence for model suggestions
                            secondary_sections.append(model_sec_copy)
            
            crime_type = f"Keyword Analysis: High Confidence Match"
            description = f"Based on incident keywords, also classified as: {primary_category}"
        else:
            # No keyword match - fall back to model prediction
            sections_data = get_sections_for_category(primary_category)
            if sections_data:
                primary_sections = sections_data.get('primary_sections', [])
                secondary_sections = sections_data.get('secondary_sections', [])
                crime_type = sections_data.get('crime_type', 'Unknown')
                description = sections_data.get('description', '')
            else:
                primary_sections = []
                secondary_sections = []
                crime_type = "Unable to determine"
                description = "Please consult legal officer for appropriate sections"
        
        # Step 4: Get similar cases (using model's category)
        similar_cases = find_similar_judgements(primary_category, incident_text)
        
        # Step 5: Generate FIR draft
        fir_draft_data = {
            'primary_sections': primary_sections,
            'secondary_sections': secondary_sections,
            'crime_type': crime_type,
            'description': description
        }
        fir_draft = generate_fir_draft(incident_text, fir_draft_data, primary_category)
        
        return jsonify({
            'success': True,
            'incident': incident_text,
            'predicted_category': primary_category,
            'confidence': confidence,
            'crime_type': crime_type,
            'description': description,
            'primary_sections': primary_sections,
            'secondary_sections': secondary_sections[:5],  # Limit secondary sections
            'similar_cases': similar_cases[:5],  # Limit to 5 cases
            'fir_draft': fir_draft,
            'all_categories': category_result.get('all_predictions', [])[:3],  # Top 3 alternatives
            'used_keyword_matching': len(keyword_sections) > 0,  # NEW: Indicate if keyword matching was used
            'keyword_confidence': keyword_sections[0]['confidence'] if keyword_sections else 0  # NEW: Keyword confidence
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def generate_fir_draft(incident, sections_data, category):
    """Generate FIR draft text"""
    if not sections_data or not sections_data.get('primary_sections'):
        return "Unable to generate draft. Please consult legal officer."
    
    draft = f"""FIRST INFORMATION REPORT (DRAFT)
{"=" * 70}

INCIDENT DESCRIPTION:
{incident}

{"=" * 70}
CRIME CLASSIFICATION:
Crime Type: {sections_data.get('crime_type', 'Unknown')}
Category: {category}
{sections_data.get('description', '')}

{"=" * 70}
APPLICABLE SECTIONS (PRIMARY):

"""
    
    for i, section in enumerate(sections_data.get('primary_sections', []), 1):
        draft += f"{i}. {section['section']} - {section['title']}\n"
        if 'description' in section and section['description']:
            draft += f"   Description: {section['description']}\n"
        draft += f"   Penalty: {section['penalty']}\n"
        if 'bailable' in section:
            bailable = "Bailable" if section['bailable'] else "Non-Bailable"
            draft += f"   Nature: {bailable}\n"
        if 'confidence' in section:
            draft += f"   Confidence: {int(section['confidence'] * 100)}%\n"
        draft += "\n"
    
    draft += f"\n{'=' * 70}\n"
    draft += "IMPORTANT NOTES:\n"
    draft += "• This is an AI-generated draft based on incident description\n"
    draft += "• Sections recommended using keyword analysis for accuracy\n"
    draft += "• Please verify sections with legal officer before filing\n"
    draft += "• Add complete details: Date, Time, Location, Witnesses\n"
    draft += "• Obtain complainant's signature\n"
    draft += "• Mention evidence collected (if any)\n"
    draft += f"\n{'=' * 70}\n"
    draft += "Generated by NyayaMitra FIR Assistant (Enhanced Keyword Matching)\n"
    draft += f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    
    return draft

if __name__ == '__main__':
    print("Starting ML model loading in background...")
    threading.Thread(target=load_model, daemon=True).start()
    
    # Get dataset statistics
    dataset_stats = get_dataset_stats()
    
    print("Starting Flask application on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)