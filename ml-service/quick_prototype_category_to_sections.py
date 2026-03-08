"""
Quick Prototype: Map Current Categories to IPC Sections
This bridges your current model to FIR assistance use case
"""

# Comprehensive mapping of your 9 categories to relevant IPC sections
CATEGORY_TO_SECTIONS = {
    'Criminal Appeal': {
        'primary_sections': [
            {'section': 'IPC 302', 'title': 'Murder', 'description': 'Punishment for murder', 'penalty': 'Death or life imprisonment', 'bailable': False},
            {'section': 'IPC 304', 'title': 'Culpable homicide not amounting to murder', 'description': 'Culpable homicide', 'penalty': 'Up to life imprisonment', 'bailable': False},
            {'section': 'IPC 307', 'title': 'Attempt to murder', 'description': 'Attempt to commit murder', 'penalty': 'Up to 10 years imprisonment', 'bailable': False},
            {'section': 'IPC 376', 'title': 'Rape', 'description': 'Sexual assault', 'penalty': 'Minimum 10 years, may extend to life', 'bailable': False},
        ],
        'secondary_sections': [
            {'section': 'IPC 323', 'title': 'Voluntarily causing hurt', 'penalty': 'Up to 1 year imprisonment'},
            {'section': 'IPC 325', 'title': 'Voluntarily causing grievous hurt', 'penalty': 'Up to 7 years imprisonment'},
            {'section': 'IPC 506', 'title': 'Criminal intimidation', 'penalty': 'Up to 2 years imprisonment'},
        ],
        'crime_type': 'Heinous & Serious Crimes',
        'description': 'Serious criminal matters involving violence or threat to life',
        'keywords': ['murder', 'kill', 'death', 'rape', 'assault', 'attack', 'weapon']
    },
    
    'Bail Application': {
        'primary_sections': [
            {'section': 'IPC 323', 'title': 'Voluntarily causing hurt', 'penalty': 'Up to 1 year', 'bailable': True},
            {'section': 'IPC 341', 'title': 'Wrongful restraint', 'penalty': 'Up to 1 month', 'bailable': True},
            {'section': 'IPC 504', 'title': 'Intentional insult', 'penalty': 'Up to 2 years', 'bailable': True},
            {'section': 'IPC 506', 'title': 'Criminal intimidation', 'penalty': 'Up to 2 years', 'bailable': True},
        ],
        'secondary_sections': [
            {'section': 'IPC 294', 'title': 'Obscene acts in public', 'penalty': 'Up to 3 months'},
            {'section': 'IPC 509', 'title': 'Word/gesture to insult modesty of woman', 'penalty': 'Up to 3 years'},
        ],
        'crime_type': 'Bailable Offenses',
        'description': 'Less serious offenses typically eligible for bail',
        'keywords': ['minor', 'hurt', 'insult', 'threat', 'restraint', 'bail']
    },
    
    'Property Dispute': {
        'primary_sections': [
            {'section': 'IPC 379', 'title': 'Theft', 'description': 'Dishonestly taking movable property', 'penalty': 'Up to 3 years imprisonment', 'bailable': False},
            {'section': 'IPC 380', 'title': 'Theft in dwelling house', 'penalty': 'Up to 7 years imprisonment', 'bailable': False},
            {'section': 'IPC 420', 'title': 'Cheating', 'description': 'Cheating and dishonestly inducing delivery of property', 'penalty': 'Up to 7 years imprisonment', 'bailable': False},
            {'section': 'IPC 406', 'title': 'Criminal breach of trust', 'penalty': 'Up to 3 years imprisonment', 'bailable': False},
            {'section': 'IPC 447', 'title': 'Criminal trespass', 'penalty': 'Up to 3 months imprisonment', 'bailable': True},
        ],
        'secondary_sections': [
            {'section': 'IPC 411', 'title': 'Receiving stolen property', 'penalty': 'Up to 3 years'},
            {'section': 'IPC 403', 'title': 'Dishonest misappropriation', 'penalty': 'Up to 2 years'},
            {'section': 'IPC 415', 'title': 'Cheating', 'penalty': 'Up to 1 year'},
        ],
        'crime_type': 'Property Crimes',
        'description': 'Theft, fraud, criminal breach of trust, property-related offenses',
        'keywords': ['theft', 'stolen', 'fraud', 'cheating', 'property', 'money', 'mobile', 'wallet', 'jewellery']
    },
    
    'Family Law': {
        'primary_sections': [
            {'section': 'IPC 498A', 'title': 'Dowry harassment', 'description': 'Cruelty by husband or relatives', 'penalty': 'Up to 3 years imprisonment', 'bailable': False},
            {'section': 'IPC 304B', 'title': 'Dowry death', 'description': 'Death within 7 years of marriage', 'penalty': 'Minimum 7 years, may extend to life', 'bailable': False},
            {'section': 'IPC 494', 'title': 'Bigamy', 'penalty': 'Up to 7 years imprisonment', 'bailable': False},
            {'section': 'IPC 125 CrPC', 'title': 'Maintenance', 'description': 'Maintenance of wife, children, parents', 'penalty': 'Civil remedy'},
        ],
        'secondary_sections': [
            {'section': 'IPC 323', 'title': 'Domestic violence', 'penalty': 'Up to 1 year'},
            {'section': 'IPC 354', 'title': 'Assault on woman', 'penalty': 'Up to 2 years'},
            {'section': 'Dowry Prohibition Act', 'title': 'Dowry demand', 'penalty': 'Up to 5 years'},
        ],
        'crime_type': 'Domestic & Family Offenses',
        'description': 'Dowry, domestic violence, matrimonial disputes',
        'keywords': ['dowry', 'wife', 'husband', 'marriage', 'domestic', 'family', 'harassment', 'divorce']
    },
    
    'Contract Law': {
        'primary_sections': [
            {'section': 'IPC 420', 'title': 'Cheating', 'penalty': 'Up to 7 years imprisonment', 'bailable': False},
            {'section': 'IPC 406', 'title': 'Criminal breach of trust', 'penalty': 'Up to 3 years imprisonment', 'bailable': False},
            {'section': 'IPC 415', 'title': 'Cheating by personation', 'penalty': 'Up to 1 year imprisonment'},
        ],
        'secondary_sections': [
            {'section': 'IPC 463', 'title': 'Forgery', 'penalty': 'Up to 2 years'},
            {'section': 'IPC 467', 'title': 'Forgery of valuable security', 'penalty': 'Up to life imprisonment'},
            {'section': 'Indian Contract Act 1872', 'title': 'Breach of contract', 'penalty': 'Civil remedy'},
        ],
        'crime_type': 'Contract & Business Fraud',
        'description': 'Breach of contract, business fraud, cheating in business dealings',
        'keywords': ['contract', 'agreement', 'business', 'fraud', 'payment', 'breach']
    },
    
    'Taxation Matter': {
        'primary_sections': [
            {'section': 'Income Tax Act 1961', 'title': 'Tax evasion', 'penalty': 'Up to 7 years imprisonment'},
            {'section': 'GST Act', 'title': 'GST fraud', 'penalty': 'Up to 5 years imprisonment'},
            {'section': 'IPC 420', 'title': 'Cheating (tax fraud)', 'penalty': 'Up to 7 years imprisonment'},
        ],
        'secondary_sections': [
            {'section': 'IPC 467', 'title': 'Forgery (fake documents)', 'penalty': 'Up to life imprisonment'},
            {'section': 'Customs Act', 'title': 'Customs duty evasion', 'penalty': 'Up to 7 years'},
        ],
        'crime_type': 'Economic Offenses',
        'description': 'Tax evasion, GST fraud, customs violations',
        'keywords': ['tax', 'GST', 'income', 'evasion', 'customs', 'duty']
    },
    
    'Service Matter': {
        'primary_sections': [
            {'section': 'IPC 406', 'title': 'Criminal breach of trust', 'penalty': 'Up to 3 years imprisonment'},
            {'section': 'IPC 409', 'title': 'Criminal breach by public servant', 'penalty': 'Up to life imprisonment'},
            {'section': 'Prevention of Corruption Act', 'title': 'Bribery', 'penalty': 'Up to 7 years imprisonment'},
        ],
        'secondary_sections': [
            {'section': 'IPC 120B', 'title': 'Criminal conspiracy', 'penalty': 'Up to 2 years'},
            {'section': 'IPC 166', 'title': 'Public servant disobeying law', 'penalty': 'Up to 1 year'},
        ],
        'crime_type': 'Service & Employment',
        'description': 'Employment disputes, service matters, corruption',
        'keywords': ['job', 'employment', 'salary', 'corruption', 'bribe', 'service']
    },
    
    'Constitutional Matter': {
        'primary_sections': [
            {'section': 'Article 21', 'title': 'Right to life and personal liberty', 'penalty': 'Constitutional remedy'},
            {'section': 'Article 14', 'title': 'Equality before law', 'penalty': 'Constitutional remedy'},
            {'section': 'Article 19', 'title': 'Freedom of speech and expression', 'penalty': 'Constitutional remedy'},
            {'section': 'IPC 153A', 'title': 'Promoting enmity between groups', 'penalty': 'Up to 3 years imprisonment'},
        ],
        'secondary_sections': [
            {'section': 'IPC 295A', 'title': 'Outraging religious feelings', 'penalty': 'Up to 3 years'},
            {'section': 'SC/ST Act', 'title': 'Atrocities against SC/ST', 'penalty': 'Up to 5 years'},
        ],
        'crime_type': 'Rights Violation',
        'description': 'Fundamental rights violation, discrimination, constitutional issues',
        'keywords': ['rights', 'discrimination', 'liberty', 'freedom', 'constitutional']
    },
    
    'Corporate Law': {
        'primary_sections': [
            {'section': 'Companies Act 2013', 'title': 'Corporate fraud', 'penalty': 'Up to 10 years imprisonment'},
            {'section': 'IPC 420', 'title': 'Cheating (corporate)', 'penalty': 'Up to 7 years imprisonment'},
            {'section': 'IPC 467', 'title': 'Forgery of documents', 'penalty': 'Up to life imprisonment'},
            {'section': 'SEBI Act', 'title': 'Securities fraud', 'penalty': 'Up to 10 years imprisonment'},
        ],
        'secondary_sections': [
            {'section': 'IPC 120B', 'title': 'Criminal conspiracy', 'penalty': 'Up to 2 years'},
            {'section': 'Prevention of Money Laundering Act', 'title': 'Money laundering', 'penalty': 'Up to 7 years'},
        ],
        'crime_type': 'Corporate & White Collar Crime',
        'description': 'Corporate fraud, securities violations, white collar crimes',
        'keywords': ['company', 'corporate', 'shares', 'fraud', 'embezzlement', 'business']
    }
}

