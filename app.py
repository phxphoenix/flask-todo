from flask import Flask, render_template, request, redirect
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

import os

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "moj_sekret")

# konfiguracja bazy danych SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://todo_db_9usc_user:Gpt7xwNeYs28IJyTyIZjBa7KebvGgTIU@dpg-d3n7ogbuibrs73bivphg-a.frankfurt-postgres.render.com/todo_db_9usc'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# model danych
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, default=False)  # ✅ NOWE POLE

with app.app_context():
    db.create_all()

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

if __name__ == '__main__':
    app.run(debug=True)
