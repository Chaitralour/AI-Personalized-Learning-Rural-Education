from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from db import get_db_connection
import requests
import os
import uuid
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB maximum PDF
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "materials")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["MATERIAL_UPLOAD_FOLDER"] = UPLOAD_FOLDER


def ensure_materials_table(connection):
    """Create the materials table if it does not already exist."""
    cursor = connection.cursor()
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS learning_materials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id INT NOT NULL,
                topic_id INT NOT NULL,
                title VARCHAR(150) NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                stored_filename VARCHAR(255) NOT NULL UNIQUE,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_material_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_material_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
            )
        """)
        connection.commit()
    finally:
        cursor.close()



@app.route("/")
def home():
    return "RuralEdu backend is running!"


@app.route("/api/test")
def test():
    return jsonify({
        "message": "Frontend connected to Flask successfully!"
    })
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email, and password are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must contain at least 8 characters"
        }), 400

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )

        if cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "An account with this email already exists"
            }), 409

        password_hash = generate_password_hash(password)

        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash, role)
            VALUES (%s, %s, %s, 'student')
            """,
            (name, email, password_hash)
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Student account created successfully",
            "user": {
                "id": cursor.lastrowid,
                "name": name,
                "email": email,
                "role": "student"
            }
        }), 201

    except Exception:
        connection.rollback()
        app.logger.exception("Registration failed")

        return jsonify({
            "success": False,
            "message": "Unable to create account"
        }), 500

    finally:
        if cursor:
            cursor.close()
        connection.close()
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, name, email, password_hash, role
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user or not check_password_hash(
            user["password_hash"], password
        ):
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }), 200

    except Exception:
        app.logger.exception("Login failed")

        return jsonify({
            "success": False,
            "message": "Unable to log in"
        }), 500

    finally:
        if cursor:
            cursor.close()
        connection.close()
@app.route("/api/ask-ai", methods=["POST"])
def ask_ai():
    data = request.json

    question = data.get("question", "")
    topic = data.get("topic", "General")

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2:3b",
            "prompt": f"""
You are RuralEdu, an AI learning assistant for students.

The student is currently learning:
{topic}

Your job is to help the student understand this topic.

Rules:
- Answer based on the selected topic.
- Explain concepts in simple and clear language.
- Assume the learner is a school-level student.
- Use a simple example when helpful.
- If the question is related to the selected topic, answer it directly.
- If the question is unrelated, politely tell the student that it is outside the current topic.
- Do not make the answer unnecessarily complicated.
- Do not provide overly long answers.

Current topic:
{topic}

Student question:
{question}
""",
            "stream": False
        }
    )

    result = response.json()

    return jsonify({
        "answer": result["response"]
    })
