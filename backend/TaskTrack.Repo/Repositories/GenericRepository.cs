using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly TaskManagementContext _context;
    protected readonly DbSet<T> _dbSet;

    public GenericRepository(TaskManagementContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(int id) => await _dbSet.FindAsync(id);

    public virtual async Task<List<T>> GetAllAsync() => await _dbSet.ToListAsync();

    public virtual async Task AddAsync(T entity) => await _dbSet.AddAsync(entity);

    public virtual void Update(T entity) => _dbSet.Update(entity);

    public virtual void Remove(T entity) => _dbSet.Remove(entity);

    public Task<int> SaveChangesAsync() => _context.SaveChangesAsync();
}
