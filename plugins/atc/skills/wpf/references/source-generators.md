# Source Generators Reference

The source generator DLL (`Atc.XamlToolkit.SourceGenerators.dll`) is bundled inside the `Atc.XamlToolkit` NuGet package under `analyzers/` — it is **not** a separate NuGet package. It is automatically available when you reference `Atc.XamlToolkit.Wpf` (or any platform package). All generator attributes are in the **`Atc.XamlToolkit.Mvvm`** namespace. They run at compile time — zero runtime reflection.

**Required using:**
```csharp
using Atc.XamlToolkit.Mvvm; // All attributes: [ObservableProperty], [RelayCommand], [ComputedProperty], etc.
```

---

## [ObservableProperty]

Generate a full property with `INotifyPropertyChanged` from a backing field.

```csharp
using Atc.XamlToolkit.Mvvm;

public partial class PersonViewModel : ViewModelBase
{
    [ObservableProperty]
    private string firstName = string.Empty;

    [ObservableProperty]
    private int age;
}
```

**Generates:**
```csharp
public string FirstName
{
    get => firstName;
    set
    {
        if (EqualityComparer<string>.Default.Equals(firstName, value)) return;
        OnFirstNameChanging(value);
        firstName = value;
        OnPropertyChanged();
        OnFirstNameChanged(value);
    }
}

partial void OnFirstNameChanging(string value);
partial void OnFirstNameChanged(string value);
```

**Platform:** WPF, WinUI 3, Avalonia

---

## [ComputedProperty]

Auto-detect property dependencies and regenerate when they change.

```csharp
using Atc.XamlToolkit.Mvvm;

public partial class PersonViewModel : ViewModelBase
{
    [ObservableProperty]
    private string firstName = string.Empty;

    [ObservableProperty]
    private string lastName = string.Empty;

    [ComputedProperty]
    public string FullName => $"{FirstName} {LastName}";
}
```

The generator detects that `FullName` depends on `FirstName` and `LastName`, and raises `PropertyChanged` for `FullName` when either changes.

**Platform:** WPF, WinUI 3, Avalonia

---

## [RelayCommand]

Generate command properties from methods. Attribute is in `Atc.XamlToolkit.Mvvm`.

### Synchronous Command

```csharp
using Atc.XamlToolkit.Mvvm;

[RelayCommand]
private void Save()
{
    // Save logic
}
```

**Generates:** `public IRelayCommand SaveCommand { get; }`

### Async Command

```csharp
[RelayCommand]
private async Task LoadDataAsync(CancellationToken cancellationToken)
{
    // Async logic
}
```

**Generates:** `public IRelayCommandAsync LoadDataCommand { get; }`

### With Cancellation Support

```csharp
[RelayCommand(SupportsCancellation = true)]
private async Task ImportAsync(CancellationToken cancellationToken)
{
    // Long-running import
}
```

**Generates:**
- `public IRelayCommandAsync ImportCommand { get; }` — the main command
- `public IRelayCommand ImportCancelCommand { get; }` — cancel command for XAML binding
- `public void CancelImport()` — programmatic cancellation method
- Auto-generated `DisposeCommands()` helper method

### With Parameter

```csharp
[RelayCommand]
private void SelectItem(Pet pet)
{
    SelectedPet = pet;
}
```

**Generates:** `public IRelayCommand<Pet> SelectItemCommand { get; }`

### CanExecute

The generated command automatically refreshes `CanExecute` when properties change. For async commands, `CanExecute` returns `false` while `IsExecuting` is `true`.

**Platform:** WPF, WinUI 3, Avalonia

---

## [DependencyProperty]

Generate WPF/WinUI dependency property registration boilerplate.

```csharp
public partial class CustomControl : UserControl
{
    [DependencyProperty]
    private string title = "Default Title";

    [DependencyProperty]
    private bool isActive;
}
```

**Generates (WPF):**
```csharp
public static readonly DependencyProperty TitleProperty =
    DependencyProperty.Register(
        nameof(Title),
        typeof(string),
        typeof(CustomControl),
        new FrameworkPropertyMetadata("Default Title"));

public string Title
{
    get => (string)GetValue(TitleProperty);
    set => SetValue(TitleProperty, value);
}
```

**Class requirements:** Must inherit from `UserControl`, `DependencyObject`, `FrameworkElement`, or class name must end with `Attach`, `Behavior`, or `Helper`.

**Platform:** WPF, WinUI 3

---

## [StyledProperty]

