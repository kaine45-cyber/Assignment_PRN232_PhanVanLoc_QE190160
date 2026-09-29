using TaskTrack.Repo.Interfaces;
using TaskTrack.Repo.Models;
using TaskTrack.Service.Common;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Interfaces;
using TaskTrack.Service.Mappers;

namespace TaskTrack.Service.Services;

public class TagService : ITagService
{
    private readonly ITagRepository _tags;

    public TagService(ITagRepository tags)
    {
        _tags = tags;
    }

    public async Task<List<TagDto>> GetAllAsync()
    {
        var list = await _tags.GetAllWithUsageAsync();
        return list.Select(t => t.ToDto()).ToList();
    }

    public async Task<TagDto> CreateAsync(TagRequest request)
    {
        var name = request.TagName.Trim();
        if (await _tags.NameExistsAsync(name))
            throw BadRequestException.ForField("TagName", $"Tag '{name}' already exists.");

        var tag = new Tag { TagName = name, Color = NormalizeColor(request.Color) };
        await _tags.AddAsync(tag);
        await _tags.SaveChangesAsync();
        return tag.ToDto();
    }

    public async Task<TagDto> UpdateAsync(int id, TagRequest request)
    {
        var tag = await _tags.GetWithTasksAsync(id)
                  ?? throw new NotFoundException($"Tag {id} not found.");

        var name = request.TagName.Trim();
        if (await _tags.NameExistsAsync(name, id))
            throw BadRequestException.ForField("TagName", $"Tag '{name}' already exists.");

        tag.TagName = name;
        tag.Color = NormalizeColor(request.Color);
        await _tags.SaveChangesAsync();
        return tag.ToDto();
    }

    public async Task DeleteAsync(int id)
    {
        var tag = await _tags.GetByIdAsync(id)
                  ?? throw new NotFoundException($"Tag {id} not found.");

        if (await _tags.IsUsedAsync(id))
            throw new BadRequestException("Cannot delete this tag because it is used by one or more tasks.");

        _tags.Remove(tag);
        await _tags.SaveChangesAsync();
    }

    private static string? NormalizeColor(string? color) =>
        string.IsNullOrWhiteSpace(color) ? null : color.Trim().ToUpperInvariant();
}