# Additional common IPC sections for quick reference
COMMON_IPC_SECTIONS = {
    # Crimes against person
    'IPC 279': {'title': 'Rash driving', 'penalty': 'Up to 6 months', 'bailable': True},
    'IPC 304A': {'title': 'Death by negligence', 'penalty': 'Up to 2 years', 'bailable': True},
    'IPC 354': {'title': 'Assault on woman', 'penalty': 'Up to 2 years', 'bailable': False},
    'IPC 354A': {'title': 'Sexual harassment', 'penalty': 'Up to 3 years', 'bailable': False},
    'IPC 509': {'title': 'Insulting modesty of woman', 'penalty': 'Up to 3 years', 'bailable': True},
    
    # Crimes against property
    'IPC 457': {'title': 'House-breaking at night', 'penalty': 'Up to 14 years', 'bailable': False},
    'IPC 392': {'title': 'Robbery', 'penalty': 'Up to 10 years', 'bailable': False},
    'IPC 397': {'title': 'Robbery with weapon', 'penalty': 'Up to 14 years', 'bailable': False},
    
    # Cybercrime
    'IT Act 66': {'title': 'Computer related offenses', 'penalty': 'Up to 3 years', 'bailable': True},
    'IT Act 66C': {'title': 'Identity theft', 'penalty': 'Up to 3 years', 'bailable': True},
    'IT Act 66D': {'title': 'Cheating by personation using computer', 'penalty': 'Up to 3 years', 'bailable': True},
    'IT Act 67': {'title': 'Publishing obscene content', 'penalty': 'Up to 5 years', 'bailable': False},
    
    # Public order
    'IPC 141': {'title': 'Unlawful assembly', 'penalty': 'Up to 6 months', 'bailable': True},
    'IPC 143': {'title': 'Being member of unlawful assembly', 'penalty': 'Up to 6 months', 'bailable': True},
    'IPC 147': {'title': 'Rioting', 'penalty': 'Up to 2 years', 'bailable': True},
}