Avalonia equivalent of `[DependencyProperty]`.

```csharp
public partial class CustomControl : UserControl
{
    [StyledProperty]
    private string title = "Default Title";
}
```

**Generates:**
```csharp
public static readonly StyledProperty<string> TitleProperty =
    AvaloniaProperty.Register<CustomControl, string>(nameof(Title), "Default Title");

public string Title
{
    get => GetValue(TitleProperty);
    set => SetValue(TitleProperty, value);
}
```

**Platform:** Avalonia only

---

## [AttachedProperty]

Generate attached property with static Get/Set methods.

```csharp
public partial class GridHelper // Can also end with Attach, Behavior
{
    [AttachedProperty]
    private static int columnSpan = 1;
}
```

**Generates (WPF):**
```csharp
public static readonly DependencyProperty ColumnSpanProperty =
    DependencyProperty.RegisterAttached(
        "ColumnSpan",
        typeof(int),
        typeof(GridHelper),
        new FrameworkPropertyMetadata(1));

public static int GetColumnSpan(DependencyObject obj) => (int)obj.GetValue(ColumnSpanProperty);
public static void SetColumnSpan(DependencyObject obj, int value) => obj.SetValue(ColumnSpanProperty, value);
```

**Platform notes:**
- WPF/WinUI: Owner class can be static
- Avalonia: Owner MUST be non-static and inherit from `AvaloniaObject`

**Platform:** WPF, WinUI 3, Avalonia

---

## [RoutedEvent]

Generate routed event registration (WPF only).

```csharp
public partial class CustomButton : Button
{
    [RoutedEvent(RoutingStrategy = RoutingStrategy.Bubble)]
    private event RoutedEventHandler customClick;
}
```

**Generates:**
```csharp
public static readonly RoutedEvent CustomClickEvent =
    EventManager.RegisterRoutedEvent(
        "CustomClick",
        RoutingStrategy.Bubble,
        typeof(RoutedEventHandler),
        typeof(CustomButton));

public event RoutedEventHandler CustomClick
{
    add => AddHandler(CustomClickEvent, value);
    remove => RemoveHandler(CustomClickEvent, value);
}
```

Routing strategies: `Bubble`, `Tunnel`, `Direct`.

**Platform:** WPF only (not supported on WinUI 3 or Avalonia)

---

## [ObservableDtoViewModel]

Auto-generate a ViewModel wrapper for DTOs/POCOs.

```csharp
[ObservableDtoViewModel(typeof(PersonDto))]
public partial class PersonViewModel : ViewModelBase { }
```

### What Gets Generated

- **Properties:** All public properties from the DTO, with `INotifyPropertyChanged`
- **IsDirty:** Tracks whether any property has been modified
- **InnerModel:** Access to the underlying DTO instance
- **Method proxies:** Public methods from the DTO are proxied
- **Validation:** Validation attributes from the DTO are copied

### Options

| Parameter | Type | Description |
|---|---|---|
| `IgnorePropertyNames` | string[] | Properties to exclude |
| `IgnoreMethodNames` | string[] | Methods to exclude |
| `EnableValidationOnPropertyChanged` | bool | Copy validation attributes |
| `EnableValidationOnInit` | bool | Validate on initialization |

### Example with Options

```csharp
[ObservableDtoViewModel(
    typeof(PersonDto),
    IgnorePropertyNames = new[] { "InternalId" },
    EnableValidationOnPropertyChanged = true)]
public partial class PersonViewModel : ViewModelBase { }
```

### Works with [ComputedProperty]

```csharp
[ObservableDtoViewModel(typeof(PersonDto))]
public partial class PersonViewModel : ViewModelBase
{
    [ComputedProperty]
    public string FullName => $"{FirstName} {LastName}";
}
```

**Platform:** WPF, WinUI 3, Avalonia

---

## Platform Detection

Source generators auto-detect the target platform from project references:

| Platform | Detection |
|---|---|
| WPF | References `PresentationCore` or `PresentationFramework` |
| WinUI 3 | References `Microsoft.WindowsAppSDK` or `Microsoft.WinUI` |
| Avalonia | References `Avalonia` |

### Platform-Specific Behavior

- **WinUI threading:** Generators capture `DispatcherQueue` for thread-safe UI updates from async commands
- **Avalonia owner types:** `[AttachedProperty]` owner must inherit from `AvaloniaObject`
- **WPF-only features:** `[RoutedEvent]` is silently skipped on non-WPF platforms
