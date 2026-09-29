using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/tags")]
[Produces("application/json")]
public class TagsController : ControllerBase
{
    private readonly ITagService _service;

    public TagsController(ITagService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<TagDto>>> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpPost]
    public async Task<ActionResult<TagDto>> Create([FromBody] TagRequest request)
    {
        var created = await _service.CreateAsync(request);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TagDto>> Update(int id, [FromBody] TagRequest request)
        => Ok(await _service.UpdateAsync(id, request));

    /// <summary>Delete a tag — returns 400 if it is used by any task.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
