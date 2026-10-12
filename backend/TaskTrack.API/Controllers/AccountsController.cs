using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskTrack.API.Extensions;
using TaskTrack.Service.Constants;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;

namespace TaskTrack.API.Controllers;

/// <summary>Account management — Admin role only (401 without a token, 403 for Staff).</summary>
[ApiController]
[Route("api/accounts")]
[Produces("application/json")]
[Authorize(Roles = Roles.Admin)]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _service;

    public AccountsController(IAccountService service) => _service = service;

    /// <summary>List all accounts.</summary>
    [HttpGet]
    public async Task<ActionResult<List<AccountDto>>> GetAll() => Ok(await _service.GetAllAsync());

    /// <summary>Get one account.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<AccountDto>> GetById(int id) => Ok(await _service.GetByIdAsync(id));

    /// <summary>Update name or role (0 = Staff, 1 = Admin).</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<AccountDto>> Update(int id, [FromBody] UpdateAccountRequest request)
        => Ok(await _service.UpdateAsync(id, request, User.RequireAccountId()));

    /// <summary>Delete an account — 409 if the account has created any tasks.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, User.RequireAccountId());
        return NoContent();
    }
}
