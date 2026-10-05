import os
import time
import pandas as pd
import numpy as np
from PIL import Image
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, accuracy_score

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "color_labels.csv")
IMG_DIR = os.path.join(BASE_DIR, "color_dataset", "color_dataset")

import sys
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

print("=" * 60, flush=True)
print("[+] STARTING DATASET TRAINING RUN", flush=True)
print("=" * 60, flush=True)

# 1. Load dataset as-is
print(f"[*] Loading dataset from: {CSV_PATH}", flush=True)
df = pd.read_csv(CSV_PATH)
print(f"[*] Total samples loaded: {len(df)}", flush=True)
print(f"[*] Classes found: {df['source_html'].nunique()} categories", flush=True)

# 2. Extract features directly without cleaning
rgb_features = df['rgb'].apply(lambda x: [float(v) for v in str(x).split(',')]).tolist()
X = np.array(rgb_features)
labels = df['source_html'].values

unique_classes = sorted(list(set(labels)))
label_to_idx = {name: i for i, name in enumerate(unique_classes)}
y = np.array([label_to_idx[l] for l in labels])

# Train / Test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# --- Model 1: Random Forest Classifier ---
print("\n--- Model 1: Training Random Forest Classifier ---", flush=True)
start_time = time.time()
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)
rf_time = time.time() - start_time

rf_preds = rf.predict(X_test)
rf_acc = accuracy_score(y_test, rf_preds)
print(f"[+] Random Forest Training Completed in {rf_time:.2f}s", flush=True)
print(f"[+] Random Forest Test Accuracy: {rf_acc * 100:.2f}%", flush=True)

# Save Random Forest model
rf_path = os.path.join(BASE_DIR, "color_classifier_rf.joblib")
joblib.dump({"model": rf, "label_map": label_to_idx}, rf_path)
print(f"[+] Saved model: {rf_path}", flush=True)

# --- Model 2: Neural Network (MLP) Classifier ---
print("\n--- Model 2: Training Neural Network (MLP) Classifier ---", flush=True)
start_time = time.time()
mlp = MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=200, random_state=42)
mlp.fit(X_train, y_train)
mlp_time = time.time() - start_time

mlp_preds = mlp.predict(X_test)
mlp_acc = accuracy_score(y_test, mlp_preds)
print(f"[+] MLP Training Completed in {mlp_time:.2f}s", flush=True)
print(f"[+] MLP Test Accuracy: {mlp_acc * 100:.2f}%", flush=True)

# Save MLP model
mlp_path = os.path.join(BASE_DIR, "color_classifier_mlp.joblib")
joblib.dump({"model": mlp, "label_map": label_to_idx}, mlp_path)
print(f"[+] Saved model: {mlp_path}", flush=True)

# --- Model 3: PyTorch Deep Learning Classifier on Swatch Images ---
print("\n--- Model 3: Training PyTorch CNN on Image Swatches ---", flush=True)

class SwatchDataset(Dataset):
    def __init__(self, dataframe, img_dir, label_map):
        self.df = dataframe
        self.img_dir = img_dir
        self.label_map = label_map

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = os.path.join(self.img_dir, row['filename'])
        try:
            with Image.open(img_path) as im:
                im = im.convert('RGB').resize((32, 32))
                arr = np.array(im, dtype=np.float32) / 255.0  # (32, 32, 3)
                arr = np.transpose(arr, (2, 0, 1))  # (3, 32, 32)
        except Exception:
            arr = np.zeros((3, 32, 32), dtype=np.float32)

        label = self.label_map[row['source_html']]
        return torch.tensor(arr, dtype=torch.float32), torch.tensor(label, dtype=torch.long)

dataset = SwatchDataset(df, IMG_DIR, label_to_idx)
train_size = int(0.8 * len(dataset))
test_size = len(dataset) - train_size
train_dataset, test_dataset = torch.utils.data.random_split(dataset, [train_size, test_size])

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

class SwatchCNN(nn.Module):
    def __init__(self, num_classes):
        super(SwatchCNN, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((4, 4))
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(32 * 4 * 4, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        return self.classifier(x)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[*] Training PyTorch on compute device: {device}", flush=True)

model = SwatchCNN(num_classes=len(unique_classes)).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.003)

epochs = 5
print(f"[*] Training for {epochs} epochs...", flush=True)

for epoch in range(1, epochs + 1):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    for images, targets in train_loader:
        images, targets = images.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        total += targets.size(0)
        correct += predicted.eq(targets).sum().item()

    epoch_loss = running_loss / total
    epoch_acc = 100.0 * correct / total
    print(f"  Epoch [{epoch}/{epochs}] - Loss: {epoch_loss:.4f} - Accuracy: {epoch_acc:.2f}%", flush=True)

# Evaluate PyTorch Model
model.eval()
test_correct = 0
test_total = 0
with torch.no_grad():
    for images, targets in test_loader:
        images, targets = images.to(device), targets.to(device)
        outputs = model(images)
        _, predicted = outputs.max(1)
        test_total += targets.size(0)
        test_correct += predicted.eq(targets).sum().item()

pytorch_acc = 100.0 * test_correct / test_total
print(f"[+] PyTorch CNN Test Accuracy: {pytorch_acc:.2f}%", flush=True)

# Save PyTorch model
pt_path = os.path.join(BASE_DIR, "color_swatch_cnn.pt")
torch.save({"state_dict": model.state_dict(), "label_map": label_to_idx}, pt_path)
print(f"[+] Saved model: {pt_path}", flush=True)

print("\n" + "=" * 60, flush=True)
print("[+] TRAINING SUMMARY (QUICK RUN FINISHED)", flush=True)
print(f"  - Random Forest Classifier:  {rf_acc * 100:.2f}% test accuracy")
print(f"  - MLP Neural Network:        {mlp_acc * 100:.2f}% test accuracy")
print(f"  - PyTorch Swatch CNN:        {pytorch_acc:.2f}% test accuracy")
print(f"  - Artifacts saved in:        {BASE_DIR}")
print("=" * 60, flush=True)
