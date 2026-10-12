using System.Net;

namespace TaskTrack.Tests;

public class AuthorizationTests : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client;

    public AuthorizationTests(ApiFactory factory) => _client = factory.CreateClient();

    [Theory]
    [InlineData("/api/departments")]
    [InlineData("/api/projects")]
    [InlineData("/api/tasks")]
    [InlineData("/api/tags")]
    [InlineData("/api/tasks/search?title=test")]
    public async Task Get_endpoints_stay_public(string url)
    {
        var response = await _client.GetAsync(url);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("POST", "/api/departments")]
    [InlineData("PUT", "/api/departments/1")]
    [InlineData("DELETE", "/api/departments/1")]
    [InlineData("POST", "/api/projects")]
    [InlineData("PUT", "/api/projects/1")]
    [InlineData("DELETE", "/api/projects/1")]
    [InlineData("POST", "/api/tasks")]
    [InlineData("PUT", "/api/tasks/1")]
    [InlineData("DELETE", "/api/tasks/1")]
    [InlineData("POST", "/api/tags")]
    [InlineData("PUT", "/api/tags/1")]
    [InlineData("DELETE", "/api/tags/1")]
    [InlineData("GET", "/api/accounts")]
    public async Task Protected_endpoints_return_401_without_token(string method, string url)
    {
        var response = await _client.Send(new HttpMethod(method), url, method == "DELETE" || method == "GET" ? null : new { });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Staff_can_write_but_gets_403_on_admin_endpoints()
    {
        var (staff, staffId) = await _client.NewStaff();

        var dept = await _client.Send(HttpMethod.Post, "/api/departments",
            new { departmentName = "Staff Dept " + Guid.NewGuid().ToString("N")[..6], departmentDescription = "created in tests" }, staff);
        Assert.Equal(HttpStatusCode.Created, dept.StatusCode);
        var deptId = (await dept.ReadJson()).GetProperty("departmentId").GetInt32();

        var project = await _client.Send(HttpMethod.Post, "/api/projects",
            new { projectName = "Staff Project", startDate = "2024-01-01", departmentId = deptId }, staff);
        Assert.Equal(HttpStatusCode.Created, project.StatusCode);
        Assert.Equal(staffId, (await project.ReadJson()).GetProperty("createdById").GetInt32());

        Assert.Equal(HttpStatusCode.Forbidden, (await _client.Send(HttpMethod.Get, "/api/accounts", token: staff)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _client.Send(HttpMethod.Get, $"/api/accounts/{staffId}", token: staff)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await _client.Send(HttpMethod.Delete, $"/api/accounts/{staffId}", token: staff)).StatusCode);

        // clean up (no tasks were created)
        await _client.Send(HttpMethod.Delete, $"/api/projects/{(await project.ReadJson()).GetProperty("projectId").GetInt32()}", token: staff);
        await _client.Send(HttpMethod.Delete, $"/api/departments/{deptId}", token: staff);
    }

    [Fact]
    public async Task Admin_manages_accounts_and_cannot_delete_account_with_tasks()
    {
        var (admin, _, adminId) = await _client.Login(ApiFactory.AdminEmail, ApiFactory.AdminPassword);
        var (staff, staffId) = await _client.NewStaff();

        var list = await _client.Send(HttpMethod.Get, "/api/accounts", token: admin);
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);

        var rename = await _client.Send(HttpMethod.Put, $"/api/accounts/{staffId}", new { fullName = "Renamed Staff", role = 0 }, admin);
        Assert.Equal(HttpStatusCode.OK, rename.StatusCode);

        // staff creates a task → the account can no longer be deleted (409)
        var task = await _client.Send(HttpMethod.Post, "/api/tasks", new { title = "Task by staff", projectId = 1, tagIds = new[] { 1 } }, staff);
        Assert.Equal(HttpStatusCode.Created, task.StatusCode);
        var taskId = (await task.ReadJson()).GetProperty("taskId").GetInt32();
        Assert.Equal(HttpStatusCode.Conflict, (await _client.Send(HttpMethod.Delete, $"/api/accounts/{staffId}", token: admin)).StatusCode);
        await _client.Send(HttpMethod.Delete, $"/api/tasks/{taskId}", token: staff); // soft delete keeps the reference

        // admin cannot demote or delete themself
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.Send(HttpMethod.Put, $"/api/accounts/{adminId}", new { fullName = "Admin", role = 0 }, admin)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.Send(HttpMethod.Delete, $"/api/accounts/{adminId}", token: admin)).StatusCode);

        // an account without tasks can be deleted
        var (_, emptyId) = await _client.NewStaff();
        Assert.Equal(HttpStatusCode.NoContent, (await _client.Send(HttpMethod.Delete, $"/api/accounts/{emptyId}", token: admin)).StatusCode);
    }
}
