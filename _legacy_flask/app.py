from flask import Flask, render_template, request, redirect, flash
from flask_sqlalchemy import SQLAlchemy

import os

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "moj_sekret")

# konfiguracja bazy danych PostgreSQL (Render) lub lokalnej SQLite jako fallback
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///tasks.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# model danych
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, default=False)  # ✅ NOWE POLE

# with app.app_context():
#   db.create_all()

@app.route('/')
def index():
    tasks = Task.query.all()
    return render_template('index.html', tasks=tasks)

@app.route('/add', methods=['POST'])
def add_task():
    task_content = request.form.get('content')  # <- poprawione 'task' -> 'content'
    if task_content:
        new_task = Task(content=task_content)
        db.session.add(new_task)
        db.session.commit()
    return redirect('/')

@app.route('/delete/<int:id>')
def delete_task(id):
    task = Task.query.get_or_404(id)
    db.session.delete(task)
    db.session.commit()
    return redirect('/')

@app.route('/edit/<int:id>', methods=['GET', 'POST'])
def edit_task(id):
    task = Task.query.get_or_404(id)
    if request.method == 'POST':
        task.content = request.form['content']
        db.session.commit()
        return redirect('/')
    return render_template('edit.html', task=task)

@app.route('/toggle/<int:id>')
def toggle_task(id):
    task = Task.query.get_or_404(id)
    task.done = not task.done
    db.session.commit()
    return redirect('/')

import json
from flask import send_file

@app.route('/export')
def export_tasks():
    """
    Eksportuje wszystkie zadania z bazy do pliku JSON.
    Plik jest pobierany przez przeglądarkę.
    """
    tasks = Task.query.all()
    tasks_list = [{"id": t.id, "content": t.content, "done": t.done} for t in tasks]

    # zapis do tymczasowego pliku
    with open("tasks_backup.json", "w") as f:
        json.dump(tasks_list, f, indent=4)

    # wysłanie pliku do pobrania
    return send_file("tasks_backup.json", as_attachment=True)

@app.route('/import', methods=['GET', 'POST'])
def import_tasks():
    """
    Importuje zadania z pliku JSON przesłanego przez użytkownika.
    """
    if request.method == 'POST':
        file = request.files['file']
        if file:
            tasks_list = json.load(file)
            for t in tasks_list:
                if not Task.query.get(t['id']):
                    new_task = Task(id=t['id'], content=t['content'], done=t['done'])
                    db.session.add(new_task)
            db.session.commit()
            flash('Zadania zostały pomyślnie zaimportowane ✅', 'success')
        return redirect('/')
        

    # GET — zwraca elegancką stronę formularza
    return render_template('import.html')


if __name__ == '__main__':
    app.run(debug=True)