# BNS 2023 (Bharatiya Nyaya Sanhita) - New criminal code replacing IPC
# Note: From July 1, 2024, BNS replaces IPC
BNS_MAPPING = {
    'IPC 302': 'BNS 103',  # Murder
    'IPC 304': 'BNS 105',  # Culpable homicide
    'IPC 307': 'BNS 109',  # Attempt to murder
    'IPC 323': 'BNS 115',  # Voluntarily causing hurt
    'IPC 376': 'BNS 63',   # Rape
    'IPC 379': 'BNS 303',  # Theft
    'IPC 420': 'BNS 318',  # Cheating
    'IPC 498A': 'BNS 84',  # Dowry harassment
    # ... add more mappings
}

def get_sections_for_category(category, include_bns=True):
    """Get relevant IPC/BNS sections for a category"""
    if category not in CATEGORY_TO_SECTIONS:
        return None
    
    result = CATEGORY_TO_SECTIONS[category].copy()
    
    # Add BNS equivalents if requested
    if include_bns:
        for section_list in ['primary_sections', 'secondary_sections']:
            for section in result.get(section_list, []):
                ipc_section = section['section']
                if ipc_section in BNS_MAPPING:
                    section['bns_equivalent'] = BNS_MAPPING[ipc_section]
    
    return result

