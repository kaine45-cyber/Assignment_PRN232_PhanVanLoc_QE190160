using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/departments")]
[Produces("application/json")]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _service;

    public DepartmentsController(IDepartmentService service) => _service = service;

    /// <summary>List all active departments (includeInactive=true is used by the management page).</summary>
    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> GetAll([FromQuery] bool includeInactive = false)
        => Ok(await _service.GetAllAsync(includeInactive));

    /// <summary>Get one department and its projects.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DepartmentDetailDto>> GetById(int id)
        => Ok(await _service.GetByIdAsync(id));

    /// <summary>Search active departments by name (partial, case-insensitive).</summary>
    [HttpGet("search")]
    public async Task<ActionResult<List<DepartmentDto>>> Search([FromQuery] string? name)
        => Ok(await _service.SearchAsync(name));

    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> Create([FromBody] DepartmentRequest request)
    {
        var created = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.DepartmentId }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<DepartmentDto>> Update(int id, [FromBody] DepartmentRequest request)
        => Ok(await _service.UpdateAsync(id, request));

    /// <summary>Delete a department — returns 400 if any project is linked.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
