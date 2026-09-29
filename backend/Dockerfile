# ---------- Build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first (better layer caching)
COPY StudentID_ClassCode_Ass1_BE.sln ./
COPY TaskTrack.API/TaskTrack.API.csproj TaskTrack.API/
COPY TaskTrack.Service/TaskTrack.Service.csproj TaskTrack.Service/
COPY TaskTrack.Repo/TaskTrack.Repo.csproj TaskTrack.Repo/
RUN dotnet restore TaskTrack.API/TaskTrack.API.csproj

COPY . .
RUN dotnet publish TaskTrack.API/TaskTrack.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---------- Runtime stage ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Render sets PORT (default 10000); Program.cs listens on it. 8080 is the local fallback.
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "TaskTrack.API.dll"]
