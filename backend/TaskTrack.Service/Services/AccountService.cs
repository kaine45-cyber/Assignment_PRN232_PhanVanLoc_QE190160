using TaskTrack.Repo.Interfaces;
using TaskTrack.Service.Common;
using TaskTrack.Service.Constants;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;
using TaskTrack.Service.Mappers;

namespace TaskTrack.Service.Services;

/// <summary>Admin-only account management.</summary>
public class AccountService : IAccountService
{
    private readonly IAccountRepository _accounts;

    public AccountService(IAccountRepository accounts) => _accounts = accounts;

    public async Task<List<AccountDto>> GetAllAsync()
    {
        var rows = await _accounts.GetAllWithTaskCountAsync();
        return rows.Select(r => r.Account.ToDto(r.CreatedTaskCount)).ToList();
    }

    public async Task<AccountDto> GetByIdAsync(int id)
    {
        var row = await _accounts.GetWithTaskCountAsync(id) ?? throw new NotFoundException($"Account {id} not found.");
        return row.Account.ToDto(row.CreatedTaskCount);
    }

    /// <summary>Updates name and role. An admin cannot demote themself, and the last admin cannot be demoted.</summary>
    public async Task<AccountDto> UpdateAsync(int id, UpdateAccountRequest request, int actorId)
    {
        var account = await _accounts.GetByIdAsync(id) ?? throw new NotFoundException($"Account {id} not found.");

        var demoting = account.Role == (short)AccountRole.Admin && request.Role != (short)AccountRole.Admin;
        if (demoting && id == actorId)
            throw BadRequestException.ForField("Role", "You cannot remove your own Admin role.");
        if (demoting && await _accounts.CountAdminsAsync() <= 1)
            throw BadRequestException.ForField("Role", "At least one Admin account must remain.");

        account.FullName = request.FullName.Trim();
        account.Role = request.Role;
        await _accounts.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    /// <summary>Deletes an account — rejected (409) when the account has created any tasks.</summary>
    public async Task DeleteAsync(int id, int actorId)
    {
        var account = await _accounts.GetByIdAsync(id) ?? throw new NotFoundException($"Account {id} not found.");

        if (id == actorId)
            throw new BadRequestException("You cannot delete your own account.");

        var taskCount = await _accounts.CountCreatedTasksAsync(id);
        if (taskCount > 0)
            throw new ConflictException($"Cannot delete this account because it has created {taskCount} task(s).");

        if (account.Role == (short)AccountRole.Admin && await _accounts.CountAdminsAsync() <= 1)
            throw new BadRequestException("At least one Admin account must remain.");

        _accounts.Remove(account);
        await _accounts.SaveChangesAsync();
    }
}