@app.route("/api/topics", methods=["GET"])
def get_topics():
    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                t.id AS topic_id,
                t.name AS topic_name,
                s.name AS subject_name
            FROM topics t
            JOIN subjects s ON s.id = t.subject_id
            ORDER BY s.name, t.name
        """)

        topics = cursor.fetchall()

        return jsonify({
            "success": True,
            "topics": topics
        })

    except Exception:
        app.logger.exception("Failed to fetch topics")

        return jsonify({
            "success": False,
            "message": "Unable to fetch topics"
        }), 500

    finally:
        if cursor:
            cursor.close()
        connection.close()
@app.route("/api/db-test")
def db_test():
    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    try:
        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        database_name = cursor.fetchone()[0]

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "RuralEdu database connected successfully!",
            "database": database_name
        })

    except Exception as error:
        connection.close()
        app.logger.exception("Database test failed")
        return jsonify({
            "success": False,
            "message": "Database query failed"
        }), 500
@app.route("/api/quiz/submit", methods=["POST"])
def submit_quiz():
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    subject_name = data.get("subject_name", "").strip()
    topic_name = data.get("topic_name", "").strip()
    score = data.get("score")
    total_questions = data.get("total_questions")

    if not all([
        user_id,
        subject_name,
        topic_name,
        score is not None,
        total_questions is not None
    ]):
        return jsonify({
            "success": False,
            "message": "Missing required quiz details"
        }), 400

    try:
        user_id = int(user_id)
        score = int(score)
        total_questions = int(total_questions)

        if (
            user_id <= 0
            or total_questions <= 0
            or score < 0
            or score > total_questions
        ):
            return jsonify({
                "success": False,
                "message": "Invalid quiz details"
            }), 400

    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Quiz details must contain valid numbers"
        }), 400

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:
        cursor = connection.cursor()

        # Find the correct topic using its subject and name
        cursor.execute(
            """
            SELECT t.id
            FROM topics t
            JOIN subjects s ON s.id = t.subject_id
            WHERE s.name = %s AND t.name = %s
            """,
            (subject_name, topic_name)
        )

        topic = cursor.fetchone()

        if not topic:
            return jsonify({
                "success": False,
                "message": "Topic not found in the database"
            }), 404

        topic_id = topic[0]

        # Confirm the student exists
        cursor.execute(
            "SELECT id FROM users WHERE id = %s AND role = 'student'",
            (user_id,)
        )

        if not cursor.fetchone():
            return jsonify({
                "success": False,
                "message": "Student account not found"
            }), 404

        percentage = round(
            (score / total_questions) * 100, 2
        )

        cursor.execute(
            """
            INSERT INTO quiz_attempts
                (user_id, topic_id, score, total_questions, percentage)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, topic_id, score, total_questions, percentage)
        )

        connection.commit()
        attempt_id = cursor.lastrowid

        return jsonify({
            "success": True,
            "message": "Quiz result saved successfully",
            "attempt_id": attempt_id,
            "user_id": user_id,
            "topic_id": topic_id,
            "score": score,
            "total_questions": total_questions,
            "percentage": percentage
        }), 201

    except Exception:
        connection.rollback()
        app.logger.exception("Failed to save quiz result")

        return jsonify({
            "success": False,
            "message": "Unable to save quiz result"
        }), 500

    finally:
        if cursor:
            cursor.close()
        connection.close()


@app.route("/api/quiz/history/<int:user_id>", methods=["GET"])
def get_quiz_history(user_id):
    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = None

    try:
        cursor = connection.cursor(dictionary=True)

        # Return only this student's quiz attempts.
        cursor.execute("""
            SELECT
                qa.id AS attempt_id,
                s.name AS subject,
                t.name AS topic,
                qa.score,
                qa.total_questions,
                qa.percentage,
                qa.attempted_at
            FROM quiz_attempts qa
            JOIN topics t ON t.id = qa.topic_id
            JOIN subjects s ON s.id = t.subject_id
            WHERE qa.user_id = %s
            ORDER BY qa.attempted_at DESC
        """, (user_id,))

        history = cursor.fetchall()

        for attempt in history:
            if attempt.get("attempted_at"):
                attempt["attempted_at"] = attempt["attempted_at"].isoformat()

        return jsonify({
            "success": True,
            "history": history
        }), 200

    except Exception:
        app.logger.exception("Failed to fetch quiz history")
        return jsonify({
            "success": False,
            "message": "Unable to fetch quiz history"
        }), 500

    finally:
        if cursor:
            cursor.close()
        connection.close()




