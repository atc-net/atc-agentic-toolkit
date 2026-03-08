namespace {{PROJECT_NAMESPACE}}.Modules.Contracts.Extensions;

public static class LoggingBuilderExtensions
{
    /// <summary>
    /// Adds systemd console logging with standardized timestamp format and log level configuration.
    /// </summary>
    /// <param name="builder">The <see cref="ILoggingBuilder"/> to configure.</param>
    /// <returns>The <see cref="ILoggingBuilder"/> for chaining.</returns>
    public static ILoggingBuilder AddModuleConsoleLogging(this ILoggingBuilder builder)
    {
        builder.AddSystemdConsole(options =>
        {
            options.UseUtcTimestamp = true;
            options.TimestampFormat = " yyyy-MM-dd HH:mm:ss.fff zzz ";
        });

        builder.SetMinimumLevel(LogLevel.Information);

        return builder;
    }
}