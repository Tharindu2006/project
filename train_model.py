import pandas as pd
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# 1️⃣ Load dataset
df = pd.read_csv("StudentsPerformance.csv")

# 2️⃣ Fill missing values with column mean
df.fillna(df.mean(), inplace=True)

# 3️⃣ Prepare features (X) and target (y)
feature_cols = [
    "study_hours",
    "attendance",
    "GPA",
    "sleep_hours",
    "participation",
    "homework_completion",
    "extracurricular_hours",
    "stress_level"
]
X = df[feature_cols].values
y = df["marks"].values

# 4️⃣ Split into train/test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5️⃣ Train Random Forest Regressor
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 6️⃣ Evaluate
y_pred = model.predict(X_test)
print("Mean Squared Error:", mean_squared_error(y_test, y_pred))

# 7️⃣ Save model
with open("exam_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("Model saved as exam_model.pkl")