# MVVM Infrastructure Reference

---

## ViewModelBase

Base class for all ViewModels. Inherits from `ObservableObject` and provides:

### Built-in Properties

| Property | Type | Default | Purpose |
|---|---|---|---|
| `IsEnable` | bool | `true` | Enable/disable UI elements |
| `IsVisible` | bool | `true` | Show/hide UI elements |
| `IsBusy` | bool | `false` | Loading/processing indicator |
| `IsDirty` | bool | `false` | Change tracking |
| `IsSelected` | bool | `false` | Selection state |

All properties are decorated with `[JsonIgnore]` for serialization safety.

### Validation

```csharp
public partial class PersonViewModel : ViewModelBase
{
    [ObservableProperty]
    [Required]
    [StringLength(100, MinimumLength = 1)]
    private string name = string.Empty;

    [ObservableProperty]
    [Range(0, 150)]
    private int age;

    public PersonViewModel()
    {
        InitializeValidation(); // Enable DataAnnotation validation
    }
}
```

**Validation methods:**
- `ValidateProperty(propertyName)` — Validate a single property
- `ValidateAllProperties()` — Validate all properties
- `HasErrors` — Check if any validation errors exist
- `GetErrors(propertyName)` — Get errors for a specific property

### Messenger Integration

ViewModelBase has built-in access to the messaging system:

```csharp
// In ViewModel
Messenger.Default.Send(new NotificationMessage("Data saved"));
```

---

## Specialized ViewModelBase Classes

### MainWindowViewModelBase

Lifecycle management for main window:

```csharp
public partial class MainWindowViewModel : MainWindowViewModelBase
{
    protected override async Task OnInitializedAsync()
    {
        // Called after window loads
        await LoadDataAsync();
    }

    protected override async Task OnClosingAsync()
    {
        // Called when window is closing
        await SaveStateAsync();
    }
}
```

### ViewModelDialogBase

For dialog ViewModels with Ok/Cancel result:

```csharp
public partial class EditPersonDialogViewModel : ViewModelDialogBase
{
    [ObservableProperty]
    private string name = string.Empty;

    protected override bool CanOk() => !string.IsNullOrEmpty(Name);
}
```

---

## Commands

### RelayCommand

```csharp
// Manual creation
public IRelayCommand SaveCommand { get; }

public MyViewModel()
{
    SaveCommand = new RelayCommand(Save, CanSave);
}

private void Save() { /* ... */ }
private bool CanSave() => IsDirty;
```

### RelayCommandAsync

```csharp
public IRelayCommandAsync LoadCommand { get; }

public MyViewModel()
{
    LoadCommand = new RelayCommandAsync(LoadAsync);
}

private async Task LoadAsync(CancellationToken cancellationToken)
{
    IsBusy = true;
    try
    {
        // Async work
    }
    finally
    {
        IsBusy = false;
    }
}
```

### Error Handling

```csharp
public class MyErrorHandler : IErrorHandler
{
    public void HandleError(Exception ex)
    {
        // Log, show dialog, etc.
    }
}

// Register
var command = new RelayCommandAsync(ExecuteAsync, errorHandler: new MyErrorHandler());
```

---

## Messaging System

### Messenger

Central pub/sub message bus with weak references (prevents memory leaks).

```csharp
// Register for messages
Messenger.Default.Register<GenericMessage<string>>(this, msg =>
{
    var content = msg.Content; // "Hello"
});

// Send a message
Messenger.Default.Send(new GenericMessage<string>("Hello"));

// Unregister
Messenger.Default.Unregister<GenericMessage<string>>(this);
```

### Message Types

| Type | Purpose | Usage |
|---|---|---|
| `GenericMessage<T>` | Send typed data | Cross-ViewModel data sharing |
| `NotificationMessage` | String notifications | Simple status updates |
| `NotificationMessageAction` | Message with callback | Request/response patterns |
| `NotificationMessageAction<T>` | Parameterized callback | Typed request/response |
| `PropertyChangedMessage<T>` | Property change broadcast | Sync state across ViewModels |
| `NotificationMessageWithCallback` | Generic callback | Advanced scenarios |

### Example: Cross-ViewModel Communication

```csharp
// In SettingsViewModel
Messenger.Default.Send(new PropertyChangedMessage<string>(
    this, oldTheme, newTheme, nameof(Theme)));

// In MainViewModel
Messenger.Default.Register<PropertyChangedMessage<string>>(this, msg =>
{
    if (msg.PropertyName == "Theme")
    {
        ApplyTheme(msg.NewValue);
    }
});
```

---

## Services

### IClipboardService

```csharp
public interface IClipboardService
{
    void SetText(string text);
    string? GetText();
    void SetData(string format, object data);
    object? GetData(string format);
}
```

### IUndoRedoService

```csharp
public interface IUndoRedoService
{
    bool CanUndo { get; }
    bool CanRedo { get; }
    void Execute(IUndoRedoCommand command);
    void Undo();
    void Redo();
    void Clear();
}
```

### IHotkeyService

```csharp
public interface IHotkeyService
{
    void Register(KeyGesture gesture, Action action);
    void Unregister(KeyGesture gesture);
}
```

### INavigationService

```csharp
public interface INavigationService
{
    void NavigateTo<TViewModel>() where TViewModel : ViewModelBase;
    void NavigateTo(Type viewModelType);
    bool CanGoBack { get; }
    void GoBack();
}
```

### INavigationGuard

```csharp
public interface INavigationGuard
{
    Task<bool> CanNavigateAwayAsync();
}
```

### IPrintService

```csharp
public interface IPrintService
{
    void Print(Visual visual, string description);
    void ShowPrintPreview(Visual visual, string description);
}
```

### IToastNotificationService

```csharp
public interface IToastNotificationService
{
    void Show(string title, string message, ToastNotificationType type = ToastNotificationType.Information);
    void ShowSuccess(string title, string message);
    void ShowWarning(string title, string message);
    void ShowError(string title, string message);
}
```

### ICaptureService

```csharp
public interface ICaptureService
{
    BitmapSource CaptureScreen();
    BitmapSource CaptureWindow(Window window);
    BitmapSource CaptureRegion(Rect region);
}
```

### IBusyIndicatorService

```csharp
public interface IBusyIndicatorService
{
    bool IsBusy { get; }
    void Show(string? message = null);
    void Hide();
}
```
