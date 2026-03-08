from transformers import pipeline
import torch

# 1. Apne save kiye hue model ka path
MODEL_PATH = "saved_model_balanced_extended"

# 2. Model ko load karna
# Agar aapke paas NVIDIA GPU hai to device=0 likho, warna device=-1 (CPU ke liye)
device = 0 if torch.cuda.is_available() else -1
print(f"Loading model from {MODEL_PATH}...")
classifier = pipeline("text-classification", model=MODEL_PATH, device=device)
print("Model successfully loaded!")


# 3. Naye legal sentences jinhe test karna hai
# Aap in sentences ko badal kar kuch bhi test kar sakte hain
new_legal_texts = [
    "The petitioner seeks anticipatory bail in connection with FIR No. 123 under Section 438 of the CrPC.",
    "This sale deed is executed on the 15th of September, transferring the title of the immovable property.",
    "This agreement shall be governed by the laws of India and any breach of contract will be subject to arbitration.",
    "The fundamental right to equality under Article 14 of the Constitution has been violated."
]


# 4. Prediction karna aur result dikhana
print("\n--- Making Predictions --- 💡")
for text in new_legal_texts:
    prediction = classifier(text)
    # The pipeline returns a list, we take the first element
    result = prediction[0]
    
    print(f"\nText: '{text}'")
    print(f"  -> Predicted Category: {result['label']} (Confidence: {result['score']:.2f})")