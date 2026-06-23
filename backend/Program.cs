using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// Register PostgreSQL DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<TodoContext>(options =>
    options.UseNpgsql(connectionString));

// Add CORS support
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Automatically ensure the database is created and applied migrations/updates.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TodoContext>();
    try
    {
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error creating/migrating database: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAngular");
app.UseHttpsRedirection();

// GET all todos
app.MapGet("/api/todo", async (TodoContext db) =>
    await db.Todos.OrderBy(t => t.CreatedAt).ToListAsync());

// POST new todo
app.MapPost("/api/todo", async (TodoItem todo, TodoContext db) =>
{
    todo.CreatedAt = DateTime.UtcNow;
    db.Todos.Add(todo);
    await db.SaveChangesAsync();
    return Results.Created($"/api/todo/{todo.Id}", todo);
});

// PUT update todo (Toggle completion or update text)
app.MapPut("/api/todo/{id}", async (int id, TodoItem inputTodo, TodoContext db) =>
{
    var todo = await db.Todos.FindAsync(id);
    if (todo is null) return Results.NotFound();

    todo.Title = inputTodo.Title;
    todo.IsCompleted = inputTodo.IsCompleted;

    await db.SaveChangesAsync();
    return Results.NoContent();
});

// DELETE todo
app.MapDelete("/api/todo/{id}", async (int id, TodoContext db) =>
{
    if (await db.Todos.FindAsync(id) is TodoItem todo)
    {
        db.Todos.Remove(todo);
        await db.SaveChangesAsync();
        return Results.Ok(todo);
    }

    return Results.NotFound();
});

app.Run();
