import os
import warnings
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch

# Warnings suppress karo
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
warnings.filterwarnings('ignore')

# Configuration
MODEL_PATH = "saved_model_balanced_extended"

class LegalDocumentClassifier:
    """Class for classifying legal documents using the trained model"""

    def __init__(self, model_path=MODEL_PATH):
        print("Loading model and tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)

        # Create pipeline for easy inference
        self.classifier = pipeline(
            "text-classification",
            model=self.model,
            tokenizer=self.tokenizer,
            return_all_scores=True
        )

        # Get label mapping
        self.id2label = self.model.config.id2label
        self.labels = list(self.id2label.values())

        print("[OK] Model loaded successfully!")
        print(f"Available categories: {self.labels}")

    def predict_single(self, text, max_length=128):
        """Predict category for a single text"""
        # Truncate if too long
        if len(text) > 1000:
            text = text[:1000] + "..."

        # Get predictions
        predictions = self.classifier(text)

        # Format results
        results = []
        for pred in predictions[0]:
            # pred['label'] is already the label name for pipeline
            results.append({
                'category': pred['label'],
                'confidence': pred['score']
            })

        # Sort by confidence
        results.sort(key=lambda x: x['confidence'], reverse=True)

        return results

    def predict_batch(self, texts, max_length=128):
        """Predict categories for multiple texts"""
        predictions = self.classifier(texts)

        batch_results = []
        for text_preds in predictions:
            results = []
            for pred in text_preds:
                # pred['label'] is already the label name for pipeline
                results.append({
                    'category': pred['label'],
                    'confidence': pred['score']
                })
            results.sort(key=lambda x: x['confidence'], reverse=True)
            batch_results.append(results)

        return batch_results

    def predict_with_threshold(self, text, threshold=0.5):
        """Predict only if confidence is above threshold"""
        results = self.predict_single(text)

        # Check if top prediction meets threshold
        if results[0]['confidence'] >= threshold:
            return results[0]
        else:
            return {
                'category': 'Uncategorized',
                'confidence': results[0]['confidence'],
                'note': f'Confidence below threshold ({threshold})'
            }

def demo_predictions():
    """Demo function to show how to use the model"""
    print("Legal Document Classification Demo")
    print("=" * 60)

    # Initialize classifier
    classifier = LegalDocumentClassifier()

    # Sample legal texts for testing
    sample_texts = [
        """This criminal appeal is filed under Section 374 of the Code of Criminal Procedure, 1973 against the judgment and order dated 15.02.2023 passed by the learned Sessions Judge, whereby the appellant has been convicted for the offence punishable under Section 302 of the Indian Penal Code and sentenced to undergo imprisonment for life and fine.""",

        """This is a bail application filed under Section 439 of the Code of Criminal Procedure, 1973 seeking bail in connection with FIR No. 123/2023 registered at Police Station XYZ for the offences punishable under Sections 406, 420, 120-B of the Indian Penal Code.""",

        """The present writ petition is filed under Article 226 of the Constitution of India challenging the order dated 10.01.2023 passed by the respondent whereby the petitioner's application for regularization of service was rejected.""",

        """This civil suit is filed for recovery of Rs. 5,00,000/- along with interest being the principal amount due under the agreement dated 15.06.2020 executed between the plaintiff and defendant for purchase of property.""",

        """The appellant has preferred this appeal against the order dated 20.03.2023 passed by the Income Tax Appellate Tribunal dismissing the appeal filed by the appellant challenging the assessment order passed under Section 143(3) of the Income Tax Act, 1961."""
    ]

    print("\nTesting with sample legal documents:")
    print("-" * 60)

    for i, text in enumerate(sample_texts, 1):
        print(f"\nSample {i}:")
        print(f"Text: {text[:150]}...")

        # Get prediction
        result = classifier.predict_single(text)

        print(f"Top Prediction: {result[0]['category']}")
        print(f"Confidence: {result[0]['confidence']:.4f}")

        # Show top 3 predictions
        print("Top 3 predictions:")
        for j, pred in enumerate(result[:3], 1):
            print(f"  {j}. {pred['category']}: {pred['confidence']:.4f}")

        print("-" * 40)

def interactive_prediction():
    """Interactive mode for user input"""
    print("\nInteractive Legal Document Classification")
    print("=" * 60)

    classifier = LegalDocumentClassifier()

    print("Enter legal document text (or 'quit' to exit):")

    while True:
        print("\n" + "-" * 60)
        text = input("Enter text: ").strip()

        if text.lower() == 'quit':
            break

        if not text:
            print("Please enter some text.")
            continue

        # Get prediction
        result = classifier.predict_single(text)

        print("\nPREDICTION RESULTS:")
        print(f"Primary Category: {result[0]['category']}")
        print(f"Confidence: {result[0]['confidence']:.4f}")

        print("\nAll Predictions:")
        for pred in result:
            print(f"  {pred['category']}: {pred['confidence']:.4f}")

if __name__ == "__main__":
    # Run demo first
    demo_predictions()

    # Then interactive mode
    interactive_prediction()
