"""
AI Services Integration
Bhashini (Speech-to-Text + Translation) + OpenRouter (AI Responses)
"""
import requests
import json
import base64
import os
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Credentials - Read from environment variables (NEVER hardcode secrets)
BHASHINI_USER_ID = os.environ.get("BHASHINI_USER_ID", "")
BHASHINI_ULCA_KEY = os.environ.get("BHASHINI_ULCA_KEY", "")
BHASHINI_INFERENCE_KEY = os.environ.get("BHASHINI_INFERENCE_KEY", "")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# DEMO MODE DISABLED - Using real AI APIs
DEMO_MODE = False  # Using real Bhashini + OpenRouter APIs

# Language Codes
LANGUAGE_NAMES = {
    'en': 'English',
    'hi': 'Hindi',
    'mr': 'Marathi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'bn': 'Bengali',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi'
}

class BhashiniService:
    """Bhashini API Integration for Speech-to-Text and Translation"""
    
    # Using direct compute endpoint which works!
    BASE_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0"
    COMPUTE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    
    @staticmethod
    def get_pipeline_config(source_lang: str, target_lang: str = 'en'):
        """Get Bhashini pipeline configuration for ASR and Translation"""
        try:
            url = f"{BhashiniService.BASE_URL}/model/getModelsPipeline"
            headers = {
                "userID": BHASHINI_USER_ID,
                "ulcaApiKey": BHASHINI_ULCA_KEY,
                "Content-Type": "application/json"
            }
            
            # Request both ASR and Translation
            payload = {
                "pipelineTasks": [
                    {
                        "taskType": "asr",
                        "config": {
                            "language": {
                                "sourceLanguage": source_lang
                            }
                        }
                    },
                    {
                        "taskType": "translation",
                        "config": {
                            "language": {
                                "sourceLanguage": source_lang,
                                "targetLanguage": target_lang
                            }
                        }
                    }
                ],
                "pipelineRequestConfig": {
                    "pipelineId": "64392f96daac500b55c543cd"
                }
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                return {
                    'success': True,
                    'config': response.json()
                }
            else:
                return {
                    'success': False,
                    'error': f"Failed to get pipeline config: {response.status_code}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def speech_to_text(audio_base64: str, source_lang: str) -> Dict[str, Any]:
        """Convert speech to text using Bhashini ASR"""
        try:
            # Get pipeline config
            config_result = BhashiniService.get_pipeline_config(source_lang)
            if not config_result['success']:
                return config_result
            
            pipeline_config = config_result['config']
            
            # Extract ASR config
            asr_config = None
            for task in pipeline_config.get('pipelineResponseConfig', []):
                if task['taskType'] == 'asr':
                    asr_config = task['config'][0]
                    break
            
            if not asr_config:
                return {'success': False, 'error': 'ASR config not found'}
            
            # Call ASR service
            asr_url = asr_config['serviceId']
            asr_headers = {
                BHASHINI_INFERENCE_KEY: asr_config['apiKey'],
                "Content-Type": "application/json"
            }
            
            asr_payload = {
                "pipelineTasks": [
                    {
                        "taskType": "asr",
                        "config": {
                            "language": {
                                "sourceLanguage": source_lang
                            },
                            "serviceId": asr_config['serviceId'],
                            "audioFormat": "wav",
                            "samplingRate": 16000
                        }
                    }
                ],
                "inputData": {
                    "audio": [{
                        "audioContent": audio_base64
                    }]
                }
            }
            
            response = requests.post(asr_url, headers=asr_headers, json=asr_payload, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                transcript = result.get('pipelineResponse', [{}])[0].get('output', [{}])[0].get('source', '')
                return {
                    'success': True,
                    'transcript': transcript,
                    'language': source_lang
                }
            else:
                return {
                    'success': False,
                    'error': f"ASR failed: {response.status_code}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def translate_text(text: str, source_lang: str, target_lang: str = 'en') -> Dict[str, Any]:
        """Translate text from source language to target language using direct compute endpoint"""
        try:
            # If source and target are same, return original text
            if source_lang == target_lang:
                return {
                    'success': True,
                    'translated_text': text,
                    'source_lang': source_lang,
                    'target_lang': target_lang
                }
            
            # Use direct compute endpoint
            headers = {
                "Authorization": BHASHINI_INFERENCE_KEY,
                "Content-Type": "application/json"
            }
            
            payload = {
                "pipelineTasks": [
                    {
                        "taskType": "translation",
                        "config": {
                            "language": {
                                "sourceLanguage": source_lang,
                                "targetLanguage": target_lang
                            },
                            "serviceId": "ai4bharat/indictrans-v2-all-gpu--t4"
                        }
                    }
                ],
                "inputData": {
                    "input": [{
                        "source": text
                    }]
                }
            }
            
            response = requests.post(BhashiniService.COMPUTE_URL, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                translated = result.get('pipelineResponse', [{}])[0].get('output', [{}])[0].get('target', text)
                return {
                    'success': True,
                    'translated_text': translated,
                    'source_lang': source_lang,
                    'target_lang': target_lang
                }
            else:
                return {
                    'success': False,
                    'error': f"Translation failed: {response.status_code} - {response.text[:100]}",
                    'translated_text': text  # Fallback to original
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'translated_text': text  # Fallback to original
            }


class GeminiService:
    """Google Gemini API Integration for AI Responses"""
    
    # Correct Gemini API endpoint (using gemini-2.5-flash which is free and fast)
    @staticmethod
    def get_api_url():
        return f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    @staticmethod
    def get_legal_response(user_query: str, language: str = 'en') -> Dict[str, Any]:
        """Get AI response using Gemini"""
        try:
            if not GEMINI_API_KEY:
                return {
                    'success': False,
                    'error': 'Gemini API key not configured',
                    'response': 'Please add your Gemini API key in ai_services.py'
                }
            
            url = GeminiService.get_api_url()
            
            # System context
            system_context = """You are NyayaMitra AI, an expert Indian legal assistant specializing in:
- Indian Penal Code (IPC) sections and laws
- FIR (First Information Report) generation
- Legal case analysis and precedents
- Legal guidance for police officers and citizens

Provide accurate, professional legal information based on Indian law."""
            
            full_prompt = f"{system_context}\n\nUser Query: {user_query}\n\nProvide a detailed, helpful response:"
            
            payload = {
                "contents": [{
                    "parts": [{
                        "text": full_prompt
                    }]
                }]
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result['candidates'][0]['content']['parts'][0]['text']
                
                return {
                    'success': True,
                    'response': ai_response,
                    'model': 'gemini-pro',
                    'usage': {}
                }
            else:
                return {
                    'success': False,
                    'error': f"Gemini API error: {response.status_code}",
                    'response': f"Error connecting to Gemini: {response.text[:100]}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "I apologize, but I encountered an error connecting to the AI service."
            }


class OpenRouterService:
    """OpenRouter API Integration for AI Responses"""
    
    BASE_URL = "https://api.openrouter.ai/api/v1/chat/completions"
    
    @staticmethod
    def get_legal_response(user_query: str, language: str = 'en', conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """Get AI response for legal queries"""
        
        # Demo mode responses when API is unavailable
        if DEMO_MODE:
            return OpenRouterService._get_demo_response(user_query)
        
        try:
            # Build conversation history
            messages = []
            
            # System prompt for legal assistant
            system_prompt = """You are NyayaMitra AI, an expert Indian legal assistant specializing in:
- Indian Penal Code (IPC) sections and laws
- FIR (First Information Report) generation
- Legal case analysis and precedents
- Legal guidance for police officers and citizens

Key responsibilities:
1. Provide accurate legal information based on Indian law
2. Help identify relevant IPC sections for incidents
3. Generate professional FIR drafts
4. Explain legal processes in simple terms
5. Search and cite relevant case laws
6. Provide step-by-step legal guidance

Guidelines:
- Be accurate and cite specific IPC sections
- Use professional but understandable language
- Provide practical, actionable advice
- Include relevant case law citations when applicable
- Format FIR drafts professionally
- Support multi-language users

Always be helpful, accurate, and professional."""
            
            messages.append({"role": "system", "content": system_prompt})
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-10:]:  # Last 10 messages for context
                    messages.append(msg)
            
            # Add current query
            messages.append({"role": "user", "content": user_query})
            
            # Call OpenRouter API
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://nyayamitra.ai",  # Optional
                "X-Title": "NyayaMitra Legal Assistant"  # Optional
            }
            
            payload = {
                "model": "google/gemini-2.5-flash",  # Using Gemini via OpenRouter as fallback
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1000
            }
            
            response = requests.post(
                OpenRouterService.BASE_URL,
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                ai_response = result['choices'][0]['message']['content']
                
                return {
                    'success': True,
                    'response': ai_response,
                    'model': result.get('model', 'gpt-3.5-turbo'),
                    'usage': result.get('usage', {})
                }
            else:
                return {
                    'success': False,
                    'error': f"OpenRouter API failed: {response.status_code}",
                    'response': "I apologize, but I'm having trouble connecting to the AI service right now. Please try again."
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': "I apologize, but I encountered an error. Please try again."
            }
    
    @staticmethod
    def _get_demo_response(user_query: str) -> Dict[str, Any]:
        """Get demo responses when API is unavailable"""
        query_lower = user_query.lower()
        
        # IPC Section queries
        if '420' in query_lower or 'fraud' in query_lower or 'cheating' in query_lower or 'धोखाधड़ी' in query_lower:
            response = """**IPC Section 420 - Cheating and Dishonestly Inducing Delivery of Property**

**Offense:** Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security.

**Punishment:** 
- Imprisonment up to 7 years
- Fine or both
- This is a **Non-Bailable** offense

**Key Elements:**
- Deception or cheating
- Dishonest inducement
- Delivery of property

**Related Sections:**
- IPC 415: Definition of Cheating
- IPC 417: Punishment for cheating
- IPC 463-477A: Forgery related sections

**Common Cases:**
- Online fraud
- Credit card fraud
- Property fraud
- Investment scams

**What to do if you're a victim:**
1. File FIR immediately at nearest police station
2. Collect all evidence (messages, receipts, bank statements)
3. Note down dates, times, and transaction details
4. Get legal counsel

Would you like me to help you draft an FIR for a fraud case?"""
        
        elif 'fir' in query_lower and ('generate' in query_lower or 'draft' in query_lower or 'help' in query_lower or 'दर्ज' in query_lower):
            response = """**I'll help you generate an FIR. Let me guide you through the process:**

To create a proper FIR, I need the following information:

1. **Your Details:**
   - Name of complainant
   - Address
   - Contact number

2. **Incident Details:**
   - Type of crime (theft, assault, fraud, etc.)
   - Date and time of incident
   - Location of incident

3. **Accused Information:**
   - Name (if known)
   - Description
   - Any identifying marks

4. **What Happened:**
   - Brief description of the incident
   - Sequence of events
   - Any witnesses

5. **Property/Loss Details:**
   - Items stolen/damaged
   - Estimated value

**Please provide these details, and I'll draft a complete FIR for you.**

You can also:
- Use the **FIR Assistant** page for templates
- Use **Voice Input** to describe the incident
- I'll automatically identify relevant IPC sections"""
        
        elif 'section' in query_lower or 'ipc' in query_lower or 'law' in query_lower:
            response = """**Common IPC Sections - Quick Reference:**

**Property Crimes:**
- **IPC 379**: Theft (Punishment: Up to 3 years)
- **IPC 380**: Theft in dwelling house
- **IPC 420**: Cheating (Punishment: Up to 7 years)
- **IPC 406**: Criminal breach of trust

**Violence:**
- **IPC 302**: Murder (Punishment: Death or life imprisonment)
- **IPC 304**: Culpable homicide not amounting to murder
- **IPC 323**: Voluntarily causing hurt
- **IPC 325**: Voluntarily causing grievous hurt

**Against Women:**
- **IPC 354**: Assault on woman with intent to outrage modesty
- **IPC 376**: Rape (Punishment: 10 years to life)
- **IPC 498A**: Cruelty by husband or relatives

**Property Damage:**
- **IPC 425**: Mischief
- **IPC 427**: Mischief causing damage above ₹50

**Cyber Crimes:**
- **IPC 66C IT Act**: Identity theft
- **IPC 66D IT Act**: Cheating by impersonation using computer

**Which specific crime/situation do you want to know about?**"""
        
        elif 'case' in query_lower or 'judgment' in query_lower or 'precedent' in query_lower:
            response = """**I can help you search case laws!**

**Important Supreme Court Precedents:**

**Fraud & Cheating:**
- State of Maharashtra v. Balram Bali Patil (1983)
- P. Ramanatha Aiyar v. State of Tamil Nadu (2004)

**Murder & Culpable Homicide:**
- K.M. Nanavati v. State of Maharashtra (1962)
- Sharad Birdhichand Sarda v. State of Maharashtra (1984)

**Women's Rights:**
- Vishaka v. State of Rajasthan (1997) - Sexual harassment
- Laxmi v. Union of India (2014) - Acid attack

**To search specific cases:**
1. Go to **Case Laws** section in sidebar
2. Use filters for category and year
3. 9,924 Supreme Court cases available

**What type of case law are you looking for?** Please specify:
- Crime category
- Year range
- Specific legal issue"""
        
        elif 'theft' in query_lower or 'चोरी' in query_lower:
            response = """**IPC Section 379 - Theft**

**Definition:** Whoever intends to take dishonestly any movable property out of the possession of any person without that person's consent.

**Punishment:**
- Imprisonment up to 3 years
- Fine or both
- **Bailable offense**

**Essential Elements:**
1. Dishonest intention
2. Moving of property
3. Without consent
4. Intention to take permanently

**Types of Theft:**
- Simple theft (IPC 379)
- Theft in dwelling (IPC 380)
- Theft by servant (IPC 381)
- Theft after preparation (IPC 382)

**For FIR Registration:**
1. Note down stolen items and value
2. Time and place of theft
3. Any CCTV or witness
4. Serial numbers if available

**Need help drafting a theft FIR?** I can assist you!"""
        
        elif 'assault' in query_lower or 'hurt' in query_lower or 'मारपीट' in query_lower:
            response = """**IPC Sections for Assault/Hurt:**

**IPC 323 - Voluntarily Causing Hurt**
- Punishment: Up to 1 year or fine up to ₹1000 or both
- Bailable offense
- Simple hurt (bruises, swelling, minor injuries)

**IPC 325 - Voluntarily Causing Grievous Hurt**
- Punishment: Up to 7 years + fine
- Non-bailable offense
- Serious injuries (fractures, permanent damage)

**IPC 326 - Causing Grievous Hurt by Dangerous Weapons**
- Punishment: Life imprisonment or 10 years + fine
- Non-bailable offense

**IPC 352 - Assault or Criminal Force**
- Punishment: Up to 3 months or fine up to ₹500
- Bailable offense

**Medical Documentation Required:**
- Visit hospital immediately
- Get Medical Legal Case (MLC) report
- Photograph injuries
- Keep all medical bills

**Would you like help filing an FIR for assault?**"""
        
        else:
            response = f"""**Hello! I'm NyayaMitra AI, your legal assistant.** 👋

I can help you with:

1. **📝 FIR Generation** - Describe incident, I'll draft FIR
2. **⚖️ IPC Sections** - Find relevant laws for your case
3. **🔍 Case Laws** - Search 9,924 Supreme Court judgments
4. **💡 Legal Advice** - Guidance on legal procedures
5. **🗣️ Multiple Languages** - Hindi, English, and 8+ Indian languages

**Popular Queries:**
- "What is IPC Section 420?"
- "Help me file FIR for theft"
- "Show me cases on fraud"
- "मेरे साथ धोखाधड़ी हुई है"

**Your question was:** "{user_query}"

Could you please specify:
- What type of legal help do you need?
- What crime/incident are you asking about?
- Do you need IPC sections, FIR help, or case laws?

I'm here to help! 😊"""
        
        return {
            'success': True,
            'response': response,
            'model': 'demo-mode',
            'usage': {}
        }
    
    @staticmethod
    def extract_fir_details(incident_description: str) -> Dict[str, Any]:
        """Extract structured FIR details from incident description"""
        try:
            prompt = f"""Analyze the following incident description and extract FIR details in JSON format:

Incident: {incident_description}

Extract and return ONLY a JSON object with these fields:
{{
    "complainant_name": "Name of complainant if mentioned, else 'Not specified'",
    "incident_type": "Type of crime (e.g., Theft, Assault, Fraud)",
    "date_time": "Date and time of incident if mentioned, else 'To be filled'",
    "location": "Location of incident if mentioned, else 'To be filled'",
    "accused": "Name/description of accused if mentioned, else 'Unknown'",
    "brief_facts": "Brief summary of facts",
    "ipc_sections": ["List of applicable IPC sections"],
    "injuries": "Any injuries mentioned, else 'None'",
    "witnesses": "Names of witnesses if mentioned, else 'None'",
    "property_details": "Stolen/damaged property if mentioned, else 'None'"
}}"""
            
            response = OpenRouterService.get_legal_response(prompt)
            
            if response['success']:
                # Try to parse JSON from response
                try:
                    # Extract JSON from response (AI might add extra text)
                    response_text = response['response']
                    json_start = response_text.find('{')
                    json_end = response_text.rfind('}') + 1
                    if json_start != -1 and json_end > json_start:
                        json_str = response_text[json_start:json_end]
                        fir_details = json.loads(json_str)
                        return {
                            'success': True,
                            'fir_details': fir_details
                        }
                except:
                    pass
                
                # If JSON parsing fails, return the text response
                return {
                    'success': True,
                    'fir_details': {
                        'analysis': response['response']
                    }
                }
            else:
                return response
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


# Convenience functions
def process_voice_input(audio_base64: str, source_lang: str) -> Dict[str, Any]:
    """Process voice input: Speech-to-Text + Translation"""
    # Step 1: Speech to Text
    stt_result = BhashiniService.speech_to_text(audio_base64, source_lang)
    if not stt_result['success']:
        return stt_result
    
    transcript = stt_result['transcript']
    
    # Step 2: Translate to English if not already English
    if source_lang != 'en':
        translation_result = BhashiniService.translate_text(transcript, source_lang, 'en')
        if translation_result['success']:
            return {
                'success': True,
                'original_text': transcript,
                'original_lang': source_lang,
                'translated_text': translation_result['translated_text'],
                'target_lang': 'en'
            }
        else:
            # Return original even if translation fails
            return {
                'success': True,
                'original_text': transcript,
                'original_lang': source_lang,
                'translated_text': transcript,
                'target_lang': source_lang,
                'translation_error': translation_result.get('error')
            }
    else:
        return {
            'success': True,
            'original_text': transcript,
            'original_lang': 'en',
            'translated_text': transcript,
            'target_lang': 'en'
        }


def get_ai_legal_advice(query: str, language: str = 'en') -> Dict[str, Any]:
    """Get AI legal advice and translate response back to user's language"""
    # Step 1: Translate query to English if needed
    if language != 'en':
        translation_result = BhashiniService.translate_text(query, language, 'en')
        if translation_result['success']:
            english_query = translation_result['translated_text']
        else:
            english_query = query
    else:
        english_query = query
    
    # Step 2: Get AI response - Try Gemini first, fallback to OpenRouter
    if GEMINI_API_KEY:
        ai_response = GeminiService.get_legal_response(english_query, language)
    else:
        ai_response = OpenRouterService.get_legal_response(english_query, language)
    
    if not ai_response['success']:
        return ai_response
    
    # Step 3: Translate response back to user's language if needed
    if language != 'en':
        translation_result = BhashiniService.translate_text(
            ai_response['response'], 
            'en', 
            language
        )
        if translation_result['success']:
            return {
                'success': True,
                'response': translation_result['translated_text'],
                'response_en': ai_response['response'],
                'language': language
            }
    
    return {
        'success': True,
        'response': ai_response['response'],
        'language': 'en'
    }