def search_sections_by_keywords(incident_text):
    """Find relevant categories based on keywords in incident"""
    incident_lower = incident_text.lower()
    matches = []
    
    for category, data in CATEGORY_TO_SECTIONS.items():
        keyword_matches = sum(1 for keyword in data['keywords'] if keyword in incident_lower)
        if keyword_matches > 0:
            matches.append({
                'category': category,
                'match_score': keyword_matches,
                'sections': data
            })
    
    # Sort by match score
    matches.sort(key=lambda x: x['match_score'], reverse=True)
    return matches

# Enhanced direct IPC section recommendation based on keywords
def get_direct_ipc_sections(incident_text):
    """
    Directly recommend IPC sections based on specific keywords in incident.
    This is more accurate than model-based classification for FIR use cases.
    """
    incident_lower = incident_text.lower()
    recommended_sections = []
    confidence_scores = {}
    
    # Theft-related
    theft_keywords = ['stole', 'stolen', 'theft', 'took away', 'pickpocket', 'snatched', 'robbery']
    if any(keyword in incident_lower for keyword in theft_keywords):
        recommended_sections.extend([
            {
                'section': 'IPC 379',
                'title': 'Theft',
                'description': 'Dishonestly taking movable property',
                'penalty': 'Up to 3 years imprisonment or fine',
                'bailable': False,
                'confidence': 0.95
            },
            {
                'section': 'IPC 411',
                'title': 'Receiving stolen property',
                'penalty': 'Up to 3 years imprisonment',
                'bailable': False,
                'confidence': 0.70
            }
        ])
        
        # If dwelling/house mentioned
        if any(word in incident_lower for word in ['house', 'home', 'dwelling', 'residence']):
            recommended_sections.append({
                'section': 'IPC 380',
                'title': 'Theft in dwelling house',
                'penalty': 'Up to 7 years imprisonment',
                'bailable': False,
                'confidence': 0.85
            })
    
    # Fraud/Cheating
    fraud_keywords = ['fraud', 'cheat', 'deceived', 'tricked', 'fake', 'forged', 'scam', 'promised', 'false']
    if any(keyword in incident_lower for keyword in fraud_keywords):
        recommended_sections.extend([
            {
                'section': 'IPC 420',
                'title': 'Cheating',
                'description': 'Cheating and dishonestly inducing delivery of property',
                'penalty': 'Up to 7 years imprisonment',
                'bailable': False,
                'confidence': 0.90
            },
            {
                'section': 'IPC 415',
                'title': 'Cheating',
                'penalty': 'Up to 1 year imprisonment',
                'bailable': True,
                'confidence': 0.65
            }
        ])
        
        # If documents involved
        if any(word in incident_lower for word in ['document', 'papers', 'certificate', 'appointment']):
            recommended_sections.append({
                'section': 'IPC 467',
                'title': 'Forgery of documents',
                'penalty': 'Up to life imprisonment',
                'bailable': False,
                'confidence': 0.80
            })
    
    # Assault/Physical harm
    assault_keywords = ['beat', 'beaten', 'hit', 'assault', 'attack', 'injured', 'hurt', 'punch', 'kick', 'slap']
    if any(keyword in incident_lower for keyword in assault_keywords):
        # Check severity
        severe_keywords = ['serious', 'grievous', 'fracture', 'blood', 'hospital', 'weapon', 'stick', 'rod', 'knife']
        if any(word in incident_lower for word in severe_keywords):
            recommended_sections.append({
                'section': 'IPC 325',
                'title': 'Voluntarily causing grievous hurt',
                'penalty': 'Up to 7 years imprisonment',
                'bailable': False,
                'confidence': 0.85
            })
        else:
            recommended_sections.append({
                'section': 'IPC 323',
                'title': 'Voluntarily causing hurt',
                'penalty': 'Up to 1 year imprisonment',
                'bailable': True,
                'confidence': 0.85
            })
    
    # Murder/Death threats
    murder_keywords = ['murder', 'kill', 'death', 'die', 'fatal']
    if any(keyword in incident_lower for keyword in murder_keywords):
        if any(word in incident_lower for word in ['threat', 'threatened', 'will kill', 'going to']):
            # Threat to kill
            recommended_sections.append({
                'section': 'IPC 506',
                'title': 'Criminal intimidation',
                'description': 'Threat to cause death or grievous hurt',
                'penalty': 'Up to 7 years imprisonment',
                'bailable': True,
                'confidence': 0.90
            })
        elif any(word in incident_lower for word in ['attempted', 'tried', 'attempt']):
            # Attempt to murder
            recommended_sections.append({
                'section': 'IPC 307',
                'title': 'Attempt to murder',
                'penalty': 'Up to 10 years imprisonment',
                'bailable': False,
                'confidence': 0.90
            })
        elif any(word in incident_lower for word in ['died', 'dead', 'killed', 'expired']):
            # Actual death
            recommended_sections.append({
                'section': 'IPC 302',
                'title': 'Murder',
                'description': 'Punishment for murder',
                'penalty': 'Death or life imprisonment',
                'bailable': False,
                'confidence': 0.85
            })
    
    # Threat/Intimidation (without murder)
    threat_keywords = ['threat', 'threatened', 'intimidate', 'scare', 'frighten']
    if any(keyword in incident_lower for keyword in threat_keywords) and 'IPC 506' not in [s['section'] for s in recommended_sections]:
        recommended_sections.append({
            'section': 'IPC 506',
            'title': 'Criminal intimidation',
            'penalty': 'Up to 2 years imprisonment',
            'bailable': True,
            'confidence': 0.85
        })
    
    # Dowry-related
    dowry_keywords = ['dowry', 'dowery', 'dahej', 'demand', 'in-laws', 'husband']
    if any(keyword in incident_lower for keyword in dowry_keywords):
        if any(word in incident_lower for word in ['harass', 'torture', 'cruelty', 'beat']):
            recommended_sections.append({
                'section': 'IPC 498A',
                'title': 'Dowry harassment',
                'description': 'Cruelty by husband or relatives',
                'penalty': 'Up to 3 years imprisonment',
                'bailable': False,
                'confidence': 0.95
            })
        if any(word in incident_lower for word in ['died', 'death', 'dead', 'suicide']):
            recommended_sections.append({
                'section': 'IPC 304B',
                'title': 'Dowry death',
                'penalty': 'Minimum 7 years, may extend to life',
                'bailable': False,
                'confidence': 0.90
            })
    
    # Accident-related
    accident_keywords = ['accident', 'rash', 'negligent', 'vehicle', 'motorcycle', 'car', 'hit', 'run over']
    if any(keyword in incident_lower for keyword in accident_keywords):
        if any(word in incident_lower for word in ['died', 'death', 'dead', 'fatal', 'expired']):
            recommended_sections.append({
                'section': 'IPC 304A',
                'title': 'Death by negligence',
                'penalty': 'Up to 2 years imprisonment',
                'bailable': True,
                'confidence': 0.90
            })
        else:
            recommended_sections.append({
                'section': 'IPC 279',
                'title': 'Rash driving on public way',
                'penalty': 'Up to 6 months imprisonment',
                'bailable': True,
                'confidence': 0.85
            })
        
        # If fled from scene
        if any(word in incident_lower for word in ['fled', 'ran away', 'escaped', 'left']):
            recommended_sections.append({
                'section': 'IPC 304A',
                'title': 'Causing death by negligence',
                'penalty': 'Up to 2 years imprisonment',
                'bailable': True,
                'confidence': 0.75
            })
    
    # Breach of trust
    trust_keywords = ['entrusted', 'trusted', 'given', 'safekeeping', 'misappropriated']
    if any(keyword in incident_lower for keyword in trust_keywords):
        recommended_sections.append({
            'section': 'IPC 406',
            'title': 'Criminal breach of trust',
            'penalty': 'Up to 3 years imprisonment',
            'bailable': False,
            'confidence': 0.80
        })
    
    # Sort by confidence
    recommended_sections.sort(key=lambda x: x['confidence'], reverse=True)
    
    return recommended_sections

