# RuralEdu – AI-Assisted Personalized Learning System for Rural Education

## 📌 Project Overview

RuralEdu is an AI-assisted personalized learning platform designed to improve access to quality education in rural areas. It provides students with interactive quizzes, AI-powered explanations, and performance tracking while enabling teachers to monitor student progress and manage learning materials.

## 🎯 Objectives

* Improve access to digital learning resources.
* Provide AI-assisted explanations for academic topics.
* Help students evaluate their understanding through quizzes.
* Track student marks and learning progress.
* Enable teachers to manage learning materials and monitor student performance.

## ✨ Key Features

### 👨‍🎓 Student Module

* Student registration and login.
* Learning dashboard for Science, Mathematics, and Computer Science.
* AI-powered assistant for topic-related questions.
* Interactive quizzes with correct and incorrect answer feedback.
* Quiz marks and performance tracking.
* Insights into stronger and weaker topics.
* Access to teacher-uploaded PDF learning materials.

### 👩‍🏫 Teacher Module

* Teacher login and dashboard.
* View and search registered students.
* Monitor quiz attempts and student performance.
* View average quiz percentages.
* Identify students who may need additional support.
* Upload, view, and delete PDF learning materials.
* Organize learning resources by subject and topic.

## 🛠️ Technologies Used

| Component      | Technology                            |
| -------------- | ------------------------------------- |
| Frontend       | React.js, Vite, HTML, CSS, JavaScript |
| Backend        | Python, Flask                         |
| Database       | MySQL                                 |
| AI Integration | Ollama, Llama 3.2                     |
| Tools          | Visual Studio Code, Git, GitHub       |

## 🏗️ System Architecture

1. **Frontend:** React provides the student and teacher interfaces.
2. **Backend:** Flask handles authentication, AI requests, quizzes, and performance tracking.
3. **Database:** MySQL stores application data and quiz results.
4. **AI Assistant:** Ollama runs a local language model to generate educational explanations.
5. **Learning Materials:** Teachers upload PDF resources for students to access.

## ⚙️ Prerequisites

* Python 3.12
* Node.js and npm
* MySQL Server
* Ollama

## 🚀 Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Chaitralour/AI-Personalized-Learning-Rural-Education.git
cd AI-Personalized-Learning-Rural-Education
```

### 2. Configure the Database

Create a MySQL database named `ruraledu` if it does not already exist. Configure the database connection using environment variables. Do not publish your database password.

### 3. Start the Backend

Open a terminal in the project root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install flask flask-cors mysql-connector-python requests
python app.py
```

Keep the backend terminal running.

### 4. Set Up the AI Model

Install Ollama and download the model:

```bash
ollama pull llama3.2:3b
```

Ensure Ollama is running before using the AI assistant.

### 5. Start the Frontend

Open a second terminal in the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

## 🔒 Security

* Never commit database passwords, API keys, or other secrets.
* Keep virtual environments, dependency folders, and uploaded files out of version control.

## 🔮 Future Enhancements

* Support for additional regional languages.
* Offline access to learning resources.
* More adaptive learning recommendations.
* Additional subjects and educational content.

## 👩‍💻 Author

**Chaitra .**
B.Tech – Computer Science and Engineering

GitHub: [Chaitralour](https://github.com/Chaitralour)

## 📄 License

Developed for educational and academic purposes.
