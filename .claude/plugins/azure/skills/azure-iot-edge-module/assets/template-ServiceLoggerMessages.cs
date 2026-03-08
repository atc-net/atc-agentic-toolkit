namespace {{ModuleName}};

/// <summary>
/// {{ModuleName}}Service LoggerMessages.
/// </summary>
public sealed partial class {{ModuleName}}Service
{
    private readonly ILogger<{{ModuleName}}Service> logger;

    [LoggerMessage(
        EventId = Atc.Azure.IoTEdge.LoggingEventIdConstants.ModuleStarted,
        Level = LogLevel.Trace,
        Message = "Successfully started module '{ModuleName}'")]
    private partial void LogModuleStarted(string moduleName);

    [LoggerMessage(
        EventId = Atc.Azure.IoTEdge.LoggingEventIdConstants.ModuleStopping,
        Level = LogLevel.Trace,
        Message = "Stopping module '{ModuleName}'")]
    private partial void LogModuleStopping(string moduleName);

    [LoggerMessage(
        EventId = Atc.Azure.IoTEdge.LoggingEventIdConstants.ModuleStopped,
        Level = LogLevel.Trace,
        Message = "Successfully stopped module '{moduleName}'")]
    private partial void LogModuleStopped(string moduleName);

    [LoggerMessage(
        EventId = Atc.Azure.IoTEdge.LoggingEventIdConstants.ModuleClientStarted,
        Level = LogLevel.Trace,
        Message = "Successfully started moduleClient for module '{ModuleName}'")]
    private partial void LogModuleClientStarted(string moduleName);

    [LoggerMessage(
        EventId = Atc.Azure.IoTEdge.LoggingEventIdConstants.ModuleClientStopped,
        Level = LogLevel.Trace,
        Message = "Successfully stopped moduleClient for module '{ModuleName}'")]
    private partial void LogModuleClientStopped(string moduleName);

    [LoggerMessage(
        EventId = Atc.Azure.IoTEdge.LoggingEventIdConstants.ConnectionStatusChange,
        Level = LogLevel.Debug,
        Message = "Connection status changed: Status={Status}, Reason={Reason}")]
    private partial void LogConnectionStatusChange(ConnectionStatus status, ConnectionStatusChangeReason reason);
}
