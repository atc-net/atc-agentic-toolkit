namespace {{ModuleName}};

public static class Program
{
    public static async Task Main(string[] args)
    {
        using var host = Host.CreateDefaultBuilder(args)
            .ConfigureServices((hostContext, services) =>
            {
                services.AddLogging(builder =>
                {
                    builder.AddModuleConsoleLogging();
                });

                if (hostContext.IsStandaloneMode())
                {
                    services.AddSingleton<IModuleClientWrapper, MockModuleClientWrapper>();
                }
                else
                {
                    services.AddModuleClientWrapper(TransportSettingsFactory.BuildMqttTransportSettings());
                }

                services.AddSingleton<IMethodResponseFactory, MethodResponseFactory>();

                //// TODO: Add your service registrations here

                services.AddHostedService<{{ModuleName}}Service>();
            })
            .UseConsoleLifetime()
            .Build();

        await host.RunAsync();
    }
}
