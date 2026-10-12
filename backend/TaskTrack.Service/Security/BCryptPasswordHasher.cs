using TaskTrack.Service.Interfaces;

namespace TaskTrack.Service.Security;

/// <summary>BCrypt (work factor 11) — passwords are never stored in plain text.</summary>
public class BCryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 11;

    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false; // malformed hash in the database
        }
    }
}
