import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TodoService } from './services/todo.service';
import { Todo } from './models/todo.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Aesthetic Todos';
  todos: Todo[] = [];
  newTodoTitle: string = '';
  filter: 'all' | 'active' | 'completed' = 'all';

  constructor(private todoService: TodoService) {}

  ngOnInit(): void {
    this.loadTodos();
  }

  loadTodos(): void {
    this.todoService.getTodos().subscribe({
      next: (data) => {
        this.todos = data;
      },
      error: (err) => {
        console.error('Failed to load todos', err);
      }
    });
  }

  addTodo(): void {
    if (!this.newTodoTitle.trim()) return;
    const newTodo: Todo = {
      title: this.newTodoTitle.trim(),
      isCompleted: false
    };

    this.todoService.addTodo(newTodo).subscribe({
      next: (todo) => {
        this.todos.push(todo);
        this.newTodoTitle = '';
      },
      error: (err) => console.error('Failed to add todo', err)
    });
  }

  toggleComplete(todo: Todo): void {
    todo.isCompleted = !todo.isCompleted;
    this.todoService.updateTodo(todo).subscribe({
      error: (err) => {
        console.error('Failed to update todo status', err);
        // revert on failure
        todo.isCompleted = !todo.isCompleted;
      }
    });
  }

  deleteTodo(todo: Todo): void {
    if (todo.id === undefined) return;
    this.todoService.deleteTodo(todo.id).subscribe({
      next: () => {
        this.todos = this.todos.filter(t => t.id !== todo.id);
      },
      error: (err) => console.error('Failed to delete todo', err)
    });
  }

  get filteredTodos(): Todo[] {
    if (this.filter === 'active') {
      return this.todos.filter(t => !t.isCompleted);
    } else if (this.filter === 'completed') {
      return this.todos.filter(t => t.isCompleted);
    }
    return this.todos;
  }

  get activeCount(): number {
    return this.todos.filter(t => !t.isCompleted).length;
  }

  get completionPercentage(): number {
    if (this.todos.length === 0) return 0;
    const completed = this.todos.filter(t => t.isCompleted).length;
    return Math.round((completed / this.todos.length) * 100);
  }
}
