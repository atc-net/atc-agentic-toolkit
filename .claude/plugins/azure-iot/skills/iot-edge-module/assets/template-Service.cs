namespace {{ModuleName}};

/// <summary>
/// The main {{ModuleName}}Service.
/// </summary>
public sealed partial class {{ModuleName}}Service : IHostedService
{
    private readonly IHostApplicationLifetime hostApplication;
    private readonly IModuleClientWrapper moduleClient;

    public {{ModuleName}}Service(
        ILogger<{{ModuleName}}Service> logger,
        IHostApplicationLifetime hostApplication,
        IModuleClientWrapper moduleClient)
    {
        this.logger = logger;
        this.hostApplication = hostApplication;
        this.moduleClient = moduleClient;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        hostApplication.ApplicationStarted.Register(OnStarted);
        hostApplication.ApplicationStopping.Register(OnStopping);
        hostApplication.ApplicationStopped.Register(OnStopped);

        moduleClient.SetConnectionStatusChangesHandler(LogConnectionStatusChange);

        await moduleClient.OpenAsync(cancellationToken);

        // TODO: Register direct method handlers here
        //// await moduleClient.SetMethodHandlerAsync("MethodName", HandleMethodAsync, string.Empty, cancellationToken);

        LogModuleClientStarted({{ModuleName}}Constants.ModuleId);
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        try
        {
            await moduleClient.CloseAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            // Cancellation is expected during shutdown — safe to ignore
        }

        LogModuleClientStopped({{ModuleName}}Constants.ModuleId);
    }

    private void OnStarted()
        => LogModuleStarted({{ModuleName}}Constants.ModuleId);

    private void OnStopping()
        => LogModuleStopping({{ModuleName}}Constants.ModuleId);

    private void OnStopped()
        => LogModuleStopped({{ModuleName}}Constants.ModuleId);
}
