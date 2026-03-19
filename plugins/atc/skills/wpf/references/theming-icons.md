# Theming & Icons Reference

---

## Theming (Atc.Wpf.Theming)

### NiceWindow

Replace the standard `Window` with `NiceWindow` for a themed window with built-in title bar:

```xml
<theming:NiceWindow x:Class="MyApp.MainWindow"
    xmlns:theming="clr-namespace:Atc.Wpf.Theming.Windows;assembly=Atc.Wpf.Theming"
    Title="My Application"
    Width="1024"
    Height="768">

    <Grid>
        <!-- Your content -->
    </Grid>
</theming:NiceWindow>
```

Code-behind:
```csharp
public partial class MainWindow : NiceWindow
{
    public MainWindow()
    {
        InitializeComponent();
    }
}
```

### Features

- Custom title bar with minimize/maximize/close buttons
- Light and Dark theme support
- Accent color customization
- Snap layout support (Windows 11)
- System backdrop support

### ThemeSelector Control

Built-in control for switching between Light and Dark themes:

```xml
<theming:ThemeSelector />
```

### AccentColorSelector Control

Pick an accent color:

```xml
<theming:AccentColorSelector />
```

### TransitioningContentControl

Animated content transitions when content changes:

```xml
<theming:TransitioningContentControl Content="{Binding CurrentView}" />
```

### Programmatic Theme Control

```csharp
// Switch to dark theme
ThemeManager.ChangeTheme(Application.Current, "Dark");

// Switch to light theme
ThemeManager.ChangeTheme(Application.Current, "Light");

// Set accent color
ThemeManager.ChangeAccentColor(Application.Current, Colors.DodgerBlue);
```

### App.xaml Setup

```xml
<Application.Resources>
    <ResourceDictionary>
        <ResourceDictionary.MergedDictionaries>
            <theming:ThemeResourceDictionary />
        </ResourceDictionary.MergedDictionaries>
    </ResourceDictionary>
</Application.Resources>
```

---

## Font Icons (Atc.Wpf.FontIcons)

### Available Icon Families

| Family | Enum Type | Variants | Approximate Glyphs |
|---|---|---|---|
| FontAwesome 5 | `FontAwesomeRegular5`, `FontAwesomeSolid5`, `FontAwesomeBrands5` | 3 | 1,600+ |
| FontAwesome 7 | `FontAwesomeRegular7`, `FontAwesomeSolid7`, `FontAwesomeBrands7` | 3 | 2,000+ |
| Bootstrap Icons | `BootstrapIcon` | 1 | 1,800+ |
| Material Design | `MaterialDesignIcon` | 1 | 2,100+ |
| Weather Icons | `WeatherIcon` | 1 | 200+ |
| IcoFont | `IcoFontIcon` | 1 | 2,100+ |

### XAML Usage

```xml
<!-- Using FontIcon control -->
<fontIcons:FontIcon
    IconType="FontAwesome5Solid"
    IconName="fa-check"
    FontSize="16"
    Foreground="Green" />

<!-- Using with ImageButton -->
<controls:ImageButton
    IconType="MaterialDesign"
    IconName="md-save"
    Content="Save" />
```

### Code Usage

```csharp
// Get icon as ImageSource
var icon = FontIconHelper.GetImageSource(FontAwesomeSolid5.Check, Brushes.Green, 24);

// Get icon as Geometry
var geometry = FontIconHelper.GetGeometry(MaterialDesignIcon.Save);
```

### Common Icon Names

**FontAwesome 5/7 Solid:**
- `fa-check`, `fa-times`, `fa-plus`, `fa-minus`
- `fa-search`, `fa-cog`, `fa-user`, `fa-home`
- `fa-save`, `fa-trash`, `fa-edit`, `fa-copy`
- `fa-folder`, `fa-file`, `fa-download`, `fa-upload`
- `fa-arrow-left`, `fa-arrow-right`, `fa-chevron-down`

**Material Design:**
- `md-save`, `md-delete`, `md-edit`, `md-add`
- `md-search`, `md-settings`, `md-person`, `md-home`
- `md-folder`, `md-file`, `md-download`, `md-upload`

**Bootstrap:**
- `bi-check`, `bi-x`, `bi-plus`, `bi-dash`
- `bi-search`, `bi-gear`, `bi-person`, `bi-house`