# Example usage
if __name__ == '__main__':
    # Test with sample incidents
    test_incidents = [
        "Someone stole my mobile phone from my pocket",
        "My husband is harassing me for dowry",
        "A person threatened to kill me if I don't pay money",
        "Motorcycle accident, person died due to rash driving"
    ]
    
    print("=" * 80)
    print("QUICK PROTOTYPE: Category to IPC Sections Mapping")
    print("=" * 80)
    
    for incident in test_incidents:
        print(f"\nIncident: {incident}")
        print("-" * 80)
        
        matches = search_sections_by_keywords(incident)
        
        if matches:
            best_match = matches[0]
            print(f"[PREDICTED] Category: {best_match['category']}")
            print(f"            Match Score: {best_match['match_score']} keywords")
            print(f"            Crime Type: {best_match['sections']['crime_type']}")
            print("\n[SECTIONS] Applicable IPC Sections:")
            
            for i, section in enumerate(best_match['sections']['primary_sections'][:3], 1):
                print(f"\n  {i}. {section['section']} - {section['title']}")
                print(f"      Penalty: {section['penalty']}")
                if 'bailable' in section:
                    bailable_status = "Bailable" if section['bailable'] else "Non-Bailable"
                    print(f"      Nature: {bailable_status}")
        else:
            print("[ERROR] No matching category found")
    
    print("\n" + "=" * 80)
    print("[SUCCESS] Prototype working! This can be integrated into your Flask app.")
    print("=" * 80)