@app.route("/api/teacher/dashboard", methods=["GET"])
def teacher_dashboard():
    connection = get_db_connection()
    if connection is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500

    cursor = None
    try:
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                u.id,
                u.name,
                u.email,
                COUNT(qa.id) AS attempt_count,
                ROUND(AVG(qa.percentage), 2) AS average_percentage
            FROM users u
            LEFT JOIN quiz_attempts qa ON qa.user_id = u.id
            WHERE u.role = 'student'
            GROUP BY u.id, u.name, u.email
            ORDER BY u.name
        """)
        students = cursor.fetchall()

        cursor.execute("""
            SELECT
                qa.id AS attempt_id,
                u.name AS student_name,
                u.email AS student_email,
                s.name AS subject,
                t.name AS topic,
                qa.score,
                qa.total_questions,
                qa.percentage,
                qa.attempted_at
            FROM quiz_attempts qa
            JOIN users u ON u.id = qa.user_id
            JOIN topics t ON t.id = qa.topic_id
            JOIN subjects s ON s.id = t.subject_id
            WHERE u.role = 'student'
            ORDER BY qa.attempted_at DESC
            LIMIT 200
        """)
        attempts = cursor.fetchall()

        for attempt in attempts:
            if attempt.get("attempted_at"):
                attempt["attempted_at"] = attempt["attempted_at"].isoformat()

        return jsonify({
            "success": True,
            "students": students,
            "attempts": attempts
        }), 200

    except Exception:
        app.logger.exception("Failed to load teacher dashboard")
        return jsonify({"success": False, "message": "Unable to load teacher dashboard"}), 500
    finally:
        if cursor:
            cursor.close()
        connection.close()


# --------------------------------------------------
# TEACHER-UPLOADED PDF LEARNING MATERIALS
# --------------------------------------------------

@app.route("/api/materials", methods=["GET"])
def list_learning_materials():
    connection = get_db_connection()
    if connection is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = None
    try:
        ensure_materials_table(connection)
        cursor = connection.cursor(dictionary=True)
        subject = request.args.get("subject", "").strip()
        topic = request.args.get("topic", "").strip()
        query = """
            SELECT lm.id, lm.title, lm.original_filename, lm.uploaded_at,
                   s.name AS subject_name, t.name AS topic_name, u.name AS teacher_name
            FROM learning_materials lm
            JOIN topics t ON t.id = lm.topic_id
            JOIN subjects s ON s.id = t.subject_id
            JOIN users u ON u.id = lm.teacher_id
        """
        filters = []
        params = []
        if subject:
            filters.append("s.name = %s")
            params.append(subject)
        if topic:
            filters.append("t.name = %s")
            params.append(topic)
        if filters:
            query += " WHERE " + " AND ".join(filters)
        query += " ORDER BY lm.uploaded_at DESC"
        cursor.execute(query, tuple(params))
        materials = cursor.fetchall()
        for item in materials:
            if item.get("uploaded_at"):
                item["uploaded_at"] = item["uploaded_at"].isoformat()
        return jsonify({"success": True, "materials": materials}), 200
    except Exception:
        app.logger.exception("Failed to list learning materials")
        return jsonify({"success": False, "message": "Unable to load learning materials"}), 500
    finally:
        if cursor:
            cursor.close()
        connection.close()


@app.route("/api/materials", methods=["POST"])
def upload_learning_material():
    teacher_id = request.form.get("teacher_id", type=int)
    subject_name = request.form.get("subject_name", "").strip()
    topic_name = request.form.get("topic_name", "").strip()
    title = request.form.get("title", "").strip()
    uploaded_file = request.files.get("file")

    if not teacher_id or not subject_name or not topic_name or not title or not uploaded_file:
        return jsonify({"success": False, "message": "Teacher, subject, topic, title, and PDF file are required"}), 400
    if len(title) > 150:
        return jsonify({"success": False, "message": "Title must be 150 characters or fewer"}), 400
    original_filename = secure_filename(uploaded_file.filename or "")
    if not original_filename or not original_filename.lower().endswith(".pdf"):
        return jsonify({"success": False, "message": "Only PDF files are allowed"}), 400
    file_bytes = uploaded_file.read()
    if not file_bytes.startswith(b"%PDF-"):
        return jsonify({"success": False, "message": "The selected file does not appear to be a valid PDF"}), 400

    connection = get_db_connection()
    if connection is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = None
    stored_filename = f"{uuid.uuid4().hex}.pdf"
    target_path = os.path.join(app.config["MATERIAL_UPLOAD_FOLDER"], stored_filename)
    try:
        ensure_materials_table(connection)
        cursor = connection.cursor()
        cursor.execute("SELECT id FROM users WHERE id = %s AND role = 'teacher'", (teacher_id,))
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Only a teacher account can upload learning materials"}), 403
        cursor.execute("""
            SELECT t.id
            FROM topics t JOIN subjects s ON s.id = t.subject_id
            WHERE s.name = %s AND t.name = %s
        """, (subject_name, topic_name))
        topic_row = cursor.fetchone()
        if not topic_row:
            return jsonify({"success": False, "message": "The selected subject and topic were not found"}), 404
        with open(target_path, "wb") as output_file:
            output_file.write(file_bytes)
        cursor.execute("""
            INSERT INTO learning_materials
                (teacher_id, topic_id, title, original_filename, stored_filename)
            VALUES (%s, %s, %s, %s, %s)
        """, (teacher_id, topic_row[0], title, original_filename, stored_filename))
        connection.commit()
        return jsonify({"success": True, "message": "PDF uploaded successfully", "id": cursor.lastrowid}), 201
    except Exception:
        connection.rollback()
        if os.path.exists(target_path):
            os.remove(target_path)
        app.logger.exception("Failed to upload learning material")
        return jsonify({"success": False, "message": "Unable to upload PDF"}), 500
    finally:
        if cursor:
            cursor.close()
        connection.close()


@app.route("/api/materials/<int:material_id>/file", methods=["GET"])
def view_learning_material(material_id):
    connection = get_db_connection()
    if connection is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = None
    try:
        ensure_materials_table(connection)
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT stored_filename, original_filename FROM learning_materials WHERE id = %s", (material_id,))
        material = cursor.fetchone()
        if not material:
            return jsonify({"success": False, "message": "Learning material not found"}), 404
        return send_from_directory(
            app.config["MATERIAL_UPLOAD_FOLDER"],
            material["stored_filename"],
            as_attachment=False,
            download_name=material["original_filename"],
            mimetype="application/pdf"
        )
    except Exception:
        app.logger.exception("Failed to open learning material")
        return jsonify({"success": False, "message": "Unable to open PDF"}), 500
    finally:
        if cursor:
            cursor.close()
        connection.close()


@app.route("/api/materials/<int:material_id>", methods=["DELETE"])
def delete_learning_material(material_id):
    data = request.get_json(silent=True) or {}
    teacher_id = data.get("teacher_id")
    try:
        teacher_id = int(teacher_id)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "A valid teacher account is required"}), 400
    connection = get_db_connection()
    if connection is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    cursor = None
    try:
        ensure_materials_table(connection)
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT id FROM users WHERE id = %s AND role = 'teacher'", (teacher_id,))
        if not cursor.fetchone():
            return jsonify({"success": False, "message": "Only a teacher account can delete learning materials"}), 403
        cursor.execute("SELECT stored_filename FROM learning_materials WHERE id = %s", (material_id,))
        material = cursor.fetchone()
        if not material:
            return jsonify({"success": False, "message": "Learning material not found"}), 404
        cursor.execute("DELETE FROM learning_materials WHERE id = %s", (material_id,))
        connection.commit()
        file_path = os.path.join(app.config["MATERIAL_UPLOAD_FOLDER"], material["stored_filename"])
        if os.path.isfile(file_path):
            os.remove(file_path)
        return jsonify({"success": True, "message": "Learning material deleted"}), 200
    except Exception:
        connection.rollback()
        app.logger.exception("Failed to delete learning material")
        return jsonify({"success": False, "message": "Unable to delete learning material"}), 500
    finally:
        if cursor:
            cursor.close()
        connection.close()


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({"success": False, "message": "PDF is too large. Maximum file size is 10 MB."}), 413


if __name__ == "__main__":
    app.run(debug=True)